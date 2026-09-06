# FinFood — Food Expense & Monthly Budget Tracker

A complete, production-ready full-stack Food Expense & Monthly Budget Tracker web application inspired by modern fintech design and the **shadcn/ui** design language. FinFood provides dynamic safe-zone spending recommendations, real-time optimistic UI updates, space-optimized colorful widgets & charts, and full user authentication connected to **MongoDB Atlas**.

---

## Key Features

- **Fintech & Shadcn/UI Aesthetics**: Clean off-white canvas, sleek dark hero cards, rounded-xl/2xl cards, subtle shadows, and Lucide React iconography.
- **Space-Optimized Widgets & Charts**:
  - **Budget Gauge Widget**: Semi-circular radial gauge showing budget goal progress (`72%`), center dial dot, remaining budget, and allocated funds.
  - **Spending Trend Sparkline & Area Chart**: Smooth trend curve with interactive dark tooltip boxes (`₹X`) and pace delta badges (`+4.2% vs safe`).
  - **Daily Bars Widget**: High-contrast vertical bars showing recent daily spending with hover tooltips.
  - **Multi-Colored Arc & Category Breakdown**: Semicircular donut arc with category colors (warm yellow, coral, mint, soft purple).
- **Instant Optimistic UI Updates**:
  - Adding, editing, and deleting expenses or setting budgets updates the UI **instantly (0ms)** before background synchronization with MongoDB Atlas.
- **Full Authentication ("Better Auth")**:
  - **Create Account (Register)**: Name, Email, Password (hashed with `bcryptjs`).
  - **Login**: JWT token authentication with persistent sessions.
  - **Forgot Password & Reset**: 6-digit verification code generation and instant password update.
  - User profile initials avatar and one-click logout.
  - Guest mode fallback for immediate friction-free testing.
- **Dynamic Safe Zone Engine**:
  - **Base Daily Budget**: `monthlyBudget / 30`
  - **Safe Daily Budget**: `(monthlyBudget / 30) × 70%` (30% buffer)
  - **Safe Zone Status**: `SAFE ZONE`, `APPROACHING LIMIT`, `OVER SAFE LIMIT`
  - **Dynamic Daily Recommendation**: `remainingBudget / remainingDays × 70%`
- **Full CRUD & Management**:
  - **Expenses Page**: Real-time search, category filters, sorting (newest, oldest, amount), and delete confirmations.
  - **Calendar Page**: Month grid with spending indicator dots, date click drill-down, and direct expense logging for any date.
  - **Analytics Page**: Full daily bar charts, peak spending days, and category distribution.
  - **Settings Page**: Budget management, custom category creator with custom icon and color picker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Lucide React (`shadcn/ui` icons), Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, REST API |
| **Database** | MongoDB Atlas (Cloud) / Local MongoDB via Mongoose ODM |
| **Authentication** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Styling** | Modern CSS Design Tokens, Glassmorphism, Space-Optimized Grid |

---

## Folder Structure

```text
expence tracker/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # BudgetGauge, SpendingTrend, DailyBars, CategoryArc, Modals
│   │   ├── context/            # AuthContext, AppContext (Optimistic State)
│   │   ├── layouts/            # MainLayout (Sidebar + Mobile Floating Bottom Nav)
│   │   ├── pages/              # Dashboard, Expenses, Analytics, Calendar, Settings
│   │   ├── services/           # API Client with JWT Bearer headers
│   │   ├── styles/             # Design Tokens & Shadcn/Fintech CSS
│   │   └── utils/              # Currency formatting (₹ INR), Date helpers
│   ├── .env                    # VITE_API_URL=/api
│   └── vite.config.js          # API proxy to backend port 5000
├── server/                     # Backend (Node + Express)
│   ├── config/                 # db.js (Atlas Mongoose connection with DNS fallback)
│   ├── controllers/            # Auth, Dashboard, Expenses, Budget, Analytics, Calendar, Categories
│   ├── middleware/             # Auth JWT middleware, Validation, Error Handling
│   ├── models/                 # User, MonthlyBudget, Expense, Category
│   ├── routes/                 # REST API route definitions
│   ├── services/               # BudgetService (Safe zone calculations, date boundaries)
│   ├── .env                    # MongoDB Atlas URI, PORT, JWT_SECRET
│   └── server.js               # Express application entry point
├── package.json                # Root management scripts
└── README.md
```

---

## Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://finfood:monish2005@cluster0.nixdzus.mongodb.net/finfood_db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=finfood_super_secret_jwt_key_2026
NODE_ENV=development
```

### Frontend (`client/.env`)
```env
VITE_API_URL=/api
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- Active internet connection for MongoDB Atlas cluster

### 2. Installation
Install dependencies for both backend and frontend:
```bash
# In project root
npm run install:all

# Or individually
cd server && npm install
cd ../client && npm install
```

### 3. Running Development Servers
In two separate terminals:

**Terminal 1 — Backend Server**:
```bash
cd server
npm run dev
# Server starts on http://127.0.0.1:5000 and connects to MongoDB Atlas
```

**Terminal 2 — Frontend Client**:
```bash
cd client
npm run dev
# Client starts on http://127.0.0.1:5173
```

Visit **`http://127.0.0.1:5173`** in your browser.

---

## REST API Specification

### Authentication
- `POST /api/auth/register` — Create a new user account `{ name, email, password }`
- `POST /api/auth/login` — Login with email and password, returns JWT token
- `POST /api/auth/forgot-password` — Generate 6-digit password verification code
- `POST /api/auth/reset-password` — Reset password using verification code
- `GET /api/auth/me` — Fetch authenticated user profile

### Dashboard & Budget
- `GET /api/dashboard?month=9&year=2026&today=YYYY-MM-DD` — Dynamic dashboard metrics & safe zone
- `GET /api/monthly-budget?month=9&year=2026` — Fetch monthly food budget
- `POST /api/monthly-budget` — Create/update monthly food budget `{ budgetAmount, month, year }`
- `PUT /api/monthly-budget/:id` — Update existing budget amount

### Expenses
- `GET /api/expenses?month=9&year=2026&category=Lunch&search=salad&sort=newest` — Filtered expenses
- `POST /api/expenses` — Log new food expense `{ amount, date, category, note }`
- `PUT /api/expenses/:id` — Update food expense
- `DELETE /api/expenses/:id` — Delete food expense

### Analytics & Calendar
- `GET /api/analytics?month=9&year=2026` — Daily spending chart, category breakdown, peak day
- `GET /api/calendar?month=9&year=2026` — Calendar grid days with transaction markers
- `GET /api/categories` — Get default and custom food categories
- `POST /api/categories` — Add custom category `{ name, icon, color }`
- `DELETE /api/categories/:id` — Delete custom category
