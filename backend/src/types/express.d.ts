import { User } from '@votelens/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
