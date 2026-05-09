create the pages and roles

**Pages & User Roles - Election Intelligence Platform**

**1\. User Roles Overview**

The platform should support role-based access control (RBAC) to ensure:

- secure data handling
- controlled permissions
- scalable system management

**Primary Roles**

| **Role**      | **Purpose**        |
| ------------- | ------------------ |
| Guest User    | Demo exploration   |
| Standard User | Election analysis  |
| Analyst       | Advanced analytics |
| Admin         | System management  |

**2\. Role Definitions**

**A. Guest User**

**Description**

Unauthenticated or demo-mode user.

**Permissions**

✅ View demo dashboard  
✅ Explore sample insights  
✅ Use limited AI queries  
✅ View maps and charts

**Restrictions**

❌ Cannot upload datasets  
❌ Cannot save reports  
❌ Cannot manage users

**B. Standard User**

**Description**

General authenticated user.

**Permissions**

✅ Upload election datasets  
✅ Access dashboards  
✅ Use AI querying  
✅ View constituency analysis  
✅ Export reports

**Restrictions**

❌ Cannot manage platform settings  
❌ Cannot manage users

**C. Analyst**

**Description**

Power user with advanced analytics access.

**Permissions**

✅ Everything Standard User can do  
✅ Historical comparisons  
✅ Advanced filters  
✅ Trend analysis tools  
✅ Dataset version comparison  
✅ Advanced export features

**Restrictions**

❌ Cannot manage platform infrastructure

**D. Admin**

**Description**

System administrator.

**Permissions**

✅ Full platform access  
✅ User management  
✅ Dataset moderation  
✅ System monitoring  
✅ AI usage monitoring  
✅ Platform configuration  
✅ Access control management

**3\. Role Permission Matrix**

| **Feature**              | **Guest** | **User** | **Analyst** | **Admin** |
| ------------------------ | --------- | -------- | ----------- | --------- |
| View dashboard           | ✅        | ✅       | ✅          | ✅        |
| Upload data              | ❌        | ✅       | ✅          | ✅        |
| AI insights              | Limited   | ✅       | ✅          | ✅        |
| Natural language queries | Limited   | ✅       | ✅          | ✅        |
| Export reports           | ❌        | ✅       | ✅          | ✅        |
| Advanced analytics       | ❌        | ❌       | ✅          | ✅        |
| Manage users             | ❌        | ❌       | ❌          | ✅        |
| System monitoring        | ❌        | ❌       | ❌          | ✅        |

**4\. Application Pages Overview**

**Public Pages**

| **Page**       | **Access** |
| -------------- | ---------- |
| Landing Page   | Public     |
| Login/Register | Public     |
| Demo Dashboard | Public     |

**Protected Pages**

| **Page**              | **Access** |
| --------------------- | ---------- |
| Main Dashboard        | User+      |
| Upload Dataset        | User+      |
| Constituency Explorer | User+      |
| AI Insights           | User+      |
| Ask AI                | User+      |
| Advanced Analytics    | Analyst+   |
| Admin Panel           | Admin      |

**5\. Detailed Page Structure**

**A. Landing Page**

**Route**

/

**Purpose**

Introduce the platform.

**Sections**

**Hero Section**

- value proposition
- CTA buttons
- dashboard preview

**Features**

- AI insights
- interactive maps
- trend analysis
- conversational querying

**Demo Preview**

Embedded analytics preview.

**Actions**

| **Action**  | **Outcome**    |
| ----------- | -------------- |
| Get Started | Login          |
| Try Demo    | Demo Dashboard |

**B. Authentication Pages**

**Login Page**

**Route**

/login

**Features**

- Google OAuth
- email/password
- guest access

**Register Page**

**Route**

/register

**Features**

- account creation
- role assignment
- verification

**Forgot Password**

**Route**

/forgot-password

**C. Demo Dashboard**

**Route**

/demo

**Purpose**

Allow non-registered users to experience the platform.

**Features**

- sample election data
- charts
- AI insights
- limited querying

**D. Main Dashboard**

**Route**

/dashboard

**Purpose**

Central election intelligence overview.

**Sections**

**1\. AI Insight Banner**

Displays major trends.

**2\. Summary Cards**

- turnout
- seats won
- leading party
- swing regions

**3\. Analytics Section**

- vote share charts
- turnout analysis
- regional trends

