# GradLink — Setup & Launch Guide

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas URI)
- Google Gemini API key (for AI Resume Analyzer)
- Gmail App Password or SMTP credentials (for email OTP)

---

## 1. Install Dependencies

```powershell
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## 2. Configure Environment

### Server — `server/.env`
Fill in your values:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/gradlink
JWT_SECRET=<your_random_secret>
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=<your_gemini_api_key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your_gmail>
SMTP_PASS=<your_app_password>
EMAIL_FROM=GradLink <noreply@gradlink.app>
ADMIN_EMAIL=admin@acet.ac.in
ADMIN_PASSWORD=Admin@123
NODE_ENV=development
```

### Client — `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

> **Gmail SMTP**: Enable 2FA and create an App Password at https://myaccount.google.com/apppasswords

---

## 3. Initialize Admin Account

```powershell
cd server
node scripts/initAdmin.js
```

---

## 4. Start Development Servers

```powershell
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

App: http://localhost:5173

---

## 5. Key Features by Role

### Student
- Register with college email → OTP verification
- Browse Alumni Directory and view profiles
- Send mentorship requests to alumni
- View Placement Drives, Off-Campus Jobs, Alumni-Posted Jobs
- Apply to jobs (internal form or external redirect)
- Save jobs, track applications, download application PDF
- AI Resume Analyzer (Google Gemini) — get match score, strengths, gaps, suggestions
- View Placement Updates and Events

### Alumni
- Register with college email → OTP verification
- Manage incoming mentorship requests (accept/decline)
- Post job vacancies (pending admin approval)
- Share professional updates / career milestones (pending admin approval)
- View alumni directory and events

### Admin
- Full student and alumni management (deactivate, reactivate, mentorship restrict, password reset)
- Review and approve/reject job submissions with notes
- Create/edit/delete placement updates with pin support
- Create/edit/delete events with registration links
- Review professional updates (approve/reject with notes)
- Monitor all mentorship activity platform-wide
- Manage application statuses (shortlisted, selected, rejected)
- Export student data as CSV; individual student profile as PDF

---

## 6. Email Domain Restrictions

Only these are accepted:
- `@acet.ac.in`
- `@acoe.edu.in`
- `@aec.edu.in`

---

## 7. AI Resume Analyzer

- Powered by Google Gemini (server-side only)
- Text-based PDFs only — no OCR / scanned images
- Max 10 MB
- Outputs: match score, matching skills, missing skills, strengths, improvements, recommendations
- Disclaimer shown in UI — score is AI estimate, not a recruitment guarantee

---

## 8. Run Backend Tests

```powershell
cd server
node --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.config.json --forceExit
```

Requires live MongoDB on MONGODB_URI.

---

## 9. Project Structure

```
Gradlink/
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/initAdmin.js
│   └── tests/auth.test.js
└── client/
    └── src/
        ├── pages/auth/
        ├── pages/student/
        ├── pages/alumni/
        ├── pages/admin/
        ├── pages/shared/
        ├── components/
        ├── layouts/
        ├── context/
        ├── services/
        └── utils/
```

---

## 10. Deployment

```powershell
# Build frontend
cd client && npm run build
# Serve dist/ statically (Netlify/Vercel/Nginx)
# Deploy server/ to Render/Railway with all env vars set
# Use MongoDB Atlas URI for production
```
