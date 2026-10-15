import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import twilio from 'twilio';
import WebSocket from 'ws';
import { createAppServer } from '../server/app.mjs';

const ACCOUNT_SID = `AC${'a'.repeat(32)}`;
const MESSAGE_SID = `SM${'b'.repeat(32)}`;
const SMS_SID = `SM${'f'.repeat(32)}`;
const CALL_SID = `CA${'c'.repeat(32)}`;
const SERVICE_SID = `MG${'d'.repeat(32)}`;
const CONTENT_SID = `HX${'e'.repeat(32)}`;
const TEST_PRESENTER_PASSWORD = 'test-only-presenter-pass';
const DEPLOYED_ORIGIN = 'https://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io';
const SMS_CASE_PATH = '/bank?case=1&utm_source=twilio_bank_transactional_notification&utm_medium=unbranded_sms_from_phone_number&utm_campaign=fraud_report_case_status_follow_up&delivery_context=security_notification_clickthrough&reference=DEMO-CASE-STATUS-000000000000000000000000000000000000000000000000000000000000';
const SMS_BODY_PREFIX = 'Twilio Bank: We received your report about the $9,800.00 Midlife Crisis Motors charge. View case status in your banking app: ';

const liveEnv = {
  TWILIO_ACCOUNT_SID: ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: 'test-only-token',
  TWILIO_MESSAGING_SERVICE_SID: SERVICE_SID,
  TWILIO_SMS_FROM: '+14155550102',
  TWILIO_RCS_CASE_CONTENT_SID: CONTENT_SID,
  TWILIO_VOICE_FROM: '+14155550101',
  DEMO_TO_NUMBER: '+14155550199',
  TWILIO_CONVERSATION_RELAY_URL: 'wss://relay.example.test/voice-relay',
  OPENAI_API_KEY: 'test-only-openai-key',
};
const presenterCookies = new Map();

async function withServer(fn, options = {}) {
  const env = { ...(options.env ?? {}), PRESENTER_PASSWORD: options.env?.PRESENTER_PASSWORD ?? TEST_PRESENTER_PASSWORD };
  const server = createAppServer({ ...options, env });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(`${base}/api/presenter/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: env.PRESENTER_PASSWORD }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';', 1)[0];
    assert.ok(cookie);
    presenterCookies.set(base, cookie);
    await fn(base, cookie);
  } finally {
    presenterCookies.delete(base);
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
  const cookie = presenterCookies.get(base);
  const response = await fetch(`${base}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
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
      response.on('end', () => resolve({ status: response.statusCode, body: text, headers: response.headers }));
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

test('presenter actions require a login session while audience state remains readable', async () => {
  await withServer(async (base, cookie) => {
    const audience = await snapshot(base);
    assert.equal(audience.state.step, 'idle');
    assert.equal(JSON.stringify(audience).includes(TEST_PRESENTER_PASSWORD), false);

    const anonymousSession = await fetch(`${base}/api/presenter/session`);
    assert.deepEqual(await anonymousSession.json(), { authenticated: false });

    const unauthorized = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(unauthorized.status, 401);
    assert.equal((await unauthorized.json()).code, 'PRESENTER_AUTH_REQUIRED');

    const forgedLegacyHeader = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-presenter-token': 'old-token' },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(forgedLegacyHeader.status, 401);
    assert.equal((await forgedLegacyHeader.json()).code, 'PRESENTER_AUTH_REQUIRED');
    assert.equal((await snapshot(base)).state.step, 'idle');

    const wrongLogin = await fetch(`${base}/api/presenter/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    assert.equal(wrongLogin.status, 401);
    assert.equal(wrongLogin.headers.get('set-cookie'), null);

    const authenticatedSession = await fetch(`${base}/api/presenter/session`, { headers: { cookie } });
    assert.deepEqual(await authenticatedSession.json(), { authenticated: true });

    const authorized = await action(base, 'flagPurchase');
    assert.equal(authorized.status, 200);
    assert.equal(authorized.body.state.step, 'flagged');
  });
});

test('presenter login issues an HttpOnly same-site session cookie', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/presenter/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: TEST_PRESENTER_PASSWORD }),
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Path=\//i);
    assert.doesNotMatch(cookie, /Secure/i);
    assert.equal((await response.json()).authenticated, true);
  });
});

test('non-loopback Host and cross-origin presenter requests are rejected', async () => {
  await withServer(async (base, cookie) => {
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
        cookie,
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(wrongOrigin.status, 403);
    assert.equal((await wrongOrigin.json()).code, 'LOCAL_ORIGIN_REQUIRED');
    assert.equal((await snapshot(base)).state.step, 'idle');

    const wrongLoginOrigin = await fetch(`${base}/api/presenter/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
      body: JSON.stringify({ password: TEST_PRESENTER_PASSWORD }),
    });
    assert.equal(wrongLoginOrigin.status, 403);

    const sameOrigin = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
        origin: base,
      },
      body: JSON.stringify({ action: 'flagPurchase' }),
    });
    assert.equal(sameOrigin.status, 200);
    assert.equal((await sameOrigin.json()).state.step, 'flagged');
  });
});

