// Presentation walkthroughs. Product facts and request shapes come from the linked Twilio docs.
const DOCS = {
  rcsOnboarding: 'https://www.twilio.com/docs/rcs/onboarding',
  rcsBeta: 'https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-',
  rcsSend: 'https://www.twilio.com/docs/rcs/send-an-rcs-message',
  card: 'https://www.twilio.com/docs/content/twiliocard',
  contentBuilder: 'https://www.twilio.com/docs/content/create-templates-with-the-content-template-builder',
  contentApi: 'https://www.twilio.com/docs/content/content-api-resources',
  messagingServices: 'https://www.twilio.com/docs/messaging/services',
  branded: 'https://www.twilio.com/docs/voice/branded-calling/us-enhanced',
  brandedRegistration: 'https://www.twilio.com/docs/trust-hub/registrations/branded-calling',
  brandedApi: 'https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api',
  brandedApiReference: 'https://www.twilio.com/docs/trust-hub/trusthub-rest-api/compliance/branded-calling-registrations-resource',
  calls: 'https://www.twilio.com/docs/voice/api/call-resource',
  relay: 'https://www.twilio.com/docs/voice/twiml/connect/conversationrelay',
  shakenOverview: 'https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir',
  shakenRegistration: 'https://www.twilio.com/docs/trust-hub/registrations/shaken-stir',
  shakenConsole: 'https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding/shakenstir-onboarding-in-the-twilio-console',
  shakenApi: 'https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding/shaken-stir-trust-hub-api-direct-customer',
  cnam: 'https://www.twilio.com/docs/voice/brand-your-calls-using-cnam',
  cnamRegistration: 'https://www.twilio.com/docs/trust-hub/registrations/cnam',
  integrityOverview: 'https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity',
  integrityRegistration: 'https://www.twilio.com/docs/trust-hub/registrations/voice-integrity',
  integrityConsole: 'https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding/voiceintegrity-onboarding-in-the-twilio-console',
  integrityApi: 'https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding/voice-integrity-trust-hub-api-direct-customer',
};

const TOPICS = [
  { id: 'branded-calling', title: 'Enhanced Branded Calling', category: 'Voice', summary: 'Console registration, optional API onboarding, and a call from the approved number.' },
  { id: 'rcs', title: 'RCS messaging', category: 'Messaging', summary: 'Console sender setup, a Content API rich card, and a Messages API send.' },
  { id: 'shaken-stir', title: 'SHAKEN/STIR', category: 'Voice trust', summary: 'Check caller-ID authentication, a US Enhanced setup prerequisite.' },
  { id: 'cnam', title: 'CNAM', category: 'Voice trust', summary: 'Optional caller name on eligible US local numbers, often seen on landlines.' },
  { id: 'voice-integrity', title: 'Voice Integrity', category: 'Voice trust', summary: 'Optional spam-label remediation recommended with Enhanced Calling.' },
];

export function architectureGuideHref(topic) {
  return '/architecture/details?topic=' + encodeURIComponent(topic) + '&view=1';
}

