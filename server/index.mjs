import { createAppServer } from './app.mjs';
import { createVoiceRelayServer } from './voice-agent.mjs';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
const rawVoicePort = process.env.VOICE_PORT ?? '3401';
const voicePort = Number(rawVoicePort);
if (!Number.isInteger(port) || port < 1 || port > 65_535 || !Number.isInteger(voicePort) || voicePort < 1 || voicePort > 65_535 || port === voicePort) {
  console.error('PORT and VOICE_PORT must be different integers from 1 to 65535.');
  process.exitCode = 1;
} else {
  const relayServer = createVoiceRelayServer();
  relayServer.on('error', (error) => {
    console.error(`Conversation Relay listener could not start on VOICE_PORT ${voicePort}: ${error.code ?? 'unknown error'}.`);
    process.exitCode = 1;
  });
  relayServer.listen(voicePort, '127.0.0.1', () => {
    const server = createAppServer();
    server.on('error', (error) => {
      console.error(`Demo server could not start on PORT ${port}: ${error.code ?? 'unknown error'}.`);
      relayServer.close();
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Audience:  http://127.0.0.1:${port}/bank`);
      console.log(`Presenter: http://127.0.0.1:${port}/presenter#token=${server.presenterToken}`);
      console.log(`Architecture: http://127.0.0.1:${port}/architecture`);
      console.log(`Conversation Relay listener: ws://127.0.0.1:${voicePort}/voice-relay (expose only this port through your WSS tunnel)`);
    });
  });
}
