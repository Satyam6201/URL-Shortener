import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import { metricsMiddleware, getMetrics } from './middleware/metrics.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import domainRoutes from './routes/domainRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import { getOpenApiSpec } from './controllers/docsController.js';

export const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      config.clientUrl,
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      if (name && rest.length > 0) {
        req.cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
      }
    });
  }
  next();
});

app.use(metricsMiddleware);

app.get('/metrics', getMetrics);
app.get('/api/docs', getOpenApiSpec);
app.get('/api/openapi.json', getOpenApiSpec);

app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);

app.use('/', redirectRoutes);

app.use(errorHandler);
