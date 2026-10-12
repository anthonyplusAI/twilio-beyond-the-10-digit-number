import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import twilio from 'twilio';
import WebSocket from 'ws';
import { createAppServer } from '../server/app.mjs';

const ACCOUNT_SID = `AC${'a'.repeat(32)}`;
const MESSAGE_SID = `SM${'b'.repeat(32)}`;
const CALL_SID = `CA${'c'.repeat(32)}`;
const SERVICE_SID = `MG${'d'.repeat(32)}`;
const CONTENT_SID = `HX${'e'.repeat(32)}`;

const liveEnv = {
  TWILIO_ACCOUNT_SID: ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: 'test-only-token',
  TWILIO_MESSAGING_SERVICE_SID: SERVICE_SID,
  TWILIO_RCS_CONTENT_SID: CONTENT_SID,
  TWILIO_VOICE_FROM: '+14155550101',
  DEMO_TO_NUMBER: '+14155550199',
  TWILIO_CONVERSATION_RELAY_URL: 'wss://relay.example.test/voice-relay',
  OPENAI_API_KEY: 'test-only-openai-key',
};
const presenterTokens = new Map();

async function withServer(fn, options = {}) {
  const server = createAppServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  presenterTokens.set(base, server.presenterToken);
  try {
    await fn(base, server.presenterToken);
  } finally {
    presenterTokens.delete(base);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function snapshot(base) {
  const response = await fetch(`${base}/api/state`);
  assert.equal(response.status, 200);
  return response.json();
}

async function action(base, name, rest = {}) {
  const token = presenterTokens.get(base);
  const response = await fetch(`${base}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-presenter-token': token } : {}) },
    body: JSON.stringify({ action: name, ...rest }),
  });
  return { status: response.status, body: await response.json() };
}

async function requestWithHeaders(base, path, { method = 'GET', headers = {}, body = '' } = {}) {
  const target = new URL(base);
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path,
      method,
      headers,
    }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: text }));
    });
    request.on('error', reject);
    request.end(body);
  });
}

async function unusedPort() {
  const probe = http.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

test('presenter actions require a private per-server token while audience state remains readable', async () => {
  await withServer(async (base, token) => {
    assert.equal(typeof token, 'string');
    assert.ok(token.length >= 32);
    const audience = await snapshot(base);
    assert.equal(audience.state.step, 'idle');
    assert.equal(JSON.stringify(audience).includes(token), false);

    const unauthorized = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(unauthorized.status, 403);
    assert.equal((await unauthorized.json()).code, 'PRESENTER_FORBIDDEN');

    const wrongToken = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-presenter-token': 'wrong-token' },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(wrongToken.status, 403);
    assert.equal((await wrongToken.json()).code, 'PRESENTER_FORBIDDEN');
    assert.equal((await snapshot(base)).state.step, 'idle');

    const authorized = await action(base, 'flagPurchase');
    assert.equal(authorized.status, 200);
    assert.equal(authorized.body.state.step, 'flagged');
  });
});

test('non-loopback Host and cross-origin presenter requests are rejected', async () => {
  await withServer(async (base, token) => {
    const wrongHost = await new Promise((resolve, reject) => {
      http.get(`${base}/api/state`, { headers: { host: `attacker.example:${new URL(base).port}` } }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });
    assert.equal(wrongHost.status, 403);
    assert.equal(wrongHost.body.code, 'LOCAL_ORIGIN_REQUIRED');

    const wrongOrigin = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-presenter-token': token,
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(wrongOrigin.status, 403);
    assert.equal((await wrongOrigin.json()).code, 'LOCAL_ORIGIN_REQUIRED');
    assert.equal((await snapshot(base)).state.step, 'idle');

    const sameOrigin = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-presenter-token': token,
        origin: base,
      },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(sameOrigin.status, 200);
    assert.equal((await sameOrigin.json()).state.step, 'flagged');
  });
});

test('public deployment requires a stable presenter token before the server starts', () => {
  assert.throws(
    () => createAppServer({ env: { PUBLIC_BASE_URL: 'https://demo.example.test' } }),
    /PRESENTER_TOKEN/,
  );
  assert.throws(
    () => createAppServer({ env: { PUBLIC_BASE_URL: 'https://demo.example.test', PRESENTER_TOKEN: 'guess-me' } }),
    /PRESENTER_TOKEN/,
  );
});

test('public deployment accepts only a bare HTTPS origin', () => {
  const token = randomBytes(32).toString('base64url');
  for (const publicBaseUrl of ['http://demo.example.test', 'https://demo.example.test/bank', 'https://user@demo.example.test']) {
    assert.throws(
      () => createAppServer({ env: { PUBLIC_BASE_URL: publicBaseUrl, PRESENTER_TOKEN: token } }),
      /PUBLIC_BASE_URL/,
    );
  }
});

test('public deployment rejects a relay URL on a different origin', () => {
  assert.throws(() => createAppServer({ env: {
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_TOKEN: randomBytes(32).toString('base64url'),
    TWILIO_CONVERSATION_RELAY_URL: 'wss://other.example.test/voice-relay',
  } }), /TWILIO_CONVERSATION_RELAY_URL/);
});

test('public deployment accepts only its configured Host and same-origin presenter actions', async () => {
  const token = randomBytes(32).toString('base64url');
  const env = { ...liveEnv, TWILIO_CONVERSATION_RELAY_URL: '', PUBLIC_BASE_URL: 'https://demo.example.test', PRESENTER_TOKEN: token };
  await withServer(async (base, activeToken) => {
    assert.equal(activeToken, token);
    const publicState = await requestWithHeaders(base, '/api/state', { headers: { host: 'demo.example.test' } });
    assert.equal(publicState.status, 200);
    assert.equal(JSON.parse(publicState.body).state.step, 'idle');

    const wrongHost = await requestWithHeaders(base, '/api/state', { headers: { host: 'attacker.example.test' } });
    assert.equal(wrongHost.status, 403);

    const actionBody = JSON.stringify({ action: 'flagPurchase' });
    const wrongOrigin = await requestWithHeaders(base, '/api/action', {
      method: 'POST',
      headers: {
        host: 'demo.example.test', origin: 'https://attacker.example.test',
        'content-type': 'application/json', 'x-presenter-token': token,
      },
      body: actionBody,
    });
    assert.equal(wrongOrigin.status, 403);

    const validAction = await requestWithHeaders(base, '/api/action', {
      method: 'POST',
      headers: {
        host: 'demo.example.test', origin: 'https://demo.example.test',
        'content-type': 'application/json', 'x-presenter-token': token,
      },
      body: actionBody,
    });
    assert.equal(validAction.status, 200);
    assert.equal(JSON.parse(validAction.body).state.step, 'flagged');
  }, { env });
});

test('health probe responds without a presenter token or public Host header', async () => {
  const env = {
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_TOKEN: randomBytes(32).toString('base64url'),
  };
  await withServer(async (base) => {
    const response = await requestWithHeaders(base, '/healthz', { headers: { host: 'probe.internal' } });
    assert.equal(response.status, 200);
    assert.equal(response.body, 'ok');
  }, { env });
});

test('voice readiness uses the WebSocket URL derived from the public origin', async () => {
  const env = {
    ...liveEnv,
    TWILIO_CONVERSATION_RELAY_URL: '',
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_TOKEN: randomBytes(32).toString('base64url'),
  };
  await withServer(async (base) => {
    const response = await requestWithHeaders(base, '/api/state', { headers: { host: 'demo.example.test' } });
    assert.equal(response.status, 200);
    assert.equal(JSON.parse(response.body).config.voiceReady, true);
  }, { env });
});

test('one public port serves the site and a Twilio-signed ConversationRelay WebSocket', { timeout: 5_000 }, async () => {
  const env = {
    ...liveEnv,
    TWILIO_CONVERSATION_RELAY_URL: '',
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_TOKEN: randomBytes(32).toString('base64url'),
  };
  await withServer(async (base) => {
    const page = await requestWithHeaders(base, '/bank', { headers: { host: 'demo.example.test' } });
    assert.equal(page.status, 200);

    const signature = twilio.getExpectedTwilioSignature(
      env.TWILIO_AUTH_TOKEN,
      'wss://demo.example.test/voice-relay',
      {},
    );
    const socket = new WebSocket(`${base.replace('http:', 'ws:')}/voice-relay`, {
      headers: { host: 'demo.example.test', 'x-twilio-signature': signature },
    });
    try {
      await once(socket, 'open');
      const reply = new Promise((resolve, reject) => {
        let spoken = '';
        const timer = setTimeout(() => reject(new Error('Timed out waiting for agent reply.')), 3_000);
        socket.on('message', (raw) => {
          const packet = JSON.parse(raw.toString());
          if (packet.type !== 'text') return;
          spoken += packet.token;
          if (packet.last) {
            clearTimeout(timer);
            resolve(spoken);
          }
        });
      });
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid: CALL_SID,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'What should I do?', last: true }));
      assert.equal(await reply, 'Please review the banking app.');
    } finally {
      socket.terminate();
    }
  }, {
    env,
    relayOptions: { streamReply: async function* () { yield 'Please review the banking app.'; } },
  });
});

test('public entrypoint starts one port and keeps the presenter token out of logs', { timeout: 8_000 }, async () => {
  const port = await unusedPort();
  const oldRelayPort = await unusedPort();
  const token = randomBytes(32).toString('base64url');
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      PORT: String(port),
      VOICE_PORT: String(oldRelayPort),
      PUBLIC_BASE_URL: 'https://demo.example.test',
      PRESENTER_TOKEN: token,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let errors = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { errors += chunk; });
  try {
    let startupTimer;
    try {
      await Promise.race([
        new Promise((resolve, reject) => {
          child.stdout.on('data', () => {
            if (output.includes('Conversation Relay')) resolve();
          });
          child.on('exit', (code) => reject(new Error(`Server exited with ${code}: ${errors}`)));
        }),
        new Promise((_, reject) => {
          startupTimer = setTimeout(() => reject(new Error(`Server startup timed out: ${errors}`)), 5_000);
        }),
      ]);
    } finally {
      clearTimeout(startupTimer);
    }
    assert.doesNotMatch(output, new RegExp(token));
    const health = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(health.status, 200);
    await assert.rejects(fetch(`http://127.0.0.1:${oldRelayPort}/voice-relay`, { signal: AbortSignal.timeout(500) }));
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
  }
});

async function toRewound(base) {
  for (const name of ['flagPurchase', 'showUnknownCall', 'ignoreUnknownCall', 'rewind']) {
    const result = await action(base, name);
    assert.equal(result.status, 200, `${name}: ${JSON.stringify(result.body)}`);
  }
}

test('simulated fraud alert journey advances only on explicit actions and reset clears it', async () => {
  await withServer(async (base) => {
    const initial = await snapshot(base);
    assert.equal(initial.state.step, 'idle');
    assert.equal(initial.state.audienceView, 'bank');
    assert.equal(initial.state.callPreviewDevice, 'iphone');
    assert.deepEqual(initial.state.events, []);

    await toRewound(base);
    assert.match((await snapshot(base)).state.events[0].detail, /Anthony Dellavecchia/);
    let result = await action(base, 'previewRcs');
    assert.equal(result.body.state.step, 'rcsSent');
    assert.equal(result.body.state.messageMode, 'simulated');
    assert.equal(result.body.state.messageSid, null);
    result = await action(base, 'markNoResponse');
    assert.equal(result.body.state.step, 'noResponse');
    result = await action(base, 'previewBrandedCall');
    assert.equal(result.body.state.step, 'brandedRinging');
    assert.equal(result.body.state.callMode, 'simulated');
    assert.equal(result.body.state.callPreviewDevice, 'android');
    result = await action(base, 'showIphoneCallExample');
    assert.equal(result.body.state.callPreviewDevice, 'iphone');
    result = await action(base, 'showAndroidReasonExample');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.callPreviewDevice, 'android');
    assert.equal(result.body.state.step, 'brandedRinging');
    result = await action(base, 'markReached');
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.callPreviewDevice, 'android');
    assert.ok(result.body.state.events.some((event) => event.kind === 'simulated'));

    result = await action(base, 'showIphoneCallExample');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.callPreviewDevice, 'iphone');

    result = await action(base, 'showArchitecture');
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.audienceView, 'architecture');
    result = await action(base, 'reset');
    assert.equal(result.body.state.step, 'idle');
    assert.equal(result.body.state.audienceView, 'bank');
    assert.equal(result.body.state.callPreviewDevice, 'iphone');
    assert.deepEqual(result.body.state.events, []);
  });
});

