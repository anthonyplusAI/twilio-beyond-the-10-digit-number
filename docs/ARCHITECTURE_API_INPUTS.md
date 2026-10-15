# Inputs for the architecture API examples

The guide's code panels are complete **Node 22 ESM snippets for each shown request**. Run one step at a time with the project's `twilio` package installed. Save an ID printed by one step as the environment variable used by the next. The guide itself needs none of these values to display. For trust registrations, the Console walkthrough is the main path; the API input lists below apply only when you choose the optional API route.

The Branded Calling and Trust Hub examples describe a **direct customer using its real registered business identity**. Twilio Bank is fictional; the live call uses the already approved Twilio identity. Don't submit the fictional bank as a real brand. Twilio's [US Enhanced guide](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) covers standard Console registration. Its [private-beta API walkthrough](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api) focuses on ISV onboarding, while the [API schema](https://www.twilio.com/docs/trust-hub/trusthub-rest-api/compliance/branded-calling-registrations-resource) also includes `direct_customer`.

## Common

| Variable | Value |
| --- | --- |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Credentials for the account that owns the resources. |
| `DEMO_TO_NUMBER` | Your test handset in E.164 format. |

## RCS

| Variable | Value |
| --- | --- |
| `TWILIO_MESSAGING_SERVICE_SID` | `MG` SID of the Messaging Service configured in Console. |
| `PUBLIC_BASE_URL` | Public HTTPS origin hosting `/rcs-case-update-card.png` and `/bank?case=1`. |
| `TWILIO_RCS_CASE_CONTENT_SID` | `HX` SID printed by the Content API example. |

RCS guide step 6 shows the Messaging Service in Console. Twilio lists a Messaging Service with an SMS/MMS-capable number as a prerequisite for configuring RCS, so prepare it before onboarding the sender even though the presentation visits it later. Add the RCS Sender to the service, then save the `MG` SID as `TWILIO_MESSAGING_SERVICE_SID` for the send step. [Twilio RCS prerequisites](https://www.twilio.com/docs/rcs/onboarding#prerequisites)

Create the RCS Sender, invite a tester, and submit its Google and US registrations in Console. This demo's rich card is a `twilio/card` Content Template, which **must be created through the Content API**: Twilio says that content type is unavailable in the Console builder. Save the resulting `HX` SID, then use the regular Messages API to send through the service. The separate [RCS sender-onboarding API](https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-) is private beta for ISVs; it is not required for the card or send. [RCS onboarding and service prerequisite](https://www.twilio.com/docs/rcs/onboarding) · [Console builder limitation](https://www.twilio.com/docs/content/create-templates-with-the-content-template-builder) · [Messages API send and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)

## Enhanced Branded Calling

The main setup path is **Communications → Trust Hub → Registrations → Branded calling → Create registration**. First approve a Primary Business Profile and enable SHAKEN/STIR for the calling number. For the demo's US Enhanced registration, select the destination, type, use case, direct-customer role, and approved Business Profile; enter real business and brand details, attach the signed Letter of Authorization, and submit. Assign the calling number during registration or after approval. [Twilio Console registration path](https://www.twilio.com/docs/trust-hub/registrations/branded-calling) · [US Enhanced prerequisites and registration steps](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Guide steps 5–8 are an **optional private-beta Compliance API** alternative, and the variables below for regulation, address, representative, LOA, and registration exist for that route. Twilio's published API walkthrough is labeled for ISVs; the [registration resource](https://www.twilio.com/docs/trust-hub/trusthub-rest-api/compliance/branded-calling-registrations-resource) includes `direct_customer`, but that does not grant beta access. The `AD` Address SID comes from Twilio's [Address resource](https://www.twilio.com/docs/usage/api/address). If the bundle and number are already approved, go directly to guide step 9 and use the normal [Calls API](https://www.twilio.com/docs/voice/api/call-resource). [Twilio private-beta API walkthrough](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api)

| Variable | Value |
| --- | --- |
| `BRANDED_REGULATION_VERSION` | Number printed by the regulation GET step. |
| `BRAND_REGISTRATION_NAME` | Internal registration label. |
| `BRAND_ADDRESS_SID` | Real business `AD` Address SID. |
| `BRAND_REP_FIRST`, `BRAND_REP_LAST`, `BRAND_REP_EMAIL`, `BRAND_REP_PHONE`, `BRAND_REP_JOB` | Authorized representative's real details; phone in E.164 format. |
| `BRAND_CONTACT_FIRST`, `BRAND_CONTACT_LAST`, `BRAND_CONTACT_PHONE`, `BRAND_CONTACT_EMAIL` | Authorized contact's real details. |
| `BRAND_USE_CASE_CATEGORY`, `BRAND_USE_CASE_DESCRIPTION`, `BRAND_CONSENT_DESCRIPTION`, `BRAND_DAILY_CALLS` | The real use case, consent method, and numeric daily volume. Twilio's schema includes categories such as `MIXED` and `FRAUD_ALERT`. |
| `BRAND_DISPLAY_NAME`, `BRAND_CALL_REASON`, `BRAND_LOGO_URL` | Approved brand values. The logo URL must serve the required 256 × 256 32-bit BMP asset. |
| `BRAND_LEGAL_NAME`, `BRAND_ENTITY_TYPE`, `BRAND_EIN`, `BRAND_INDUSTRY`, `BRAND_WEBSITE_URL`, `BRAND_EMPLOYEES` | Legal business values matching the registration; employee count is numeric. |
| `BRANDED_REGISTRATION_ID` | `BU` ID printed by the Compliance Registration POST step. |
| `BRAND_SIGNED_LOA_JPG` | Local path to the signed LOA as a JPEG for the upload example. |
| `TWILIO_VOICE_NUMBER_SID` | `PN` SID for the number assigned to the new branded registration. |
| `TWILIO_VOICE_FROM` | The **approved and assigned** calling number in E.164 format. |
| `TWILIO_CONVERSATION_RELAY_URL` | Public `wss://` endpoint for the application's ConversationRelay agent. |
| `TWILIO_ELEVENLABS_VOICE_ID` | Voice ID for the chosen ElevenLabs voice. |

The enhanced bundle determines the caller name, logo, and reason. The [Calls API](https://www.twilio.com/docs/voice/api/call-resource) request does not add a new reason per call. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) connects an answered call to the WebSocket app.

## SHAKEN/STIR, CNAM, and Voice Integrity

Each Console path starts with an **approved** Business Profile and a number assigned to it. SHAKEN/STIR guide step 3 creates its Trust Product in Console; steps 4–6 are the optional API alternative. CNAM guide step 3 creates its Trust Product in Console; steps 4–6 are optional API calls, and step 7 enables Caller Name Lookup. Voice Integrity guide step 3 creates its Trust Product in Console; steps 4–6 are the optional **private-beta API** route, and step 7 checks status. The `TWILIO_PHONE_NUMBER_SID` input is needed for those API examples and refers to the number being registered for that product. [SHAKEN/STIR registration](https://www.twilio.com/docs/trust-hub/registrations/shaken-stir) · [CNAM registration](https://www.twilio.com/docs/trust-hub/registrations/cnam) · [Voice Integrity registration](https://www.twilio.com/docs/trust-hub/registrations/voice-integrity) · [Voice Integrity API status](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding)

| Variable | Value |
| --- | --- |
| `TWILIO_BUSINESS_PROFILE_SID` | Approved Primary Business Profile `BU` SID. |
| `TWILIO_PHONE_NUMBER_SID` | Twilio calling number's `PN` SID. For CNAM, use an eligible **US local** number. |
| `COMPLIANCE_EMAIL` | Email contact for the Trust Product. |
| `SHAKEN_TRUST_PRODUCT_SID` | `BU` SID printed by the SHAKEN/STIR product-creation step. |
| `APPROVED_CNAM_NAME` | Proposed caller name, at most 15 characters and conforming to Twilio's CNAM rules. |
| `CNAM_TRUST_PRODUCT_SID`, `CNAM_END_USER_SID` | SIDs printed by the CNAM product and End User step. |
| `VOICE_INTEGRITY_USE_CASE`, `VOICE_INTEGRITY_EMPLOYEE_COUNT`, `VOICE_INTEGRITY_DAILY_CALLS`, `VOICE_INTEGRITY_NOTES` | Real calling use case and expected volumes. Choose a use-case value from Twilio's allowed list. |
| `VOICE_INTEGRITY_PRODUCT_SID`, `VOICE_INTEGRITY_END_USER_SID` | SIDs printed by the Voice Integrity product and End User step. |

CNAM is a **public beta**, and its Console/API registration only covers eligible US local numbers; toll-free CNAM changes require Support. Twilio's direct-customer API guides: [SHAKEN/STIR](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding/shaken-stir-trust-hub-api-direct-customer), [CNAM](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam), and [Voice Integrity](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding/voice-integrity-trust-hub-api-direct-customer).
