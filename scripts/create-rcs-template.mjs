// Creates one Twilio Content Template. Does not send a message.
// https://www.twilio.com/docs/content/content-api-resources
// https://www.twilio.com/docs/content/twiliocard

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
const mediaUrl = process.env.TWILIO_RCS_MEDIA_URL ?? '';

if (!/^AC[0-9a-f]{32}$/i.test(accountSid) || !authToken.trim()) {
  console.error('Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env first.');
  process.exit(1);
}

let imageUrl;
try {
  imageUrl = new URL(mediaUrl);
} catch {
  console.error('Set TWILIO_RCS_MEDIA_URL to the public HTTPS URL of rcs-alert-card.png.');
  process.exit(1);
}
if (imageUrl.protocol !== 'https:' || !/\.(?:png|jpe?g|gif)$/i.test(imageUrl.pathname)) {
  console.error('TWILIO_RCS_MEDIA_URL must be a public HTTPS image URL ending in .png, .jpg, .jpeg, or .gif.');
  process.exit(1);
}

const template = {
  friendly_name: 'twilio_bank_fraud_alert_webinar_demo',
  language: 'en',
  types: {
    'twilio/text': {
      body: 'Twilio Bank: Anthony, was the $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829 yours? Reply YES or NO.',
    },
    'twilio/card': {
      title: 'Vehicle deposit to review',
      body: 'Anthony, was the $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829 yours?',
      media: [imageUrl.toString()],
      actions: [
        { type: 'QUICK_REPLY', title: 'Yes, it was me', id: 'authorized' },
        { type: 'QUICK_REPLY', title: 'No, not me', id: 'fraud' },
      ],
    },
  },
};

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
  console.error(`Twilio did not create the Content Template${code}. Check the media URL and account in Console.`);
  process.exit(1);
}

console.log(`Created Content Template: ${body.sid}`);
console.log('Set TWILIO_RCS_CONTENT_SID to this value in .env, then restart npm run dev.');