test('invalid transitions and client-supplied destinations are rejected without changing state', async () => {
  await withServer(async (base) => {
    let result = await action(base, 'markReached');
    assert.equal(result.status, 409);
    assert.equal(result.body.code, 'INVALID_TRANSITION');

    result = await action(base, 'showAndroidReasonExample');
    assert.equal(result.status, 409);
    assert.equal(result.body.code, 'INVALID_TRANSITION');

    result = await action(base, 'flagPurchase', { to: '+14155550000' });
    assert.equal(result.status, 400);
    assert.equal(result.body.code, 'UNEXPECTED_FIELDS');

    assert.equal((await snapshot(base)).state.step, 'idle');
  });
});

test('prototype property names are rejected as unknown presenter actions', async () => {
  await withServer(async (base) => {
    const result = await action(base, 'toString');
    assert.equal(result.status, 400);
    assert.equal(result.body.code, 'UNKNOWN_ACTION');
    assert.equal((await snapshot(base)).state.step, 'idle');
  });
});

test('real RCS action requires complete configuration and leaves the story rewound on failure', async () => {
  await withServer(async (base) => {
    await toRewound(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'RCS_NOT_CONFIGURED');
    assert.equal((await snapshot(base)).state.step, 'rewound');
  });
});

test('real RCS sends a configured Content Template to only the fixed tester and records acceptance', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ sid: MESSAGE_SID, status: 'accepted', to: liveEnv.DEMO_TO_NUMBER }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  await withServer(async (base) => {
    await toRewound(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'rcsSent');
    assert.equal(result.body.state.messageMode, 'live');
    assert.equal(result.body.state.messageSid, MESSAGE_SID);
    assert.equal(result.body.state.messageStatus, 'accepted');
    assert.equal(result.body.config.recipientMasked, '•••• 0199');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`);
    assert.equal(requests[0].init.method, 'POST');
    assert.equal(requests[0].init.headers.authorization, `Basic ${Buffer.from(`${ACCOUNT_SID}:test-only-token`).toString('base64')}`);
    const form = new URLSearchParams(requests[0].init.body);
    assert.equal(form.get('To'), '+14155550199');
    assert.equal(form.get('MessagingServiceSid'), SERVICE_SID);
    assert.equal(form.get('ContentSid'), CONTENT_SID);
    assert.equal(form.has('From'), false);
    assert.equal(result.body.state.events.at(-1).kind, 'real');
    assert.match(result.body.state.events.at(-1).title, /accepted/i);
    assert.doesNotMatch(result.body.state.events.at(-1).title, /delivered/i);
  }, { env: liveEnv, fetchImpl });
});

test('RCS channel is confirmed only after Twilio reports delivery from an RCS sender', async () => {
  let status = 'sent';
  const fetchImpl = async (url) => new Response(JSON.stringify(
    url.endsWith('/Messages.json')
      ? { sid: MESSAGE_SID, status: 'accepted', from: 'rcs:Twilio Bank' }
      : { sid: MESSAGE_SID, status, from: 'rcs:Twilio Bank' },
  ), { status: url.endsWith('/Messages.json') ? 201 : 200 });
  await withServer(async (base) => {
    await toRewound(base);
    const accepted = await action(base, 'sendRcs');
    assert.equal(accepted.body.state.messageChannel, 'pending');

    const sent = await action(base, 'refreshStatuses');
    assert.equal(sent.body.state.messageStatus, 'sent');
    assert.equal(sent.body.state.messageChannel, 'pending');

    status = 'delivered';
    const delivered = await action(base, 'refreshStatuses');
    assert.equal(delivered.body.state.messageStatus, 'delivered');
    assert.equal(delivered.body.state.messageChannel, 'rcs');
    assert.match(delivered.body.state.events.at(-1).detail, /RCS sender/);
  }, { env: liveEnv, fetchImpl });
});

test('Twilio delivery from an E.164 sender is identified as number-based fallback', async () => {
  const fetchImpl = async (url) => new Response(JSON.stringify(
    url.endsWith('/Messages.json')
      ? { sid: MESSAGE_SID, status: 'accepted' }
      : { sid: MESSAGE_SID, status: 'delivered', from: '+14155550101' },
  ), { status: url.endsWith('/Messages.json') ? 201 : 200 });
  await withServer(async (base) => {
    await toRewound(base);
    await action(base, 'sendRcs');
    const delivered = await action(base, 'refreshStatuses');
    assert.equal(delivered.body.state.messageStatus, 'delivered');
    assert.equal(delivered.body.state.messageChannel, 'fallback');
    assert.match(delivered.body.state.events.at(-1).detail, /number-based fallback sender/i);
  }, { env: liveEnv, fetchImpl });
});

test('Twilio RCS rejection is sanitized and does not create a fake sent state', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ code: 21614, message: 'Sensitive +14155550199' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
  await withServer(async (base) => {
    await toRewound(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_MESSAGE_REJECTED');
    assert.doesNotMatch(result.body.error, /\+14155550199/);
    assert.equal((await snapshot(base)).state.step, 'rewound');
  }, { env: liveEnv, fetchImpl });
});

test('live AI call requires a public relay URL and LLM key', async () => {
  const { TWILIO_CONVERSATION_RELAY_URL, OPENAI_API_KEY, ...withoutAgent } = liveEnv;
  await withServer(async (base) => {
    const initial = await snapshot(base);
    assert.equal(initial.config.voiceReady, false);
    await toRewound(base);
    await action(base, 'previewRcs');
    await action(base, 'markNoResponse');
    const result = await action(base, 'placeCall');
    assert.equal(result.status, 503);
    assert.equal((await snapshot(base)).state.step, 'noResponse');
  }, { env: withoutAgent });
});

test('branded call preview defaults to the supported Android reason example', async () => {
  await withServer(async (base) => {
    await toRewound(base);
    await action(base, 'previewRcs');
    await action(base, 'markNoResponse');
    const result = await action(base, 'previewBrandedCall');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.callPreviewDevice, 'android');
  });
});

test('real call uses the approved caller number and connects to an ElevenLabs voiced AI agent', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ sid: CALL_SID, status: 'queued', to: liveEnv.DEMO_TO_NUMBER }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  await withServer(async (base) => {
    await toRewound(base);
    await action(base, 'previewRcs');
    await action(base, 'markNoResponse');
    const result = await action(base, 'placeCall');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'brandedRinging');
    assert.equal(result.body.state.callMode, 'live');
    assert.equal(result.body.state.callStatus, 'queued');
    assert.equal(result.body.state.callSid, CALL_SID);
    assert.equal(requests[0].url, `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`);
    const form = new URLSearchParams(requests[0].init.body);
    assert.equal(form.get('To'), liveEnv.DEMO_TO_NUMBER);
    assert.equal(form.get('From'), liveEnv.TWILIO_VOICE_FROM);
    assert.equal(result.body.state.callPreviewDevice, 'android');
    assert.match(form.get('Twiml'), /<Connect><ConversationRelay /);
    assert.match(form.get('Twiml'), /url="wss:\/\/relay\.example\.test\/voice-relay"/);
    assert.match(form.get('Twiml'), /ttsProvider="ElevenLabs"/);
    assert.match(form.get('Twiml'), /voice="UgBBYS2sOqTuMpoF3BR0"/);
    assert.match(form.get('Twiml'), /Twilio Bank virtual assistant/);
    assert.doesNotMatch(form.get('Twiml'), /<Say>/);
  }, { env: liveEnv, fetchImpl });
});

test('refreshStatuses polls only recorded live SIDs and updates delivery separately from API acceptance', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    let payload;
    if (url.endsWith('/Messages.json')) payload = { sid: MESSAGE_SID, status: 'accepted' };
    else if (url.endsWith('/Calls.json')) payload = { sid: CALL_SID, status: 'queued' };
    else if (url.endsWith(`/Messages/${MESSAGE_SID}.json`)) payload = { sid: MESSAGE_SID, status: 'delivered' };
    else if (url.endsWith(`/Calls/${CALL_SID}.json`)) payload = { sid: CALL_SID, status: 'in-progress' };
    else throw new Error(`Unexpected URL: ${url}`);
    return new Response(JSON.stringify(payload), { status: init.method === 'GET' ? 200 : 201 });
  };
  await withServer(async (base) => {
    await toRewound(base);
    await action(base, 'sendRcs');
    await action(base, 'markNoResponse');
    await action(base, 'placeCall');
    const result = await action(base, 'refreshStatuses');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.messageStatus, 'delivered');
    assert.equal(result.body.state.callStatus, 'in-progress');
    assert.equal(result.body.state.step, 'brandedRinging');
    assert.equal(seen.filter(({ init }) => init.method === 'GET').length, 2);
    assert.ok(result.body.state.events.some((event) => event.kind === 'real' && /delivered/i.test(event.title)));
  }, { env: liveEnv, fetchImpl });
});

test('SSE sends an initial snapshot and broadcasts the next presenter action', { timeout: 5_000 }, async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/events`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const readUntil = async (pattern) => {
      let received = '';
      while (!pattern.test(received)) {
        const chunk = await reader.read();
        assert.equal(chunk.done, false);
        received += decoder.decode(chunk.value, { stream: true });
      }
      return received;
    };
    const first = await readUntil(/"step":"idle"/);
    assert.match(first, /"step":"idle"/);
    await action(base, 'flagPurchase');
    const next = await readUntil(/"step":"flagged"/);
    assert.match(next, /"step":"flagged"/);
    await reader.cancel();
  });
});
