import { createHmac, timingSafeEqual } from 'node:crypto';
import worker from '../dist/server/index.js';

const SESSION_COOKIE = 'zain_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const text = (value) => String(value || '').trim();

function envForVercel() {
  const storageKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
  const bucketName = text(process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-media');
  return {
    SUPABASE_URL: text(process.env.SUPABASE_URL),
    SUPABASE_PUBLISHABLE_KEY: text(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
    SUPABASE_ANON_KEY: text(process.env.SUPABASE_ANON_KEY),
    KNOWLEDGE_ADMIN_TOKEN: text(process.env.KNOWLEDGE_ADMIN_TOKEN),
    NVIDIA_NIM_API_KEY: text(process.env.NVIDIA_NIM_API_KEY),
    NVIDIA_NIM_BASE_URL: text(process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'),
    NVIDIA_NIM_CHAT_MODEL: text(process.env.NVIDIA_NIM_CHAT_MODEL || 'z-ai/glm-5.3-flash'),
    NVIDIA_NIM_EMBEDDING_MODEL: text(process.env.NVIDIA_NIM_EMBEDDING_MODEL || 'nvidia/nemotron-3-embed-1b'),
    NVIDIA_NIM_EMBEDDING_DIMENSIONS: text(process.env.NVIDIA_NIM_EMBEDDING_DIMENSIONS || '2048'),
    RAG_SIMILARITY_THRESHOLD: text(process.env.RAG_SIMILARITY_THRESHOLD || '0.42'),
    ADMIN_EMAIL: text(process.env.ADMIN_EMAIL),
    BUCKET: storageKey && process.env.SUPABASE_URL ? createSupabaseStorageAdapter({
      baseUrl: text(process.env.SUPABASE_URL),
      serviceKey: storageKey,
      bucketName
    }) : undefined
  };
}

function storageUrl(config, key) {
  const encodedKey = String(key).split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${config.baseUrl.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(config.bucketName)}/${encodedKey}`;
}

function storageHeaders(config, extra = {}) {
  return { apikey: config.serviceKey, authorization: `Bearer ${config.serviceKey}`, ...extra };
}

function createSupabaseStorageAdapter(config) {
  return {
    async get(key) {
      const response = await fetch(storageUrl(config, key), { headers: storageHeaders(config) });
      if (!response.ok) return null;
      const body = await response.arrayBuffer();
      return {
        body,
        arrayBuffer: async () => body,
        customMetadata: {},
        httpMetadata: { contentType: response.headers.get('content-type') || 'application/octet-stream' }
      };
    },
    async head(key) {
      const response = await fetch(storageUrl(config, key), { method: 'HEAD', headers: storageHeaders(config) });
      if (!response.ok) return null;
      return {
        size: Number(response.headers.get('content-length') || 0),
        customMetadata: {},
        httpMetadata: { contentType: response.headers.get('content-type') || 'application/octet-stream' }
      };
    },
    async put(key, body, options = {}) {
      const contentType = options.httpMetadata?.contentType || 'application/octet-stream';
      const response = await fetch(storageUrl(config, key), {
        method: 'POST',
        headers: storageHeaders(config, { 'content-type': contentType, 'x-upsert': 'true' }),
        body
      });
      if (!response.ok) throw new Error('Supabase Storage upload failed.');
    },
    async delete(key) {
      await fetch(storageUrl(config, key), { method: 'DELETE', headers: storageHeaders(config) });
    }
  };
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function sessionValue(email, secret) {
  const payload = `${email}|${Date.now() + SESSION_TTL_MS}`;
  return `${base64Url(payload)}.${sign(payload, secret)}`;
}

function readCookies(request) {
  return Object.fromEntries(text(request.headers.cookie).split(';').map((part) => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function sessionEmail(request, env) {
  const secret = text(process.env.ADMIN_SESSION_SECRET);
  const expectedEmail = text(env.ADMIN_EMAIL).toLowerCase();
  const raw = readCookies(request)[SESSION_COOKIE];
  if (!secret || !expectedEmail || !raw) return '';
  const [encoded, signature] = raw.split('.');
  if (!encoded || !signature) return '';
  let payload;
  try { payload = Buffer.from(encoded, 'base64url').toString('utf8'); } catch { return ''; }
  const [email, expiresAt] = payload.split('|');
  if (!email || email.toLowerCase() !== expectedEmail || Number(expiresAt) < Date.now()) return '';
  const expected = sign(payload, secret);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return '';
  } catch { return ''; }
  return expectedEmail;
}

function cookieHeader(value, maxAge = 60 * 60 * 12) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function loginPage(message = '') {
  const safeMessage = String(message).replace(/[<&>]/g, (value) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[value]));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login — Zain Ali</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050813;color:#edf5ff;font:16px system-ui,sans-serif}.box{width:min(420px,calc(100% - 40px));padding:32px;border:1px solid #1e4267;border-radius:20px;background:#0b1424;box-shadow:0 24px 80px #0008}h1{margin:0 0 8px}p{color:#8fa3be;line-height:1.6}label{display:block;margin:20px 0 8px;color:#b8cae0;font-size:13px}input{width:100%;box-sizing:border-box;padding:13px;border:1px solid #2a5278;border-radius:10px;background:#07101d;color:#fff;font-size:16px}button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:10px;background:linear-gradient(110deg,#63e4ff,#4389ff);color:#031017;font-weight:800;font-size:15px;cursor:pointer}.error{color:#ff91a9}</style></head><body><main class="box"><h1>Admin Manager</h1><p>Owner-only access for Zain Ali portfolio.</p>${safeMessage ? `<p class="error">${safeMessage}</p>` : ''}<form method="post" action="/api/admin/login"><label for="password">Admin password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Sign in</button></form></main></body></html>`;
}

async function bodyText(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return '';
  return await request.text();
}

function requestPath(request) {
  const url = new URL(request.url, `https://${request.headers.host || 'vercel.app'}`);
  return url.searchParams.get('__path') || url.pathname;
}

async function forwardToWorker(request, env, path) {
  const headers = new Headers(request.headers);
  const email = sessionEmail(request, env);
  if (email) headers.set('oai-authenticated-user-email', email);
  const body = await bodyText(request);
  const url = new URL(request.url, `https://${request.headers.host || 'vercel.app'}`);
  url.pathname = path;
  url.search = path.includes('?') ? '' : url.search;
  const forwarded = new Request(url, { method: request.method, headers, body: body || undefined });
  return worker.fetch(forwarded, env);
}

export default async function handler(req, res) {
  const env = envForVercel();
  const path = requestPath(req);
  const isAdminPath = path === '/admin' || path === '/admin/' || path === '/admin/knowledge' || path === '/admin/knowledge/' || path === '/manage-cv' || path.startsWith('/api/admin/');

  if (path === '/api/admin/login' && req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
    const password = form.get('password') || '';
    const configuredPassword = text(process.env.VERCEL_ADMIN_PASSWORD);
    if (!configuredPassword || !env.ADMIN_EMAIL || password.length < 1 || password !== configuredPassword) {
      res.statusCode = 401;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(loginPage('Invalid admin credentials.'));
      return;
    }
    const secret = text(process.env.ADMIN_SESSION_SECRET);
    if (!secret) { res.statusCode = 503; res.end('ADMIN_SESSION_SECRET is not configured.'); return; }
    res.statusCode = 303;
    res.setHeader('location', '/admin/knowledge');
    res.setHeader('set-cookie', cookieHeader(sessionValue(env.ADMIN_EMAIL.toLowerCase(), secret)));
    res.end();
    return;
  }

  if (path === '/api/admin/logout') {
    res.statusCode = 303;
    res.setHeader('location', '/');
    res.setHeader('set-cookie', cookieHeader('', 0));
    res.end();
    return;
  }

  if (isAdminPath && !sessionEmail(req, env)) {
    if (req.method === 'GET' && (path === '/admin' || path === '/admin/' || path === '/admin/knowledge' || path === '/admin/knowledge/' || path === '/manage-cv')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(loginPage());
      return;
    }
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Owner login required.' }));
    return;
  }

  const response = await forwardToWorker(req, env, path);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}
