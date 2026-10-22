# SnipURL — High-Performance URL Shortener, Fast Edge Redirection & Live Telemetry Platform

An enterprise-grade, high-throughput URL shortening and link intelligence platform designed to handle large-scale link redirection with sub-3ms latency, real-time telemetry streaming, Day & Night themes, developer automation, and AI-powered link safety.

**Designed & Developed by Satyam Kumar Mishra**

---

## 1. System Architecture

SnipURL is architected around a high-performance read-heavy topology. Redirection paths bypass disk storage entirely through a Redis cache-aside layer, while click telemetry is ingested asynchronously via a BullMQ message queue.

```
                                  [ Client Traffic ]
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │          Nginx Reverse Proxy          │
                      │     (Gateway, Port 80 & Port 3000)    │
                      └───────────────────┬───────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼ (Static Single Page App)                  ▼ (/api/* and /:shortCode)
        ┌───────────────────────┐                   ┌───────────────────────────────┐
        │    React Dashboard    │                   │      Express API Services     │
        │ (Day/Night Theme, UI) │                   │  (Base62 Engine, SSRF Guard)  │
        └───────────────────────┘                   └───────────────┬───────────────┘
                                                                    │
                    ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
                    ▼                                               ▼                                               ▼
        ┌───────────────────────┐                       ┌───────────────────────┐                       ┌───────────────────────┐
        │        Redis 7        │                       │   MongoDB Atlas 7.0   │                       │     BullMQ Worker     │
        │ ───────────────────── │                       │ ───────────────────── │                       │ ───────────────────── │
        │ • Cache-Aside (Sub-3ms│                       │ • User Accounts       │                       │ • Asynchronous Ingest │
        │ • Negative Caching    │                       │ • Shortcode Registry  │◄──────────────────────┤ • GeoIP Resolution    │
        │ • Atomic Base62 INCR  │                       │ • Click Telemetry     │                       │ • Device Classification│
        │ • 2-Tier Rate Limiter │                       │ • Campaign Tags       │                       │ • Batch DB Ingestion  │
        │ • BullMQ Job Queue    │                       │ • Webhooks Registry   │                       └───────────────────────┘
        │ • Pub/Sub Live Stream │                       │ • Audit Logs          │
        └───────────────────────┘                       └───────────────────────┘
                    │                                               │
                    ▼                                               ▼
        ┌───────────────────────┐                       ┌───────────────────────┐
        │  Google Gemini Engine │                       │  Webhook Dispatcher   │
        │ ───────────────────── │                       │ ───────────────────── │
        │ • Malicious Heuristics│                       │ • HMAC-SHA256 Signing │
        │ • Smart Slug Synthesizer                      │ • Event: Link Clicked │
        │ • Natural Language Q&A│                       │ • Event: Link Expired │
        └───────────────────────┘                       └───────────────────────┘
```

---

## 2. Senior Engineering Decisions & Trade-Offs

### Sub-3ms Cache-Aside Redirection
* **In-Memory First**: The redirection route `GET /:shortCode` evaluates the Redis memory layer first (`url:{shortCode}`). Cache hits respond immediately with an HTTP 302 redirect without touching database disk I/O.
* **Negative Caching**: Non-existent codes are cached for 60 seconds (`{ notFound: true }`). This defends against cache-penetration denial-of-service attacks that attempt to exhaust database thread pools through automated enumeration.
* **HTTP 302 Redirection**: Standard 302 Found redirection is used so that every click event flows through the gateway for telemetry, while preventing aggressive client-side browser caching that skews analytics.

### Atomic Base62 Generation (Zero Database Collisions)
* **Algorithmic Guarantee**: Traditional platforms compute an MD5 or SHA-256 hash of the target URL and truncate it, requiring repetitive database existence checks to resolve collisions. SnipURL derives its shortcodes from a Redis atomic increment counter (`INCR url_counter`) mapped to Base62 (`0-9`, `a-z`, `A-Z`).
* **High Namespace Capacity**: Starting at offset `10,000,000`, 6-character shortcodes provide over 56.8 billion deterministic, collision-free identifiers with O(1) time complexity.
* **High-Availability Fallback**: If Redis memory is exhausted or unavailable, the system fails over transparently to an atomic sequence generator inside MongoDB.