test('server requires a presenter password before it starts', () => {
  assert.throws(
    () => createAppServer({ env: { PUBLIC_BASE_URL: 'https://demo.example.test' } }),
    /PRESENTER_PASSWORD/,
  );
  assert.throws(
    () => createAppServer({ env: { PRESENTER_PASSWORD: '   ' } }),
    /PRESENTER_PASSWORD/,
  );
});

test('public deployment accepts only a bare HTTPS origin', () => {
  for (const publicBaseUrl of ['http://demo.example.test', 'https://demo.example.test/bank', 'https://user@demo.example.test']) {
    assert.throws(
      () => createAppServer({ env: { PUBLIC_BASE_URL: publicBaseUrl, PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD } }),
      /PUBLIC_BASE_URL/,
    );
  }
});

test('public deployment rejects a relay URL on a different origin', () => {
  assert.throws(() => createAppServer({ env: {
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
    TWILIO_CONVERSATION_RELAY_URL: 'wss://other.example.test/voice-relay',
  } }), /TWILIO_CONVERSATION_RELAY_URL/);
});

test('public deployment accepts only its configured Host and same-origin presenter actions', async () => {
  const env = { ...liveEnv, TWILIO_CONVERSATION_RELAY_URL: '', PUBLIC_BASE_URL: 'https://demo.example.test', PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD };
  await withServer(async (base, cookie) => {
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
        'content-type': 'application/json', cookie,
      },
      body: actionBody,
    });
    assert.equal(wrongOrigin.status, 403);

    const validAction = await requestWithHeaders(base, '/api/action', {
      method: 'POST',
      headers: {
        host: 'demo.example.test', origin: 'https://demo.example.test',
        'content-type': 'application/json', cookie,
      },
      body: actionBody,
    });
    assert.equal(validAction.status, 200);
    assert.equal(JSON.parse(validAction.body).state.step, 'flagged');

    const publicLogin = await requestWithHeaders(base, '/api/presenter/login', {
      method: 'POST',
      headers: { host: 'demo.example.test', origin: 'https://demo.example.test', 'content-type': 'application/json' },
      body: JSON.stringify({ password: TEST_PRESENTER_PASSWORD }),
    });
    assert.equal(publicLogin.status, 200);
    assert.match(publicLogin.headers['set-cookie']?.[0] ?? '', /^__Host-twilio_bank_presenter=[^;]+; HttpOnly; SameSite=Strict; Path=\/; Secure$/);
  }, { env });
});

