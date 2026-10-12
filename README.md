# Twilio Bank: attendee demo guide

A companion to **Beyond the 10-Digit Number: Building Branded, High-Trust Communications** for builders getting started with Twilio.

You can follow the webinar without installing anything: watch the shared bank app and phone illustration. If you are attending a hands-on workshop or want to replay the story afterward, run your own copy using the steps below.

In the story, Anthony Dellavecchia sees a $9,800.00 vehicle deposit at Midlife Crisis Motors flagged on his card ending 4829. The first call comes from an unknown number, so he misses it. Then we replay the same moment with a branded message and follow-up call.

The Twilio Bank account, merchant, charge, and illustrated phone screens are fictional. The presenter may show a separately identified real test handset.

## What you will learn

- How a Rich Communication Services (RCS) Sender gives a conversation a business identity and how a rich card can include quick replies. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio card](https://www.twilio.com/docs/content/twiliocard)
- How a Messaging Service can try RCS first and use configured SMS or MMS senders when RCS is unavailable. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)
- How an approved US Enhanced Branded Calling number can show a business name, logo, and, on supported devices, a call reason. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
- How an application can decide when to follow up after no response. In this demo, the presenter controls that decision.
- How a live follow-up call can connect to an AI agent: Twilio ConversationRelay handles speech and ElevenLabs voice output while the application supplies the conversation logic. A clear spoken answer updates this demo's bank screen. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration)

## Replay the simulation yourself

You need Node.js 22 or newer. From this project folder, run:

    cp .env.example .env
    npm install
    npm run dev

Set your own private `PRESENTER_PASSWORD` in `.env` before starting the server. Open the **Presenter** URL printed in the terminal, enter that password, then click **Open audience window** to see the customer view. Keep the presenter window private if you share your screen. No Twilio credentials are needed for the preview; **Show RCS preview** and **Show call preview** do not send anything.

## Follow the story

1. **Flag purchase.** See Anthony’s $9,800.00 vehicle deposit in the banking app.
2. **Show unknown call → Anthony ignores it.** The important alert becomes a missed call.
3. **Rewind → Show RCS preview.** A branded card supplies context and reply choices. [Twilio card](https://www.twilio.com/docs/content/twiliocard)
4. **Mark no response → Show call preview.** The illustrated Android 14+ phone shows the registered caller name **Twilio**, logo, and an **example** “Card security alert” reason. Compare the iPhone illustration for name and logo only. The actual approved call reason has not been verified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
5. **Choose “No, not mine” or “Yes, I made it.”** The presenter choice simulates Anthony’s answer. The bank screen shows the decision and whether further fraud review is needed. In a live call, a clear spoken answer updates the screen automatically. [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)
6. **Show architecture → Show technical notes (optional).** These presenter controls switch the same audience window from the bank app to the trust overview and then the implementation details. **Show bank app** returns to Anthony’s account.

## Read the architecture

The **Architecture** slide shows a reusable pattern in one view: an application event leads to a branded message, a branded call, or both, then the customer decides whether to engage. Twilio can try RCS first and use a configured SMS/MMS fallback. ConversationRelay connects an answered call to your WebSocket app, which uses your choice of agent or model. Use **Show technical notes** in the presenter controls, or the link in the slide header, for the full ConversationRelay diagram, registration, illustrative payloads, and an optional path to [Twilio Conversations](https://www.twilio.com/docs/conversations) and [Twilio Agent Connect](https://www.twilio.com/docs/conversations/agent-connect/overview). [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

This demo uses a Content Template for its RCS branch. Its current live voice adapter uses a configured OpenAI model for replies and ElevenLabs for speech; a clear yes or no updates the fictional dashboard, never a real card or bank system. [Twilio card](https://www.twilio.com/docs/content/twiliocard) · [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)

To configure real sends, rehearse device behavior, or operate the webinar, see the [presenter guide](PRESENTER.md).

## Hosting a webinar copy

Presenters can host the app on Azure Container Apps so the site and live ConversationRelay endpoint share one HTTPS hostname. See the [deployment guide](docs/DEPLOYMENT.md), [one-time Azure setup](docs/INFRA_SETUP.md), and [CI checks](docs/CICD.md). Keep the presenter controls private and share only the audience window. [Azure WebSocket ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview) · [Twilio ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
