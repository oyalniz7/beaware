# Separation Complete: React Frontend & Node.js Backend

The application has been successfully separated into two distinct projects: **Frontend** (React/Vite) and **Backend** (Node.js/Express).

## 📂 Project Structure

```
/
├── backend/            # Express API & Prisma
│   ├── src/            # Controllers, Routes, Middleware
│   ├── prisma/         # Database Schema
│   └── package.json    # Backend Dependencies
│
└── frontend/           # React App (Vite)
    ├── src/            # Components, Pages, App Router
    └── package.json    # Frontend Dependencies
```

## 🚀 How to Run

You will need two terminal windows.

### 1. Start the Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push  # Sync database
npm run dev
```
> Server will start on **http://localhost:3001**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```
> App will run on **http://localhost:5173** (or similar)

## 🔑 Key Changes

- **Authentication**: Now uses JWT. The login page interacts with `POST /api/auth/login`.
- **API**: All server actions have been converted to REST API endpoints (`/api/assets`, `/api/risks`, etc.).
- **Data**: The database (`dev.db`) is now managed inside `backend/prisma/`.

## ✅ Verification

1.  Open Frontend.
2.  Register a new account (or login if you migrated data).
3.  You should see the Dashboard populated with Asset data from the Backend.

Enjoy your modular architecture!
