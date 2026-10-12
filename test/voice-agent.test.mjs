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

test('public HTTPS origin supplies the ConversationRelay WSS URL', () => {
  const xml = createRelayTwiml({
    ...env,
    TWILIO_CONVERSATION_RELAY_URL: '',
    PUBLIC_BASE_URL: 'https://demo.example.test',
  });
  assert.match(xml, /url="wss:\/\/demo\.example\.test\/voice-relay"/);
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

test('explicit spoken denial records an unrecognized decision before the agent replies', async () => {
  const callSid = `CA${'1'.repeat(32)}`;
  const decisions = [];
  const prompts = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    try {
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));

      const reply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: "No, I didn't make that purchase.", last: true }));
      await reply;
      assert.deepEqual(decisions, [{ callSid, decision: 'unrecognized' }]);
      assert.match(prompts[0], /unrecognized/i);
      assert.match(prompts[0], /recorded/i);
    } finally {
      socket.close();
      await once(socket, 'close');
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      return true;
    },
    streamReply: async function* ({ messages }) {
      assert.equal(decisions.length, 1, 'record the decision before asking the model to reply');
      prompts.push(messages.filter((message) => message.role === 'system').map((message) => message.content).join(' '));
      yield 'I recorded that you do not recognize the charge.';
    },
  });
});

test('an explicit purchase admission records a recognized decision', async () => {
  const callSid = `CA${'2'.repeat(32)}`;
  const decisions = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    try {
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));
      const reply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'I paid for that vehicle deposit.', last: true }));
      await reply;
      assert.deepEqual(decisions, [{ callSid, decision: 'recognized' }]);
    } finally {
      socket.close();
      await once(socket, 'close');
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      return true;
    },
    streamReply: async function* () { yield 'I recorded that you recognize the purchase.'; },
  });
});

test('a pending decision prevents a later contradictory answer from replacing it', async () => {
  const callSid = `CA${'3'.repeat(32)}`;
  const decisions = [];
  const prompts = [];
  let releaseDecision;
  let firstDecisionStarted;
  const decisionGate = new Promise((resolve) => { releaseDecision = resolve; });
  const firstDecision = new Promise((resolve) => { firstDecisionStarted = resolve; });
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    try {
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: "No, I didn't make it.", last: true }));
      await firstDecision;

      const reply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'Yes, I did make it.', last: true }));
      const pong = once(socket, 'pong');
      socket.ping();
      await pong;
      assert.deepEqual(decisions, [{ callSid, decision: 'unrecognized' }]);

      releaseDecision();
      await reply;
      assert.match(prompts[0], /unrecognized.*recorded/i);

      const followUp = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'Yes, what should I do next?', last: true }));
      await followUp;
      assert.deepEqual(decisions, [{ callSid, decision: 'unrecognized' }]);
    } finally {
      releaseDecision();
      socket.close();
      await once(socket, 'close');
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      firstDecisionStarted();
      await decisionGate;
      return true;
    },
    streamReply: async function* ({ messages }) {
      prompts.push(messages.filter((message) => message.role === 'system').map((message) => message.content).join(' '));
      yield 'I recorded your answer.';
    },
  });
});

test('an uncertain answer stays pending until the caller clearly denies the charge', async () => {
  const callSid = `CA${'4'.repeat(32)}`;
  const decisions = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    try {
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));
      const uncertainReply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: "No, wait, I'm not sure yet.", last: true }));
      await uncertainReply;
      assert.deepEqual(decisions, []);

      const clearReply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'I did not authorize that deposit.', last: true }));
      await clearReply;
      assert.deepEqual(decisions, [{ callSid, decision: 'unrecognized' }]);
    } finally {
      socket.close();
      await once(socket, 'close');
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      return true;
    },
    streamReply: async function* () { yield 'Please clarify whether you recognize the charge.'; },
  });
});

test('a request to repeat the amount does not count as a spoken denial', async () => {
  const callSid = `CA${'5'.repeat(32)}`;
  const decisions = [];
  await withRelay(async (url) => {
    const socket = signedSocket(url);
    await once(socket, 'open');
    try {
      socket.send(JSON.stringify({
        type: 'setup',
        accountSid: env.TWILIO_ACCOUNT_SID,
        callSid,
        from: env.TWILIO_VOICE_FROM,
        to: env.DEMO_TO_NUMBER,
      }));
      const repeatReply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'No, can you repeat the amount?', last: true }));
      await repeatReply;
      assert.deepEqual(decisions, []);

      const denialReply = nextTalkCycle(socket);
      socket.send(JSON.stringify({ type: 'prompt', voicePrompt: 'No, I do not recognize that charge.', last: true }));
      await denialReply;
      assert.deepEqual(decisions, [{ callSid, decision: 'unrecognized' }]);
    } finally {
      socket.close();
      await once(socket, 'close');
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      return true;
    },
    streamReply: async function* () { yield 'I can repeat the amount before you decide.'; },
  });
});

test('standalone yes and no remain valid answers to the charge question', async () => {
  const cases = [
    { callSid: `CA${'6'.repeat(32)}`, speech: 'No.', decision: 'unrecognized' },
    { callSid: `CA${'7'.repeat(32)}`, speech: 'Yes!', decision: 'recognized' },
  ];
  const decisions = [];
  await withRelay(async (url) => {
    for (const item of cases) {
      const socket = signedSocket(url);
      await once(socket, 'open');
      try {
        socket.send(JSON.stringify({
          type: 'setup',
          accountSid: env.TWILIO_ACCOUNT_SID,
          callSid: item.callSid,
          from: env.TWILIO_VOICE_FROM,
          to: env.DEMO_TO_NUMBER,
        }));
        const reply = nextTalkCycle(socket);
        socket.send(JSON.stringify({ type: 'prompt', voicePrompt: item.speech, last: true }));
        await reply;
      } finally {
        socket.close();
        await once(socket, 'close');
      }
    }
  }, {
    onDecision: async (outcome) => {
      decisions.push(outcome);
      return true;
    },
    streamReply: async function* () { yield 'I recorded your answer.'; },
  });
  assert.deepEqual(decisions, cases.map(({ callSid, decision }) => ({ callSid, decision })));
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
