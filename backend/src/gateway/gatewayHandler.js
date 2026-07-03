// ============================================================================
// THE GATEWAY — MeterFlow's core. Every consumer request flows through here.
//
// Path:  /gw/*   (e.g. GET /gw/pokemon/ditto with header `x-api-key: mf_...`)
//
// Pipeline (order matters, and every step is on the hot path):
//   1. AUTHENTICATE   — resolve the API key (Redis-cached) -> key context or 401.
//   2. RATE LIMIT     — atomic Redis token bucket -> 429 if exhausted.
//   3. PROXY          — forward method/path/body/headers to the upstream base URL.
//   4. METER          — fire-and-forget usage log (Mongo + Redis + socket). Never
//                       awaited: logging must not add latency to the response.
//   5. RESPOND        — stream the upstream response back plus metering headers.
//
// Design rule (non-negotiable): the response path never blocks on logging.
// ============================================================================
import { resolveApiKey } from '../services/apiKeyCache.js';
import { consumeToken } from '../services/rateLimiter.js';
import { recordUsage } from '../services/usageLogger.js';

// Hop-by-hop and host-specific headers we must not forward upstream.
const STRIPPED_REQUEST_HEADERS = new Set([
  'host', 'connection', 'content-length', 'x-api-key', 'authorization',
]);
const STRIPPED_RESPONSE_HEADERS = new Set([
  'connection', 'transfer-encoding', 'content-encoding', 'content-length',
]);

export async function gatewayHandler(req, res) {
  const startedAt = process.hrtime.bigint();

  // --- 1. AUTHENTICATE ------------------------------------------------------
  const rawKey = req.headers['x-api-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  const keyCtx = await resolveApiKey(rawKey);
  if (!keyCtx) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  // --- 2. RATE LIMIT --------------------------------------------------------
  const limit = await consumeToken(keyCtx.apiKeyId, keyCtx.rateLimitPerMin);
  res.setHeader('X-RateLimit-Limit', limit.limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.remaining));

  if (!limit.allowed) {
    const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    // Meter the throttled attempt too — it's real usage signal.
    meter(req, keyCtx, 429, startedAt, 0);
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: limit.retryAfterMs });
  }

  // --- 3. PROXY -------------------------------------------------------------
  // Everything after "/gw" is the upstream path. `req.params[0]` holds the wildcard.
  const upstreamPath = req.params[0] ? `/${req.params[0]}` : '/';
  const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  const upstreamUrl = joinUrl(keyCtx.upstreamBaseUrl, upstreamPath) + query;

  let upstreamResponse;
  let bodyBuffer;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers: buildUpstreamHeaders(req.headers),
      // GET/HEAD carry no body; everything else forwards the parsed JSON body.
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : serializeBody(req),
    });
    bodyBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
  } catch (err) {
    // Upstream unreachable / DNS / timeout — surface as 502 and still meter it.
    meter(req, keyCtx, 502, startedAt, 0);
    return res.status(502).json({ error: 'Upstream request failed', detail: err.message });
  }

  // --- 4. METER (fire-and-forget — NOT awaited) -----------------------------
  meter(req, keyCtx, upstreamResponse.status, startedAt, bodyBuffer.length);

  // --- 5. RESPOND -----------------------------------------------------------
  copyResponseHeaders(upstreamResponse.headers, res);
  res.status(upstreamResponse.status).send(bodyBuffer);
}

// Emit a usage event without blocking. latency measured to this point.
function meter(req, keyCtx, statusCode, startedAt, responseSize) {
  const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  recordUsage({
    apiKeyId: keyCtx.apiKeyId,
    apiId: keyCtx.apiId,
    orgId: keyCtx.orgId,
    endpoint: req.params[0] ? `/${req.params[0]}` : '/',
    method: req.method,
    statusCode,
    latencyMs,
    responseSize,
    ip: req.ip,
  });
}

// --- helpers ---------------------------------------------------------------

function joinUrl(base, path) {
  return base.replace(/\/+$/, '') + path;
}

function buildUpstreamHeaders(incoming) {
  const headers = {};
  for (const [name, value] of Object.entries(incoming)) {
    if (!STRIPPED_REQUEST_HEADERS.has(name.toLowerCase())) headers[name] = value;
  }
  return headers;
}

// express.json() already parsed the body; re-serialize for the upstream fetch.
function serializeBody(req) {
  if (req.body == null || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
    return undefined;
  }
  return JSON.stringify(req.body);
}

function copyResponseHeaders(upstreamHeaders, res) {
  upstreamHeaders.forEach((value, name) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(name.toLowerCase())) res.setHeader(name, value);
  });
}
