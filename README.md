# Twilio Bank: attendee demo guide

A companion to **Beyond the 10-Digit Number: Building Branded, High-Trust Communications** for builders getting started with Twilio.

You can follow the webinar without installing anything: watch the shared bank app and phone illustration. If you want to replay the story afterward, run your own copy using the steps below.

## The story

Twilio Bank is a **fictional** bank. Anthony Dellavecchia sees a $9,800.00 vehicle deposit at Midlife Crisis Motors on his card ending 4829. An unknown-number call goes unanswered. A call from a number registered for Enhanced Branded Calling reaches him, and he says the charge is **not** his. The bank app records a fictional fraud report. Later, Anthony skips a number-only SMS about the case, then opens the case from a branded RCS message with a **View case** button.

The bank website, merchant, charge, case, and illustrated phone screens are simulations. The presenter may show a separately identified **real test handset**. The actual approved live caller name is **Twilio**, which may display as “Twilio Inc,” while the simulated bank is called Twilio Bank. The case is only a demo record; no real card or bank account changes.

## What you will learn

- How an approved US Enhanced Branded Calling number can show a business name and logo, plus a call reason on supported phones. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
- Where an approved Business Profile, SHAKEN/STIR, Voice Integrity, and CNAM fit alongside Branded Calling. [SHAKEN/STIR](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding) · [Voice Integrity](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity) · [CNAM](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam)
- How ConversationRelay connects an answered call to an application-owned AI agent for speech input, spoken replies, and interruptions. This sample uses an OpenAI model and a voice selected through Twilio's ElevenLabs integration; the architecture can use your own agent/model. [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) · [Voice selection](https://www.twilio.com/docs/voice/conversationrelay/voice-configuration)
- How an RCS Sender supplies public business details and how a rich card can include a **URL button** that opens a case page. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Card actions](https://www.twilio.com/docs/content/twiliocard)
- How a Messaging Service can attempt RCS and use configured SMS or MMS senders if RCS is unavailable. The number-only SMS in the story is a **separate application send**, not that automatic fallback. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)
- Why Answering Machine Detection belongs **after answer** in a voice design; it does not change the incoming caller display. [AMD](https://www.twilio.com/docs/voice/answering-machine-detection)

## Replay the simulation yourself

You need Node.js 22 or newer. From this project folder, run:

    cp .env.example .env
    npm install
    npm run dev

Set your own private `PRESENTER_PASSWORD` in `.env` before starting. Open the **Presenter** URL printed in the terminal, enter that password, then click **Open audience window**. Share only the audience window. No Twilio credentials are needed for the previews; **Show SMS preview**, **Show RCS preview**, and **Show call preview** do not contact a phone.

## Follow the story

1. **Flag purchase.** See the fictional $9,800.00 deposit.
2. **Show unknown call → Anthony ignores it.** This is an illustrated phone call; no real call is placed.
3. **Place live AI agent call, or Show call preview.** The real approved number is branded as Twilio. The illustrated supported Android phone shows what a name, logo, and example call reason can look like; the actual display depends on the recipient device and carrier. [Supported-device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)
4. **Answer “No, I do not recognize that charge.”** A live spoken answer updates the demo. If you use a preview, choose **No, not mine** in Presenter. That simulated choice opens the fraud-report path. **Yes, I made it** ends the charge story without a fraud case. [ConversationRelay WebSocket messages](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages)
5. **Send live SMS, or Show SMS preview → Anthony ignores SMS.** The illustrated Messages conversation first shows the full case-status text for the audience. That preview does not mean Anthony opened it; the next step shows his unread notification. He does not act on the number-only update because there is no business profile to inspect. [RCS business messaging](https://www.twilio.com/docs/rcs)
6. **Send live RCS, or Show RCS preview → inspect the sender profile.** For RCS delivery or a preview, click the Twilio Bank logo or name atop the illustrated chat. **Info** and **Options** show the sender's public details. If the live request falls back to SMS/MMS, the illustration first shows the number-only result; click **Show intended RCS example** in Presenter to compare a clearly labeled, simulated RCS card and profile. [RCS public details](https://www.twilio.com/docs/rcs/onboarding) · [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)
7. **View case.** For RCS delivery, the card's URL button opens the hosted demo website on the real phone; the illustrated button opens a separate customer tab. In Presenter, click **View case status** (or **Open fictional case page** in the full controls) separately to advance the shared audience screen. If the live request fell back to SMS/MMS, the real phone has no RCS URL button; use the labeled illustration or advance the fictional case in Presenter. [Twilio card URL action](https://www.twilio.com/docs/content/twiliocard)
8. **Show architecture → Show setup guide.** Click the RCS or Branded Calling lane for its setup and API page; click SHAKEN/STIR, CNAM, or Voice Integrity below the diagram for those guides. Each detail page has **Back to architecture**. **Show bank app** returns to the customer view.

The **“No, not mine”** branch is the intended webinar run. Use **Restart story** in Presenter to reset at any point. Resetting the screen does not undo a real message or call.

## Read the architecture

The **Architecture** view shows a reusable pattern: the application detects an event, chooses a channel, sends from an established identity, then handles the person's action. The first SMS in the story is an explicit number-based send. The later RCS request can separately fall back to SMS/MMS where RCS is unavailable. ConversationRelay connects the answered call to the application's WebSocket and agent. [Messaging Service sender selection](https://www.twilio.com/docs/messaging/services) · [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

The **Implementation guide** has five presentation paths. Each starts with the customer benefit, then shows the Console setup and any API steps used by the demo or offered as an optional alternative. The RCS path covers sender testing, Google and US registration, a Messaging Service with RCS and SMS/MMS senders, the required Content API request for this `twilio/card`, and the Messages API send. The voice paths cover Enhanced Branded Calling, SHAKEN/STIR, CNAM, and Voice Integrity. [Twilio RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Console builder limitations](https://www.twilio.com/docs/content/create-templates-with-the-content-template-builder) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Twilio documents a private beta onboarding API for [RCS senders](https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-). [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) is generally available to direct customers and ISVs, with Console registration as the standard setup path. Its optional [Trust Hub Compliance API](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api) for automating registration is private beta. Twilio's API walkthrough focuses on ISVs, though the [registration schema](https://www.twilio.com/docs/trust-hub/trusthub-rest-api/compliance/branded-calling-registrations-resource) includes direct customers. Once a number is approved and assigned, the normal [Calls API](https://www.twilio.com/docs/voice/api/call-resource) places the branded call. Add real Console captures with the [numbered screenshot guide](docs/ARCHITECTURE_SCREENSHOTS.md); see [API example inputs](docs/ARCHITECTURE_API_INPUTS.md) for code variables.

To configure real sends and the live call, see the [presenter guide](PRESENTER.md). The full natural-language talk track is in [SCRIPT.MD](SCRIPT.MD).

## Hosting a webinar copy

Presenters can host the app on Azure Container Apps so the site and ConversationRelay endpoint share one HTTPS hostname. See the [deployment guide](docs/DEPLOYMENT.md), [one-time Azure setup](docs/INFRA_SETUP.md), and [CI checks](docs/CICD.md). Keep Presenter private and share only the audience window. [Twilio ConversationRelay onboarding](https://www.twilio.com/docs/voice/conversationrelay/onboarding)
