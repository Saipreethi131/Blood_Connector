import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import campRoutes from './routes/campRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import { initSocket } from './socket/socketHandler.js';
import { startExpiryCron } from './cron/expiryCron.js';

dotenv.config();
connectDB();
startExpiryCron();

const app = express();
app.set('trust proxy', 1); // trust Render's first reverse proxy hop for accurate client IPs (rate limiter)
const server = http.createServer(app);

const isDev = process.env.NODE_ENV !== 'production';

// Deployed CLIENT_URL plus common local dev ports — a single fixed origin
// would otherwise make the browser reject every request from `npm run dev`.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || isDev || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Respond with 503 if any route hangs beyond 15 seconds
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(503).json({ status: 'error', message: 'Request timed out — please try again' });
    }
  });
  next();
});

// Global rate limit: 200 req/15min (dev: 500)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 200,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests, please try again later.' },
}));

// Auth endpoints: 50 req/15min (dev: 100)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 50,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many auth attempts, please try again later.' },
});

app.use('/api/auth/login',             authLimiter);
app.use('/api/auth/register/donor',    authLimiter);
app.use('/api/auth/register/hospital', authLimiter);

// Mount Routes
app.use('/api/auth',          authRoutes);
app.use('/api/donor',         donorRoutes);
app.use('/api/hospital',      hospitalRoutes);
app.use('/api/requests',      requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/camps',         campRoutes);
app.use('/api/push',          pushRoutes);
app.use('/api/leaderboard',   leaderboardRoutes);
app.use('/api/ratings',       ratingRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Blood Connector Server is running smoothly',
    timestamp: new Date()
  });
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isDev || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  }
});

initSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export { io };