test('health probe responds without a presenter login or public Host header', async () => {
  const env = {
    PUBLIC_BASE_URL: 'https://demo.example.test',
    PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
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
    PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
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
    PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
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

test('public entrypoint starts one port and keeps the presenter password out of logs', { timeout: 8_000 }, async () => {
  const port = await unusedPort();
  const oldRelayPort = await unusedPort();
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      PORT: String(port),
      VOICE_PORT: String(oldRelayPort),
      PUBLIC_BASE_URL: 'https://demo.example.test',
      PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
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
    assert.doesNotMatch(output, new RegExp(TEST_PRESENTER_PASSWORD));
    assert.match(output, new RegExp(`Presenter: https://demo.example.test/presenter`));
    assert.doesNotMatch(output, /#token=/);
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

async function toFlagged(base) {
  const result = await action(base, 'flagPurchase');
  assert.equal(result.status, 200, `flagPurchase: ${JSON.stringify(result.body)}`);
}

async function toSmsIgnored(base) {
  await toReached(base);
  for (const name of ['previewSms', 'ignoreSms']) {
    const result = await action(base, name);
    assert.equal(result.status, 200, `${name}: ${JSON.stringify(result.body)}`);
  }
}

async function toUnknownMissed(base) {
  await toFlagged(base);
  for (const name of ['showUnknownCall', 'ignoreUnknownCall']) {
    const result = await action(base, name);
    assert.equal(result.status, 200, `${name}: ${JSON.stringify(result.body)}`);
  }
}

async function toCallPreview(base) {
  await toUnknownMissed(base);
  const result = await action(base, 'previewBrandedCall');
  assert.equal(result.status, 200, `previewBrandedCall: ${JSON.stringify(result.body)}`);
}

async function toReached(base, decisionAction = 'reportUnrecognized') {
  await toCallPreview(base);
  const result = await action(base, decisionAction);
  assert.equal(result.status, 200, `${decisionAction}: ${JSON.stringify(result.body)}`);
  assert.equal(result.body.state.step, 'reached');
}

async function openSignedRelay(base, callSid) {
  const socket = new WebSocket(`${base.replace(/^http/, 'ws')}/voice-relay`, {
    headers: {
      'X-Twilio-Signature': twilio.getExpectedTwilioSignature(
        liveEnv.TWILIO_AUTH_TOKEN,
        liveEnv.TWILIO_CONVERSATION_RELAY_URL,
        {},
      ),
    },
  });
  await once(socket, 'open');
  socket.send(JSON.stringify({
    type: 'setup',
    accountSid: ACCOUNT_SID,
    callSid,
    from: liveEnv.TWILIO_VOICE_FROM,
    to: liveEnv.DEMO_TO_NUMBER,
  }));
  return socket;
}

function relayReply(socket, voicePrompt) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error('Timed out waiting for ConversationRelay reply.'));
    }, 3_000);
    const onMessage = (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type !== 'text' || message.last !== true) return;
      clearTimeout(timer);
      socket.off('message', onMessage);
      resolve();
    };
    socket.on('message', onMessage);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt, last: true }));
  });
}

test('the story requires a completed fraud call before the case-update messages', async () => {
  await withServer(async (base) => {
    await toFlagged(base);
    let result = await action(base, 'previewSms');
    assert.equal(result.status, 409);
    assert.equal(result.body.code, 'INVALID_TRANSITION');

    result = await action(base, 'previewRcs');
    assert.equal(result.status, 409);
    assert.equal(result.body.code, 'INVALID_TRANSITION');

    for (const name of ['showUnknownCall', 'ignoreUnknownCall', 'previewBrandedCall', 'reportUnrecognized']) {
      result = await action(base, name);
      assert.equal(result.status, 200, name);
    }
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.chargeDecision, 'unrecognized');

    result = await action(base, 'previewSms');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'smsSent');
    assert.equal(result.body.state.smsMode, 'simulated');
    assert.equal(result.body.state.smsSid, null);
    assert.equal(result.body.state.smsStatus, null);
    assert.equal(result.body.state.messageMode, 'none');
    assert.equal(result.body.state.events.at(-1).kind, 'simulated');

    result = await action(base, 'ignoreSms');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'smsIgnored');
    result = await action(base, 'previewRcs');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'rcsSent');
    assert.equal(result.body.state.smsMode, 'simulated');
    assert.equal(result.body.state.messageMode, 'simulated');

    result = await action(base, 'viewCase');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'caseViewed');
    assert.equal(result.body.state.chargeDecision, 'unrecognized');
    assert.equal(result.body.state.events.at(-1).kind, 'simulated');

    result = await action(base, 'reset');
    assert.equal(result.body.state.step, 'idle');
    assert.equal(result.body.state.smsMode, 'none');
    assert.equal(result.body.state.smsSid, null);
    assert.equal(result.body.state.smsStatus, null);
    assert.equal(result.body.state.messageMode, 'none');
    assert.equal(result.body.state.chargeDecision, null);
    assert.equal(result.body.state.decisionSource, null);
  });
});

test('live SMS requires a configured sender and never advances on missing setup', async () => {
  const { TWILIO_SMS_FROM, ...withoutSmsSender } = liveEnv;
  await withServer(async (base) => {
    const config = (await snapshot(base)).config;
    assert.equal(config.smsReady, false);
    assert.equal(config.smsSenderDisplay, null);
    await toReached(base);
    const result = await action(base, 'sendSms');
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'SMS_NOT_CONFIGURED');
    const current = await snapshot(base);
    assert.equal(current.state.step, 'reached');
    assert.equal(current.state.smsMode, 'none');
    assert.equal(current.state.chargeDecision, 'unrecognized');
    assert.equal(current.state.events.at(-1).title, 'Presenter marked purchase as unrecognized');
  }, { env: withoutSmsSender });
});