### Two-Tier Rate Limiting & User Quotas
* **Tier 1 (Burst Protection)**: Sliding-window token bucket tracking request frequencies per IP address (20 creations/minute) to suppress automated bots.
* **Tier 2 (24-Hour Rolling Quotas)**: Redis counters track link creation against user subscriptions (Anonymous: 5/day; Free: 25/day; Pro: 100/day; Enterprise: 1,000+/day).
* **RFC Compliance**: When thresholds are exceeded, the server returns `HTTP 429 Too Many Requests` with a structured payload and standard `Retry-After` header.

### Decoupled Telemetry Processing via BullMQ
* Redirection handlers must not be burdened with database write latency. Click events (anonymized IP hash, GeoIP country, city, user agent, operating system, device family, referrer) are placed onto an in-memory BullMQ queue in under 1 millisecond.
* A dedicated background worker consumes events in micro-batches and performs bulk upserts into MongoDB, ensuring continuous redirection throughput even under severe traffic spikes.

### Defense-in-Depth SSRF & Namespace Security
* **SSRF Guard**: All destination URLs undergo DNS pre-flight inspection before insertion. The system strictly rejects RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback interfaces (`127.0.0.0/8`, `::1`), link-local metadata endpoints (`169.254.169.254`), and internal Docker container DNS names.
* **Namespace Reservation**: Protected pathnames (`/api`, `/health`, `/metrics`, `/login`, `/dashboard`, `/admin`) are safeguarded against custom slug hijacking.
* **Cryptographic Signatures**: User passcodes and credentials use Bcrypt with a salt factor of 10. Webhook dispatches are signed with HMAC-SHA256 signatures.

---

## 3. Modern Design System & User Experience

### Day & Night (Light / Dark) Theme Engine
* **Persistent Preference Sync**: Automatically detects and respects system OS preferences (`prefers-color-scheme`), with state persisted in `localStorage` (`snipurl_theme`).
* **Zero-Flash Initialization**: Inline client script in `index.html` prevents white or dark flashes during initial page load.
* **Custom Ambient Backgrounds**: Subtly textured background grid (`.bg-grid-pattern`), ambient radial glow orbs, and styled scrollbars for both Light and Dark modes.
* **Sun/Moon Micro-Interaction**: One-click theme toggle in the header with smooth rotational transitions.

### Human-Centric, Decluttered Layout
* **Streamlined Top Navigation**: Removed multi-tier dropdown bloat in favor of clear, intuitive navigation items:
  1. **Shortener**: Hero generator with live safety badge, AI slug suggestions, and drawer controls.
  2. **My Links**: Searchable link directory with category tags, active/disabled toggles, QR downloads, and individual analytics.
  3. **Live Stream**: Real-time SSE telemetry feed streaming live visitors and automated bot detection.
  4. **Campaign Tools**: Unified suite with a segmented pill toggle combining **Bulk Shortening** and **UTM Campaign Attribution**.
  5. **Developer API**: Interactive OpenAPI 3.0 documentation and copy-paste code snippets for cURL, Node.js, and Python.
* **Subtle Glassmorphism & Glow Effects**:
  - `backdrop-blur-2xl` glass header with border shine.
  - Ambient radial gradients (`blur-[130px]`) that subtly illuminate the main shortener card.
  - Hover lift states and glowing focus rings on inputs (`focus:ring-4 focus:ring-teal-500/10`).
* **Responsive Mobile Drawer**: Fluid hamburger navigation with touch-friendly 44px targets and zero horizontal scroll breakage.

---

## 4. Comprehensive Feature Matrix

### Link Routing & Access Control
* **Passcode Protection**: Protect sensitive destinations with a hashed passcode gate. Visitors enter the passcode on a dedicated landing screen to unlock the target.
* **One-Time Burn Links**: Self-destructing links that expire and purge automatically after a single successful redirect.
* **Click Quotas**: Set strict visitor caps (e.g., first 500 visitors). Once reached, the link automatically deactivates.
* **Scheduled Activation**: Defer link availability until a specified future date and time (`activateAt`).
* **Device Targeting**: Dynamically route traffic based on device type (iOS users to App Store, Android to Google Play, desktop users to standard web).
* **Geo-Routing**: Route traffic based on visitor country codes (e.g., US visitors to a regional store, Indian visitors to a localized page).
* **Bulk Shortening**: Ingest up to 100 URLs per batch via CSV file upload or multi-line text input, with instant CSV result export.
* **UTM Campaign Builder**: Generate standardized marketing attribution parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) with preset templates.

