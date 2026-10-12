# Presenter guide

This guide covers webinar controls and optional live Twilio tests. Attendees can start with the [demo guide](README.md).

## Start and share

Install dependencies once, then run the local server:

    npm install
    npm run dev

Use this command so Node loads the values in `.env`. Starting `node server/index.mjs` directly leaves the live RCS and call buttons unavailable unless those values are already in the shell environment.

Open the **Presenter** URL printed in the terminal. For the [hosted webinar app](docs/DEPLOYMENT.md), open `https://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/presenter#token=<PRESENTER_TOKEN>` using the token saved privately in `.env` and Azure. Keep that tab private. Click **Open audience window** and share only that window. The audience starts at /bank; **Show architecture** changes the same shared window to /architecture. The prominent next step ends at **Story complete**. Use **Restart story** in the current step box to begin again at any point; this clears the story and returns the audience to the bank view, but does not cancel a message or call already placed.

At step **05/09**, the current step box turns green before **Send live RCS**; at **07/09**, it does the same before **Place live AI call** when its configuration is complete. Those green **Real phone** buttons unlock only at their matching step. The detailed runbook labels future live buttons with their unlock step. After an accepted live request, the cue changes to **Check your phone now**. Preview buttons change only the illustrated phone. API acceptance does not guarantee handset delivery or a human answer. [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource) · [Call statuses](https://www.twilio.com/docs/voice/api/call-resource)

The banking app and iPhone/Android phone illustrations are simulations. If you also share your own handset, identify it as the live device. The demo never captures your phone.

## Run of show

| Action | What to narrate |
| --- | --- |
| Flag purchase | Anthony Dellavecchia sees a $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829. |
| Show unknown call → Anthony ignores it | An unrecognized number can cause a time-sensitive alert to be missed. |
| Rewind | Same transaction, different contact experience. |
| Show RCS preview, or Send live rich RCS | The RCS Sender provides the brand identity; the rich card adds transaction context and reply choices. The on-screen phone remains an illustration. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio card](https://www.twilio.com/docs/content/twiliocard) |
| Mark no response | This is a presenter-selected state. An application would make its own escalation decision. |
| Show call preview, or Place live AI call | The registered caller display name is **Twilio**. The Android 14+ illustration shows name, logo, and an **example** call reason. The live call connects to a conversational AI agent using Twilio ConversationRelay and ElevenLabs speech. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| Compare iPhone display (optional) | The supported iPhone illustration shows name and logo, without a call reason. The actual approved call reason for this bundle is unverified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| Mark customer reached → Show architecture | Reveal the RCS-first route, text fallback, application-controlled voice step, and event log. [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Calls API](https://www.twilio.com/docs/voice/api/call-resource) |

The Twilio Bank account, merchant, charge, and illustrated phone screens are fictional. Anthony Dellavecchia is the named customer character in the story. **Show RCS preview** and **Show call preview** never contact a phone.

## Optional: send a real RCS test

A sender that is still under review can send to a device invited as a tester after the device owner accepts **Make me a tester**. Twilio documents the [RCS onboarding and invitation flow](https://www.twilio.com/docs/rcs/onboarding) and a [rich-card tester walkthrough](https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio). Use your own RCS-capable tester device. Real sender branding follows its Console profile and may differ from the fictional Twilio Bank illustration.

For the fictional Twilio Bank sender profile in this webinar, the images are ready to host:

- [Sender logo PNG](public/rcs-sender-logo.png): 224 × 224 pixels.
- [Sender banner PNG](public/rcs-sender-banner.png): 1440 × 448 pixels.

The square logo uses the Twilio Bug; the banner is branded for the fictional Twilio Bank. The editable SVG sources are beside the PNGs. Twilio requires public image URLs for the sender profile; the logo appears in conversations and the banner appears on Android. [RCS onboarding and image requirements](https://www.twilio.com/docs/rcs/onboarding)

1. Host the sender logo and banner at public HTTPS URLs. The deployed app serves them at `/rcs-sender-logo.png` and `/rcs-sender-banner.png` on its public hostname; Twilio **Public Assets** are another option. In a paid Twilio account, create an RCS Sender test profile using those URLs. Invite your phone as a test device, accept the invitation on that phone, and add the sender to a Messaging Service. Before submitting a sender for production approval, use business details and brand assets that can be verified; carriers review the public display name and logo. [Public Assets](https://www.twilio.com/docs/serverless/functions-assets/assets) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [US RCS guidelines](https://www.twilio.com/en-us/guidelines/us/rcs)
2. Copy .env.example to .env. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DEMO_TO_NUMBER (your accepted tester in E.164), and TWILIO_MESSAGING_SERVICE_SID.
3. Set TWILIO_RCS_CONTENT_SID to an existing HX Content Template SID with a rich card. To create the sample for this story, use the hosted `/rcs-alert-card.png` URL or upload [the card image](public/rcs-alert-card.png) as a Twilio **Public Asset**. Put that public HTTPS URL in TWILIO_RCS_MEDIA_URL, run the command below, and copy the returned HX SID into .env. The helper creates a template; it does not send a message. [Public Assets](https://www.twilio.com/docs/serverless/functions-assets/assets) · [Content API](https://www.twilio.com/docs/content/content-api-resources) · [Card format](https://www.twilio.com/docs/content/twiliocard)

       npm run create:rcs-template

4. Restart the local server or update the hosted Container App settings, then click **Send live rich RCS** at the RCS step. It sends only to DEMO_TO_NUMBER. Check your actual tester phone, then click **Refresh live statuses**. API acceptance alone does not confirm delivery; Twilio says the Message resource’s From field starts with rcs: after successful RCS delivery. [RCS sending and monitoring](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource)

The sample template has a twilio/card type for RCS and a twilio/text type for fallback. Twilio can attempt RCS first and fall back to SMS or MMS when the Messaging Service has suitable senders in its pool. The architecture screen illustrates that production path. For an unapproved sender, use the accepted tester; do not count on an uninvited device to demonstrate fallback. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)

The app does not receive inbound message webhooks. Tapping a quick reply on a real phone does not advance the bank story; use the presenter controls for the narrative. Handling replies would require an inbound [Messaging webhook](https://www.twilio.com/docs/messaging/guides/webhook-request). RCS sending needs no tunnel; the logo, banner, and card image need public HTTPS URLs. The live AI call needs a public WSS endpoint, which the deployed app provides. [ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)

## Optional: place a real branded AI call

The live call now uses an AI agent. Twilio ConversationRelay transcribes your speech, sends text to this application's WebSocket, and speaks its replies through ElevenLabs. The app uses OpenAI to generate answers, so it needs an OpenAI API key. A separate ElevenLabs API key is not used because the voice is selected in ConversationRelay. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration) · [Twilio's OpenAI integration walkthrough](https://www.twilio.com/en-us/blog/developers/tutorials/product/integrate-openai-twilio-voice-using-conversationrelay)

1. In Twilio Console, accept the **Predictive and Generative AI/ML Features Addendum** for Voice. [Onboarding guide](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
2. Set `TWILIO_VOICE_FROM` in `.env` to the number assigned to your approved US Enhanced Branded Calling bundle. Keep `DEMO_TO_NUMBER` as your own test phone. Set `OPENAI_API_KEY` to your API key. `OPENAI_MODEL` defaults to `gpt-4o-mini`. To select and tune an ElevenLabs voice, copy its ID and optional model/speed settings from [Twilio's voice guide](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration) into `TWILIO_ELEVENLABS_VOICE_ID`; otherwise the app uses Twilio's documented US English default.
3. On Azure, the public voice endpoint is `wss://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/voice-relay`. The app derives it from `PUBLIC_BASE_URL`; no tunnel or separate voice port is needed. For a local end-to-end rehearsal, tunnel the **same app port** with `ngrok http 3000`, set `PUBLIC_BASE_URL` to the tunnel's HTTPS origin in `.env`, and leave `TWILIO_CONVERSATION_RELAY_URL` blank so the matching WSS URL is derived. [ConversationRelay URL requirement and signature validation](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
4. Open the private Presenter URL. At step **07/09**, click **Place live AI call**, then answer your phone. The Twilio Bank virtual assistant asks whether Anthony made the vehicle deposit. Try responding **“No, I didn't. What happens next?”** and ask one follow-up question. ConversationRelay passes each spoken turn to the app and speaks the AI's reply. Tell the webinar audience that Twilio Bank is fictional before this scene. [WebSocket message flow](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)

Your approved display name is **Twilio**, not Twilio Bank. Your test phone displayed **Twilio Inc**; carrier and device presentation can vary. Twilio’s [US Enhanced guide](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) lists Samsung support at Android 14 or later. Your Samsung Android 13 is outside that documented range, so a missing logo or call reason is plausible. Twilio lists name, logo, and call reason for supported Android devices; its listed iPhone entries have name and logo. “Card security alert” is an **illustrative** reason in the Android 14+ phone simulation; this application does not set a call reason in the outbound API request. [US Enhanced guide and device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Use **Mark customer reached** only when that fits the story. A completed Call resource status can include voicemail or an IVR, so the API result alone does not establish that Anthony answered. [Call status reference](https://www.twilio.com/docs/voice/api/call-resource)

## Operation

- The site and signed WebSocket share one server and port. Local preview binds to 127.0.0.1; Azure serves them through one HTTPS hostname. Browser state contains only readiness flags and masked phone numbers. [ConversationRelay WebSocket security](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
- The fixed DEMO_TO_NUMBER is the only destination for real sends and calls; the presenter UI cannot change it.
- Azure uses a stable private `PRESENTER_TOKEN`; local preview generates one when none is configured. Story state stays in memory and resets on restart or **Restart story**. Avoid deployments during the webinar.
- Apple Messages for Business is outside this sample app while the separate webinar demo material is being prepared.
- After changes, run:

      npm run check
      npm test
