// Creates the case-status Content Template after the updated demo site is public.
// It does not send a message or change an RCS Sender registration.
// https://www.twilio.com/docs/content/content-api-resources
// https://www.twilio.com/docs/content/twiliocard

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? '';
const dryRun = process.argv.includes('--dry-run');

let origin;
try {
  origin = new URL(publicBaseUrl);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) {
    throw new TypeError('PUBLIC_BASE_URL must be a public HTTPS origin.');
  }
} catch {
  console.error('Set PUBLIC_BASE_URL to the public HTTPS origin of the updated demo app.');
  process.exit(1);
}

const imageUrl = new URL('/rcs-case-update-card.png', origin).toString();
const caseUrl = new URL('/bank?case=1', origin).toString();
const template = {
  friendly_name: 'twilio_bank_case_update_webinar_demo_v2',
  language: 'en',
  types: {
    'twilio/text': {
      body: 'Twilio Bank: Your fraud report for the $9,800.00 Midlife Crisis Motors charge is being reviewed. View case status in your banking app.',
    },
    'twilio/card': {
      title: 'Fraud report received',
      body: 'Your report about the $9,800.00 Midlife Crisis Motors charge is being reviewed.',
      media: [imageUrl],
      actions: [{ type: 'URL', title: 'View case', id: 'view_case', url: caseUrl }],
    },
  },
};

if (dryRun) {
  console.log(JSON.stringify(template, null, 2));
  process.exit(0);
}

if (!/^AC[0-9a-f]{32}$/i.test(accountSid) || !authToken.trim()) {
  console.error('Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env first.');
  process.exit(1);
}

try {
  const media = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
  if (!media.ok || !String(media.headers.get('content-type') ?? '').toLowerCase().startsWith('image/png')) {
    throw new Error('The updated card image is not available as a PNG.');
  }
  await media.body?.cancel();
} catch {
  console.error('Deploy the updated app first so PUBLIC_BASE_URL serves /rcs-case-update-card.png.');
  process.exit(1);
}

let response;
try {
  response = await fetch('https://content.twilio.com/v1/Content', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(template),
    signal: AbortSignal.timeout(15_000),
  });
} catch {
  console.error('Could not reach the Twilio Content API. Check your connection and try again.');
  process.exit(1);
}

let body;
try { body = await response.json(); } catch { body = {}; }
if (!response.ok || !/^HX[0-9a-f]{32}$/i.test(body.sid ?? '')) {
  const code = Number.isInteger(body.code) ? ` (Twilio error ${body.code})` : '';
  console.error(`Twilio did not create the case-update Content Template${code}. Check the image URL and account in Console.`);
  process.exit(1);
}

console.log(`Created case-update Content Template: ${body.sid}`);
console.log('Set TWILIO_RCS_CASE_CONTENT_SID to this value in .env or your deployment secrets, then restart the app.');
