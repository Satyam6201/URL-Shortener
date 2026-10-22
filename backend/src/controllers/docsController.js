import { config } from '../config/env.js';

export function getOpenApiSpec(req, res) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'SnipURL Production Developer REST API',
      version: '1.0.0',
      description: 'High-throughput URL shortener, low-latency redirection, and real-time click telemetry API.',
      contact: {
        name: 'SnipURL Engineering',
        url: config.baseUrl,
      },
    },
    servers: [
      { url: config.baseUrl, description: 'Current Environment' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        ShortenRequest: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: { type: 'string', format: 'uri' },
            customAlias: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            password: { type: 'string' },
            isOneTime: { type: 'boolean' },
            clickLimit: { type: 'integer' },
            activateAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            showPreview: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/api/urls': {
        post: {
          summary: 'Create a shortened URL',
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShortenRequest' } } },
          },
          responses: { 201: { description: 'Short link generated successfully' } },
        },
        get: {
          summary: 'List shortened URLs',
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          responses: { 200: { description: 'Paginated link records' } },
        },
      },
      '/api/analytics/{shortCode}': {
        get: {
          summary: 'Get detailed click telemetry and AI insights',
          parameters: [{ name: 'shortCode', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Aggregated analytics and AI summary' } },
        },
      },
      '/api/ai/suggest-slugs': {
        post: {
          summary: 'Generate smart slug suggestions via Gemini AI',
          responses: { 200: { description: 'List of slug suggestions' } },
        },
      },
    },
  };

  res.json(spec);
}
