import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import twilio from 'twilio';
import { createOpenAiStreamReply, createRelayTwiml, createVoiceRelayServer, isValidElevenLabsVoiceId, isValidRelayUrl } from '../server/voice-agent.mjs';

const env = {
  TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`,
  TWILIO_AUTH_TOKEN: 'test-only-auth-token',
  TWILIO_VOICE_FROM: '+14155550101',
  DEMO_TO_NUMBER: '+14155550199',
  TWILIO_CONVERSATION_RELAY_URL: 'wss://relay.example.test/voice-relay',
  OPENAI_API_KEY: 'test-only-openai-key',
};

async function withRelay(fn, options = {}) {
  const server = createVoiceRelayServer({ env, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await fn(`ws://127.0.0.1:${server.address().port}/voice-relay`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

function signedSocket(url, signature = twilio.getExpectedTwilioSignature(env.TWILIO_AUTH_TOKEN, env.TWILIO_CONVERSATION_RELAY_URL, {})) {
  return new WebSocket(url, { headers: { 'X-Twilio-Signature': signature } });
}

function nextTalkCycle(socket) {
  return new Promise((resolve, reject) => {
    const packets = [];
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error('Timed out waiting for the agent reply.'));
    }, 3_000);
    const onMessage = (raw) => {
      const packet = JSON.parse(raw.toString());
      if (packet.type !== 'text') return;
      packets.push(packet);
      if (packet.last === true) {
        clearTimeout(timer);
        socket.off('message', onMessage);
        resolve(packets);
      }
    };
    socket.on('message', onMessage);
  });
}

test('relay URL must be an exact public WSS route', () => {
  assert.equal(isValidRelayUrl('wss://relay.example.test/voice-relay'), true);
  assert.equal(isValidRelayUrl('ws://relay.example.test/voice-relay'), false);
  assert.equal(isValidRelayUrl('wss://relay.example.test/other'), false);
  assert.equal(isValidRelayUrl('wss://user:password@relay.example.test/voice-relay'), false);
});

test('ElevenLabs voice IDs accept documented model and voice-setting suffixes only', () => {
  const id = 'UgBBYS2sOqTuMpoF3BR0';
  for (const voice of [
    undefined,
    '',
    id,
    `${id}-flash_v2`,
    `${id}-flash_v2_5`,
    `${id}-turbo_v2`,
    `${id}-turbo_v2_5`,
    `${id}-1.2_0.6_0.8`,
    `${id}-turbo_v2_5-0.7_0_1.0`,
  ]) {
    assert.equal(isValidElevenLabsVoiceId(voice), true, `Expected valid voice: ${voice}`);
  }
  for (const voice of [
    'short',
    `${id}-unknown_model`,
    `${id}-0.6_0.6_0.8`,
    `${id}-1.3_0.6_0.8`,
    `${id}-1.0_1.1_0.8`,
    `${id}-1.0_0.6_-0.1`,
    `${id}-1.0_0.6`,
    `${id}--0.8_0.8_0.6`,
    `${id}-turbo_v2_5-1.0_0.6`,
    `${id}-turbo_v2_5-1.0_0.6_0.8-extra`,
    `${id}-turbo_v2_5-1.0_nan_0.8`,
    `${id}-turbo_v2_5-1.0_0.6_0.8 `,
  ]) {
    assert.equal(isValidElevenLabsVoiceId(voice), false, `Expected invalid voice: ${voice}`);
  }
  assert.match(createRelayTwiml({ ...env, TWILIO_ELEVENLABS_VOICE_ID: `${id}-turbo_v2_5-0.8_0.8_0.6` }), /voice="UgBBYS2sOqTuMpoF3BR0-turbo_v2_5-0\.8_0\.8_0\.6"/);
});

test('call TwiML selects ConversationRelay and ElevenLabs without a scripted Say', () => {
  const xml = createRelayTwiml(env);
  assert.match(xml, /<Connect><ConversationRelay /);
  assert.match(xml, /ttsProvider="ElevenLabs"/);
  assert.match(xml, /voice="UgBBYS2sOqTuMpoF3BR0"/);
  assert.match(xml, /url="wss:\/\/relay\.example\.test\/voice-relay"/);
  assert.match(xml, /Hi Anthony.*Midlife Crisis Motors.*Do you recognize this charge\?/);
  assert.doesNotMatch(xml, /fictional/i);
  assert.doesNotMatch(xml, /<Say>/);
});

test('OpenAI adapter streams model text chunks with the call history', async () => {
  const requests = [];
  const client = {
    chat: {
      completions: {
        create: async (body, options) => {
          requests.push({ body, options });
          return (async function* () {
            yield { choices: [{ delta: { content: 'That ' } }] };
            yield { choices: [{ delta: { content: 'sounds concerning.' } }] };
          })();
        },
      },
    },
  };
  const controller = new AbortController();
  const reply = createOpenAiStreamReply({ env, openaiClient: client });
  const messages = [{ role: 'user', content: 'I did not make that deposit.' }];
  const chunks = [];
  for await (const chunk of reply({ messages, signal: controller.signal })) chunks.push(chunk);
  assert.deepEqual(chunks, ['That ', 'sounds concerning.']);
  assert.equal(requests[0].body.model, 'gpt-4o-mini');
  assert.equal(requests[0].body.stream, true);
  assert.deepEqual(requests[0].body.messages, messages);
  assert.equal(requests[0].options.signal, controller.signal);
});

