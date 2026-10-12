import { createAppServer } from './app.mjs';
import { resolveRelayUrl } from './voice-agent.mjs';

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exitCode = 1;
} else {
  let server;
  try {
    server = createAppServer();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }

  if (server) {
    const publicMode = Boolean(process.env.PUBLIC_BASE_URL);
    const bindHost = publicMode ? '0.0.0.0' : '127.0.0.1';
    server.on('error', (error) => {
      console.error(`Demo server could not start on PORT ${port}: ${error.code ?? 'unknown error'}.`);
      process.exitCode = 1;
    });
    server.listen(port, bindHost, () => {
      const baseUrl = publicMode ? new URL(process.env.PUBLIC_BASE_URL).origin : `http://127.0.0.1:${port}`;
      console.log(`Audience: ${baseUrl}/bank`);
      console.log(publicMode
        ? `Presenter: ${baseUrl}/presenter (use your private PRESENTER_TOKEN in the URL fragment)`
        : `Presenter: ${baseUrl}/presenter#token=${server.presenterToken}`);
      console.log(`Architecture: ${baseUrl}/architecture`);
      console.log(`Conversation Relay: ${resolveRelayUrl(process.env) ?? 'not configured'}`);
    });
  }
}
