# Blood Connector 🩸

A full-stack MERN application that connects blood donors with hospitals in real time.

## Features

- **Donor Portal** — Register with blood group, toggle availability, browse blood requests, respond with one click
- **Hospital Portal** — Post blood requests (Normal / Urgent / Critical), search available donors, manage request status
- **Real-time Notifications** — Socket.io broadcasts critical requests to matching donors instantly; hospitals get notified when donors respond
- **OTP Verification** — Phone-based OTP for donor accounts
- **JWT Auth** — Secure protected routes with role-based access (donor / hospital)

---

## Project Structure

```
Blood_Connector/
├── Backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/socketHandler.js
│   ├── utils/otpHelper.js
│   └── server.js
└── Frontend/
    └── src/
        ├── api/axios.js
        ├── context/          (AuthContext, SocketContext)
        ├── components/       (Navbar, ProtectedRoute)
        └── pages/            (Landing, Login, Register, VerifyOTP, dashboards, Notifications)
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### Backend

```bash
cd Backend
npm install
```

Edit `.env` with your real values:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/blood_connector
JWT_SECRET=some_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev      # nodemon (development)
npm start        # node server.js (production)
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

> **OTP note**: In development, OTP codes are printed to the **server console** (mock SMS). Look for the `[OTP CODE]` line.

> **Hospital login note**: New hospital accounts require admin approval (`verificationStatus: approved` in MongoDB) before they can log in. You can manually set this in Atlas → Collections → `users`.

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register/donor` | — | Register donor |
| POST | `/api/auth/register/hospital` | — | Register hospital |
| POST | `/api/auth/verify-otp` | — | Verify donor OTP |
| POST | `/api/auth/resend-otp` | — | Resend OTP |
| POST | `/api/auth/login` | — | Login (any role) |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/donor/profile` | Donor | Get donor profile |
| POST | `/api/donor/profile` | Donor | Update donor profile |
| GET | `/api/donor/requests` | Donor | Get open requests (filterable) |
| PUT | `/api/donor/availability` | Donor | Toggle availability |
| POST | `/api/donor/respond/:id` | Donor | Respond to a request |
| GET | `/api/hospital/profile` | Hospital | Get hospital profile |
| POST | `/api/hospital/profile` | Hospital | Update hospital profile |
| GET | `/api/hospital/donors` | Hospital | Search available donors |
| POST | `/api/hospital/request` | Hospital | Post blood request |
| GET | `/api/hospital/requests` | Hospital | Get own requests |
| PUT | `/api/hospital/request/:id` | Hospital | Update request status |
| GET | `/api/requests` | JWT | Get all open requests |
| GET | `/api/requests/:id` | JWT | Get single request |
| GET | `/api/notifications` | JWT | Get notifications |
| PUT | `/api/notifications/:id/read` | JWT | Mark one as read |
| PUT | `/api/notifications/read-all` | JWT | Mark all as read |

---

## Deployment

### Backend → Render

1. Push Backend to GitHub (or a monorepo)
2. Create a new **Web Service** on [Render](https://render.com)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add Environment Variables (same as `.env`)
6. Set `CLIENT_URL` to your Vercel frontend URL

### Frontend → Vercel

1. Push Frontend to GitHub
2. Import on [Vercel](https://vercel.com)
3. Framework preset: **Vite**
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-render-service.onrender.com
   VITE_SOCKET_URL=https://your-render-service.onrender.com
   ```
5. Deploy

---

## Socket Events

| Event (client → server) | Payload | Description |
|---|---|---|
| `join` | `userId` | Register user's socket for targeted notifications |
| `join_blood_group` | `bloodGroup` | Donor joins broadcast room (e.g. `"A+"`) |

| Event (server → client) | Trigger | Description |
|---|---|---|
| `notification` | Donor responds to a request | Sent to the hospital that owns the request |
| `new_urgent_request` | Hospital posts Urgent/Critical request | Broadcast to all donors in that blood-group room |
