# Presenter guide

This guide covers the webinar controls and optional live Twilio tests. Attendees can start with the [demo guide](README.md). The full talk track is in [SCRIPT.MD](SCRIPT.MD).

## Start and share

Install dependencies once, then run the local server:

    npm install
    npm run dev

Set `PRESENTER_PASSWORD` in your local `.env` before starting. `npm run dev` loads those values. Open the **Presenter** URL printed in the terminal and enter the password on the page. For the [hosted webinar app](docs/DEPLOYMENT.md), open the hosted `/presenter` route. Keep that window private. Click **Open audience window** and share **only** the audience window.

The bank dashboard and phone illustrations are simulations. If you mirror your own handset, identify it as the live device. The app never captures your phone. The presenter step turns green at each configured **real phone** action: live call, SMS, and RCS. The preview actions change only the illustration. A request accepted by Twilio does not by itself prove handset delivery or a human answer. [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource) · [Call statuses](https://www.twilio.com/docs/voice/api/call-resource)

After the case is viewed, use **Show architecture** and **Show setup guide** to switch the shared audience window. On the architecture diagram, click a channel or voice-trust layer to open its setup page; use **Back to architecture** to return. **Show bank app** returns to Anthony's account. **Restart story** resets the displayed story at any point; it does not cancel a message or call already placed.

## 30-minute agenda

| Time | Topic | What to show |
| --- | --- | --- |
| 0:00–2:00 | The trust problem | Introduce the fictional Twilio Bank and the flagged $9,800.00 vehicle deposit. |
| 2:00–3:00 | Unknown caller | Show a **simulated** number-only call. Anthony ignores it. |
| 3:00–9:00 | Voice identity tutorial | Walk through Trust Hub, SHAKEN/STIR, Voice Integrity, Enhanced Branded Calling, CNAM, and the Calls API. [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| 9:00–13:00 | Branded AI call | Place or preview the call. Anthony says **No**; the fictional bank records a fraud report. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| 13:00–14:00 | New, lower-urgency job | Show the case-status update the bank wants Anthony to view. |
| 14:00–16:00 | Plain SMS | Send or preview a number-only case-status message. Anthony does not open it. |
| 16:00–22:00 | RCS identity tutorial | Show sender public details, accepted tester, Messaging Service, Content Template, and Messages API. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) |
| 22:00–25:00 | Branded RCS | Send or preview the case-status card. Inspect the profile and open **View case**. [Card actions](https://www.twilio.com/docs/content/twiliocard) |
| 25:00–27:00 | Architecture and AMD | Trace channel choice and fallback; place AMD after answer. [AMD](https://www.twilio.com/docs/voice/answering-machine-detection) |
| 27:00–29:00 | Apple Messages for Business | Show a prepared private-beta demo or the Twilio page and access request. [Apple Messages for Business](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business) |
| 29:00–30:00 | Close | Recap what voice and RCS each accomplished. |

## Presenter action order

| Presenter action | What the audience sees and what to say |
| --- | --- |
| **Flag purchase** | The fake bank flags a $9,800.00 deposit at Midlife Crisis Motors on Anthony Dellavecchia's card ending 4829. The purchase and bank are fictional. |
| **Show unknown call → Anthony ignores it** | Show the illustrated unfamiliar number. This is a comparison **simulation**. No real call is placed. |
| **Place live AI agent call** or **Show call preview** | The illustrated phone says **Twilio Bank** for the fictional story. The real approved caller display name is **Twilio**, so show the live test phone separately. The illustrated Android 14+ phone also shows an **example** call reason. [Supported-device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| On the live call, say **“No, I do not recognize that charge.”** | The application should record the spoken decision and show a fraud report in the fake bank. The green response indicator means a decision was captured; it does not mean a real card was blocked. [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) |
| For a preview or backup, choose **No, not mine** | This presenter choice simulates the “No” answer when no live answer was captured. **Yes, I made it** ends the charge story without a fraud-report follow-up, so use **No** for the intended webinar path. |
| **Send live SMS** or **Show SMS preview → Anthony ignores SMS** | This is a separate, number-only update about the already opened fraud report. Anthony leaves the text alone because the sender is an unfamiliar number, not because the urgent question is unresolved. [RCS and SMS sender differences](https://www.twilio.com/docs/rcs) |
| **Send live RCS** or **Show RCS preview** | The case-status card has a **View case** URL action. Show the real phone if the invited tester receives RCS. If Twilio instead delivers SMS/MMS fallback, identify the number-only result, then click **Show intended RCS example** for a labeled comparison. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Card URL actions](https://www.twilio.com/docs/content/twiliocard) |
| For RCS or the labeled example: open the illustrated sender profile → **Back to chat** | Click the logo or name at the top of the illustrated chat. **Info** shows banner, logo, description, and contact details; **Options** shows privacy and terms links. **Show live fallback view** returns to the actual number-only result. [RCS public details](https://www.twilio.com/docs/rcs/onboarding) |
| Tap **View case**; then click **View case status** in Presenter | A real RCS URL button opens the hosted demo website. The illustrated URL button opens a separate customer tab. **View case status** in the current-step box, or **Open fictional case page** in full controls, advances the shared bank screen manually. An SMS/MMS fallback has no RCS URL button; use the labeled example or advance directly in Presenter. [Card URL action](https://www.twilio.com/docs/content/twiliocard) |
| **Show architecture → Show setup guide** | Use the overview to connect the branded call, separate SMS, branded RCS follow-up, and channel fallback. Click the RCS, Branded Calling, SHAKEN/STIR, CNAM, or Voice Integrity sections for setup steps and sourced code. |

For the audience, the most important distinction is simple: **the fraud answer arrives by voice; RCS helps Anthony find the later case update.** The initial unknown call is simulated, the branded call can be live, and the case-status SMS and RCS can be live sends to a fixed tester. Both messaging sends are explicit application actions. Twilio's automatic RCS-to-SMS/MMS fallback is a separate delivery path. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)

## Before showing the Console

Prepare these pages in separate tabs so the talk remains on time:

1. **Trust Hub → Registrations:** Approved Business Profile, SHAKEN/STIR, Voice Integrity if registered, and Enhanced Branded Calling bundle with the assigned number. Twilio requires an approved Business Profile and SHAKEN/STIR for Enhanced Branded Calling. [Enhanced setup](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [SHAKEN/STIR](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding)
2. **RCS Sender → Public details and Configuration:** Name, description, logo, banner, contact details, privacy policy, terms, tester, and assigned Messaging Service. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)
3. **Content Template:** The **Fraud report received** card, its **View case** URL action, and its text fallback. `twilio/card` supports an RCS URL button whose destination is publicly accessible. [Card actions](https://www.twilio.com/docs/content/twiliocard)
4. **Code view:** The Calls API, ConversationRelay TwiML, deliberate SMS request, and Content SID RCS send. The [script's code cards](SCRIPT.MD#code-cards-for-the-shared-code-tab) provide short examples. [Calls API](https://www.twilio.com/docs/voice/api/call-resource) · [RCS Messages API](https://www.twilio.com/docs/rcs/send-an-rcs-message)

A registered Enhanced bundle and production RCS Sender are reviewed workflows. Twilio says Enhanced review can take up to seven days and RCS onboarding may take four to six weeks or longer. Twilio documents a [private-beta Branded Calling onboarding API for ISVs](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api) and a [private-beta RCS onboarding API for ISVs](https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-). Do not attempt either registration on stage. [Enhanced review](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)

## Live branded AI call

The first unknown-number call is only a simulation. For the second call, use the approved `TWILIO_VOICE_FROM` number. The actual approved display name is **Twilio**. The phone you tested displayed **Twilio Inc**; your Samsung Android 13 is below Twilio's documented Samsung Android 14+ range for the full name, logo, and reason display. The illustration shows a supported-device example. “Card security alert” in that illustration is an **example** reason; verify the real bundle's approved reason in Console before making any claim about the live display. [US Enhanced device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Twilio ConversationRelay transcribes the caller, sends the text to this app's WebSocket, and speaks the agent response using the selected ElevenLabs voice. This sample uses an OpenAI model for the agent reply. A separate ElevenLabs API key is not needed for Twilio's voice selection. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [Voice configuration](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration)

1. Accept Twilio's **Predictive and Generative AI/ML Features Addendum** for Voice in Console. [ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
2. Set `TWILIO_VOICE_FROM` to the number assigned to your approved Branded Calling bundle, `DEMO_TO_NUMBER` to your test handset, and `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-4o-mini`. Optionally set `TWILIO_ELEVENLABS_VOICE_ID` using Twilio's [voice selection guide](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration).
3. For the hosted app, `PUBLIC_BASE_URL` supplies the HTTPS origin and the app derives `wss://<same-host>/voice-relay`. For local end-to-end rehearsal, tunnel the **same app port** with `ngrok http 3000`, set `PUBLIC_BASE_URL` to the tunnel's HTTPS origin, and leave `TWILIO_CONVERSATION_RELAY_URL` blank. [ConversationRelay URL and signature guidance](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
4. At the call step, click **Place live AI agent call**, answer the phone, and say clearly **“No, I do not recognize that charge.”** Let the agent respond. The bank screen should record the answer automatically. Use **No, not mine** only as a labeled presenter simulation if the call is previewed or the live answer is not captured.

If Voice Integrity is present, show its registration for the same number as a spam-label remediation layer. If it is absent, describe the setup without claiming this number is registered. Twilio recommends it alongside Enhanced Branded Calling. CNAM is a separate name-only mechanism; for a toll-free number, Twilio says CNAM updates require Support. [Voice Integrity](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity) · [CNAM](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam)

AMD is not part of the live call. It classifies human versus machine **after** answer; synchronous AMD can delay TwiML. Explain it briefly while showing the architecture as an optional voicemail branch, not an incoming-screen trust cue. [Answering Machine Detection](https://www.twilio.com/docs/voice/answering-machine-detection)

## Send the case-status SMS live

The verified toll-free number is currently registered under a **marketing** use case. This webinar sends only to the fixed test phone. A production case-status program should have registration that reflects its actual traffic; Twilio's guide says changing an approved toll-free use case requires deleting and resubmitting the verification. Branded Calling registration is separate from messaging verification. [Toll-free verification](https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding) · [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Set `TWILIO_SMS_FROM` to the verified toll-free number in the `TWILIO_MESSAGING_SERVICE_SID` sender pool. The app specifies both the Messaging Service and this `From` number, so this deliberate send does not select the RCS Sender. Keep `DEMO_TO_NUMBER` set to your own phone. [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services)

After the **No** answer opens the fictional fraud report, click **Send live SMS**. The message begins:

> Twilio Bank: We received your report about the $9,800.00 Midlife Crisis Motors charge. View case status in your banking app: https://…

The app appends a deliberately long, raw case URL with demo tracking parameters. Its origin comes from `PUBLIC_BASE_URL` when set, or the hosted demo origin otherwise, and it opens `/bank?case=1`. The SMS send does not request Twilio Link Shortening, so the full URL remains visible. A long message may use multiple SMS segments. It sets `MessageIntent=notifications` because this is an account case-status notification. Twilio's Compliance Toolkit treats that intent as essential for Quiet Hours; it does not change the sender's toll-free registration or guarantee handset delivery. [Twilio Link Shortening](https://www.twilio.com/docs/messaging/features/link-shortening) · [Compliance Toolkit](https://www.twilio.com/docs/messaging/features/compliance-toolkit) · [Messages API](https://www.twilio.com/docs/messaging/api/message-resource)

Click **Refresh SMS status** beside the current step before saying the live text arrived. **Accepted** means Twilio received the request; **scheduled** means it has not reached the phone and may be sent later. A scheduled message from an earlier run is not changed by a new deployment. If the live send is still scheduled, call the illustrated phone a preview and continue the fictional story. When the text arrives, show the number-only sender on your handset. The audience illustration opens the Messages conversation so the full SMS is readable; this is a presenter preview, not Anthony opening it. Then click **Anthony ignores SMS** to show his unread notification. For a simulation, use **Show SMS preview**. The app does not handle inbound SMS replies. [Messages API](https://www.twilio.com/docs/messaging/api/message-resource) · [Compliance Toolkit](https://www.twilio.com/docs/messaging/features/compliance-toolkit) · [Messaging webhooks](https://www.twilio.com/docs/messaging/guides/webhook-request)

## Send the case-status RCS live

A sender under review can send to a phone invited as a tester after its owner accepts **Make me a tester**. This is for testing, not production approval. A real handset shows the sender profile configured in Console; the illustrated Twilio Bank profile is fictional. [RCS onboarding and invitation](https://www.twilio.com/docs/rcs/onboarding) · [API-sent rich-card tester tutorial](https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio)

The sender's logo and banner files are in `public/`:

- [Sender logo](public/rcs-sender-logo.png): 224 × 224 pixels.
- [Sender banner](public/rcs-sender-banner.png): 1440 × 448 pixels.
- [Case-status card art](public/rcs-case-update-card.png): used by the new Content Template.

Twilio requires public URLs for sender imagery; the banner appears on Android. The card's **View case** URL also needs to point to a publicly accessible site. [RCS public details](https://www.twilio.com/docs/rcs/onboarding) · [Card URL action](https://www.twilio.com/docs/content/twiliocard)

1. Host the logo and banner at public HTTPS URLs. The deployed app serves them at `/rcs-sender-logo.png` and `/rcs-sender-banner.png`; Twilio [Public Assets](https://www.twilio.com/docs/serverless/functions-assets/assets) are another option. In a paid Twilio account, create or open the RCS Sender, invite the test phone, accept the invitation, and assign the Sender to a Messaging Service. Before production approval, use a business identity and assets that can pass review. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [US guidelines](https://www.twilio.com/en-us/guidelines/us/rcs)
2. In local `.env`, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `DEMO_TO_NUMBER` (accepted tester in E.164), `TWILIO_MESSAGING_SERVICE_SID`, and `PUBLIC_BASE_URL` to the **deployed** app's public HTTPS origin while running the helper. The helper derives the card image and case URL from that origin. Deploy the updated app before creating the template so `/rcs-case-update-card.png` is reachable. For a later local voice rehearsal, change `PUBLIC_BASE_URL` to your HTTPS tunnel origin as described above. [RCS rich-content send](https://www.twilio.com/docs/rcs/send-an-rcs-message#send-an-rcs-message-that-contains-rich-content) · [Card URL requirements](https://www.twilio.com/docs/content/twiliocard)
3. Run the helper and copy its **new** `HX...` SID into `TWILIO_RCS_CASE_CONTENT_SID`, then restart the app or update the hosted setting:

       npm run create:rcs-template

   The old `TWILIO_RCS_CONTENT_SID` belongs to the previous **fraud-question** card with Yes/No replies. **Do not reuse it** for this case-status story. The helper creates the new **Fraud report received** card and does not send a message. It includes a **View case** URL action to `/bank?case=1` on `PUBLIC_BASE_URL` and a `twilio/text` version for SMS/MMS fallback. [Content API](https://www.twilio.com/docs/content/content-api-resources) · [Card URL action](https://www.twilio.com/docs/content/twiliocard)
4. After the number-only SMS is ignored, click **Send live RCS**. Check your accepted tester phone, then click **Refresh live statuses**. API acceptance alone does not confirm delivery. The RCS request omits a specific `From` number, letting the Messaging Service attempt RCS and use an SMS/MMS-capable sender when necessary. [RCS send and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource)
5. If RCS arrives, open the illustrated sender profile and return to chat. Tap **View case** on the real phone; it should open the hosted demo website. Then click **View case status** in Presenter (or **Open fictional case page** in full controls) to advance the **shared audience view**. If the request falls back to SMS/MMS, the illustration first shows a number-only text; use **Show intended RCS example** to compare the simulated rich path, then advance the fictional case page in Presenter. The live channel status stays marked as fallback. A URL click is not an inbound reply or webhook event in this app. [Card URL action](https://www.twilio.com/docs/content/twiliocard)

If the live request falls back to SMS/MMS, say so. The phone's delivered text is then not branded RCS. The earlier SMS and later RCS are **two deliberate sends**; fallback is a third, automatic channel behavior within the RCS request. [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)

## Architecture, Apple Messages for Business, and questions

On **Show architecture**, trace the general pattern: application event → channel choice → registered sender identity → customer action. Voice resolves the urgent fraud question; the later RCS card helps Anthony open the case update. Click a channel lane to open its dedicated setup page. The voice strip opens SHAKEN/STIR, CNAM, and Voice Integrity guides. **Show setup guide** opens the index of all five. Each detail page has **Back to architecture** and a Console screenshot slot; [these capture instructions](docs/ARCHITECTURE_SCREENSHOTS.md) list where to get each image. [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [RCS](https://www.twilio.com/docs/rcs) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

Apple Messages for Business is outside this sample app. If a separate internal beta demo is ready, use it briefly. Otherwise, show [Twilio's private-beta product page and request form](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business). Its current page describes branded customer conversations and outbound transactional templates; avoid promising an immediate self-service Console signup. [Private beta announcement](https://www.twilio.com/en-us/changelog/amb-private-beta)

For an optional question about shared context: this app keeps its own voice decision and case state. Twilio's [Conversation Orchestrator](https://www.twilio.com/docs/conversations/orchestrator) can capture RCS and Voice channels, while [Conversation Memory](https://www.twilio.com/docs/conversations/memory) and [Twilio Agent Connect](https://www.twilio.com/docs/conversations/agent-connect/overview) provide a broader architecture for cross-channel agents. Those are possible extensions, not components of this demo. Do not imply that clicking **View case** automatically creates a shared Conversation. [Supported Orchestrator channels](https://www.twilio.com/docs/conversations/orchestrator/concepts/channels)

## Operation

- The fixed `DEMO_TO_NUMBER` is the only destination for real SMS, RCS, and calls; the presenter page cannot change it.
- The site and signed ConversationRelay WebSocket share one server and port. Local preview binds to `127.0.0.1`; Azure serves them through one HTTPS hostname. [ConversationRelay WebSocket setup](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
- Presenter login uses a private `PRESENTER_PASSWORD` and browser session cookie. Keep that value in local `.env` and the deployment secret store. Story state is in memory; restarting the app or **Restart story** clears it. Avoid a deployment during the live demo.
- After changes, run:

      npm run check
      npm test