test('live SMS uses the configured number in the Messaging Service and records API acceptance', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ sid: SMS_SID, status: 'accepted', to: liveEnv.DEMO_TO_NUMBER }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  await withServer(async (base) => {
    const config = (await snapshot(base)).config;
    assert.equal(config.smsReady, true);
    assert.equal(config.smsSenderMasked, '•••• 0102');
    assert.equal(config.smsSenderDisplay, '+14155550102');
    assert.equal(config.smsCaseUrl, `https://demo.example.test${SMS_CASE_PATH}`);
    await toReached(base);

    const unauthorized = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'sendSms' }),
    });
    assert.equal(unauthorized.status, 401);
    assert.equal(requests.length, 0);

    const result = await action(base, 'sendSms');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'smsSent');
    assert.equal(result.body.state.smsMode, 'live');
    assert.equal(result.body.state.smsSid, SMS_SID);
    assert.equal(result.body.state.smsStatus, 'accepted');
    assert.equal(result.body.state.messageMode, 'none');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`);
    assert.equal(requests[0].init.method, 'POST');
    const form = new URLSearchParams(requests[0].init.body);
    assert.equal(form.get('To'), '+14155550199');
    assert.equal(form.get('MessagingServiceSid'), SERVICE_SID);
    assert.equal(form.get('From'), '+14155550102');
    assert.equal(form.get('Body'), `${SMS_BODY_PREFIX}https://demo.example.test${SMS_CASE_PATH}`);
    assert.equal(form.get('MessageIntent'), 'notifications');
    assert.equal(form.has('ContentSid'), false);
    assert.equal(form.has('ShortenUrls'), false);
    assert.equal(result.body.state.events.at(-1).kind, 'real');
    assert.match(result.body.state.events.at(-1).title, /SMS/i);
    assert.match(result.body.state.events.at(-1).title, /accepted/i);
    assert.doesNotMatch(result.body.state.events.at(-1).title, /delivered/i);
  }, { env: { ...liveEnv, PUBLIC_BASE_URL: 'https://demo.example.test', TWILIO_CONVERSATION_RELAY_URL: 'wss://demo.example.test/voice-relay' }, fetchImpl });
});

test('SMS case link falls back to the deployed HTTPS site and its query still opens the case page', async () => {
  await withServer(async (base) => {
    const { smsCaseUrl } = (await snapshot(base)).config;
    assert.equal(smsCaseUrl, `${DEPLOYED_ORIGIN}${SMS_CASE_PATH}`);
    assert.ok(smsCaseUrl.length > 300);
    const target = new URL(smsCaseUrl);
    assert.equal(target.searchParams.get('case'), '1');
    assert.equal((await fetch(`${base}${target.pathname}${target.search}`)).status, 200);
  }, { env: liveEnv });
});

test('an invalid SMS sender is omitted from audience configuration', async () => {
  const invalidSender = '<img src=x onerror=alert(1)>';
  await withServer(async (base) => {
    const current = await snapshot(base);
    assert.equal(current.config.smsReady, false);
    assert.equal(current.config.smsSenderDisplay, null);
    assert.equal(current.config.smsSenderMasked, null);
    assert.doesNotMatch(JSON.stringify(current), /onerror/);
  }, { env: { ...liveEnv, TWILIO_SMS_FROM: invalidSender } });
});

test('Twilio SMS rejection is sanitized and leaves the answered call as the last completed beat', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ code: 21614, message: 'Sensitive +14155550199' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
  await withServer(async (base) => {
    await toReached(base);
    const result = await action(base, 'sendSms');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_SMS_REJECTED');
    assert.doesNotMatch(result.body.error, /\+14155550199/);
    const current = await snapshot(base);
    assert.equal(current.state.step, 'reached');
    assert.equal(current.state.smsMode, 'none');
    assert.equal(current.state.smsSid, null);
    assert.equal(current.state.smsStatus, null);
  }, { env: liveEnv, fetchImpl });
});

test('an immediately failed SMS response does not create a sent story state', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ sid: SMS_SID, status: 'failed' }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
  await withServer(async (base) => {
    await toReached(base);
    const result = await action(base, 'sendSms');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_SMS_REJECTED');
    assert.equal((await snapshot(base)).state.step, 'reached');
    assert.equal((await snapshot(base)).state.smsMode, 'none');
  }, { env: liveEnv, fetchImpl });
});

test('a malformed SMS acceptance response is rejected without exposing its contents', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    sid: SMS_SID,
    status: { private: 'Sensitive +14155550199' },
  }), { status: 201 });
  await withServer(async (base) => {
    await toReached(base);
    const result = await action(base, 'sendSms');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_SMS_REJECTED');
    assert.doesNotMatch(result.body.error, /\+14155550199/);
    assert.equal((await snapshot(base)).state.step, 'reached');
  }, { env: liveEnv, fetchImpl });
});

