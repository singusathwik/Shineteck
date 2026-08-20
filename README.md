# Shinetek Inc. — Enterprise Employee Portal & Admin Management System

A full-stack enterprise web application built for **Shinetek Inc.** featuring employee onboarding, document verification, timesheet management, automated payroll tracking, vendor management, and configurable ID generation.

---

## 🌟 Key Features

### 👤 Employee Self-Service Portal
- **Multi-Step Onboarding Wizard**: Step-by-step registration with dynamic form validation, image cropper for profile pictures, and secure document upload (I-9, W-4, Passport, Visa, etc.).
- **Smart Address Verification**: Dynamic country, state, and city cascading dropdowns with ZIP code validation.
- **Document Vault**: Upload, preview, stream, and track approval status of enterprise verification documents.
- **Work Timesheets**: Periodic timesheet logging with CSV/Excel attachment support and live manager approval status.
- **Payroll & Paystub Access**: Real-time view of earnings, deductions, gross/net pay, and download history.
- **In-App Notifications**: Real-time notification center for approval alerts and account updates.

### 🛡️ Admin Management & Compliance
- **Executive Dashboard**: Key performance metrics (active workforce, pending document verifications, timesheet backlogs, monthly payroll totals).
- **Workforce Management**: Searchable, filterable directory with employee status toggling (Active / On Leave / Terminated).
- **Document Verification & Audit**: Split-screen document inspection modal with one-click approve/reject actions and feedback notes.
- **Timesheet Processing**: Bulk review and approval workflow for employee work logs.
- **Configurable ID Generator**: Customizable employee ID format with prefix, starting sequence, and minimum padding length (e.g., `SH-2005`).
- **Vendor Management**: Create, update, and manage vendor partnerships and billing profiles.
- **Monthly Payroll Entries**: Comprehensive payroll calculation, tax withholding, and compensation records.
- **Comprehensive Audit Trail**: Tamper-evident logging of administrative actions, status transitions, and document approvals.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, React Easy Crop
- **Backend**: Node.js, Express, Multer (secure file handling), JWT (JSON Web Tokens), bcryptjs
- **Database**: SQLite (via `better-sqlite3` for local lightning-fast storage) + MongoDB (via `mongoose` for enterprise cloud persistence)
- **Deployment**: Ready for Vercel (Frontend SPA) + Render / Railway / Node.js Host (Backend)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn

### 2. Install Dependencies
```bash
# Install root and backend dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure the following variables are defined in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shinetek_db
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

### 4. Run Locally
Run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔐 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@shinetek.com` | `Admin@1234` |
| **Employee** | `johnathan.davis@shinetek.com` | `Employee@1234` |
| **Employee** | `emily.chen@shinetek.com` | `Employee@1234` |

---

## ☁️ Deploying to Vercel

### Step 1: Push Code to GitHub
Connect this repository to your GitHub account (`https://github.com/singusathwik/Shineteck.git`).

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select your **`Shineteck`** repository.
3. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `./client`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist` (or `dist` if root directory is `./client`)
4. **Environment Variables**:
   - Add `VITE_API_URL`: URL of your deployed Express backend (e.g. `https://shineteck-api.onrender.com`).
5. Click **Deploy**.

`vercel.json` is pre-configured to handle single-page application (SPA) routing, ensuring direct navigation and page reloads work smoothly.

---

## 📂 Project Structure

```
shineteck/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI & modal components
│   │   ├── context/            # AuthContext and state providers
│   │   ├── pages/              # Admin & Employee page views
│   │   ├── services/           # Axios / Fetch API client
│   │   └── App.jsx             # Main application router
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/                     # Express Backend
│   ├── controllers/            # Route controllers
│   ├── db/                     # SQLite schema & MongoDB integration
│   ├── middleware/             # Auth, Upload, Audit middlewares
│   ├── uploads/                # Managed storage (avatars, private docs)
│   └── server.js               # Main Express entry point
├── vercel.json                 # Root Vercel SPA routing configuration
├── .env.example
├── .gitignore
└── package.json                # Root orchestration scripts
```

---

## 📄 License
All rights reserved © 2026 Shinetek Inc.
