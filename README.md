<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/2830/2830284.png" alt="Bank System Logo" width="120" height="120" />
  <h1>🚀 Next-Gen Banking System</h1>
  <p>A modern, secure, and fully-featured banking application built with <strong>NestJS</strong> and <strong>React</strong>.</p>
  
  <p>
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  </p>
</div>

---

## 📖 Overview

The **Next-Gen Banking System** is a comprehensive financial platform tailored to provide users with a seamless banking experience. It features real-time notifications, a fully fledged transaction system, savings goals, credit/debit card management, advanced security (KYC, 2FA), and multi-language support. 

## ✨ Key Features

### 🏦 For Users (Customers)
- **Dashboard & Analytics:** Real-time balance and interactive financial charts (via Recharts).
- **Accounts & Cards:** Manage Checking/Savings accounts and freeze/unfreeze cards.
- **Transactions:** Deposit, withdraw, and transfer funds instantly.
- **Savings Goals:** Set specific financial targets with automated auto-save milestones.
- **Security:** 2FA authentication, KYC document verification, and secure session management.
- **Real-Time Notifications:** Live updates for transactions and account alerts (via WebSockets).
- **Internationalization:** Multi-language support out of the box (via i18next).

### 🛠️ For Administrators
- **User Management:** Oversee user accounts, freeze/activate accounts.
- **KYC Verification:** Approve or reject KYC applications.
- **System Monitoring:** Track global transactions and user statistics.

---

## 💻 Tech Stack

### **Backend (`/backend`)**
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** JWT, Passport, bcryptjs, otplib (for 2FA)
- **Payments Integration:** [Stripe](https://stripe.com/)
- **Real-Time:** Socket.io
- **Emails:** Resend API

### **Frontend (`/front`)**
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management:** Zustand & React Query (@tanstack/react-query)
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Routing:** React Router v7

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (Running locally or via Docker)
- Stripe Account (for payment keys)
- Resend API Key (for emails)

### 1️⃣ Clone the Repository
```bash
git clone <your-repo-url>
cd bank-system
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the following template:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/bank_system?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PORT=3000
RESEND_API_KEY="re_..."
```

**Run Database Migrations & Seed:**
```bash
npx prisma migrate dev
npm run build
npm run start:dev
```

### 3️⃣ Frontend Setup
```bash
cd ../front
npm install
```

Create a `.env` file in the `front` directory:
```env
VITE_API_URL="http://localhost:3000"
VITE_STRIPE_PUBLIC_KEY="pk_test_..."
```

**Start the Development Server:**
```bash
npm run dev
```
*The app will be available at `http://localhost:5173`.*

---

## 📁 Project Structure

```text
bank-system/
├── backend/                  # NestJS Backend Application
│   ├── prisma/               # Database schema & migrations
│   ├── src/                  # Controllers, Services, Modules
│   └── test/                 # E2E Tests
├── front/                    # React Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Application views (Dashboard, Login, etc.)
│   │   ├── store/            # Zustand global state
│   │   └── utils/            # Helper functions & API instances
│   └── public/               # Static assets
└── README.md                 # Project documentation
```

---

## 🛡️ Security & Best Practices
- **Rate Limiting:** Protects endpoints from brute-force attacks.
- **Helmet:** Sets secure HTTP headers out of the box.
- **Data Validation:** Zod validates incoming data on the frontend, and `class-validator` handles it gracefully on the backend.
- **Role-Based Access Control (RBAC):** Strict boundaries between `CUSTOMER` and `ADMIN` actions.

---

<div align="center">
  <i>Crafted with ❤️ by a passionate developer.</i>
</div>