test('status refresh tracks the live SMS and RCS messages independently', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    let payload;
    if (url.endsWith('/Messages.json')) {
      const form = new URLSearchParams(init.body);
      payload = form.has('From')
        ? { sid: SMS_SID, status: 'accepted', from: liveEnv.TWILIO_SMS_FROM }
        : { sid: MESSAGE_SID, status: 'accepted', from: 'rcs:twilio-bank' };
    } else if (url.endsWith(`/Messages/${SMS_SID}.json`)) {
      payload = { sid: SMS_SID, status: 'delivered', from: liveEnv.TWILIO_SMS_FROM };
    } else if (url.endsWith(`/Messages/${MESSAGE_SID}.json`)) {
      payload = { sid: MESSAGE_SID, status: 'sent', from: 'rcs:twilio-bank' };
    } else {
      throw new Error(`Unexpected URL: ${url}`);
    }
    return new Response(JSON.stringify(payload), { status: init.method === 'GET' ? 200 : 201 });
  };
  await withServer(async (base) => {
    await toReached(base);
    for (const [name, step] of [['sendSms', 'smsSent'], ['ignoreSms', 'smsIgnored'], ['sendRcs', 'rcsSent']]) {
      const response = await action(base, name);
      assert.equal(response.status, 200);
      assert.equal(response.body.state.step, step);
    }

    const result = await action(base, 'refreshStatuses');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.smsSid, SMS_SID);
    assert.equal(result.body.state.smsStatus, 'delivered');
    assert.equal(result.body.state.messageSid, MESSAGE_SID);
    assert.equal(result.body.state.messageStatus, 'sent');
    assert.equal(result.body.state.messageChannel, 'pending');
    assert.deepEqual(seen.filter(({ init }) => init.method === 'GET').map(({ url }) => url), [
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages/${SMS_SID}.json`,
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages/${MESSAGE_SID}.json`,
    ]);
    assert.ok(result.body.state.events.some(({ title }) => title === 'SMS status: delivered'));
    assert.ok(result.body.state.events.some(({ title }) => title === 'RCS message status: sent'));

    const reset = await action(base, 'reset');
    assert.equal(reset.body.state.smsMode, 'none');
    assert.equal(reset.body.state.smsSid, null);
    assert.equal(reset.body.state.smsStatus, null);
    assert.equal(reset.body.state.messageMode, 'none');
    assert.equal(reset.body.state.messageSid, null);
    assert.equal(reset.body.state.messageStatus, null);
  }, { env: liveEnv, fetchImpl });
});

test('simulated voice-first journey keeps the spoken report visible through the case update', async () => {
  await withServer(async (base) => {
    const initial = await snapshot(base);
    assert.equal(initial.state.step, 'idle');
    assert.equal(initial.state.audienceView, 'bank');
    assert.equal(initial.state.callPreviewDevice, 'iphone');
    assert.deepEqual(initial.state.events, []);

    await toUnknownMissed(base);
    assert.match((await snapshot(base)).state.events[0].detail, /Anthony Dellavecchia/);
    let result = await action(base, 'previewBrandedCall');
    assert.equal(result.body.state.step, 'brandedRinging');
    assert.equal(result.body.state.callMode, 'simulated');
    assert.equal(result.body.state.callPreviewDevice, 'android');
    result = await action(base, 'showIphoneCallExample');
    assert.equal(result.body.state.callPreviewDevice, 'iphone');
    result = await action(base, 'showAndroidReasonExample');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.callPreviewDevice, 'android');
    assert.equal(result.body.state.step, 'brandedRinging');
    result = await action(base, 'reportUnrecognized');
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.chargeDecision, 'unrecognized');
    assert.equal(result.body.state.decisionSource, 'presenter');
    assert.equal(result.body.state.callPreviewDevice, 'android');
    assert.ok(result.body.state.events.some((event) => event.kind === 'simulated'));

    result = await action(base, 'showIphoneCallExample');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.callPreviewDevice, 'iphone');

    result = await action(base, 'previewSms');
    assert.equal(result.body.state.step, 'smsSent');
    result = await action(base, 'ignoreSms');
    assert.equal(result.body.state.step, 'smsIgnored');
    result = await action(base, 'previewRcs');
    assert.equal(result.body.state.step, 'rcsSent');
    assert.equal(result.body.state.messageMode, 'simulated');
    assert.equal(result.body.state.messageSid, null);
    result = await action(base, 'viewCase');
    assert.equal(result.body.state.step, 'caseViewed');
    assert.equal(result.body.state.chargeDecision, 'unrecognized');
    assert.equal(result.body.state.decisionSource, 'presenter');
    assert.equal(result.body.state.audienceView, 'bank');

    result = await action(base, 'showArchitecture');
    assert.equal(result.body.state.step, 'caseViewed');
    assert.equal(result.body.state.audienceView, 'architecture');
    result = await action(base, 'reset');
    assert.equal(result.body.state.step, 'idle');
    assert.equal(result.body.state.audienceView, 'bank');
    assert.equal(result.body.state.callPreviewDevice, 'iphone');
    assert.equal(result.body.state.chargeDecision, null);
    assert.equal(result.body.state.decisionSource, null);
    assert.deepEqual(result.body.state.events, []);
  });
});

