# Twilio Bank: attendee demo guide

A companion to **Beyond the 10-Digit Number: Building Branded, High-Trust Communications** for builders getting started with Twilio.

You can follow the webinar without installing anything: watch the shared bank app and phone illustration. If you are attending a hands-on workshop or want to replay the story afterward, run your own copy using the steps below.

In the story, Twilio Bank flags a $9,800.00 vehicle deposit at Midlife Crisis Motors on Anthony Dellavecchia’s card ending 4829. Anthony doubts a text that claims to be from his bank but arrives from a number. A branded RCS alert follows, but he is away from his phone and does not see it. An unknown call brings him back to his phone; he sees the unfamiliar number and does not answer. A branded call finally gets his answer.

The Twilio Bank account, merchant, charge, and illustrated phone screens are fictional. The presenter may show a separately identified real test handset.

## What you will learn

- How a Rich Communication Services (RCS) Sender gives a conversation a business identity and how a rich card can include quick replies. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio card](https://www.twilio.com/docs/content/twiliocard)
- Why a number-based SMS and a verified RCS Sender can feel different to a customer. The initial SMS in this story is a separate application send, distinct from automatic RCS fallback. [RCS and SMS sender comparison](https://www.twilio.com/docs/rcs) · [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services)
- How a Messaging Service can try RCS first and use configured SMS or MMS senders when RCS is unavailable. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)
- How an approved US Enhanced Branded Calling number can show a business name, logo, and, on supported devices, a call reason. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
- How an application can decide when to follow up after no response. In this demo, the presenter controls that decision.
- How a live follow-up call can connect to an AI agent: Twilio ConversationRelay handles speech and ElevenLabs voice output while the application supplies the conversation logic. A clear spoken answer updates this demo's bank screen. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration)

## Replay the simulation yourself

You need Node.js 22 or newer. From this project folder, run:

    cp .env.example .env
    npm install
    npm run dev

Set your own private `PRESENTER_PASSWORD` in `.env` before starting the server. Open the **Presenter** URL printed in the terminal, enter that password, then click **Open audience window** to see the customer view. Keep the presenter window private if you share your screen. No Twilio credentials are needed for the preview; **Show SMS preview**, **Show RCS preview**, and **Show call preview** do not send anything.

## Follow the story

1. **Flag purchase.** See the $9,800.00 vehicle deposit on Anthony’s card in the banking app.
2. **Send live SMS (or show the preview) → Anthony ignores it.** The text claims to be from Twilio Bank, but its sender is only a number. Anthony cannot tell from that sender display who sent it. The live action sends to the presenter's fixed test phone when configured. [RCS and SMS sender comparison](https://www.twilio.com/docs/rcs) · [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource)
3. **Send live RCS (or show the preview) → open the sender profile → back to chat → Mark RCS missed.** Click the Twilio Bank logo or name at the top of the simulated Android chat. The **Info** tab shows its banner, logo, name, description, phone number, website, and email; **Options** shows Privacy Policy and Terms of Service. Use the back button to return to the message. The Twilio Bank details are fictional illustrations. A real sender displays the public details registered in Twilio Console; Twilio lists the banner and accent color for Android only. This audience view illustrates the message; Anthony is away from his phone and does not see it. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio sender preview](https://www.twilio.com/en-us/blog/get-started-rcs-twilio) · [Twilio card](https://www.twilio.com/docs/content/twiliocard)
4. **Show unknown call → Anthony ignores it.** The simulated ring draws him back to his phone. He notices the unfamiliar number and lets the call go unanswered. No real call is placed at this step.
5. **Place the live branded call (or show the preview).** The illustrated Android 14+ phone shows the registered caller name **Twilio**, logo, and an **example** “Card security alert” reason. Compare the iPhone illustration for name and logo only. The actual approved call reason has not been verified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
6. **Choose “No, not mine” or “Yes, I made it.”** The presenter choice simulates Anthony’s answer. The bank screen shows the decision and whether further fraud review is needed. In a live call, a clear spoken answer updates the screen automatically. [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)
7. **Show architecture → Show technical notes (optional).** These presenter controls switch the same audience window from the bank app to the trust overview and then the implementation details. **Show bank app** returns to Anthony’s account.

## Read the architecture

The **Architecture** slide shows a reusable pattern in one view: an application event leads to a branded message, a branded call, or both, then the customer decides whether to engage. The story's first SMS is a deliberate send using a selected phone-number sender. Separately, Twilio can try RCS first and use a configured SMS/MMS fallback if RCS is unavailable. ConversationRelay connects an answered call to your WebSocket app, which uses your choice of agent or model. Use **Show technical notes** in the presenter controls, or the link in the slide header, for the full ConversationRelay diagram, registration, illustrative payloads, and an optional path to [Twilio Conversations](https://www.twilio.com/docs/conversations) and [Twilio Agent Connect](https://www.twilio.com/docs/conversations/agent-connect/overview). [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services) · [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

This demo uses a Content Template for its RCS branch. Its current live voice adapter uses a configured OpenAI model for replies and ElevenLabs for speech; a clear yes or no updates the fictional dashboard, never a real card or bank system. [Twilio card](https://www.twilio.com/docs/content/twiliocard) · [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)

To configure real sends, rehearse device behavior, or operate the webinar, see the [presenter guide](PRESENTER.md).

## Hosting a webinar copy

Presenters can host the app on Azure Container Apps so the site and live ConversationRelay endpoint share one HTTPS hostname. See the [deployment guide](docs/DEPLOYMENT.md), [one-time Azure setup](docs/INFRA_SETUP.md), and [CI checks](docs/CICD.md). Keep the presenter controls private and share only the audience window. [Azure WebSocket ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview) · [Twilio ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
