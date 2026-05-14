<div align="center">

<br/>

```
  ███████╗██╗  ██╗██╗   ██╗███████╗████████╗
  ██╔════╝██║  ██║╚██╗ ██╔╝██╔════╝╚══██╔══╝
  ███████╗███████║ ╚████╔╝ █████╗     ██║   
  ╚════██║██╔══██║  ╚██╔╝  ██╔══╝     ██║   
  ███████║██║  ██║   ██║   ██║        ██║   
  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝   
```

### **The Modern, All-in-One Human Resource Management System**

*Work tracked. Time respected. Teams empowered.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16.2.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_DB-Serverless-00E5CC?style=for-the-badge&logo=postgresql&logoColor=white)

<br/>

[🌐 Live Demo](#) · [🐛 Report Bug](#) · [💡 Request Feature](#)

</div>

---

## 📌 Table of Contents

- [About SHYFT](#-about-shyft)
- [System Architecture](#-system-architecture)
- [Feature Modules](#-feature-modules)
  - [HR Admin Dashboard](#-hr-admin-dashboard)
  - [Employee Self-Service Portal](#-employee-self-service-portal)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)

---

## 🏢 About SHYFT

**SHYFT** is a production-grade, full-stack HRMS (Human Resource Management System) designed for modern companies. It replaces fragmented Google Forms, email chains, and spreadsheets with a single, unified platform offering role-based portals for both HR Administrators and Employees.

### Why SHYFT?

| Traditional Approach | With SHYFT |
|---|---|
| Google Forms for onboarding | Guided multi-step KYC wizard |
| Email chains for leave approval | Hierarchical approval workflows |
| Spreadsheets for timesheets | Automated time tracking & audits |
| Manual asset registers | Real-time asset lifecycle tracking |
| Physical expense slips | Digital reimbursement with receipt uploads |
| Scattered PDF documents | Centralized Cloudinary document vault |
| No notification system | Real-time in-app notification bell |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SHYFT Platform                                 │
│                                                                         │
│  ┌──────────────┐    ┌───────────────────┐    ┌──────────────────────┐  │
│  │ Landing Page │ →  │  Auth (Better Auth)│ →  │   Role-based Shell   │  │
│  └──────────────┘    └───────────────────┘    └──────────┬───────────┘  │
│                                                          │              │
│                          ┌───────────────┬───────────────┘              │
│                          ▼               ▼                              │
│            ┌─────────────────┐  ┌──────────────────┐                   │
│            │  HR Dashboard   │  │ Employee Portal  │                   │
│            │  /dashboard/*   │  │  /employee/*     │                   │
│            └────────┬────────┘  └────────┬─────────┘                   │
│                     │                    │                              │
│            ┌────────▼────────────────────▼─────────┐                   │
│            │          Next.js App Router API        │                   │
│            │              /api/*                    │                   │
│            └────────────────┬───────────────────────┘                   │
│                             │                                           │
│            ┌────────────────▼────────────────────┐                      │
│            │    Prisma ORM  ←→  Neon PostgreSQL   │                      │
│            └──────────────────────────────────────┘                      │
│                                                                         │
│  External Services: Cloudinary · Nodemailer SMTP                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Modules

### 🖥️ HR Admin Dashboard

Accessible by Organization Owners (HR Administrators). A comprehensive control center for managing the entire workforce.

#### 📊 Overview & Analytics
- Real-time workforce summary cards (active employees, pending approvals, etc.)
- Organisation health metrics and quick-action shortcuts

#### 👥 Employee Management
- **Add / Edit / Delete** employees with full personal and professional profiles
- Role-based access: Employee, Lead, Manager, or HR
- Generate and email secure temporary passwords for new accounts
- Upload and manage employee avatars
- Manage reporting hierarchies (multi-level reporting chains)
- Department, designation, position, and employment-type management

#### 🕐 Timesheets & Time Tracker
- **HR Timesheet Dashboard** — Review all employee monthly timesheets in a paginated, filterable table
- **Full Audit Modal** — Drill down into each employee's daily entries (start/end times, break minutes, tasks)
- **Holiday Manager** — Define organization-wide public holidays; entries on those days are auto-tagged
- **Status Workflow** — Draft → Submitted → Lead Approved → HR Approved / Rejected
- **PDF Export** — Generate formatted timesheet PDFs for payroll

#### 🏖️ Leave & Comp-Off Management
- **Leave Applications** — Review all employee leave requests; filter by status, employee, leave type
- **Hierarchical Approvals** — Leave flows from Lead → HR, with full approval chain tracking
- **Comp-Off Management** — Review and approve/reject Compensatory Off requests
- **Rejection Notes** — HR can add specific feedback when declining any request

#### 💸 Reimbursements
- **Cinematic Sliding Drawer** — Click any request to open a detailed side panel
- **Bill Viewer** — Preview uploaded receipt images or PDFs directly in the browser
- **Amount Verification** — Approve or reject individual claims with optional HR notes
- **Status Tracking** — Full lifecycle: Submitted → Under Review → Approved / Rejected

#### 💻 Asset Management
- **Company Asset Inventory** — Track all company products with Prod IDs, categories, and assignment status
- **Assign Assets** — Link assets directly to employee records
- **Asset Request Review** — Approve/reject employee requests for new assets, replacements, or returns
- **History Tracking** — Full audit trail of every asset movement

#### 📋 Employee Onboarding Review
- **Submission Table** — See all onboarding form submissions with status badges
- **Document Viewer** — Integrated secure document viewer for all uploaded KYC files (Passbook, PAN, Aadhaar, Marksheets, etc.)
- **Approve / Reject** — One-click approval unlocks employee's full dashboard access and auto-syncs data to their profile
- **HR Notes** — Provide specific rejection reasons to guide employees

#### 🧠 Skills & Projects
- **Skills Management** — Define and assign skill tags to employees; visualize team skill distribution
- **Project Management** — Create projects, assign leads and members, track project-level skills
- **Team Skills Overview** — Visual heat-map of team capabilities

#### ⚙️ Settings
- **Organisation Profile** — Update company name, logo, and basic info
- **Department & Position Management** — Maintain the master list of departments and designations

---

### 👤 Employee Self-Service Portal

A clean, focused portal for employees to manage their own work life without needing HR intervention for routine tasks.

#### 🏠 Personal Dashboard
- Personalized greeting and time-aware message
- Key stats: Days logged, Hours this month, Timesheet status, Department
- Smart **Onboarding Reminder Banner** — Displayed prominently if KYC is incomplete (with 5-day grace period policy)
- Monthly timesheet summary with quick navigation

#### ✅ Onboarding Wizard
- Multi-step form collecting: Personal info, Contact numbers, Addresses, Date of Birth/Birthday, Bank details, and Professional history
- **Secure KYC Uploads** — PAN Card, Aadhaar Card, 10th/12th Marksheets, Graduation Certificate, Offer Letter, Experience Letter (via Cloudinary signed uploads)
- **Status Screen** — Shows "Approved ✓" once HR has reviewed and accepted the documents
- Accessible as a persistent tab — employees can complete it within the 5-day joining window without being locked out of the dashboard

#### ⏱️ Timesheet
- **Real-time Time Tracker** — Start/stop timers per working day with break time logging
- **Visual Progress Rings** — SVG progress rings showing hours worked vs. target
- **Task Logging Modal** — Add detailed task notes for each day's entry
- **Monthly View** — Full calendar-style month view with daily entry cards
- **Submission Flow** — Submit timesheet to Reporting Lead for review
- Holiday entries are auto-identified and labeled

#### 📝 Leave Management
- **Leave Application Form** — Side-by-side grid layout with leave type, date range, and reason selection
- **Reporting Person Selector** — Chip-pill UI for selecting from your hierarchical reporting chain
- **Leave History** — View all past and pending applications with status badges
- **Team Leave View** — See your teammates' approved leave calendar

#### 🔄 Compensatory Off (Comp-off)
- Apply for comp-off days earned from overtime/working on holidays
- Attach evidence and notes; routed to the correct reporting manager
- History view with full status tracking

#### 🧾 Reimbursements
- **Expense Form** — Fill claim details (category, amount, date, description)
- **Receipt Upload** — Direct Cloudinary upload for scanned bills/receipts
- **History View** — Track all submitted claims with real-time status updates

#### 🖥️ Asset Requests
- **Asset Form** — Request to Acquire, Replace, or Return a company asset
- **Prod ID Field** — Reference the physical product ID printed on each company device
- **Duration & Reason** — Provide justification and expected usage duration
- **Request History** — Track all raised requests and their HR approval status

#### 🗺️ Skill Map & Team
- Personal skill portfolio with proficiency levels
- Browse team members' skill stacks
- View projects you're assigned to

#### 👤 Approval Queue (Leads & Managers)
- Leads see a dedicated **Approvals tab** to review timesheets submitted by their direct reports
- First-level approval before escalating to HR

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Server Actions) | 16.2.5 |
| **Language** | TypeScript | 5 |
| **Runtime** | React | 19.2.4 |
| **Styling** | Tailwind CSS | v4 |
| **Animation** | Framer Motion | 12.38 |
| **Component Library** | Base UI | 1.4 |
| **Icons** | Lucide React | 1.14 |
| **ORM** | Prisma | 7.8 |
| **Database** | Neon (PostgreSQL Serverless) | — |
| **Authentication** | Better Auth | 1.6 |
| **File Storage** | Cloudinary | 2.10 |
| **Email** | Nodemailer | 8 |
| **Charts** | Recharts | 3.8 |
| **PDF Generation** | jsPDF + AutoTable | 4.2 / 5.0 |
| **Drag & Drop** | dnd-kit | 6.3 |
| **Toast Notifications** | Sonner | 2.0 |
| **Date Utilities** | date-fns | 4.1 |
| **Command Palette** | cmdk | 1.1 |

---

## 📁 Project Structure

```
shyft/
├── prisma/
│   └── schema.prisma                 # Full database schema (18+ models)
│
├── src/
│   ├── app/
│   │   ├── (auth)/                   # Login & Sign Up pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   │
│   │   ├── (dashboard)/              # HR Admin portal
│   │   │   └── dashboard/
│   │   │       ├── assets/           # Asset inventory & requests
│   │   │       ├── employees/        # Employee CRUD
│   │   │       ├── leave/            # Leave & comp-off management
│   │   │       ├── onboarding/       # KYC review
│   │   │       ├── projects/         # Project management
│   │   │       ├── reimbursements/   # Claims review
│   │   │       ├── reports/          # Analytics & exports
│   │   │       ├── settings/         # Org & profile settings
│   │   │       ├── skills/           # Skills management
│   │   │       ├── team/             # Team overview
│   │   │       ├── timesheets/       # Timesheet auditing
│   │   │       └── tracker/          # Time tracker
│   │   │
│   │   ├── (employee)/               # Employee self-service portal
│   │   │   └── employee/
│   │   │       ├── approvals/        # Lead approval queue
│   │   │       ├── assets/           # Asset requests & history
│   │   │       ├── leave/            # Leave & comp-off applications
│   │   │       ├── onboarding/       # KYC wizard
│   │   │       ├── profile/          # Personal profile
│   │   │       ├── reimbursements/   # Expense claims
│   │   │       ├── skill-map/        # Personal skills
│   │   │       ├── team-leave/       # Team leave calendar
│   │   │       ├── team-skills/      # Team skill browser
│   │   │       └── timesheet/        # Monthly timesheet
│   │   │
│   │   ├── (onboarding)/             # Organization setup wizard (new users)
│   │   │
│   │   └── api/                      # 17 REST API route groups
│   │       ├── admin/
│   │       ├── assets/
│   │       │   ├── inventory/        # CRUD for company assets
│   │       │   └── requests/         # Employee asset requests
│   │       ├── auth/                 # Better Auth handler
│   │       ├── comp-off/
│   │       ├── departments/
│   │       ├── employees/
│   │       ├── generate-password/
│   │       ├── holidays/
│   │       ├── leave/
│   │       ├── notifications/
│   │       ├── onboarding/
│   │       │   └── upload-signature/ # Cloudinary signed upload
│   │       ├── org/
│   │       ├── positions/
│   │       ├── projects/
│   │       ├── reimbursements/
│   │       │   └── upload-signature/ # Cloudinary signed upload
│   │       ├── skills/
│   │       └── timesheets/
│   │
│   ├── components/
│   │   ├── dashboard/                # HR-side UI components
│   │   │   ├── assets/
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── onboarding/
│   │   │   ├── reimbursements/
│   │   │   ├── skills/
│   │   │   ├── timesheets/
│   │   │   ├── overview.tsx
│   │   │   ├── organisation-settings.tsx
│   │   │   └── shell.tsx             # HR sidebar navigation shell
│   │   │
│   │   ├── employee/                 # Employee-side UI components
│   │   │   ├── assets/
│   │   │   ├── leave/
│   │   │   ├── reimbursements/
│   │   │   ├── skill-map/
│   │   │   ├── employee-overview.tsx
│   │   │   ├── employee-profile.tsx
│   │   │   ├── employee-shell.tsx    # Employee sidebar navigation shell
│   │   │   ├── lead-approvals.tsx
│   │   │   ├── timesheet-view.tsx
│   │   │   └── project-list.tsx
│   │   │
│   │   ├── employee-onboarding/      # Multi-step KYC wizard
│   │   │   └── wizard.tsx
│   │   │
│   │   ├── landing/                  # Public marketing site
│   │   │   ├── header.tsx
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── cta.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── shared/                   # Cross-portal reusable components
│   │   │   ├── notification-bell.tsx # Real-time notifications
│   │   │   ├── nav-breadcrumbs.tsx   # Context-aware breadcrumbs
│   │   │   └── theme-toggle.tsx      # Dark/Light mode toggle
│   │   │
│   │   └── ui/                       # Wrapped Base UI primitives
│   │       └── (button, card, badge, dialog, drawer, tooltip, etc.)
│   │
│   └── lib/
│       ├── auth.ts                   # Better Auth config & session helpers
│       ├── prisma.ts                 # Prisma client (Neon serverless adapter)
│       └── utils.ts                  # cn() and shared utilities
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/employees` | List or create employees |
| `GET/PATCH/DELETE` | `/api/employees/[id]` | Single employee operations |
| `GET/POST` | `/api/timesheets` | Timesheet listing and creation |
| `GET/PATCH` | `/api/timesheets/[id]` | Timesheet detail and approval |
| `GET/POST` | `/api/leave` | Leave applications |
| `PATCH` | `/api/leave/[id]` | Approve or reject a leave |
| `GET/POST` | `/api/comp-off` | Compensatory off requests |
| `PATCH` | `/api/comp-off/[id]` | Approve or reject comp-off |
| `GET/POST` | `/api/reimbursements` | Expense claims |
| `PATCH` | `/api/reimbursements/[id]` | Review reimbursement |
| `POST` | `/api/reimbursements/upload-signature` | Get signed Cloudinary upload URL |
| `GET/POST` | `/api/assets/inventory` | Company asset inventory |
| `GET/POST` | `/api/assets/requests` | Employee asset requests |
| `PATCH` | `/api/assets/requests/[id]` | Approve/reject asset request |
| `GET/POST` | `/api/onboarding` | Submit KYC form |
| `PATCH` | `/api/onboarding/[id]` | HR approval/rejection of onboarding |
| `POST` | `/api/onboarding/upload-signature` | Get signed Cloudinary upload URL |
| `GET/POST` | `/api/notifications` | Fetch and mark notifications |
| `GET/POST` | `/api/projects` | Project management |
| `GET/POST` | `/api/skills` | Skills management |
| `GET/POST` | `/api/holidays` | Holiday calendar |
| `GET/POST` | `/api/departments` | Department list |
| `GET/POST` | `/api/positions` | Designation list |
| `POST` | `/api/generate-password` | Generate and email employee credentials |

---

## 🗄️ Database Schema

```
Organization
│
├── User (login accounts, roles, onboardingCompleted flag)
│
├── Employee
│   ├── Timesheet
│   │   └── TimesheetEntry (daily log: startTime, endTime, breakMins, tasks)
│   │
│   ├── LeaveApplication (leave type, dates, reason, status, chain)
│   │
│   ├── LeaveCompensation (comp-off request, status, chain)
│   │
│   ├── Reimbursement
│   │   └── ReimbursementBill (amount, receipt URL, status)
│   │
│   ├── AssetRequest (type: ACQUIRE | REPLACE | RETURN, Prod ID, status)
│   │
│   ├── Asset (assigned company product with Prod ID)
│   │
│   ├── EmployeeOnboarding (KYC docs: PAN, Aadhaar, Passbook, Marksheets, etc.)
│   │
│   ├── ProjectMember → Project (lead, members, skills)
│   │
│   └── EmployeeSkill → Skill
│
├── Asset (company inventory, Prod ID, category, assignee)
│
└── Notification (type, title, message, read status, linked entity)
```

**Enums:** `EmployeeStatus`, `EmploymentType`, `TimesheetStatus`, `LeaveStatus`, `LeaveType`, `CompOffStatus`, `ReimbursementStatus`, `BillStatus`, `AssetRequestType`, `AssetRequestStatus`, `OnboardingStatus`, `NotificationType`

---

## ⚡ Getting Started

### Prerequisites

- Node.js `v20+`
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudinary](https://cloudinary.com) account
- An SMTP email account (Gmail App Password recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/AnshuHemal/Shyft.git
cd Shyft
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# ── Database (Neon PostgreSQL) ─────────────────────────────────
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# ── Better Auth ────────────────────────────────────────────────
BETTER_AUTH_SECRET="a-long-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── Cloudinary (File Uploads) ──────────────────────────────────
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ── Email / SMTP (Nodemailer) ──────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

> **Tip:** Generate a secure `BETTER_AUTH_SECRET` with `openssl rand -hex 32`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please open an issue to discuss proposed changes before submitting a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is **proprietary** and not open for redistribution without explicit permission.

---

<div align="center">

**SHYFT** — Built with care for teams everywhere.

Made with ❤️ using **Next.js 16** · **Prisma 7** · **Neon DB** · **Cloudinary** · **Better Auth**

</div>