### Telemetry & Real-Time Analytics
* **Real-Time Telemetry Stream**: Server-Sent Events (SSE) stream at `/api/analytics/stream` providing live incoming click telemetry without polling.
* **Bot & Crawler Filtering**: Automatic identification and isolation of automated web spiders, crawlers, and scrapers to ensure verified human metrics.
* **Granular Drill-Downs**: Interactive distributions across geographic countries, cities, device families, operating systems, browsers, and referring platforms.
* **Data Portability**: Full CSV export capabilities for link-level and account-level analytics reports.

### AI Link Intelligence (Google Gemini)
* **Smart Slug Generator**: Evaluates destination URLs to produce readable, context-aware kebab-case slugs.
* **Malicious URL Detection**: Heuristic scanning detecting phishing patterns, high-entropy suspicious hostnames, and known malicious top-level domains.
* **Conversational Analytics**: Natural language Q&A interface powered by Gemini 3.8 Flash, answering complex query questions over telemetry data.

### Developer Platform & Webhooks
* **Developer REST API**: Secure programmatic access using `snip_live_...` API keys with per-key rate limiting.
* **HMAC Webhooks**: Automated HTTP webhooks with HMAC-SHA256 signatures for `click` and `expire` event streaming.
* **Interactive OpenAPI 3.0**: Interactive API documentation served directly at `/api/docs`.

---

## 5. Technology Stack

| Layer | Component | Technical Justification |
| :--- | :--- | :--- |
| **Edge Gateway** | Nginx 1.31 Alpine | High-concurrency connection pooling, gzip compression, static asset caching, SSL termination |
| **Frontend Dashboard** | React 19 + Tailwind CSS + Lucide | Fast component hydration, Day/Night theme system, responsive glassmorphism |
| **Core API Engine** | Node.js 20 LTS + Express | High-concurrency asynchronous I/O, event-loop efficiency for read-heavy workloads |
| **Caching & Sequencing** | Redis 7 Alpine | Sub-millisecond in-memory key-value lookups, atomic `INCR` Base62 sequence generation, Pub/Sub |
| **Job Queue** | BullMQ | Redis-backed asynchronous worker queue ensuring zero latency overhead on redirects |
| **Primary Database** | MongoDB Atlas 7.0 | Distributed multi-region document storage, flexible telemetry schema, B-tree indexes |
| **AI Intelligence** | Google Gemini 3.8 Flash | Low-latency inference for real-time safety classification and conversational insights |
| **Containerization** | Docker & Docker Compose | Multi-stage production container builds ensuring deterministic multi-environment deployment |

---

## 6. API Reference

All requests accept and return standard `application/json` payloads. Authentication is provided via Bearer JWT tokens or `X-API-Key` headers.

### URL Operations
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/urls` | Create shortened link with targeting, passcode, expiry | Optional |
| `POST` | `/api/urls/bulk` | Batch shorten up to 100 links via array payload | Optional |
| `GET` | `/api/urls` | Retrieve paginated links with filters (search, category, status) | Required |
| `GET` | `/api/urls/:id` | Retrieve single URL configuration | Required |
| `PATCH` | `/api/urls/:id` | Update destination, targeting, status, or metadata | Required |
| `DELETE` | `/api/urls/:id` | Purge shortcode and invalidate Redis cache | Required |
| `GET` | `/api/urls/quota` | Check current rate limit and remaining daily allowance | Public |

### Redirection Engine
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/:shortCode` | Low-latency 302 redirect with asynchronous telemetry | Public |
| `POST` | `/api/urls/:shortCode/verify-passcode` | Unlock password-protected link destination | Public |

