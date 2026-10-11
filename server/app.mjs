import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const defaultPublicDir = resolve(moduleDir, '../public');
const SID = {
  account: /^AC[0-9a-f]{32}$/i,
  service: /^MG[0-9a-f]{32}$/i,
  content: /^HX[0-9a-f]{32}$/i,
  message: /^(?:SM|MM)[0-9a-f]{32}$/i,
  call: /^CA[0-9a-f]{32}$/i,
};
const E164 = /^\+[1-9]\d{7,14}$/;
const STEP_ACTIONS = {
  flagPurchase: 'idle',
  showUnknownCall: 'flagged',
  ignoreUnknownCall: 'unknownRinging',
  rewind: 'unknownMissed',
  previewRcs: 'rewound',
  sendRcs: 'rewound',
  markNoResponse: 'rcsSent',
  previewBrandedCall: 'noResponse',
  placeCall: 'noResponse',
  markReached: 'brandedRinging',
};
const ALWAYS_ACTIONS = new Set(['showArchitecture', 'showBank', 'refreshStatuses', 'reset']);
const CALL_PREVIEW_ACTIONS = new Set(['showAndroidReasonExample', 'showIphoneCallExample']);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const VOICE_TWIML = '<Response><Say>This is a Twilio demonstration call for a fictional Twilio Bank scenario. Anthony Dellavecchia, a nine thousand eight hundred dollar vehicle deposit at Midlife Crisis Motors on card ending four eight two nine was flagged. Please review the transaction in your official banking app. Goodbye.</Say></Response>';

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function maskNumber(number) {
  return E164.test(number ?? '') ? `•••• ${number.slice(-4)}` : null;
}

function getConfig(env) {
  const accountValid = SID.account.test(env.TWILIO_ACCOUNT_SID ?? '');
  const tokenValid = Boolean(env.TWILIO_AUTH_TOKEN?.trim());
  const recipientValid = E164.test(env.DEMO_TO_NUMBER ?? '');
  const serviceValid = SID.service.test(env.TWILIO_MESSAGING_SERVICE_SID ?? '');
  const contentValid = SID.content.test(env.TWILIO_RCS_CONTENT_SID ?? '');
  const callerValid = E164.test(env.TWILIO_VOICE_FROM ?? '');

  return {
    rcsReady: accountValid && tokenValid && recipientValid && serviceValid && contentValid,
    voiceReady: accountValid && tokenValid && recipientValid && callerValid,
    recipientMasked: maskNumber(env.DEMO_TO_NUMBER),
    callerMasked: maskNumber(env.TWILIO_VOICE_FROM),
    contentSidConfigured: contentValid,
  };
}

function freshState() {
  return {
    step: 'idle',
    audienceView: 'bank',
    messageMode: 'none',
    messageChannel: 'none',
    callMode: 'none',
    callPreviewDevice: 'iphone',
    messageSid: null,
    callSid: null,
    messageStatus: null,
    callStatus: null,
    events: [],
    updatedAt: new Date().toISOString(),
  };
}

