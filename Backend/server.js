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
import { initSocket } from './socket/socketHandler.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isDev = process.env.NODE_ENV === 'development';

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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Blood Connector Server is running smoothly',
    timestamp: new Date()
  });
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

initSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export { io };
