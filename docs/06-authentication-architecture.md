# Authentication Architecture

## Firebase Authentication Integration

### Authentication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Firebase  │         │   Backend   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                      │                      │
       │  1. signInWith...    │                      │
       ├─────────────────────>│                      │
       │                      │                      │
       │  2. ID Token         │                      │
       │<─────────────────────┤                      │
       │                      │                      │
       │  3. POST /auth/login │                      │
       │                      ├─────────────────────>│
       │                      │                      │
       │                      │  4. verifyIdToken    │
       │                      │<─────────────────────┤
       │                      │                      │
       │  5. JWT + User Data  │                      │
       │<─────────────────────┤                      │
       │                      │                      │
```

### Firebase Configuration

```typescript
// src/config/firebase.ts
import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

export const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const firebaseAuth = firebaseApp.auth();
```

## Backend Authentication Service

```typescript
// src/services/auth.service.ts
class AuthService {
  async verifyToken(token: string): Promise<DecodedToken> {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  async syncUser(firebaseUser: any): Promise<User> {
    let user = await this.userRepository.findByFirebaseUid(firebaseUser.uid);
    
    if (!user) {
      user = await this.userRepository.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.name,
        photoURL: firebaseUser.picture,
      });
    } else {
      user = await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });
    }
    
    return user;
  }

  async generateAccessToken(user: User): Promise<string> {
    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  async generateRefreshToken(user: User): Promise<string> {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  async login(idToken: string): Promise<AuthResponse> {
    const firebaseUser = await this.verifyToken(idToken);
    const user = await this.syncUser(firebaseUser);
    
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    const user = await this.userRepository.findById(decoded.userId);
    
    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);
    
    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
```

## Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    req.user = await this.userService.findById(decoded.userId);
    next();
  } catch (error) {
    next(error);
  }
};
```

## Role-Based Access Control (RBAC)

### RBAC Middleware

```typescript
// src/middleware/rbac.middleware.ts
export const rbacMiddleware = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    
    next();
  };
};

// Usage
router.post('/elections', authMiddleware, rbacMiddleware([Role.ADMIN, Role.SUPER_ADMIN]), createElection);
```

### Permission Matrix

| Resource | Action | User | Admin | Super Admin |
|----------|--------|------|-------|-------------|
| Elections | Read | ✓ | ✓ | ✓ |
| Elections | Create | ✗ | ✓ | ✓ |
| Elections | Update Own | ✓ | ✓ | ✓ |
| Elections | Update Any | ✗ | ✓ | ✓ |
| Elections | Delete Own | ✓ | ✓ | ✓ |
| Elections | Delete Any | ✗ | ✗ | ✓ |
| Insights | Read | ✓ | ✓ | ✓ |
| Insights | Generate | ✓ | ✓ | ✓ |
| Analytics | Read | ✓ | ✓ | ✓ |
| Users | Read | ✗ | ✓ | ✓ |
| Users | Update | ✗ | ✗ | ✓ |
| Organizations | Read | ✗ | ✓ | ✓ |
| Organizations | Create | ✗ | ✓ | ✓ |

## Session Management

### Session Configuration

```typescript
// Session configuration
const sessionConfig = {
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '7d',
  maxSessions: 5,
  sessionCleanup: '24h',
};
```

### Refresh Token Rotation

```typescript
// Refresh token rotation
async function refreshAccessToken(refreshToken: string) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
  const user = await userService.findById(decoded.userId);
  
  // Revoke old refresh token
  await tokenService.revokeRefreshToken(refreshToken);
  
  // Generate new tokens
  const newAccessToken = await authService.generateAccessToken(user);
  const newRefreshToken = await authService.generateRefreshToken(user);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

## Frontend Authentication

### Firebase Client Setup

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithGoogle,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogleProvider() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

### Auth Hook

```typescript
// src/lib/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { auth, signIn, signOut, onAuthChange } from '../firebase';
import { apiClient } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const { data } = await apiClient.post('/auth/login', { idToken });
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const logout = async () => {
    await signOut();
    await apiClient.post('/auth/logout');
  };

  return { user, loading, login, logout };
}
```

## Security Best Practices

### Token Storage

```typescript
// Store tokens securely
const tokenStorage = {
  // Access token in memory (short-lived)
  accessToken: null,
  
  // Refresh token in httpOnly cookie
  setRefreshToken: (token: string) => {
    document.cookie = `refreshToken=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`;
  },
  
  getRefreshToken: () => {
    const match = document.cookie.match(/refreshToken=([^;]+)/);
    return match ? match[1] : null;
  },
  
  clearTokens: () => {
    document.cookie = 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
  },
};
```

### Token Refresh

```typescript
// Axios interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Password Reset Flow

```typescript
// Password reset via Firebase
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function confirmPasswordReset(oobCode: string, newPassword: string) {
  return confirmPasswordReset(auth, oobCode, newPassword);
}
```

## Multi-Factor Authentication (Optional)

```typescript
// Enable MFA for high-security accounts
export async function enableMFA(user: User) {
  const multiFactorUser = multiFactor(user);
  const session = await multiFactorUser.getSession();
  
  const phoneInfoOptions = {
    phoneNumber: user.phoneNumber,
    session: session,
  };
  
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions);
  
  return verificationId;
}

export async function verifyMFA(verificationId: string, code: string) {
  const cred = PhoneAuthProvider.credential(verificationId, code);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  
  await multiFactor(user).enroll(multiFactorAssertion, 'phone');
}
```