**4\. Interactive Election Map**

Constituency-level visualization.

**5\. Quick AI Query Box**

Ask questions directly.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| Guest    | Limited    |
| User     | Full       |
| Analyst  | Full       |
| Admin    | Full       |

**E. Upload Dataset Page**

**Route**

/upload

**Purpose**

Import election datasets.

**Features**

**File Upload**

Supports:

- CSV
- Excel
- JSON

**Validation**

Checks:

- required columns
- duplicates
- invalid values

**Preview Table**

Display parsed records before import.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| User     | ✅         |
| Analyst  | ✅         |
| Admin    | ✅         |

**F. Constituency Explorer**

**Route**

/constituencies

**Purpose**

Detailed constituency-level analysis.

**Features**

**Filters**

- state
- party
- turnout
- candidate

**Metrics**

- vote margin
- turnout %
- historical comparison

**Map Drilldown**

Interactive constituency map.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| User     | ✅         |
| Analyst  | ✅         |
| Admin    | ✅         |

**G. AI Insights Page**

**Route**

/insights

**Purpose**

Centralized AI-generated election intelligence.

**Sections**

**Trending Insights**

Most important election developments.

**Regional Trends**

Geographic insights.

**Alerts**

Close contests and anomalies.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| User     | ✅         |
| Analyst  | ✅         |
| Admin    | ✅         |

**H. Ask AI Page**

**Route**

/ask-ai

**Purpose**

Natural language election analysis.

**Features**

**Conversational Interface**

Users ask:

- "Which party gained most vote share?"
- "Show lowest turnout regions."

**AI Responses**

Includes:

- summaries
- metrics
- linked charts/maps

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| Guest    | Limited    |
| User     | ✅         |
| Analyst  | ✅         |
| Admin    | ✅         |

**I. Advanced Analytics Page**

**Route**

/advanced-analytics

**Purpose**

Deep election intelligence for analysts.

**Features**

**Historical Analysis**

Compare election cycles.

**Swing Analysis**

Identify shifting constituencies.

**Trend Modeling**

Analyze turnout and vote movement.

**Custom Filters**

Advanced segmentation.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| Analyst  | ✅         |
| Admin    | ✅         |

**J. Reports & Export Page**

**Route**

/reports

**Purpose**

Export election insights.

**Features**

**Export Formats**

- PDF
- CSV
- PNG charts

**Saved Reports**

Store historical exports.

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| User     | ✅         |
| Analyst  | ✅         |
| Admin    | ✅         |

**K. User Profile Page**

**Route**

/profile

**Features**

- account settings
- saved datasets
- AI query history
- notification preferences

**Access**

Authenticated users only.

**L. Admin Panel**

**Route**

/admin

**Purpose**

Platform management.

**Sections**

**User Management**

- add/remove users
- role assignment
- access control

**Dataset Management**

- approve datasets
- remove corrupted uploads

**AI Monitoring**

- API usage
- cost tracking
- rate limiting

**System Health**

- uptime
- logs
- errors

**Access**

| **Role** | **Access** |
| -------- | ---------- |
| Admin    | ✅         |

**6\. Navigation Structure**

**Main Navigation**

Dashboard  
Constituencies  
Insights  
Maps  
Ask AI  
Upload  
Reports  
Profile

**Admin Navigation**

Admin Dashboard  
Users  
Datasets  
AI Monitoring  
System Logs  
Settings

**7\. Mobile Navigation**

Use:

- bottom tab navigation
- collapsible menus
- simplified analytics

**Mobile Tabs**

Home  
Insights  
Maps  
Ask AI  
Profile

**8\. Route Protection Logic**

**Public Routes**

Accessible without login.

**Protected Routes**

Require authentication.

**Admin Routes**

Require admin role validation.

**Example Middleware**

Guest → Public only  
<br/>User → User pages  
<br/>Analyst → Advanced analytics  
<br/>Admin → Full access

**9\. Recommended Folder Structure**

src/  
├── pages/  
├── components/  
├── layouts/  
├── routes/  
├── services/  
├── hooks/  
├── contexts/  
├── store/  
├── utils/  
└── api/

**10\. Final UX Goal**

The final platform should feel like:

"A modern AI-powered election intelligence workspace where users can upload election data, instantly understand trends, explore visual analytics, and ask questions naturally."