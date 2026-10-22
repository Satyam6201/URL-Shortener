import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.env === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  transport: config.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