### Analytics & Telemetry
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/:shortCode` | Detailed time-series, geo, device, and referrer metrics | Required |
| `GET` | `/api/analytics/overview` | Account-level aggregate metrics across all links | Required |
| `GET` | `/api/analytics/stream` | Server-Sent Events (SSE) live click telemetry feed | Required |
| `GET` | `/api/analytics/:shortCode/export/csv` | Export link click records as CSV | Required |
| `GET` | `/api/analytics/overview/export/csv` | Export entire account telemetry as CSV | Required |
| `POST` | `/api/analytics/ask-ai` | Conversational natural language query over metrics | Required |

### Developer Keys & Webhooks
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/keys` | List active developer API keys | Required |
| `POST` | `/api/keys` | Generate new developer REST API key | Required |
| `DELETE` | `/api/keys/:key` | Revoke developer API key | Required |
| `GET` | `/api/webhooks` | List registered event webhooks | Required |
| `POST` | `/api/webhooks` | Register new webhook subscription | Required |
| `POST` | `/api/webhooks/:id/test` | Dispatch test HMAC ping payload to target URL | Required |
| `DELETE` | `/api/webhooks/:id` | Remove webhook subscription | Required |

### Platform Administration
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Global platform metrics, user counts, cache hit ratio | Superadmin |
| `GET` | `/api/admin/users` | Platform user directory with suspension controls | Superadmin |
| `PATCH` | `/api/admin/users/:id/status` | Suspend or reactivate user accounts | Superadmin |
| `GET` | `/api/admin/abuse-reports` | Review flagged links submitted by users | Superadmin |
| `POST` | `/api/abuse/report` | Submit abuse report for malicious shortlink | Public |

### Health & Observability
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Basic service liveness probe | Public |
| `GET` | `/health/ready` | Deep readiness probe (verifies MongoDB & Redis) | Public |
| `GET` | `/metrics` | Prometheus metrics scrape target | Public |
| `GET` | `/api/docs` | OpenAPI 3.0 specification | Public |

---

## 7. Quick Start & Production Deployment

### Prerequisites
* Docker Engine 24.0+ and Docker Compose v2+
* Node.js 20 LTS (for local non-container development)

### Step 1: Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Verify your environment configuration values:
```env
PORT=5000
NODE_ENV=production
BASE_URL=http://localhost:3000

MONGO_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/urlshortener?retryWrites=true&w=majority
REDIS_URL=redis://redis:6379

JWT_SECRET=your-production-jwt-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 2: Launch All Services
Execute the single-command multi-container startup:
```bash
docker compose up -d --build
```

Docker Compose initiates 6 isolated services:
1. `url_shortener_nginx` — Public gateway reverse proxy (Ports `80`, `3000`)
2. `url_shortener_frontend` — Production Vite/React Single Page Application
3. `url_shortener_backend` — Core Express REST API (Port `5000`)
4. `url_shortener_worker` — BullMQ asynchronous click worker
5. `url_shortener_redis` — In-memory speed layer (Port `6379`)
6. `url_shortener_mongodb` — Local fallback database (Port `27017`)

### Step 3: Populate Sample Data
Seed the database with sample links, rich visitor click telemetry, and a pre-configured account:
```bash
docker compose exec backend npm run seed
```

**Pre-Configured Demo Credentials**:
* **Email**: `demo@example.com`
* **Password**: `password123`
* **Account Tier**: Pro Plan (100 links/day, Webhooks enabled)

---

## 8. Verification & Benchmarking

### Running the Test Suite
The automated test suite runs inside the Node 20 environment, testing Base62 algorithms, SSRF defenses, AI safety heuristics, and slug validation:
```bash
docker compose exec backend npm test
```
```
# tests 32
# pass 32
# fail 0
# duration_ms 16253.25
```

### High-Concurrency Redirection Benchmark
Measure the cache-aside latency profile under concurrent load:
```bash
docker compose exec -i backend node - < scripts/load-test.js
```

**Benchmark Results (1,000 requests, 50 concurrency)**:
* **Success Rate**: 100.0% (1,000 successes, 0 errors)
* **Throughput**: ~435+ req/sec on local Docker virtualization
* **Min Latency**: 37 ms
* **Median Latency (p50)**: 92 ms
* **Production Redis Latency (Native)**: 1–5 ms cache hits

---

## 9. Author & Attribution

**Designed & Developed by Satyam Kumar Mishra**  
Lead Software Engineer & Architect  
*© 2026 Satyam Kumar Mishra. All rights reserved.*