function stepHref(topic, step) {
  return '/architecture/details?topic=' + encodeURIComponent(topic) + '&step=' + step + '&view=1';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function sourceLinks(links) {
  return links.map(({ label, url }) =>
    '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(label) + ' ↗</a>').join('');
}

// Each code slide is a complete Node ESM snippet for that API step. Values from
// an earlier slide are supplied through environment variables, never fake SIDs.
const RCS_TEMPLATE_CODE = String.raw`const origin = new URL(process.env.PUBLIC_BASE_URL);
const template = {
  friendly_name: "twilio_bank_case_update_webinar_demo_v2",
  language: "en",
  types: {
    "twilio/text": {
      body: "Twilio Bank: Your fraud report for the $9,800.00 " +
        "Midlife Crisis Motors charge is being reviewed. " +
        "View case status in your banking app."
    },
    "twilio/card": {
      title: "Fraud report received",
      body: "Your report about the $9,800.00 Midlife Crisis " +
        "Motors charge is being reviewed.",
      media: [new URL("/rcs-case-update-card.png", origin).toString()],
      actions: [{
        type: "URL", title: "View case", id: "view_case",
        url: new URL("/bank?case=1", origin).toString()
      }]
    }
  }
};

const auth = Buffer.from(process.env.TWILIO_ACCOUNT_SID + ":" +
  process.env.TWILIO_AUTH_TOKEN).toString("base64");
const response = await fetch("https://content.twilio.com/v1/Content", {
  method: "POST",
  headers: { Authorization: "Basic " + auth,
    "Content-Type": "application/json" },
  body: JSON.stringify(template)
});
const result = await response.json();
if (!response.ok) throw new Error(JSON.stringify(result));
console.log("TWILIO_RCS_CASE_CONTENT_SID=" + result.sid);`;

const RCS_SEND_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const message = await client.messages.create({
  to: process.env.DEMO_TO_NUMBER,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  contentSid: process.env.TWILIO_RCS_CASE_CONTENT_SID
});
console.log("Message SID: " + message.sid);`;

const BRANDED_REGULATION_CODE = String.raw`const regulationId = "RNa0b74679be7511921f4d2e3094fa6d23";
const auth = "Basic " + Buffer.from(
  process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
).toString("base64");

const response = await fetch(
  "https://trusthub.twilio.com/v4/Compliance/Regulations/" + regulationId,
  { headers: { Authorization: auth } }
);
const regulation = await response.json();
if (!response.ok) throw new Error(JSON.stringify(regulation));
console.log("BRANDED_REGULATION_VERSION=" + regulation.version);`;

const BRANDED_REGISTRATION_CODE = String.raw`const auth = "Basic " + Buffer.from(
  process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
).toString("base64");

const registration = {
  regulationId: "RNa0b74679be7511921f4d2e3094fa6d23",
  regulationVersion: Number(process.env.BRANDED_REGULATION_VERSION),
  friendlyName: process.env.BRAND_REGISTRATION_NAME,
  data: {
    address: { id: process.env.BRAND_ADDRESS_SID },
    authorizedRepresentative1: {
      firstName: process.env.BRAND_REP_FIRST,
      lastName: process.env.BRAND_REP_LAST,
      email: process.env.BRAND_REP_EMAIL,
      phoneE164: process.env.BRAND_REP_PHONE,
      jobPosition: process.env.BRAND_REP_JOB
    },
    authorizedContact: {
      firstName: process.env.BRAND_CONTACT_FIRST,
      lastName: process.env.BRAND_CONTACT_LAST,
      mobilePhoneE164: process.env.BRAND_CONTACT_PHONE,
      verificationEmail: process.env.BRAND_CONTACT_EMAIL
    },
    useCase: {
      category: process.env.BRAND_USE_CASE_CATEGORY,
      description: process.env.BRAND_USE_CASE_DESCRIPTION,
      consentDescription: process.env.BRAND_CONSENT_DESCRIPTION,
      callVolumeDaily: Number(process.env.BRAND_DAILY_CALLS)
    },
    brandedCaller: {
      displayName: process.env.BRAND_DISPLAY_NAME,
      displayCallReason: process.env.BRAND_CALL_REASON,
      displayLogoUrl: process.env.BRAND_LOGO_URL
    },
    business: {
      legalName: process.env.BRAND_LEGAL_NAME,
      entityType: process.env.BRAND_ENTITY_TYPE,
      identityType: "direct_customer",
      isSubassigned: "NO",
      registrationNumber: process.env.BRAND_EIN,
      registrationAuthority: "EIN",
      industry: process.env.BRAND_INDUSTRY,
      websiteUrl: process.env.BRAND_WEBSITE_URL,
      employeeCount: Number(process.env.BRAND_EMPLOYEES)
    }
  }
};

const response = await fetch(
  "https://trusthub.twilio.com/v4/Compliance/Registrations",
  { method: "POST", headers: { Authorization: auth,
      "Content-Type": "application/json" },
    body: JSON.stringify(registration) }
);
const result = await response.json();
if (!response.ok) throw new Error(JSON.stringify(result));
console.log("BRANDED_REGISTRATION_ID=" + result.id);`;

const BRANDED_LOA_CODE = String.raw`import { readFile } from "node:fs/promises";

const base = "https://trusthub.twilio.com/v4/Compliance";
const auth = "Basic " + Buffer.from(
  process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
).toString("base64");
const form = new FormData();
form.append("type", "LETTER_OF_AUTHORIZATION");
form.append("friendlyName", "Signed Branded Calling LOA");
form.append("content", new Blob([
  await readFile(process.env.BRAND_SIGNED_LOA_JPG)
], { type: "image/jpeg" }), "signed-loa.jpg");

const upload = await fetch(base + "/Documents", {
  method: "POST", headers: { Authorization: auth }, body: form
});
const document = await upload.json();
if (!upload.ok) throw new Error(JSON.stringify(document));

const link = await fetch(base + "/DocumentLinks", {
  method: "POST", headers: { Authorization: auth,
    "Content-Type": "application/json" },
  body: JSON.stringify({ documentId: document.id,
    registrationId: process.env.BRANDED_REGISTRATION_ID })
});
const linked = await link.json();
if (!link.ok) throw new Error(JSON.stringify(linked));
console.log("Linked LOA document: " + linked.documentId);`;

const BRANDED_ASSIGN_CODE = String.raw`const auth = "Basic " + Buffer.from(
  process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
).toString("base64");
const id = process.env.BRANDED_REGISTRATION_ID;
const base = "https://trusthub.twilio.com";
const form = new FormData();
form.append("Type", "phone-number");
form.append("ResourceSid", process.env.TWILIO_VOICE_NUMBER_SID);

const assign = await fetch(base + "/v1/Compliance/Registrations/" +
  id + "/ResourceAssignments", {
    method: "POST", headers: { Authorization: auth }, body: form
  });
const assignment = await assign.json();
if (!assign.ok) throw new Error(JSON.stringify(assignment));

const url = base + "/v4/Compliance/Registrations/" + id;
const submit = await fetch(url, {
  method: "PATCH", headers: { Authorization: auth,
    "Content-Type": "application/json" },
  body: JSON.stringify({ status: "PENDING_REVIEW" })
});
const submitted = await submit.json();
if (!submit.ok) throw new Error(JSON.stringify(submitted));

const check = await fetch(url, { headers: { Authorization: auth } });
const current = await check.json();
if (!check.ok) throw new Error(JSON.stringify(current));
console.log("Registration status: " + current.status);`;

const CALL_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const twiml = new twilio.twiml.VoiceResponse();
twiml.connect().conversationRelay({
  url: process.env.TWILIO_CONVERSATION_RELAY_URL,
  language: "en-US",
  transcriptionProvider: "Deepgram",
  ttsProvider: "ElevenLabs",
  voice: process.env.TWILIO_ELEVENLABS_VOICE_ID,
  welcomeGreeting: "Hi. This is your account security team.",
  interruptible: "speech"
});

const call = await client.calls.create({
  to: process.env.DEMO_TO_NUMBER,
  from: process.env.TWILIO_VOICE_FROM,
  twiml: twiml.toString()
});
console.log("Call SID: " + call.sid);`;

const PROFILE_NUMBER_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const assignment = await client.trusthub.v1
  .customerProfiles(process.env.TWILIO_BUSINESS_PROFILE_SID)
  .customerProfilesChannelEndpointAssignment.create({
    channelEndpointSid: process.env.TWILIO_PHONE_NUMBER_SID,
    channelEndpointType: "phone-number"
  });
console.log("Business Profile assignment: " + assignment.sid);`;

const SHAKEN_CREATE_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const product = await client.trusthub.v1.trustProducts.create({
  friendlyName: "Caller ID authentication",
  email: process.env.COMPLIANCE_EMAIL,
  policySid: "RN7a97559effdf62d00f4298208492a5ea"
});
console.log("SHAKEN_TRUST_PRODUCT_SID=" + product.sid);`;

const CNAM_CREATE_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const product = await client.trusthub.v1.trustProducts.create({
  friendlyName: "Caller name registration",
  email: process.env.COMPLIANCE_EMAIL,
  policySid: "RNf3db3cd1fe25fcfd3c3ded065c8fea53"
});
const name = await client.trusthub.v1.endUsers.create({
  type: "cnam_information",
  friendlyName: "Approved caller name",
  attributes: { cnam_display_name: process.env.APPROVED_CNAM_NAME }
});
console.log("CNAM_TRUST_PRODUCT_SID=" + product.sid);
console.log("CNAM_END_USER_SID=" + name.sid);`;

const INTEGRITY_CREATE_CODE = String.raw`import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const product = await client.trusthub.v1.trustProducts.create({
  friendlyName: "Spam-label remediation",
  email: process.env.COMPLIANCE_EMAIL,
  policySid: "RN5b3660f9598883b1df4e77f77acefba0"
});
const useCase = await client.trusthub.v1.endUsers.create({
  type: "voice_integrity_information",
  friendlyName: "Outbound calling use case",
  attributes: {
    use_case: process.env.VOICE_INTEGRITY_USE_CASE,
    business_employee_count: process.env.VOICE_INTEGRITY_EMPLOYEE_COUNT,
    average_business_day_call_volume: process.env.VOICE_INTEGRITY_DAILY_CALLS,
    notes: process.env.VOICE_INTEGRITY_NOTES
  }
});
console.log("VOICE_INTEGRITY_PRODUCT_SID=" + product.sid);
console.log("VOICE_INTEGRITY_END_USER_SID=" + useCase.sid);`;

function trustFinishCode(productEnv, endUserEnv) {
  const lines = [
    'import twilio from "twilio";',
    '',
    'const client = twilio(',
    '  process.env.TWILIO_ACCOUNT_SID,',
    '  process.env.TWILIO_AUTH_TOKEN',
    ');',
    'const product = client.trusthub.v1.trustProducts(',
    '  process.env.' + productEnv,
    ');',
    'await product.trustProductsEntityAssignments.create({',
    '  objectSid: process.env.TWILIO_BUSINESS_PROFILE_SID',
    '});',
  ];
  if (endUserEnv) {
    lines.push(
      'await product.trustProductsEntityAssignments.create({',
      '  objectSid: process.env.' + endUserEnv,
      '});',
    );
  }
  lines.push(
    'await product.trustProductsChannelEndpointAssignment.create({',
    '  channelEndpointSid: process.env.TWILIO_PHONE_NUMBER_SID,',
    '  channelEndpointType: "phone-number"',
    '});',
    'const submitted = await product.update({ status: "pending-review" });',
    'console.log("Trust Product status: " + submitted.status);',
  );
  return lines.join('\n');
}

const GUIDES = {
  'branded-calling': {
    title: 'Enhanced Branded Calling',
    steps: [
      {
        title: 'A reason to answer', mode: 'overview',
        definition: 'Approved business details can appear on a supported incoming-call screen: name, logo, and reason.',
        flow: [
          ['Verify', 'Business identity and number'],
          ['Register', 'Display name, logo, and call reason'],
          ['Call', 'Recognizable screen before answer'],
        ],
        benefit: 'A customer can recognize an urgent call before deciding to answer.',
        limit: 'Display varies by carrier and handset. The reason comes from the registration.',
        sources: [{ label: 'Twilio Enhanced Branded Calling', url: DOCS.branded }],
      },
      {
        title: 'Start with a verified business', mode: 'console',
        cue: 'Twilio lists an approved Primary Business Profile, enabled SHAKEN/STIR, and a signed LOA as US Enhanced prerequisites.',
        path: 'Communications → Trust Hub → Profiles',
        actions: ['Open the approved Primary Business Profile.', 'Locate the Business Profile SID and its registered address.'],
        shot: 'branded-calling/1',
        sources: [{ label: 'Twilio prerequisites', url: DOCS.branded }],
      },
      {
        title: 'Register the visible identity', mode: 'console',
        cue: 'Register the real company identity. Twilio Bank is the fictional story, not the identity submitted for approval.',
        path: 'Communications → Trust Hub → Registrations → Branded calling → Create registration',
        actions: [
          'Choose US Enhanced, the calling use case, Direct customer, and the approved Business Profile.',
          'Enter real contact and brand details, including the display name, logo URL, and call reason; sign the LOA and submit.',
          'Open the approved registration to show the identity used for this demo.',
        ],
        shot: 'branded-calling/2',
        sources: [
          { label: 'Twilio Console registration', url: DOCS.brandedRegistration },
          { label: 'Twilio Enhanced setup', url: DOCS.branded },
        ],
      },
      {
        title: 'Assign the calling number', mode: 'console',
        cue: 'Calls from an approved and assigned number carry the registered identity. Steps 5–8 are an optional private-beta registration API route; step 9 makes the demo call.',
        path: 'Communications → Trust Hub → Registrations → Branded calling → Assigned phone numbers',
        actions: ['Open the approved registration.', 'Add the calling number and save if it was not assigned during registration.', 'Show the approved status and assigned number.'],
        shot: 'branded-calling/3',
        sources: [{ label: 'Twilio number assignment', url: DOCS.branded }],
      },
      {
        title: 'Optional API: check registration requirements', mode: 'code',
        cue: 'This request asks Twilio which details a US Enhanced registration needs and gets the version number for the next request. Console handles this step for you.',
        codeLabel: 'Private beta · GET Compliance Regulation', code: BRANDED_REGULATION_CODE,
        focus: ['regulationId =', '/v4/Compliance/Regulations/', 'regulation.version'],
        focusNotes: [
          'Selects the US Enhanced registration rules.',
          'Fetches the current requirements from Trust Hub.',
          'Saves the version needed for the create request.',
        ],
        sources: [
          { label: 'Twilio API walkthrough', url: DOCS.brandedApi },
          { label: 'Required field reference', url: DOCS.brandedApiReference },
        ],
      },
      {
        title: 'Optional API: submit brand details', mode: 'code',
        cue: 'Supply real legal, contact, and use-case values. The public logo URL must serve a 256 × 256, 32-bit BMP.',
        codeLabel: 'Private beta · POST Compliance Registration', code: BRANDED_REGISTRATION_CODE,
        focus: ['regulationVersion:', 'authorizedRepresentative1:', 'useCase:', 'brandedCaller:', 'business:', '/v4/Compliance/Registrations', 'result.id'],
        focusNotes: [
          'Uses the regulation version returned in the previous step.',
          'Names a person Twilio can contact about the business.',
          'Describes the purpose and volume of the calls.',
          'Sets the name, logo, and reason customers may see.',
          'Provides the legal business identity behind the brand.',
          'Creates the Branded Calling registration.',
          'Saves its ID for the LOA, number, and review steps.',
        ],
        sources: [{ label: 'Twilio registration request', url: DOCS.brandedApi }],
      },
      {
        title: 'Optional API: upload and link LOA', mode: 'code',
        cue: 'Upload the signed letter as multipart data, then link its returned document ID to the registration.',
        codeLabel: 'Private beta · Documents + DocumentLinks', code: BRANDED_LOA_CODE,
        focus: ['LETTER_OF_AUTHORIZATION', 'readFile(', '/Documents', '/DocumentLinks', 'documentId: document.id'],
        focusNotes: [
          'Identifies this upload as a Letter of Authorization.',
          'Reads the signed letter from disk.',
          'Uploads the signed letter to Trust Hub.',
          'Links the uploaded letter to the registration.',
          'Uses the new document ID for that link.',
        ],
        sources: [{ label: 'Twilio LOA workflow', url: DOCS.brandedApi }],
      },
      {
        title: 'Optional API: assign and submit', mode: 'code',
        cue: 'Assign the PN SID while the bundle is in Draft, then submit it and poll status before live calling.',
        codeLabel: 'Private beta · ResourceAssignments + review', code: BRANDED_ASSIGN_CODE,
        focus: ['ResourceSid', '/ResourceAssignments', 'PENDING_REVIEW', 'current.status'],
        focusNotes: [
          'Identifies the Twilio number that will carry the brand.',
          'Attaches that number to the registration.',
          'Submits the registration for review.',
          'Checks its current review status.',
        ],
        sources: [{ label: 'Twilio submission workflow', url: DOCS.brandedApi }],
      },
      {
        title: 'Call from the approved number', mode: 'code',
        cue: 'The regular Calls API places the call from your approved number. Its bundle supplies the display details; ConversationRelay connects the answer to your agent.',
        codeLabel: 'Calls API + ConversationRelay', code: CALL_CODE,
        focus: ['conversationRelay({', 'url: process.env.TWILIO_CONVERSATION_RELAY_URL', 'await client.calls.create', 'from: process.env.TWILIO_VOICE_FROM'],
        focusNotes: [
          'Connects the answered call to ConversationRelay.',
          'Points Twilio to the agent WebSocket endpoint.',
          'Starts the outbound call through the Calls API.',
          'Uses the number approved for Branded Calling.',
        ],
        sources: [
          { label: 'Twilio Calls API', url: DOCS.calls },
          { label: 'ConversationRelay', url: DOCS.relay },
        ],
      },
    ],
  },
  rcs: {
    title: 'RCS messaging',
    steps: [
      {
        title: 'A sender people can inspect', mode: 'overview',
        definition: 'Rich Communication Services (RCS) gives a business sender a public profile, while rich content can add a card and action.',
        flow: [
          ['Create sender', 'Name, logo, and public details'],
          ['Build content', 'Rich card and text alternative'],
          ['Send', 'RCS or SMS/MMS fallback'],
        ],
        benefit: 'Anthony can check who sent the update and open his case from the message.',
        limit: 'RCS availability varies. A Messaging Service can use SMS/MMS when RCS is unavailable.',
        sources: [
          { label: 'Twilio RCS onboarding', url: DOCS.rcsOnboarding },
          { label: 'RCS send and fallback', url: DOCS.rcsSend },
        ],
      },
      {
        title: 'Create the sender profile', mode: 'console',
        cue: 'Start with a Messaging Service that has an SMS/MMS number. Create the RCS Sender in Console; its onboarding API is private beta for ISVs.',
        path: 'Communications → Numbers & senders → Overview → RCS',
        actions: ['Create or open the RCS Sender.', 'Show Public details: logo, banner, description, and contact links.'],
        shot: 'rcs/1',
        sources: [
          { label: 'Twilio RCS sender setup', url: DOCS.rcsOnboarding },
          { label: 'Onboarding API status', url: DOCS.rcsBeta },
        ],
      },
      {
        title: 'Invite a test phone', mode: 'console',
        cue: 'An invited device can test the sender before production approval. Accept “Make me a tester” on that phone.',
        path: 'RCS Sender → Add device to test this sender',
        actions: ['Enter the phone number in E.164 format and click Invite.', 'Show the accepted tester and send a test message.'],
        shot: 'rcs/2',
        sources: [{ label: 'Twilio RCS tester flow', url: DOCS.rcsOnboarding }],
      },
      {
        title: 'Register with Google', mode: 'console',
        cue: 'For production, complete Google registration even when your only destination is the US. Invited testers can receive messages before approval.',
        path: 'RCS Sender → Compliance registration → Google',
        actions: ['Add destination countries and start Google registration.', 'Provide opt-in/out policy, use-case, and review details.'],
        shot: 'rcs/3',
        sources: [{ label: 'Twilio Google registration steps', url: DOCS.rcsOnboarding }],
      },
      {
        title: 'Complete US registration', mode: 'console',
        cue: 'For US traffic, submit the additional business, carrier, and campaign details; approval is separate from tester access.',
        path: 'RCS Sender → Compliance registration → United States',
        actions: ['Enter EIN, business address, traffic, and campaign details.', 'Review and submit; show the real current status.'],
        shot: 'rcs/4',
        sources: [{ label: 'Twilio US registration steps', url: DOCS.rcsOnboarding }],
      },
      {
        title: 'Finish the Messaging Service setup', mode: 'console',
        cue: 'The service and SMS/MMS number were prepared before RCS onboarding. Add the RCS Sender here so the app can use RCS with SMS/MMS fallback.',
        path: 'Communications → Messaging → Services → your service → Senders',
        actions: ['Confirm the service already contains an SMS/MMS-capable number.', 'Add the RCS Sender to its sender pool and save the MG SID for the send request.'],
        shot: 'rcs/5',
        sources: [
          { label: 'Create a Messaging Service', url: DOCS.messagingServices },
          { label: 'Add an RCS Sender', url: DOCS.rcsOnboarding },
        ],
      },
      {
        title: 'Content API: create the rich card', mode: 'code',
        cue: 'For this demo’s twilio/card, use the Content API: the Console builder cannot create that type. Include text for SMS fallback and public media/action URLs.',
        codeLabel: 'POST Content API · full case-update template', code: RCS_TEMPLATE_CODE,
        focus: ['"twilio/text"', '"twilio/card"', 'media:', 'actions:', 'https://content.twilio.com/v1/Content', 'result.sid'],
        focusNotes: [
          'Defines the text version for SMS fallback.',
          'Defines the rich card shown over RCS.',
          'Adds a public image URL to the card.',
          'Adds the View case button and destination.',
          'Creates the template through the Content API.',
          'Saves the template SID for the message send.',
        ],
        sources: [
          { label: 'Twilio card', url: DOCS.card },
          { label: 'Content API', url: DOCS.contentApi },
          { label: 'Console builder limits', url: DOCS.contentBuilder },
        ],
      },
      {
        title: 'Messages API: send the update', mode: 'code',
        cue: 'Pass the MG and HX SIDs to Messages API. Twilio can use the configured SMS/MMS sender if RCS is unavailable.',
        codeLabel: 'Messages API · RCS with fallback', code: RCS_SEND_CODE,
        focus: ['messagingServiceSid:', 'contentSid:', 'message.sid'],
        focusNotes: [
          'Selects the service with RCS and SMS senders.',
          'Selects the Content Template to send.',
          'Logs the Message SID for delivery tracking.',
        ],
        sources: [{ label: 'Twilio RCS send and fallback', url: DOCS.rcsSend }],
      },
    ],
  },
  'shaken-stir': {
    title: 'SHAKEN/STIR',
    steps: [
      {
        title: 'Authenticate the number', mode: 'overview',
        definition: 'SHAKEN/STIR is carrier-level caller ID authentication. A digital signature helps the receiving network check the number.',
        flow: [
          ['Associate', 'Business Profile + phone number'],
          ['Sign', 'Twilio signs the call'],
          ['Verify', 'Receiving network checks it'],
        ],
        benefit: 'It gives carriers a way to distinguish an authorized caller ID from spoofing.',
        limit: 'SHAKEN/STIR alone does not display a logo or call reason, or promise no spam label.',
        sources: [{ label: 'Twilio SHAKEN/STIR overview', url: DOCS.shakenOverview }],
      },
      {
        title: 'Find the approved profile', mode: 'console',
        cue: 'Start with an approved Primary Business Profile in Trust Hub and link the outbound number to it.',
        path: 'Communications → Trust Hub → Profiles',
        actions: [
          'Show the approved Primary Business Profile and confirm the calling number is assigned to it.',
          'Only for the optional API route: copy the profile’s BU SID and the number’s PN SID privately.',
        ],
        shot: 'shaken-stir/1',
        sources: [{ label: 'Twilio Console onboarding', url: DOCS.shakenConsole }],
      },
      {
        title: 'Create a SHAKEN/STIR registration', mode: 'console',
        cue: 'Check for an existing SHAKEN/STIR Trust Product first. If needed, use this Console registration path; steps 4–6 show an optional API alternative.',
        path: 'Communications → Trust Hub → Registrations → SHAKEN/STIR → Create registration',
        actions: [
          'If a Trust Product is already approved for the calling number, show its status. Otherwise, enter a friendly name and select the approved compliance profile.',
          'If creating a Trust Product, complete its details and submit it for review.',
          'Confirm the calling number is linked to both the profile and SHAKEN/STIR Trust Product.',
        ],
        shot: 'shaken-stir/2',
        sources: [
          { label: 'Twilio registration guide', url: DOCS.shakenRegistration },
          { label: 'Twilio Console onboarding', url: DOCS.shakenConsole },
        ],
      },
      {
        title: 'Optional API: link number to profile', mode: 'code',
        cue: 'The phone number must be assigned to the Business Profile before the SHAKEN/STIR Trust Product.',
        codeLabel: 'Trust Hub API · CustomerProfile assignment', code: PROFILE_NUMBER_CODE,
        focus: ['customerProfiles(', 'customerProfilesChannelEndpointAssignment.create', 'channelEndpointSid:'],
        focusNotes: [
          'Uses the approved business profile as the owner.',
          'Creates the profile-to-number assignment.',
          'Specifies the Twilio number being assigned.',
        ],
        sources: [{ label: 'Twilio SHAKEN/STIR API', url: DOCS.shakenApi }],
      },
      {
        title: 'Optional API: create the Trust Product', mode: 'code',
        cue: 'The fixed policy SID selects the SHAKEN/STIR verification workflow.',
        codeLabel: 'Trust Hub API · create SHAKEN/STIR product', code: SHAKEN_CREATE_CODE,
        focus: ['trustProducts.create', 'policySid:', 'product.sid'],
        focusNotes: [
          'Creates a Trust Product for caller ID authentication.',
          'Selects the SHAKEN/STIR policy.',
          'Saves the product SID for the next step.',
        ],
        sources: [{ label: 'Twilio SHAKEN/STIR API', url: DOCS.shakenApi }],
      },
      {
        title: 'Optional API: assign and submit', mode: 'code',
        cue: 'Attach the business and number, then submit for vetting.',
        codeLabel: 'Trust Hub API · submit SHAKEN/STIR', code: trustFinishCode('SHAKEN_TRUST_PRODUCT_SID'),
        focus: ['trustProductsEntityAssignments.create', 'trustProductsChannelEndpointAssignment.create', 'pending-review'],
        focusNotes: [
          'Links the approved business profile to the product.',
          'Links the calling number to the product.',
          'Submits the completed product for review.',
        ],
        sources: [{ label: 'Twilio SHAKEN/STIR API', url: DOCS.shakenApi }],
      },
    ],
  },
  cnam: {
    title: 'CNAM',
    steps: [
      {
        title: 'Put a name behind the number', mode: 'overview',
        definition: 'Caller ID Name (CNAM) publishes a short name for lookups on eligible US local numbers.',
        flow: [
          ['Register', 'Business and caller name'],
          ['Publish', 'CNAM database record'],
          ['Look up', 'Receiving carrier may display it'],
        ],
        benefit: 'A recipient may see a recognizable business name with the call.',
        limit: '15 characters maximum; mobile lookup is often opt-in. Toll-free CNAM changes need Support.',
        sources: [{ label: 'Twilio CNAM guide', url: DOCS.cnam }],
      },
      {
        title: 'Verify the profile and number', mode: 'console',
        cue: 'CNAM is an optional name-display layer for eligible US local numbers, especially when calling landlines. The webinar’s toll-free number needs Support for CNAM changes.',
        path: 'Communications → Trust Hub → Profiles',
        actions: ['Show the approved Business Profile with EIN or DUNS.', 'Confirm an eligible US local number is assigned to that profile.'],
        shot: 'cnam/1',
        sources: [{ label: 'Twilio CNAM eligibility', url: DOCS.cnam }],
      },
      {
        title: 'Create a CNAM registration', mode: 'console',
        cue: 'CNAM is Public Beta. Use Console for the registration; steps 4–6 show the optional API route.',
        path: 'Communications → Trust Hub → Registrations → CNAM → Create registration',
        actions: [
          'Enter a friendly name and select the approved compliance profile.',
          'Enter the proposed caller name, up to 15 characters, and submit the CNAM Trust Product for review.',
          'After approval, assign the eligible local number to the CNAM registration and save.',
        ],
        shot: 'cnam/2',
        sources: [
          { label: 'Twilio CNAM registration', url: DOCS.cnamRegistration },
          { label: 'Twilio Console onboarding', url: DOCS.cnam },
        ],
      },
      {
        title: 'Optional API: link number to profile', mode: 'code',
        cue: 'First assign the eligible PN SID to the approved Business Profile.',
        codeLabel: 'Trust Hub API · CNAM public beta', code: PROFILE_NUMBER_CODE,
        focus: ['customerProfilesChannelEndpointAssignment.create', 'channelEndpointSid:'],
        focusNotes: [
          'Adds the eligible number to the business profile.',
          'Identifies that number by its PN SID.',
        ],
        sources: [{ label: 'Twilio CNAM API steps', url: DOCS.cnam }],
      },
      {
        title: 'Optional API: create name records', mode: 'code',
        cue: 'Create a CNAM Trust Product and a separate End User record containing the proposed display name.',
        codeLabel: 'Trust Hub API · CNAM public beta', code: CNAM_CREATE_CODE,
        focus: ['policySid:', 'type: "cnam_information"', 'cnam_display_name:', 'product.sid', 'name.sid'],
        focusNotes: [
          'Selects the CNAM registration policy.',
          'Creates a record for the proposed caller name.',
          'Sets the name that eligible carriers may display.',
          'Saves the CNAM product SID for submission.',
          'Saves the name record SID so it can be attached.',
        ],
        sources: [{ label: 'Twilio CNAM API steps', url: DOCS.cnam }],
      },
      {
        title: 'Optional API: assign and submit', mode: 'code',
        cue: 'Attach the profile, name record, and local number to the product, then submit for review.',
        codeLabel: 'Trust Hub API · CNAM public beta', code: trustFinishCode('CNAM_TRUST_PRODUCT_SID', 'CNAM_END_USER_SID'),
        focus: ['trustProductsEntityAssignments.create', 'CNAM_END_USER_SID', 'trustProductsChannelEndpointAssignment.create', 'pending-review'],
        focusNotes: [
          'Links the approved business profile.',
          'Adds the proposed caller-name record.',
          'Identifies the name record created earlier.',
          'Links the eligible local number to the product.',
          'Submits the CNAM request for review.',
        ],
        sources: [{ label: 'Twilio CNAM API steps', url: DOCS.cnam }],
      },
      {
        title: 'Enable Caller Name Lookup', mode: 'console',
        cue: 'After approval and number assignment, enable Caller Name Lookup on the eligible number in Console.',
        path: 'Communications → Numbers & senders → Overview → number → Voice and emergency calling → Edit',
        actions: ['Click Edit and set Caller Name Lookup to Enabled.', 'Save Configuration.'],
        shot: 'cnam/3',
        sources: [{ label: 'Twilio CNAM Console steps', url: DOCS.cnam }],
      },
    ],
  },
  'voice-integrity': {
    title: 'Voice Integrity',
    steps: [
      {
        title: 'Address misleading spam labels', mode: 'overview',
        definition: 'Twilio submits registered numbers to carrier analytics vendors for spam-label remediation.',
        flow: [
          ['Register', 'Business, use case, and numbers'],
          ['Review', 'Carrier analytics vendors assess them'],
          ['Remediate', 'Incorrect labels may be changed'],
        ],
        benefit: 'Legitimate outbound calls have a route to correct mistaken spam labels.',
        limit: 'Registration does not guarantee that every carrier removes every label.',
        sources: [{ label: 'Twilio Voice Integrity', url: DOCS.integrityOverview }],
      },
      {
        title: 'Start with an approved profile', mode: 'console',
        cue: 'Twilio recommends Voice Integrity alongside US Enhanced Branded Calling. Use an approved Business Profile and assign the outbound number to it.',
        path: 'Communications → Trust Hub → Profiles',
        actions: ['Show the approved Business Profile and its assigned calling number.', 'For the optional API route, note the profile BU SID and each number’s PN SID privately.'],
        shot: 'voice-integrity/1',
        sources: [{ label: 'Twilio Voice Integrity setup', url: DOCS.integrityConsole }],
      },
      {
        title: 'Create a Voice Integrity registration', mode: 'console',
        cue: 'Use Console for the Trust Product. Steps 4–6 show the optional private-beta API route.',
        path: 'Communications → Trust Hub → Registrations → Voice Integrity → Create registration',
        actions: [
          'Enter a friendly name and select the approved compliance profile.',
          'Describe the real outbound calling use case and submit the Trust Product for review.',
          'Assign outbound numbers already linked to that profile to the Voice Integrity registration.',
        ],
        shot: 'voice-integrity/2',
        sources: [
          { label: 'Twilio Voice Integrity registration', url: DOCS.integrityRegistration },
          { label: 'Twilio Console onboarding', url: DOCS.integrityConsole },
        ],
      },
      {
        title: 'Optional API: link number to profile', mode: 'code',
        cue: 'A number must belong to the Business Profile before it can join the Voice Integrity Trust Product.',
        codeLabel: 'Trust Hub API · Voice Integrity private beta', code: PROFILE_NUMBER_CODE,
        focus: ['customerProfilesChannelEndpointAssignment.create', 'channelEndpointSid:'],
        focusNotes: [
          'Adds the calling number to the business profile.',
          'Identifies the Twilio number by its PN SID.',
        ],
        sources: [{ label: 'Twilio Voice Integrity API', url: DOCS.integrityApi }],
      },
      {
        title: 'Optional API: describe the calls', mode: 'code',
        cue: 'Create the Trust Product and an End User record for the real outbound calling use case.',
        codeLabel: 'Trust Hub API · Voice Integrity private beta', code: INTEGRITY_CREATE_CODE,
        focus: ['policySid:', 'type: "voice_integrity_information"', 'use_case:', 'average_business_day_call_volume:', 'useCase.sid'],
        focusNotes: [
          'Selects the Voice Integrity registration policy.',
          'Creates a record for the outbound calling use case.',
          'Describes the purpose of these calls.',
          'Estimates the average weekday call volume.',
          'Saves the use-case SID for submission.',
        ],
        sources: [{ label: 'Twilio Voice Integrity API', url: DOCS.integrityApi }],
      },
      {
        title: 'Optional API: assign and submit', mode: 'code',
        cue: 'Attach the business, use case, and calling number, then submit for review.',
        codeLabel: 'Trust Hub API · Voice Integrity private beta', code: trustFinishCode('VOICE_INTEGRITY_PRODUCT_SID', 'VOICE_INTEGRITY_END_USER_SID'),
        focus: ['trustProductsEntityAssignments.create', 'VOICE_INTEGRITY_END_USER_SID', 'trustProductsChannelEndpointAssignment.create', 'pending-review'],
        focusNotes: [
          'Links the approved business profile.',
          'Adds the outbound calling use-case record.',
          'Identifies the use-case record created earlier.',
          'Links the calling number to the product.',
          'Submits the Voice Integrity request for review.',
        ],
        sources: [{ label: 'Twilio Voice Integrity API', url: DOCS.integrityApi }],
      },
      {
        title: 'Inspect registration status', mode: 'console',
        cue: 'After Console or API submission, check the actual registration state and assigned numbers.',
        path: 'Communications → Trust Hub → Registrations → Voice Integrity',
        actions: ['Open the Voice Integrity registration.', 'Show its status and assigned numbers.'],
        shot: 'voice-integrity/3',
        sources: [{ label: 'Twilio Voice Integrity setup', url: DOCS.integrityConsole }],
      },
    ],
  },
};

function shell(body, index = false, scroll = false) {
  return '<div class="audience-shell guide-shell">' +
    '<header class="guide-topbar">' +
      '<a class="guide-brand" href="/bank?home=1" aria-label="Twilio Bank home">' +
        '<img src="/twilio-bug.svg" alt="" /><span>twilio <b>bank</b></span></a>' +
      '<nav aria-label="Guide navigation"><a href="/architecture?view=1">← Back to architecture</a>' +
        (index ? '' : '<a href="/architecture/details?view=1">All guides</a>') +
      '</nav>' +
    '</header>' +
    '<main class="guide-main' + (index ? '' : ' guide-main--stage') +
      (scroll ? ' guide-main--scroll' : '') + '">' + body + '</main>' +
  '</div>';
}

function renderIndex() {
  const cards = TOPICS.map((topic) =>
    '<a class="guide-index-link" href="' + architectureGuideHref(topic.id) + '">' +
      '<span>' + escapeHtml(topic.category) + '</span>' +
      '<strong>' + escapeHtml(topic.title) + '</strong>' +
      '<p>' + escapeHtml(topic.summary) + '</p>' +
      '<b aria-hidden="true">→</b>' +
    '</a>').join('');
  return shell(
    '<div class="guide-hero"><div><span class="guide-category">Implementation paths</span>' +
      '<h1>How the trust layers are built</h1>' +
      '<p>Each path begins with the customer benefit, then shows Console setup and the API steps this demo uses or offers as an alternative.</p>' +
    '</div></div>' +
    '<section class="guide-index" aria-label="Implementation guides">' + cards + '</section>',
    true,
  );
}

function renderOverviewVisual(topic) {
  if (topic === 'branded-calling') {
    return '<figure class="guide-visual guide-visual--branded-call">' +
      '<div class="guide-visual-phone">' +
        '<div class="guide-visual-phone-status"><span>Incoming call</span><span>Example screen</span></div>' +
        '<div class="guide-visual-phone-mark"><img src="/twilio-bug.svg" alt="" /></div>' +
        '<strong class="guide-visual-phone-name">Twilio Bank</strong>' +
        '<span class="guide-visual-phone-number">+1 (415) 555-0182</span>' +
        '<p class="guide-visual-phone-reason"><span class="guide-visual-eyebrow">Example call reason</span>' +
          '<strong>Account security update</strong></p>' +
        '<div class="guide-visual-phone-actions" aria-hidden="true">' +
          '<span class="guide-visual-phone-action guide-visual-phone-action--decline">Decline</span>' +
          '<span class="guide-visual-phone-action guide-visual-phone-action--answer">Answer</span>' +
        '</div>' +
      '</div>' +
      '<figcaption class="guide-visual-caption">Illustrative call screen. Display varies by carrier and handset.</figcaption>' +
    '</figure>';
  }
  if (topic === 'rcs') {
    return '<figure class="guide-visual guide-visual--rcs">' +
      '<div class="guide-visual-rcs">' +
        '<div class="guide-visual-rcs-header">' +
          '<div class="guide-visual-rcs-mark"><img src="/twilio-bug.svg" alt="" /></div>' +
          '<div><strong>Twilio Bank</strong><span class="guide-visual-detail">Business sender</span></div>' +
        '</div>' +
        '<div class="guide-visual-rcs-profile"><span class="guide-visual-eyebrow">Sender profile</span>' +
          '<p>Public business details and contact links</p></div>' +
        '<div class="guide-visual-rcs-message"><span class="guide-visual-eyebrow">Message preview</span>' +
          '<strong>Fraud report received</strong><p>Your case is being reviewed.</p>' +
          '<span class="guide-visual-rcs-action">View case</span></div>' +
      '</div>' +
      '<figcaption class="guide-visual-caption">Illustrative RCS sender and message. Availability varies.</figcaption>' +
    '</figure>';
  }
  if (topic === 'shaken-stir') {
    return '<figure class="guide-visual guide-visual--shaken-stir">' +
      '<div class="guide-visual-auth">' +
        '<div class="guide-visual-auth-party"><span class="guide-visual-eyebrow">Business caller</span>' +
          '<strong>Your business</strong><span class="guide-visual-detail">Places a call through Twilio</span></div>' +
        '<span class="guide-visual-auth-arrow" aria-hidden="true">→</span>' +
        '<div class="guide-visual-auth-seal"><span aria-hidden="true">✓</span>' +
          '<strong>Twilio signs</strong><span class="guide-visual-detail">Originating provider</span></div>' +
        '<span class="guide-visual-auth-arrow" aria-hidden="true">→</span>' +
        '<div class="guide-visual-auth-party"><span class="guide-visual-eyebrow">Terminating provider</span>' +
          '<strong>Recipient’s carrier</strong><span class="guide-visual-detail">Verifies signature</span></div>' +
      '</div>' +
      '<p class="guide-visual-auth-note">Authentication helps detect spoofing.</p>' +
      '<figcaption class="guide-visual-caption">Eligible outbound call through Twilio; conceptual path.</figcaption>' +
    '</figure>';
  }
  if (topic === 'cnam') {
    return '<figure class="guide-visual guide-visual--cnam">' +
      '<div class="guide-visual-cnam">' +
        '<div class="guide-visual-cnam-record"><span class="guide-visual-eyebrow">CNAM record</span>' +
          '<strong>TWILIO BANK</strong><span class="guide-visual-detail">Eligible US local number</span>' +
          '<span>+1 (415) 555-0182</span></div>' +
        '<div class="guide-visual-cnam-lookup"><span class="guide-visual-eyebrow">Receiving carrier</span>' +
          '<strong>Looks up number</strong><span class="guide-visual-detail">When available</span></div>' +
        '<div class="guide-visual-cnam-display"><span class="guide-visual-eyebrow">Possible display</span>' +
          '<strong>TWILIO BANK</strong><span class="guide-visual-detail">+1 (415) 555-0182</span></div>' +
      '</div>' +
      '<figcaption class="guide-visual-caption">Illustrative lookup. The carrier may show the name.</figcaption>' +
    '</figure>';
  }
  if (topic === 'voice-integrity') {
    return '<figure class="guide-visual guide-visual--voice-integrity">' +
      '<div class="guide-visual-integrity">' +
        '<div class="guide-visual-integrity-submission"><span class="guide-visual-eyebrow">Submitted</span>' +
          '<strong>Registered number</strong><span class="guide-visual-detail">+1 (415) 555-0182</span></div>' +
        '<span class="guide-visual-integrity-arrow" aria-hidden="true">→</span>' +
        '<div class="guide-visual-integrity-review"><span class="guide-visual-eyebrow">Review</span>' +
          '<strong>Carrier analytics</strong><span class="guide-visual-detail">Assesses the label</span></div>' +
        '<div class="guide-visual-integrity-outcome"><span class="guide-visual-eyebrow">If incorrect</span>' +
          '<span class="guide-visual-integrity-label guide-visual-integrity-label--before">Spam label</span>' +
          '<span class="guide-visual-integrity-arrow" aria-hidden="true">→</span>' +
          '<span class="guide-visual-integrity-label guide-visual-integrity-label--after">May change</span></div>' +
      '</div>' +
      '<figcaption class="guide-visual-caption">Conceptual review path. A change is not guaranteed.</figcaption>' +
    '</figure>';
  }
  return '';
}

function renderOverview(topic, step) {
  const flow = step.flow.map(([label, detail], index) =>
    '<div class="guide-overview-node" role="listitem">' +
      '<span class="guide-overview-index">0' + (index + 1) + '</span>' +
      '<div class="guide-overview-node-copy"><strong>' + escapeHtml(label) + '</strong>' +
        '<p>' + escapeHtml(detail) + '</p></div>' +
    '</div>').join('');
  return '<section class="guide-overview-stage guide-overview-stage--' + escapeHtml(topic) +
    '" aria-label="What this trust layer does">' +
    '<div class="guide-overview-main">' +
      '<div class="guide-overview-story">' +
        '<div class="guide-overview-definition"><span>What it does</span>' +
          '<p>' + escapeHtml(step.definition) + '</p></div>' +
        '<div class="guide-overview-flow" role="list" aria-label="How it works">' + flow + '</div>' +
      '</div>' +
      '<div class="guide-overview-visual">' + renderOverviewVisual(topic) + '</div>' +
    '</div>' +
    '<div class="guide-overview-benefit"><span>Why it matters</span>' +
      '<strong>' + escapeHtml(step.benefit) + '</strong></div>' +
    '<p class="guide-overview-limit">' + escapeHtml(step.limit) + '</p>' +
  '</section>';
}

function renderCode(step) {
  let focusCount = 0;
  const lines = step.code.trim().split('\n').map((line) => {
    const focused = step.focus.some((marker) => line.includes(marker));
    if (focused) focusCount += 1;
    const note = focused ? ' data-guide-line-note="' + escapeHtml(step.focusNotes[focusCount - 1]) + '"' : '';
    return '<span class="guide-code-line' + (focused ? ' is-focus' + (focusCount === 1 ? ' is-current' : '') : '') + '"' + note + '>' +
      escapeHtml(line || ' ') + '</span>';
  }).join('');
  return '<section class="guide-code-stage" data-guide-focus-index="0" aria-label="' + escapeHtml(step.codeLabel) + '">' +
    '<div class="guide-code-top"><strong>' + escapeHtml(step.codeLabel) + '</strong>' +
      '<div class="guide-code-focus-controls" aria-label="Highlighted code lines">' +
        '<span class="guide-focus-label">Key lines</span>' +
        '<button type="button" data-guide-focus-move="-1" aria-label="Previous highlighted code line" disabled>←</button>' +
        '<span data-guide-focus-count>1 / ' + focusCount + '</span>' +
        '<button type="button" data-guide-focus-move="1" aria-label="Next highlighted code line"' +
          (focusCount < 2 ? ' disabled' : '') + '>→</button>' +
      '</div></div>' +
    '<pre><code>' + lines + '</code></pre>' +
    '<div class="guide-code-note" aria-live="polite" aria-atomic="true">' +
      '<strong>What this does</strong><p data-guide-focus-note>' +
        escapeHtml(step.focusNotes[0]) + '</p></div>' +
  '</section>';
}

function renderConsole(step, variants) {
  const actions = step.actions.map((action, index) =>
    '<li><span>' + (index + 1) + '</span><strong>' + escapeHtml(action) + '</strong></li>').join('');
  const hasVariants = variants.length > 0;
  const screenshots = hasVariants
    ? variants.map((filename, index) =>
      '<figure class="guide-console-shot">' +
        '<img src="' + escapeHtml(filename) + '" alt="Twilio Console screenshot ' +
          (index + 1) + ' of ' + variants.length + '" />' +
        '<figcaption>Screenshot ' + (index + 1) + ' of ' + variants.length + '</figcaption>' +
      '</figure>').join('')
    : '<figure class="guide-console-shot" data-shot-path="' +
        escapeHtml('/architecture-shots/' + step.shot + '.png') + '">' +
        '<div class="guide-console-fallback">' +
          '<span class="guide-shot-eyebrow">Real Console screenshot pending</span>' +
          '<p>Save your capture as <code>public/architecture-shots/' + escapeHtml(step.shot) + '.png</code></p>' +
        '</div>' +
      '</figure>';
  return '<section class="guide-console-stage" aria-label="Twilio Console setup">' +
    '<div class="guide-console-route">Twilio Console <span>/</span> ' + escapeHtml(step.path) + '</div>' +
    '<div class="guide-console-visual' + (hasVariants ? ' guide-console-visual--stack' : '') + '">' +
      screenshots + '</div>' +
    '<div class="guide-console-instructions"><span>On this screen</span><ol>' + actions + '</ol></div>' +
  '</section>';
}

function selectedGuideStep(guide, search) {
  const params = new URLSearchParams(search);
  const requested = Number.parseInt(params.get('step') || '1', 10);
  const index = Math.max(0, Math.min(guide.steps.length - 1, (Number.isFinite(requested) ? requested : 1) - 1));
  return { index, step: guide.steps[index] };
}

export function architectureShotForPage(topic, search = '') {
  const guide = GUIDES[topic];
  if (!guide) return null;
  const { step } = selectedGuideStep(guide, search);
  return step.mode === 'console' ? step.shot : null;
}

function renderSlide(topic, guide, shotVariants) {
  const { index, step } = selectedGuideStep(guide, globalThis.window?.location?.search || '');
  const variants = step.mode === 'console' && Array.isArray(shotVariants[step.shot])
    ? shotVariants[step.shot] : [];
  const previous = index > 0
    ? '<a class="guide-control" href="' + stepHref(topic, index) + '">← Previous</a>'
    : '<span class="guide-control guide-control--disabled" aria-disabled="true">← Previous</span>';
  const next = index < guide.steps.length - 1
    ? '<a class="guide-control guide-control--next" href="' + stepHref(topic, index + 2) + '">Next →</a>'
    : '<a class="guide-control guide-control--next" href="/architecture?view=1">Back to architecture →</a>';
  const steps = guide.steps.map((item, stepIndex) =>
    '<a href="' + stepHref(topic, stepIndex + 1) + '" aria-label="Step ' + (stepIndex + 1) + ': ' +
      escapeHtml(item.title) + '"' + (stepIndex === index ? ' aria-current="step"' : '') + '>' +
      (stepIndex + 1) + '</a>').join('');
  const stage = step.mode === 'overview' ? renderOverview(topic, step)
    : step.mode === 'console' ? renderConsole(step, variants) : renderCode(step);
  const body =
    '<article class="guide-slide' + (step.mode === 'overview' ? ' guide-slide--overview' : '') + '">' +
      '<div class="guide-slide-heading">' +
        '<div class="guide-slide-meta"><span>' + escapeHtml(guide.title) + '</span>' +
          '<span>Step ' + (index + 1) + ' of ' + guide.steps.length + '</span></div>' +
        '<h1>' + escapeHtml(step.title) + '</h1>' +
        (step.cue ? '<p>' + escapeHtml(step.cue) + '</p>' : '') +
      '</div>' +
      stage +
      '<footer class="guide-slide-footer">' +
        '<nav class="guide-step-list" aria-label="Walkthrough steps">' + steps + '</nav>' +
        '<div class="guide-sources">' + sourceLinks(step.sources) + '</div>' +
        '<div class="guide-controls">' + previous + next + '</div>' +
      '</footer>' +
    '</article>';
  return shell(body, false, variants.length > 0);
}

export function renderArchitectureGuide(topic = '', shotVariants = {}) {
  const guide = GUIDES[topic];
  return guide ? renderSlide(topic, guide, shotVariants) : renderIndex();
}

globalThis.document?.addEventListener?.('click', (event) => {
  const button = event.target.closest?.('[data-guide-focus-move]');
  if (!button) return;
  const stage = button.closest('.guide-code-stage');
  const lines = [...stage.querySelectorAll('.guide-code-line.is-focus')];
  const index = Math.max(0, Math.min(lines.length - 1,
    Number(stage.dataset.guideFocusIndex || 0) + Number(button.dataset.guideFocusMove)));
  stage.dataset.guideFocusIndex = String(index);
  lines.forEach((line, lineIndex) => line.classList.toggle('is-current', lineIndex === index));
  stage.querySelector('[data-guide-focus-count]').textContent = (index + 1) + ' / ' + lines.length;
  stage.querySelector('[data-guide-focus-note]').textContent = lines[index].dataset.guideLineNote;
  stage.querySelector('[data-guide-focus-move="-1"]').disabled = index === 0;
  stage.querySelector('[data-guide-focus-move="1"]').disabled = index === lines.length - 1;
  lines[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