test('authenticated presenter can show technical notes after the story and return to other audience views', async () => {
  await withServer(async (base) => {
    await toCallPreview(base);
    assert.equal((await action(base, 'confirmPurchase')).body.state.step, 'reached');

    const unauthorized = await fetch(`${base}/api/action`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'showTechnicalNotes' }),
    });
    assert.equal(unauthorized.status, 401);
    assert.equal((await snapshot(base)).state.audienceView, 'bank');

    let result = await action(base, 'showTechnicalNotes');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.audienceView, 'technicalNotes');
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.chargeDecision, 'recognized');
    assert.equal((await snapshot(base)).state.audienceView, 'technicalNotes');

    result = await action(base, 'showArchitecture');
    assert.equal(result.body.state.audienceView, 'architecture');
    result = await action(base, 'showTechnicalNotes');
    assert.equal(result.body.state.audienceView, 'technicalNotes');
    result = await action(base, 'showBank');
    assert.equal(result.body.state.audienceView, 'bank');
    result = await action(base, 'showTechnicalNotes');
    assert.equal(result.body.state.audienceView, 'technicalNotes');
    result = await action(base, 'reset');
    assert.equal(result.body.state.audienceView, 'bank');
    assert.equal(result.body.state.step, 'idle');
  });
});

test('reselecting an audience view increments its revision and broadcasts every presenter command', { timeout: 5_000 }, async () => {
  await withServer(async (base) => {
    const stream = await fetch(`${base}/api/events`);
    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    let buffered = '';
    const nextStreamState = async () => {
      while (true) {
        const end = buffered.indexOf('\n\n');
        if (end !== -1) {
          const frame = buffered.slice(0, end);
          buffered = buffered.slice(end + 2);
          const data = frame.split('\n').find((line) => line.startsWith('data: '));
          if (data) return JSON.parse(data.slice(6)).state;
        } else {
          const chunk = await reader.read();
          assert.equal(chunk.done, false);
          buffered += decoder.decode(chunk.value, { stream: true });
        }
      }
    };
    try {
      assert.equal((await nextStreamState()).audienceViewRevision, 0);
      for (const [name, view, revision] of [
        ['showArchitecture', 'architecture', 1],
        ['showArchitecture', 'architecture', 2],
        ['showTechnicalNotes', 'technicalNotes', 3],
        ['showTechnicalNotes', 'technicalNotes', 4],
        ['showBank', 'bank', 5],
        ['showBank', 'bank', 6],
      ]) {
        const response = await action(base, name);
        assert.equal(response.status, 200);
        assert.equal(response.body.state.audienceView, view);
        assert.equal(response.body.state.audienceViewRevision, revision);
        const pushed = await nextStreamState();
        assert.equal(pushed.audienceView, view);
        assert.equal(pushed.audienceViewRevision, revision);
      }
      const reset = await action(base, 'reset');
      assert.equal(reset.body.state.audienceView, 'bank');
      assert.equal(reset.body.state.audienceViewRevision, 7);
      assert.equal((await nextStreamState()).audienceViewRevision, 7);
    } finally {
      await reader.cancel();
    }
  });
});

test('reset reasserts the bank view even when the server already selected bank', async () => {
  await withServer(async (base) => {
    assert.equal((await snapshot(base)).state.audienceViewRevision, 0);

    let response = await action(base, 'reset');
    assert.equal(response.status, 200);
    assert.equal(response.body.state.step, 'idle');
    assert.equal(response.body.state.audienceView, 'bank');
    assert.equal(response.body.state.audienceViewRevision, 1);

    response = await action(base, 'reset');
    assert.equal(response.body.state.audienceViewRevision, 2);
  });
});

