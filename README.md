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
- How a live follow-up call can connect to an AI agent: Twilio ConversationRelay handles speech and ElevenLabs voice output while the application supplies the conversation logic. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration)

## Replay the simulation yourself

You need Node.js 22 or newer. From this project folder, run:

    npm install
    npm run dev

Open the private **Presenter** URL printed in the terminal, then click **Open audience window** to see the customer view. Keep the presenter window private if you share your screen. No Twilio credentials are needed for the preview; **Show RCS preview** and **Show call preview** do not send anything.

## Follow the story

1. **Flag purchase.** See Anthony’s $9,800.00 vehicle deposit in the banking app.
2. **Show unknown call → Anthony ignores it.** The important alert becomes a missed call.
3. **Rewind → Show RCS preview.** A branded card supplies context and reply choices. [Twilio card](https://www.twilio.com/docs/content/twiliocard)
4. **Mark no response → Show call preview.** The illustrated Android 14+ phone shows the registered caller name **Twilio**, logo, and an **example** “Card security alert” reason. Compare the iPhone illustration for name and logo only. The actual approved call reason has not been verified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
5. **Mark customer reached → Show architecture.** See the channel routing and a labeled event log.

## Read the architecture

The RCS branch uses a Messaging Service and a Content Template. With both RCS and SMS/MMS senders in its pool, Twilio can attempt RCS first and fall back to a supported text channel. The follow-up call is a separate decision made by the application. For a live call, the Calls API connects to ConversationRelay; the app sends each caller turn to an LLM and returns the response for ElevenLabs speech. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Calls API](https://www.twilio.com/docs/voice/api/call-resource) · [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)

To configure real sends, rehearse device behavior, or operate the webinar, see the [presenter guide](PRESENTER.md).
