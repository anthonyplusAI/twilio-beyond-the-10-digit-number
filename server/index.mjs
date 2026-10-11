import { createAppServer } from './app.mjs';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exitCode = 1;
} else {
  const server = createAppServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Audience:  http://127.0.0.1:${port}/bank`);
    console.log(`Presenter: http://127.0.0.1:${port}/presenter#token=${server.presenterToken}`);
    console.log(`Architecture: http://127.0.0.1:${port}/architecture`);
  });
}
