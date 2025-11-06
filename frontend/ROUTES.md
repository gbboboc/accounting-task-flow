# Application Routes Guide

## 🏠 Root Route
- **/** - Redirects to `/dashboard` if logged in, otherwise to `/auth/login`

## 🔐 Authentication Routes (Public)
- **/auth/login** - Login page
- **/auth/register** - Registration page  
- **/auth/verify-email** - Email verification page
- **/auth/forgot-password** - Password reset page

## 📊 Dashboard Routes (Protected - Requires Login)

### Main Dashboard
- **/dashboard** - Main dashboard with statistics and overview

### Companies Management
- **/companies** - List all companies
- **/companies/new** - Add new company (multi-step wizard)
- **/companies/[id]** - View company details (replace [id] with company ID)

### Tasks Management
- **/tasks** - View all tasks (pending, due today, overdue, completed)

### Calendar
- **/calendar** - Calendar view with task deadlines

### Reports
- **/reports** - Reports and analytics

### Settings
- **/settings** - User settings and preferences

## 🚀 Quick Start

1. **First Time User:**
   - Go to `/auth/register` to create an account
   - Verify your email at `/auth/verify-email`
   - You'll be redirected to `/dashboard`

2. **Returning User:**
   - Go to `/auth/login` to sign in
   - You'll be redirected to `/dashboard`

3. **Access Dashboard Directly:**
   - Navigate to `/dashboard` (you'll be redirected to login if not authenticated)

## 🔑 Authentication Flow

\`\`\`
/ (root)
  ↓
  Is user logged in?
  ├─ Yes → /dashboard
  └─ No → /auth/login
\`\`\`

## 📱 Navigation

Once logged in, use the sidebar to navigate between:
- Dashboard
- Companies
- Tasks  
- Calendar
- Reports
- Settings
\`\`\`

```tsx file="" isHidden
