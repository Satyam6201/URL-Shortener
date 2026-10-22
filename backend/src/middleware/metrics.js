import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'url_shortener_' });

export const httpRequestsTotal = new client.Counter({
  name: 'url_shortener_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'url_shortener_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

export const redirectsTotal = new client.Counter({
  name: 'url_shortener_redirects_total',
  help: 'Total number of URL redirections handled',
  labelNames: ['status', 'source'],
});

export const cacheHitsCounter = new client.Counter({
  name: 'url_shortener_cache_hits_total',
  help: 'Total number of Redis cache hits for URL lookups',
});

export const cacheMissesCounter = new client.Counter({
  name: 'url_shortener_cache_misses_total',
  help: 'Total number of Redis cache misses requiring MongoDB lookup',
});

export const rateLimitHitsCounter = new client.Counter({
  name: 'url_shortener_rate_limit_exceeded_total',
  help: 'Total number of HTTP 429 rate limit exceeded events',
  labelNames: ['type'],
});

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
}

export async function getMetrics(req, res) {
  try {
    res.setHeader('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
}