test('unsigned WebSocket handshakes are rejected before the AI session starts', async () => {
  let calls = 0;
  await withRelay(async (url) => {
    const socket = signedSocket(url, 'invalid-signature');
    await assert.rejects(once(socket, 'open'), /403|Unexpected server response/);
    assert.equal(calls, 0);
  }, { streamReply: async function* () { calls += 1; yield 'Hello.'; } });
});

test('WSS signature with Twilio documented trailing slash authenticates the exact relay path', async () => {
  await withRelay(async (url) => {
    const slashSignature = twilio.getExpectedTwilioSignature(
      env.TWILIO_AUTH_TOKEN,
      `${env.TWILIO_CONVERSATION_RELAY_URL}/`,
      {},
    );
    const socket = signedSocket(url, slashSignature);
    await once(socket, 'open');
    socket.send(JSON.stringify({
      type: 'setup',
      accountSid: env.TWILIO_ACCOUNT_SID,
      callSid: `CA${'f'.repeat(32)}`,
      from: env.TWILIO_VOICE_FROM,
      to: env.DEMO_TO_NUMBER,
    }));
    const reply = nextTalkCycle(socket);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'Did I make that purchase?', last: true }));
    assert.equal((await reply).map((packet) => packet.token).join(''), 'Please review the alert.');
    socket.close();
    await once(socket, 'close');

    const wrongPath = signedSocket(`${url}/`, slashSignature);
    await assert.rejects(once(wrongPath, 'open'), /404|Unexpected server response/);
  }, { streamReply: async function* () { yield 'Please review the alert.'; } });
});

test('signature for an unrelated WSS URL is still rejected', async () => {
  await withRelay(async (url) => {
    const unrelatedSignature = twilio.getExpectedTwilioSignature(
      env.TWILIO_AUTH_TOKEN,
      'wss://attacker.example.test/voice-relay',
      {},
    );
    const socket = signedSocket(url, unrelatedSignature);
    await assert.rejects(once(socket, 'open'), /403|Unexpected server response/);
  }, { streamReply: async function* () { yield 'Never reached.'; } });
});

test('signed relay has a real two-turn conversation with per-call history', async () => {
  const turns = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    socket.send(JSON.stringify({
      type: 'setup',
      accountSid: env.TWILIO_ACCOUNT_SID,
      callSid: `CA${'c'.repeat(32)}`,
      from: env.TWILIO_VOICE_FROM,
      to: env.DEMO_TO_NUMBER,
    }));

    const firstReply = nextTalkCycle(socket);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt: "No, I didn't make that purchase.", last: true }));
    const firstPackets = await firstReply;
    assert.match(firstPackets.map((packet) => packet.token).join(''), /review/i);
    assert.equal(firstPackets.at(-1).last, true);

    const secondReply = nextTalkCycle(socket);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'What should I do next?', last: true }));
    const secondPackets = await secondReply;
    assert.match(secondPackets.map((packet) => packet.token).join(''), /app/i);
    assert.equal(turns.length, 2);
    assert.ok(turns[1].some((message) => message.role === 'assistant' && /review/i.test(message.content)));
    socket.close();
    await once(socket, 'close');
  }, {
    streamReply: async function* ({ messages }) {
      turns.push(structuredClone(messages));
      yield turns.length === 1 ? 'I can help review that.' : 'Please use the demo banking app.';
    },
  });
});

test('an interruption keeps only the words the caller actually heard in agent history', async () => {
  const turns = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    socket.send(JSON.stringify({
      type: 'setup',
      accountSid: env.TWILIO_ACCOUNT_SID,
      callSid: `CA${'d'.repeat(32)}`,
      from: env.TWILIO_VOICE_FROM,
      to: env.DEMO_TO_NUMBER,
    }));
    const firstReply = nextTalkCycle(socket);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'Tell me what happened.', last: true }));
    await firstReply;

    socket.send(JSON.stringify({ type: 'interrupt', utteranceUntilInterrupt: 'I can help review the charge' }));
    const secondReply = nextTalkCycle(socket);
    socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'Wait, what should I do?', last: true }));
    await secondReply;

    const heardReply = turns[1].find((message) => message.role === 'assistant');
    assert.equal(heardReply?.content, 'I can help review the charge');
    socket.close();
    await once(socket, 'close');
  }, {
    streamReply: async function* ({ messages }) {
      turns.push(structuredClone(messages));
      yield turns.length === 1 ? 'I can help review the charge and guide you through the app.' : 'Open the demo app.';
    },
  });
});

test('a signed connection with the wrong destination cannot start an agent conversation', async () => {
  let calls = 0;
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    socket.send(JSON.stringify({
      type: 'setup',
      accountSid: env.TWILIO_ACCOUNT_SID,
      callSid: `CA${'e'.repeat(32)}`,
      from: env.TWILIO_VOICE_FROM,
      to: '+14155550000',
    }));
    const [code] = await once(socket, 'close');
    assert.equal(code, 1008);
    assert.equal(calls, 0);
  }, { streamReply: async function* () { calls += 1; yield 'This must not run.'; } });
});