function createTwilioClient(env, fetchImpl) {
  const root = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}`;
  const authorization = `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`;

  async function request(resource, method, form, failureCode) {
    let response;
    try {
      response = await fetchImpl(`${root}/${resource}`, {
        method,
        headers: {
          authorization,
          ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
        },
        ...(form ? { body: new URLSearchParams(form).toString() } : {}),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new AppError(502, 'TWILIO_UNAVAILABLE', 'Twilio could not be reached. Check the connection and retry.');
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new AppError(502, failureCode, 'Twilio returned an unreadable response. Check Twilio Console for details.');
    }

    if (!response.ok) {
      const errorCode = Number.isInteger(body?.code) ? ` (error ${body.code})` : '';
      throw new AppError(502, failureCode, `Twilio rejected the request${errorCode}. Check the sender, recipient, and account setup in Twilio Console.`);
    }
    return body;
  }

  return {
    async sendRcs() {
      const result = await request('Messages.json', 'POST', {
        To: env.DEMO_TO_NUMBER,
        MessagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
        ContentSid: env.TWILIO_RCS_CONTENT_SID,
      }, 'TWILIO_MESSAGE_REJECTED');
      if (!SID.message.test(result?.sid ?? '')) {
        throw new AppError(502, 'TWILIO_MESSAGE_REJECTED', 'Twilio did not return a valid Message SID. Check Twilio Console before retrying.');
      }
      return result;
    },
    async placeCall() {
      const result = await request('Calls.json', 'POST', {
        To: env.DEMO_TO_NUMBER,
        From: env.TWILIO_VOICE_FROM,
        Twiml: VOICE_TWIML,
      }, 'TWILIO_CALL_REJECTED');
      if (!SID.call.test(result?.sid ?? '')) {
        throw new AppError(502, 'TWILIO_CALL_REJECTED', 'Twilio did not return a valid Call SID. Check Twilio Console before retrying.');
      }
      return result;
    },
    async getMessage(sid) {
      return request(`Messages/${sid}.json`, 'GET', null, 'TWILIO_STATUS_FAILED');
    },
    async getCall(sid) {
      return request(`Calls/${sid}.json`, 'GET', null, 'TWILIO_STATUS_FAILED');
    },
  };
}

function createDemo(env, fetchImpl, broadcast) {
  const config = getConfig(env);
  const twilio = createTwilioClient(env, fetchImpl);
  let state = freshState();
  let sequence = 0;
  let inFlight = false;

  function snapshot() {
    return { state, config };
  }

  function publish(update, event) {
    const next = { ...state, ...update, updatedAt: new Date().toISOString() };
    if (event) {
      const item = {
        id: String(++sequence),
        at: next.updatedAt,
        kind: event.kind,
        title: event.title,
        ...(event.detail ? { detail: event.detail } : {}),
      };
      next.events = [...state.events, item];
    }
    state = next;
    broadcast(snapshot());
    return snapshot();
  }

  async function act(action) {
    if (inFlight) {
      throw new AppError(409, 'ACTION_IN_PROGRESS', 'Wait for the current action to finish.');
    }
    if (!Object.hasOwn(STEP_ACTIONS, action) && !ALWAYS_ACTIONS.has(action) && !CALL_PREVIEW_ACTIONS.has(action)) {
      throw new AppError(400, 'UNKNOWN_ACTION', 'Unknown presenter action.');
    }
    if (Object.hasOwn(STEP_ACTIONS, action) && state.step !== STEP_ACTIONS[action]) {
      throw new AppError(409, 'INVALID_TRANSITION', `Cannot run ${action} during ${state.step}.`);
    }
    if (CALL_PREVIEW_ACTIONS.has(action) && !['brandedRinging', 'reached'].includes(state.step)) {
      throw new AppError(409, 'INVALID_TRANSITION', `Cannot run ${action} during ${state.step}.`);
    }

    inFlight = true;
    try {
      switch (action) {
        case 'flagPurchase':
          return publish({ step: 'flagged' }, {
            kind: 'simulated',
            title: 'Unusual purchase flagged',
            detail: 'Anthony Dellavecchia · Midlife Crisis Motors · $9,800.00 vehicle deposit · card ending 4829.',
          });
        case 'showUnknownCall':
          return publish({ step: 'unknownRinging' }, {
            kind: 'simulated',
            title: 'Unknown number rings',
            detail: 'The first, unbranded call is a story simulation.',
          });
        case 'ignoreUnknownCall':
          return publish({ step: 'unknownMissed' }, {
            kind: 'simulated',
            title: 'Unknown call missed',
            detail: 'The customer does not answer; the purchase still needs review.',
          });
        case 'rewind':
          return publish({
            step: 'rewound',
            messageMode: 'none',
            messageChannel: 'none',
            callMode: 'none',
            callPreviewDevice: 'iphone',
            messageSid: null,
            callSid: null,
            messageStatus: null,
            callStatus: null,
          }, {
            kind: 'system',
            title: 'Rewind to the same purchase',
            detail: 'Now the customer sees the branded route.',
          });
        case 'previewRcs':
          return publish({ step: 'rcsSent', messageMode: 'simulated', messageChannel: 'simulated' }, {
            kind: 'simulated',
            title: 'RCS alert previewed',
            detail: 'On-screen phone is a simulation; no message was sent.',
          });
        case 'sendRcs': {
          if (!config.rcsReady) {
            throw new AppError(503, 'RCS_NOT_CONFIGURED', 'Configure a valid Twilio account, demo recipient, Messaging Service SID, and Content SID before sending RCS.');
          }
          const result = await twilio.sendRcs();
          return publish({
            step: 'rcsSent',
            messageMode: 'live',
            messageChannel: 'pending',
            messageSid: result.sid,
            messageStatus: typeof result.status === 'string' ? result.status : null,
          }, {
            kind: 'real',
            title: 'Twilio accepted rich message request',
            detail: `Message ${result.sid}; status ${result.status ?? 'unknown'}. Delivery is not yet confirmed. RCS is preferred; the service may fall back to SMS.`,
          });
        }
        case 'markNoResponse':
          return publish({ step: 'noResponse' }, {
            kind: 'simulated',
            title: 'No response observed',
            detail: 'Presenter advances this story step manually.',
          });
        case 'previewBrandedCall':
          return publish({ step: 'brandedRinging', callMode: 'simulated', callPreviewDevice: 'iphone' }, {
            kind: 'simulated',
            title: 'Branded call previewed',
            detail: 'On-screen iPhone call is a simulation; no call was placed.',
          });
        case 'placeCall': {
          if (!config.voiceReady) {
            throw new AppError(503, 'VOICE_NOT_CONFIGURED', 'Configure a valid Twilio account, demo recipient, and approved caller number before placing a call.');
          }
          const result = await twilio.placeCall();
          return publish({
            step: 'brandedRinging',
            callMode: 'live',
            callPreviewDevice: 'iphone',
            callSid: result.sid,
            callStatus: typeof result.status === 'string' ? result.status : null,
          }, {
            kind: 'real',
            title: 'Twilio accepted outbound call request',
            detail: `Call ${result.sid}; status ${result.status ?? 'unknown'}. On-device branding depends on device and carrier support.`,
          });
        }
        case 'markReached':
          return publish({ step: 'reached' }, {
            kind: 'simulated',
            title: 'Customer reached in the story',
            detail: 'Presenter confirms the scenario outcome; a completed call alone does not prove a person answered.',
          });
        case 'showAndroidReasonExample':
          return state.callPreviewDevice === 'android' ? snapshot() : publish({ callPreviewDevice: 'android' });
        case 'showIphoneCallExample':
          return state.callPreviewDevice === 'iphone' ? snapshot() : publish({ callPreviewDevice: 'iphone' });
        case 'showArchitecture':
          return state.audienceView === 'architecture' ? snapshot() : publish({ audienceView: 'architecture' });
        case 'showBank':
          return state.audienceView === 'bank' ? snapshot() : publish({ audienceView: 'bank' });
        case 'refreshStatuses': {
          const checks = [];
          if (state.messageMode === 'live' && state.messageSid) {
            checks.push(twilio.getMessage(state.messageSid).then((result) => ['message', result]));
          }
          if (state.callMode === 'live' && state.callSid) {
            checks.push(twilio.getCall(state.callSid).then((result) => ['call', result]));
          }
          if (checks.length === 0) return snapshot();
          const results = await Promise.all(checks);
          const update = {};
          const events = [];
          for (const [type, result] of results) {
            const sid = type === 'message' ? state.messageSid : state.callSid;
            if (result?.sid !== sid || typeof result.status !== 'string' || result.status.length > 50) {
              throw new AppError(502, 'TWILIO_STATUS_FAILED', 'Twilio returned an unexpected status response. Check Twilio Console.');
            }
            const key = type === 'message' ? 'messageStatus' : 'callStatus';
            let nextChannel = state.messageChannel;
            if (type === 'message') {
              const status = result.status.toLowerCase();
              const sender = typeof result.from === 'string' ? result.from : '';
              if (status === 'delivered' || status === 'read') {
                nextChannel = sender.toLowerCase().startsWith('rcs:') ? 'rcs' : E164.test(sender) ? 'fallback' : 'unknown';
              } else if (status === 'failed' || status === 'undelivered' || status === 'canceled') {
                nextChannel = 'unknown';
              } else {
                nextChannel = 'pending';
              }
            }
            if (result.status !== state[key] || (type === 'message' && nextChannel !== state.messageChannel)) {
              update[key] = result.status;
              if (type === 'message') update.messageChannel = nextChannel;
              const channelDetail = type === 'message' && nextChannel !== state.messageChannel
                ? nextChannel === 'rcs' ? ' RCS sender confirmed after delivery.'
                  : nextChannel === 'fallback' ? ' Number-based fallback sender confirmed after delivery.' : ''
                : '';
              events.push({
                id: String(++sequence),
                at: new Date().toISOString(),
                kind: 'real',
                title: type === 'message' && nextChannel !== state.messageChannel && result.status === state[key]
                  ? `Message channel: ${nextChannel}`
                  : `${type === 'message' ? 'Message' : 'Call'} status: ${result.status}`,
                detail: `${type === 'message' ? 'Message' : 'Call'} ${sid} reported by Twilio.${channelDetail}`,
              });
            }
          }
          if (events.length === 0) return snapshot();
          state = {
            ...state,
            ...update,
            events: [...state.events, ...events],
            updatedAt: new Date().toISOString(),
          };
          broadcast(snapshot());
          return snapshot();
        }
        case 'reset':
          state = freshState();
          sequence = 0;
          broadcast(snapshot());
          return snapshot();
        default:
          throw new AppError(400, 'UNKNOWN_ACTION', 'Unknown presenter action.');
      }
    } finally {
      inFlight = false;
    }
  }

  return { snapshot, act };
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readAction(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON for presenter actions.');
  }
  const chunks = [];
  let length = 0;
  let tooLarge = false;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 8_192) tooLarge = true;
    if (!tooLarge) chunks.push(chunk);
  }
  if (tooLarge) throw new AppError(413, 'BODY_TOO_LARGE', 'Presenter action body is too large.');
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'Presenter action must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.action !== 'string') {
    throw new AppError(400, 'INVALID_ACTION', 'Presenter action must contain an action name.');
  }
  if (Object.keys(value).some((key) => key !== 'action')) {
    throw new AppError(400, 'UNEXPECTED_FIELDS', 'Presenter actions cannot include a destination or other extra fields.');
  }
  return value.action;
}

async function serveStatic(req, res, pathname, publicDir) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    json(res, 405, { error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' });
    return;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    json(res, 400, { error: 'Invalid URL.', code: 'INVALID_URL' });
    return;
  }
  const routeFile = ['/bank', '/presenter', '/architecture'].includes(decoded) ? 'index.html' : decoded.slice(1);
  const segments = routeFile.split('/');
  if (!routeFile || routeFile.includes('\0') || routeFile.includes('\\') || segments.some((segment) => segment.startsWith('.'))) {
    json(res, 404, { error: 'Not found.', code: 'NOT_FOUND' });
    return;
  }
  const target = resolve(publicDir, routeFile);
  if (target !== publicDir && !target.startsWith(`${publicDir}${sep}`)) {
    json(res, 404, { error: 'Not found.', code: 'NOT_FOUND' });
    return;
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('not a file');
    const body = await readFile(target);
    res.writeHead(200, {
      'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'content-length': body.length,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    json(res, 404, { error: 'Not found.', code: 'NOT_FOUND' });
  }
}

export function createAppServer({ env = process.env, fetchImpl = fetch, publicDir = defaultPublicDir } = {}) {
  const staticRoot = resolve(publicDir);
  const presenterToken = randomBytes(32).toString('base64url');
  const presenterTokenBytes = Buffer.from(presenterToken);
  const clients = new Set();
  const broadcast = (value) => {
    const data = `data: ${JSON.stringify(value)}\n\n`;
    for (const client of clients) client.write(data);
  };
  const demo = createDemo(env, fetchImpl, broadcast);

  const server = http.createServer(async (req, res) => {
    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      const host = typeof req.headers.host === 'string' ? req.headers.host.toLowerCase() : '';
      const localHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      const remote = req.socket.remoteAddress;
      const isLoopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
      if (!isLoopback || !localHosts.has(host)) {
        throw new AppError(403, 'LOCAL_ORIGIN_REQUIRED', 'Open this demo from its local URL.');
      }
      const pathname = new URL(req.url ?? '/', `http://${host}`).pathname;
      if (pathname === '/api/state' && req.method === 'GET') {
        json(res, 200, demo.snapshot());
        return;
      }
      if (pathname === '/api/events' && req.method === 'GET') {
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          'x-content-type-options': 'nosniff',
        });
        res.write('retry: 1500\n\n');
        clients.add(res);
        res.write(`data: ${JSON.stringify(demo.snapshot())}\n\n`);
        const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20_000);
        heartbeat.unref();
        res.on('close', () => {
          clients.delete(res);
          clearInterval(heartbeat);
        });
        return;
      }
      if (pathname === '/api/action' && req.method === 'POST') {
        if (req.headers.origin && req.headers.origin !== `http://${host}`) {
          throw new AppError(403, 'LOCAL_ORIGIN_REQUIRED', 'Presenter actions must come from the local demo origin.');
        }
        const suppliedToken = req.headers['x-presenter-token'];
        const suppliedBytes = typeof suppliedToken === 'string' ? Buffer.from(suppliedToken) : Buffer.alloc(0);
        if (suppliedBytes.length !== presenterTokenBytes.length || !timingSafeEqual(suppliedBytes, presenterTokenBytes)) {
          throw new AppError(403, 'PRESENTER_FORBIDDEN', 'Open the private presenter URL printed by the local server.');
        }
        const action = await readAction(req);
        json(res, 200, await demo.act(action));
        return;
      }
      if (pathname.startsWith('/api/')) {
        json(res, 404, { error: 'API route not found.', code: 'NOT_FOUND' });
        return;
      }
      if (pathname === '/') {
        res.writeHead(302, { location: '/bank', 'cache-control': 'no-store' });
        res.end();
        return;
      }
      await serveStatic(req, res, pathname, staticRoot);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (error instanceof AppError) {
        json(res, error.status, { error: error.message, code: error.code });
      } else {
        json(res, 500, { error: 'Server error. Check the local server log.', code: 'SERVER_ERROR' });
      }
    }
  });
  Object.defineProperty(server, 'presenterToken', { value: presenterToken });
  return server;
}