test('presenter can preview a recognized charge without claiming it came from live speech', async () => {
  await withServer(async (base) => {
    await toCallPreview(base);
    const result = await action(base, 'confirmPurchase');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.step, 'reached');
    assert.equal(result.body.state.chargeDecision, 'recognized');
    assert.equal(result.body.state.decisionSource, 'presenter');
    assert.equal(result.body.state.events.at(-1).kind, 'simulated');
    for (const name of ['sendSms', 'previewSms', 'sendRcs', 'previewRcs']) {
      const rejected = await action(base, name);
      assert.equal(rejected.status, 409, name);
      assert.equal(rejected.body.code, 'INVALID_TRANSITION', name);
    }
  });
});

test('invalid transitions and client-supplied destinations are rejected without changing state', async () => {
  await withServer(async (base) => {
    let result = await action(base, 'reportUnrecognized');
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

test('real RCS action requires complete configuration and leaves the story at SMS ignored on failure', async () => {
  await withServer(async (base) => {
    await toSmsIgnored(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'RCS_NOT_CONFIGURED');
    assert.equal((await snapshot(base)).state.step, 'smsIgnored');
  });
});

test('the old fraud-question Content SID cannot make the new case-update RCS send ready', async () => {
  const { TWILIO_RCS_CASE_CONTENT_SID, ...withoutCaseTemplate } = liveEnv;
  await withServer(async (base) => {
    assert.equal((await snapshot(base)).config.rcsReady, false);
    await toSmsIgnored(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'RCS_NOT_CONFIGURED');
    assert.equal((await snapshot(base)).state.step, 'smsIgnored');
  }, { env: { ...withoutCaseTemplate, TWILIO_RCS_CONTENT_SID: CONTENT_SID } });
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
    await toSmsIgnored(base);
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
    await toSmsIgnored(base);
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
    await toSmsIgnored(base);
    await action(base, 'sendRcs');
    const delivered = await action(base, 'refreshStatuses');
    assert.equal(delivered.body.state.messageStatus, 'delivered');
    assert.equal(delivered.body.state.messageChannel, 'fallback');
    assert.match(delivered.body.state.events.at(-1).detail, /number-based fallback sender/i);

    const viewed = await action(base, 'viewCase');
    assert.equal(viewed.status, 200);
    assert.equal(viewed.body.state.step, 'caseViewed');
    assert.equal(viewed.body.state.messageChannel, 'fallback');
    assert.equal(viewed.body.state.chargeDecision, 'unrecognized');
    assert.equal(viewed.body.state.events.at(-1).kind, 'simulated');
  }, { env: liveEnv, fetchImpl });
});

test('presenter can compare an illustrative RCS card after a live SMS fallback without changing delivery facts', async () => {
  let twilioRequests = 0;
  const fetchImpl = async (url) => {
    twilioRequests += 1;
    return new Response(JSON.stringify(
      url.endsWith('/Messages.json')
        ? { sid: MESSAGE_SID, status: 'accepted' }
        : { sid: MESSAGE_SID, status: 'delivered', from: liveEnv.TWILIO_SMS_FROM },
    ), { status: url.endsWith('/Messages.json') ? 201 : 200 });
  };
  await withServer(async (base) => {
    await toSmsIgnored(base);
    await action(base, 'sendRcs');
    await action(base, 'refreshStatuses');
    const beforeToggle = twilioRequests;

    const example = await action(base, 'showRcsExample');
    assert.equal(example.status, 200);
    assert.equal(example.body.state.step, 'rcsSent');
    assert.equal(example.body.state.messageMode, 'live');
    assert.equal(example.body.state.messageChannel, 'fallback');
    assert.equal(example.body.state.messageStatus, 'delivered');
    assert.equal(example.body.state.rcsExampleShown, true);
    assert.equal(example.body.state.events.at(-1).kind, 'simulated');
    assert.equal(twilioRequests, beforeToggle, 'changing the illustration must not send another message');

    const actual = await action(base, 'showActualFallback');
    assert.equal(actual.status, 200);
    assert.equal(actual.body.state.rcsExampleShown, false);
    assert.equal(actual.body.state.messageChannel, 'fallback');
    assert.equal(twilioRequests, beforeToggle);
  }, { env: liveEnv, fetchImpl });
});

test('Twilio RCS rejection is sanitized and does not create a fake sent state', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ code: 21614, message: 'Sensitive +14155550199' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
  await withServer(async (base) => {
    await toSmsIgnored(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_MESSAGE_REJECTED');
    assert.doesNotMatch(result.body.error, /\+14155550199/);
    assert.equal((await snapshot(base)).state.step, 'smsIgnored');
  }, { env: liveEnv, fetchImpl });
});

test('an immediately failed case-update RCS response does not create a sent story state', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ sid: MESSAGE_SID, status: 'failed' }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
  await withServer(async (base) => {
    await toSmsIgnored(base);
    const result = await action(base, 'sendRcs');
    assert.equal(result.status, 502);
    assert.equal(result.body.code, 'TWILIO_MESSAGE_REJECTED');
    const current = await snapshot(base);
    assert.equal(current.state.step, 'smsIgnored');
    assert.equal(current.state.messageMode, 'none');
    assert.equal(current.state.messageSid, null);
  }, { env: liveEnv, fetchImpl });
});

