# Presenter guide

This guide covers webinar controls and optional live Twilio tests. Attendees can start with the [demo guide](README.md).

## Start and share

Install dependencies once, then run the local server:

    npm install
    npm run dev

Set `PRESENTER_PASSWORD` in your local `.env` before starting. Use this command so Node loads the values in `.env`. Starting `node server/index.mjs` directly leaves the live SMS, RCS, and call buttons unavailable unless those values are already in the shell environment.

Open the **Presenter** URL printed in the terminal and enter the password on the page. For the [hosted webinar app](docs/DEPLOYMENT.md), open `https://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/presenter`. Keep that tab private. Click **Open audience window** and share only that window. After Anthony’s answer is recorded, the current step offers **Show architecture**, then **Show technical notes**. Both switch the same shared window; **Show bank app** returns to Anthony’s account. Use **Restart story** in the current step box to begin again at any point; this clears the story and returns the audience to the bank view, but does not cancel a message or call already placed.

At steps **04/10**, **06/10**, and **08/10**, the current step box turns green before a configured **Send live SMS**, **Send live RCS**, or **Place live AI call** action, respectively. The green **Real phone** buttons unlock only at their matching step. After an accepted live request, the cue changes to **Check your phone now**. Preview buttons change only the illustrated phone. API acceptance does not guarantee handset delivery or a human answer. [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource) · [Call statuses](https://www.twilio.com/docs/voice/api/call-resource)

The banking app and iPhone/Android phone illustrations are simulations. If you also share your own handset, identify it as the live device. The demo never captures your phone.

## 30-minute agenda

| Time | Topic | What to show |
| --- | --- | --- |
| 0:00–2:00 | Hook | Introduce Anthony and the flagged $9,800.00 vehicle deposit. |
| 2:00–7:00 | Unknown contact | Show the ignored unknown call, then send the number-based SMS to your test phone (or preview it). Anthony doubts the claim of Twilio Bank and does not act. |
| 7:00–9:00 | Identity changes the contact | Explain the RCS sender profile and approved Branded Calling registration. [RCS](https://www.twilio.com/docs/rcs) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| 9:00–14:00 | Rich messaging | Send or preview the branded RCS alert; Anthony happens to miss it. Briefly compare [Apple Messages for Business](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business) and explain that RCS can [fall back to SMS/MMS](https://www.twilio.com/docs/rcs/send-an-rcs-message) when unavailable. |
| 14:00–21:00 | Branded AI call | Place or preview the call. Anthony says he does not recognize the charge; the fictional bank screen records the answer. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| 21:00–26:00 | Architecture | Show the generic path from application decision to recognizable message or call and customer engagement. |
| 26:00–29:00 | Technical notes | Highlight the SMS and RCS requests, the Calls API, and ConversationRelay’s speech path to your agent. [Messaging Services](https://www.twilio.com/docs/messaging/services) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| 29:00–30:00 | Close | Recap identity, context, and fallback; hand off to questions. |

## Run of show

| Action | What to narrate |
| --- | --- |
| Flag purchase | The bank flags a $9,800.00 vehicle deposit at Midlife Crisis Motors on Anthony Dellavecchia’s card ending 4829. The audience sees the app before Anthony opens it. |
| Show unknown call → Anthony ignores it | An unrecognized number can cause a time-sensitive alert to be missed. |
| Send live SMS, or Show SMS preview | The number-based text claims to be from Twilio Bank, but the sender display does not verify that identity. Show the real test phone if you sent live; the illustrated phone remains a simulation. This is a deliberate first SMS, separate from a later RCS fallback. [RCS and SMS comparison](https://www.twilio.com/docs/rcs) · [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services) |
| Anthony ignores SMS | Anthony doubts the claim in a text from an unfamiliar number, so the charge remains unresolved. |
| Show RCS preview, or Send live rich RCS | The RCS Sender provides the brand identity; the rich card adds transaction context and reply choices. The on-screen phone remains an illustration. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio card](https://www.twilio.com/docs/content/twiliocard) |
| Open simulated RCS sender profile → Back to chat | Click the Twilio Bank logo or name at the top of the illustrated Android chat. Point out the banner, logo, display name, description, phone, website, and email on **Info**. Open **Options** for Privacy Policy and Terms of Service, then use the back button to return to the chat. These Twilio Bank values are fictional; a real sender's public details come from its Twilio Console registration. Twilio lists the banner and accent color for Android only. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio sender preview](https://www.twilio.com/en-us/blog/get-started-rcs-twilio) |
| Mark RCS missed | This time the sender is recognizable, but Anthony happens to miss the message. This is a presenter-selected state; an application would decide when to follow up. |
| Show call preview, or Place live AI call | The registered caller display name is **Twilio**. The Android 14+ illustration shows name, logo, and an **example** call reason. The live call connects to a conversational AI agent using Twilio ConversationRelay and ElevenLabs speech. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| Compare iPhone display (optional) | The supported iPhone illustration shows name and logo, without a call reason. The actual approved call reason for this bundle is unverified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| Say “No, I do not recognize that charge” on the live call | The application records the spoken answer and updates the bank screen automatically. The green check means a response was recorded; the red answer panel shows that fraud review is still needed. No real card or bank system is changed. ConversationRelay passes the caller’s speech to the app. [WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) |
| For a preview or backup, choose **Yes, I made it** or **No, not mine** | These presenter buttons set a **simulated** answer. Use them only when you are previewing, or if the live call did not record a clear response. |
| Show architecture | Use the one-slide view to connect the app decision, the RCS message or branded call, and the customer's choice to engage. The lines below show SMS/MMS fallback and the answered-call path. [RCS](https://www.twilio.com/docs/rcs) · [Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |
| Show technical notes (optional) | The same audience window opens the detailed ConversationRelay diagram, identity setup, and example requests. Use only the sections that fit the remaining time. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) |

The Twilio Bank account, merchant, charge, and illustrated phone screens are fictional. Anthony Dellavecchia is the named customer character in the story. **Show SMS preview**, **Show RCS preview**, and **Show call preview** never contact a phone.

For an optional closing point, the [Twilio Conversations layer](https://www.twilio.com/docs/conversations) can carry context beyond this first contact. [Twilio Agent Connect](https://www.twilio.com/docs/conversations/agent-connect/overview) is an SDK for connecting your own agent to channels and Conversations services; [Conversation Orchestrator](https://www.twilio.com/docs/conversations/orchestrator) and [Conversation Memory](https://www.twilio.com/docs/conversations/memory) add cross-channel history and context. The webinar demo uses its own WebSocket app directly with ConversationRelay, so describe these as an extension. Twilio states Agent Connect, Orchestrator, and Memory are not PCI compliant; do not present them as a way to process payment card data. [TAC](https://www.twilio.com/docs/conversations/agent-connect) · [Orchestrator](https://www.twilio.com/docs/conversations/orchestrator) · [Memory](https://www.twilio.com/docs/conversations/memory)

### If asked: Can the RCS tester and branded call share context?

Yes, with additional setup. Twilio's newer [Conversation Orchestrator supports RCS and Voice](https://www.twilio.com/docs/conversations/orchestrator/concepts/channels). Send the RCS template from this app to an [invited tester](https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio), add [RCS capture rules for that sender](https://www.twilio.com/docs/api/conversations/v2/configuration/fetch-configuration), and use a Conversation configuration linked to a Memory Store with `GROUP_BY_PROFILE`. Resolve the tester's phone to a [customer profile](https://www.twilio.com/docs/conversations/memory/identity-resolution), then attach the outbound call using `<ConversationRelay conversationConfiguration="...">` or `conversationId`. The [default grouping keeps channels separate](https://www.twilio.com/docs/conversations/orchestrator/concepts/core); [Twilio's active Voice guide](https://www.twilio.com/docs/conversations/orchestrator/guides/active-creation) shows the Relay attributes. This app currently uses neither Orchestrator nor Memory.

For a live RCS-to-call handoff, have the agent read the current conversation or pass the alert details from your app. Orchestrator [captures RCS text but not rich-card media](https://www.twilio.com/docs/conversations/orchestrator/concepts/channels), and [automatic Memory observations are extracted only after the conversation becomes inactive or closes](https://www.twilio.com/docs/conversations/orchestrator/concepts/profiles). I could not verify whether a send from the Console's RCS **Test** tab is captured by Orchestrator; use this app's API send and verify that its Message SID appears in the [conversation's Communications](https://www.twilio.com/docs/api/conversations/v2/communication/list-communication-by-conversation) before showing shared history live. For this ConversationRelay path, [avoid a passive Voice capture rule on the same call to prevent duplicate speech-to-text billing](https://www.twilio.com/docs/conversations/orchestrator/concepts/channels).

Shared history does not make the current RCS branch conversational by itself. To handle replies with an agent, add an [inbound messaging webhook](https://www.twilio.com/docs/messaging/guides/webhook-request) or a [Twilio Agent Connect RCS channel](https://www.twilio.com/docs/conversations/agent-connect/channels).

## Send the first SMS live

The available toll-free number is verified, with **marketing** listed as its messaging use case. For this webinar demo, the live SMS goes only to your fixed test phone. This does not change the number's registration. Before using the number for production fraud alerts, update its registered use case; Twilio's guide says an approved verification must be deleted and resubmitted when its messaging use case changes. The Branded Calling registration covers voice identity separately. [Twilio toll-free verification](https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Set `TWILIO_SMS_FROM` in local `.env` to your verified toll-free number and add that number to the sender pool of `TWILIO_MESSAGING_SERVICE_SID`. Keep `DEMO_TO_NUMBER` set to your own phone. The app specifies both the Messaging Service and that `From` number for this deliberate SMS, so it does not select the RCS sender; the later RCS request omits `From` and can use automatic SMS/MMS fallback. [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services) · [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)

At step **04/10**, click **Send live SMS**. The fixed demo text says, “Twilio Bank: Did you make a $9,800.00 charge at Midlife Crisis Motors? Open your banking app to review it.” On the real handset, point out the number-based sender display: the text claims a bank identity, but it does not provide a verified RCS profile. Then use the presenter action to have Anthony ignore it. If the SMS configuration is unavailable, use **Show SMS preview**; that changes only the illustrated phone. The app does not process inbound SMS replies. [RCS sender identity](https://www.twilio.com/docs/rcs) · [Messaging webhooks](https://www.twilio.com/docs/messaging/guides/webhook-request)

**Refresh live statuses** tracks the SMS separately from the later RCS message. API acceptance and handset delivery are different states. For the hosted app, set `TWILIO_SMS_FROM` on the Container App as described in [live demo settings](docs/INFRA_SETUP.md#live-demo-settings). [Message status reference](https://www.twilio.com/docs/messaging/api/message-resource)

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

4. Restart the local server or update the hosted Container App settings, then click **Send live rich RCS** at step **06/10**. It sends only to DEMO_TO_NUMBER. Check your actual tester phone, then click **Refresh live statuses**. API acceptance alone does not confirm delivery; Twilio says the Message resource’s From field starts with rcs: after successful RCS delivery. [RCS sending and monitoring](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource)

The sample template has a twilio/card type for RCS and a twilio/text type for fallback. Twilio can attempt RCS first and fall back to SMS or MMS when the Messaging Service has suitable senders in its pool. That fallback is separate from the earlier, deliberate SMS send. The architecture screen illustrates the production fallback path. For an unapproved sender, use the accepted tester; do not count on an uninvited device to demonstrate fallback. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)

The app does not receive inbound message webhooks. Tapping a quick reply on a real phone does not advance the bank story; use the presenter controls for the narrative. Handling replies would require an inbound [Messaging webhook](https://www.twilio.com/docs/messaging/guides/webhook-request). RCS sending needs no tunnel; the logo, banner, and card image need public HTTPS URLs. The live AI call needs a public WSS endpoint, which the deployed app provides. [ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)

## Optional: place a real branded AI call

The live call now uses an AI agent. Twilio ConversationRelay transcribes your speech, sends text to this application's WebSocket, and speaks its replies through ElevenLabs. The app uses OpenAI to generate answers, so it needs an OpenAI API key. A separate ElevenLabs API key is not used because the voice is selected in ConversationRelay. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration) · [Twilio's OpenAI integration walkthrough](https://www.twilio.com/en-us/blog/developers/tutorials/product/integrate-openai-twilio-voice-using-conversationrelay)

1. In Twilio Console, accept the **Predictive and Generative AI/ML Features Addendum** for Voice. [Onboarding guide](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
2. Set `TWILIO_VOICE_FROM` in `.env` to the number assigned to your approved US Enhanced Branded Calling bundle. Keep `DEMO_TO_NUMBER` as your own test phone. Set `OPENAI_API_KEY` to your API key. `OPENAI_MODEL` defaults to `gpt-4o-mini`. To select and tune an ElevenLabs voice, copy its ID and optional model/speed settings from [Twilio's voice guide](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration) into `TWILIO_ELEVENLABS_VOICE_ID`; otherwise the app uses Twilio's documented US English default.
3. On Azure, the public voice endpoint is `wss://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io/voice-relay`. The app derives it from `PUBLIC_BASE_URL`; no tunnel or separate voice port is needed. For a local end-to-end rehearsal, tunnel the **same app port** with `ngrok http 3000`, set `PUBLIC_BASE_URL` to the tunnel's HTTPS origin in `.env`, and leave `TWILIO_CONVERSATION_RELAY_URL` blank so the matching WSS URL is derived. [ConversationRelay URL requirement and signature validation](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
4. Open the private Presenter URL. At step **08/10**, click **Place live AI call**, then answer your phone. The Twilio Bank virtual assistant asks whether Anthony made the vehicle deposit. Say exactly **“No, I do not recognize that charge.”** Leave the bank audience window visible: its response banner should update automatically during the call. Then ask one follow-up question to show that the AI agent can converse. ConversationRelay passes each spoken turn to the app and speaks the AI's reply. Tell the webinar audience that Twilio Bank is fictional before this scene. [WebSocket message flow](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)

Your approved display name is **Twilio**, not Twilio Bank. Your test phone displayed **Twilio Inc**; carrier and device presentation can vary. Twilio’s [US Enhanced guide](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) lists Samsung support at Android 14 or later. Your Samsung Android 13 is outside that documented range, so a missing logo or call reason is plausible. Twilio lists name, logo, and call reason for supported Android devices; its listed iPhone entries have name and logo. “Card security alert” is an **illustrative** reason in the Android 14+ phone simulation; this application does not set a call reason in the outbound API request. [US Enhanced guide and device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

The live call’s clear yes or no should set the outcome without a presenter click. **Yes, I made it** and **No, not mine** in Presenter controls are backup/preview actions; using one labels the result as a simulation. If Anthony says the charge is not his, the bank screen shows that further fraud review is needed. The green check means an answer was recorded, not that a real bank resolved the alert. A completed Call resource status alone does not establish what a person said. [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) · [Call status reference](https://www.twilio.com/docs/voice/api/call-resource)

## Operation

- The site and signed WebSocket share one server and port. Local preview binds to 127.0.0.1; Azure serves them through one HTTPS hostname. Browser state omits credentials and masks the test recipient and caller numbers; it includes the SMS sender number so the simulated text matches the configured sender. [ConversationRelay WebSocket security](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
- The fixed DEMO_TO_NUMBER is the only destination for real SMS, RCS, and calls; the presenter UI cannot change it.
- Presenter login uses a private `PRESENTER_PASSWORD` and a browser session cookie. Local preview loads the password from `.env`; Azure reads it from a Container Apps secret. Story state stays in memory and resets on restart or **Restart story**. Avoid deployments during the webinar.
- Apple Messages for Business is outside this sample app while the separate webinar demo material is being prepared.
- After changes, run:

      npm run check
      npm test
