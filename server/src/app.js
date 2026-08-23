import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { tenantMiddleware } from './middleware/tenant.middleware.js';
import { verifyCookieAuth } from './middleware/auth.middleware.js';

import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import membersRoutes from './routes/members.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import meetingsRoutes from './routes/meetings.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import learningRoutes from './routes/learning.routes.js';
import sprintsRoutes from './routes/sprints.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import aiRoutes from './routes/ai.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadStatic = path.join(__dirname, '../uploads');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Configure CORS to allow local dev ports, configured client URLs, and vercel.app domains
const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [...configuredOrigins, ...devOrigins];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(cleanOrigin)) return true;
  // Allow all vercel deployment subdomains (e.g. flowgen-tau.vercel.app, flowgen-*.vercel.app)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(cleanOrigin)) return true;
  // In development, allow localhost on any port
  if (process.env.NODE_ENV !== 'production') {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', verifyCookieAuth, tenantMiddleware, express.static(uploadStatic));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'FlowGen API' }));

const API = '/api/v1';
app.use(apiLimiter);
app.use(tenantMiddleware);

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/org`, orgRoutes);
app.use(`${API}/members`, membersRoutes);
app.use(`${API}/projects`, projectsRoutes);
app.use(`${API}/teams`, teamsRoutes);
app.use(`${API}/tasks`, tasksRoutes);
app.use(`${API}/messages`, messagesRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/meetings`, meetingsRoutes);
app.use(`${API}/alerts`, alertsRoutes);
app.use(`${API}/resources`, resourcesRoutes);
app.use(`${API}/learning`, learningRoutes);
app.use(`${API}/sprints`, sprintsRoutes);
app.use(`${API}/user`, userRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/onboarding`, onboardingRoutes);
app.use(`${API}/ai`, aiRoutes);

app.use(errorHandler);

export default app;