test('live AI call requires a public relay URL and LLM key', async () => {
  const { TWILIO_CONVERSATION_RELAY_URL, OPENAI_API_KEY, ...withoutAgent } = liveEnv;
  await withServer(async (base) => {
    const initial = await snapshot(base);
    assert.equal(initial.config.voiceReady, false);
    await toUnknownMissed(base);
    const result = await action(base, 'placeCall');
    assert.equal(result.status, 503);
    assert.equal((await snapshot(base)).state.step, 'unknownMissed');
  }, { env: withoutAgent });
});

test('branded call preview defaults to the supported Android reason example', async () => {
  await withServer(async (base) => {
    await toUnknownMissed(base);
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
    await toUnknownMissed(base);
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

test('only the active signed call can record Anthony’s spoken answer and update the audience stream', { timeout: 6_000 }, async () => {
  const fetchImpl = async (url) => {
    assert.match(url, /\/Calls\.json$/);
    return new Response(JSON.stringify({ sid: CALL_SID, status: 'queued', to: liveEnv.DEMO_TO_NUMBER }), { status: 201 });
  };
  await withServer(async (base) => {
    await toUnknownMissed(base);
    assert.equal((await action(base, 'placeCall')).status, 200);

    const stream = await fetch(`${base}/api/events`);
    const reader = stream.body.getReader();
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
    try {
      assert.match(await readUntil(/"step":"brandedRinging"/), /"chargeDecision":null/);

      const stale = await openSignedRelay(base, `CA${'d'.repeat(32)}`);
      await relayReply(stale, 'No, I did not make that purchase.');
      assert.equal((await snapshot(base)).state.chargeDecision, null);
      stale.close();
      await once(stale, 'close');

      const live = await openSignedRelay(base, CALL_SID);
      const broadcast = readUntil(/"chargeDecision":"unrecognized"/);
      await relayReply(live, 'No, I did not make that purchase.');
      assert.match(await broadcast, /"decisionSource":"voice"/);
      const current = await snapshot(base);
      assert.equal(current.state.step, 'reached');
      assert.equal(current.state.chargeDecision, 'unrecognized');
      assert.equal(current.state.decisionSource, 'voice');
      assert.equal(current.state.events.at(-1).kind, 'real');

      for (const [name, step] of [
        ['previewSms', 'smsSent'],
        ['ignoreSms', 'smsIgnored'],
        ['previewRcs', 'rcsSent'],
        ['viewCase', 'caseViewed'],
      ]) {
        const next = await action(base, name);
        assert.equal(next.status, 200, name);
        assert.equal(next.body.state.step, step, name);
        assert.equal(next.body.state.chargeDecision, 'unrecognized', name);
        assert.equal(next.body.state.decisionSource, 'voice', name);
      }
      live.close();
      await once(live, 'close');
    } finally {
      await reader.cancel();
    }
  }, {
    env: liveEnv,
    fetchImpl,
    relayOptions: { streamReply: async function* () { yield 'I recorded your answer on the demo bank alert.'; } },
  });
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
    await toUnknownMissed(base);
    await action(base, 'placeCall');
    await action(base, 'reportUnrecognized');
    await action(base, 'previewSms');
    await action(base, 'ignoreSms');
    await action(base, 'sendRcs');
    const result = await action(base, 'refreshStatuses');
    assert.equal(result.status, 200);
    assert.equal(result.body.state.messageStatus, 'delivered');
    assert.equal(result.body.state.callStatus, 'in-progress');
    assert.equal(result.body.state.step, 'rcsSent');
    assert.equal(result.body.state.chargeDecision, 'unrecognized');
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
