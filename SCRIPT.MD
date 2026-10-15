# Beyond the 10-Digit Number — webinar script

**Run time:** about 30 minutes, including Console navigation and the live call.

**Reading guide:** The blockquotes are spoken lines. Screen cues and source links are presenter notes.

**Story:** Twilio Bank, its website, the merchant, the charge, and the fraud case are fictional. The approved identity on the **real branded call** is **Twilio**, which may appear as “Twilio Inc” on the test phone. The illustrated bank and phone show what a bank with its own approved identity could build.

## Before the webinar

Keep `/presenter` in a **private window**. Share a separate window with tabs already open for `/bank`, `/architecture`, the relevant Twilio Console registrations, and the [Apple Messages for Business page](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business). The architecture lanes open setup pages with code snippets and back navigation. Mirror the test phone beside the shared bank page only for live sends and the call. The on-screen iPhone and Android illustrations are simulations; identify the mirrored handset as the live device.

Rehearse with an approved Branded Calling number and an accepted RCS tester. Preload the RCS Sender profile, Messaging Service, and **new case-status Content Template**. Configure the new `TWILIO_RCS_CASE_CONTENT_SID`; the old `TWILIO_RCS_CONTENT_SID` points to a fraud-question card and cannot be reused for this story. Twilio says RCS production onboarding can take four to six weeks or longer; Enhanced Branded Calling review can take up to seven days. Do not start either registration live. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

This run takes the **“No, not mine”** branch. A clear “Yes, I made it” is also a valid response, but that branch ends the fraud story and does not open a case for the later update. The real RCS **View case** button opens the hosted demo website; the presenter advances the shared story to **case viewed** separately.

## Run of show

| Time | Story beat | Shared screen |
| --- | --- | --- |
| 0:00–2:00 | Anthony's $9,800 charge; why trust matters | Twilio Bank app |
| 2:00–3:00 | Simulated unknown call goes unanswered | Bank app and phone illustration |
| 3:00–9:00 | Set up the voice identity: Trust Hub, SHAKEN/STIR, Voice Integrity, Enhanced Branded Calling, CNAM | Twilio Console and Branded Calling setup page |
| 9:00–13:00 | Place the live branded AI call; Anthony says the charge is not his | Live phone and bank app |
| 13:00–14:00 | Fictional bank opens a fraud report | Bank app |
| 14:00–16:00 | A number-only case-status SMS is ignored | Live phone and SMS illustration |
| 16:00–22:00 | Set up RCS identity, tester, template, and Messaging Service | Twilio Console and RCS setup page |
| 22:00–25:00 | Branded case update arrives; Anthony opens View case | Live phone, RCS profile, bank app |
| 25:00–27:00 | Explain the reusable architecture and AMD's place | Clickable architecture overview |
| 27:00–29:00 | Apple Messages for Business as another branded path | Internal beta demo or Twilio page |
| 29:00–30:00 | Recap and questions | Architecture |

## 0:00–2:00 — Start with an urgent decision

**Screen:** Share the bank app. In private Presenter, click **Flag purchase**. Pause on the $9,800 alert.

> Here we have a fictional scenario. We built a fake company called Twilio Bank and this little banking website so we can watch the customer experience as it happens. Anthony is our customer. A $9,800 vehicle deposit at Midlife Crisis Motors has just appeared on his card. Maybe he bought a car. Maybe he didn't. The bank needs to find out quickly.
>
> Imagine you're Anthony. If your phone rings from a number you don't know and somebody says they're calling from your bank about fraud, do you pick up? A lot of us wouldn't. That's the problem I want to solve today: can we make the bank recognizable before Anthony has to decide whether to trust the contact?
>
> We'll handle the urgent question by voice. Then, once we've got Anthony's answer, we'll send a less urgent case update by text and see how branding changes that experience too. I'll show the setup in Twilio Console and the API requests behind each step.

**Twilio sources:** [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [RCS business messaging](https://www.twilio.com/docs/rcs)

## 2:00–3:00 — The call Anthony does not answer

**Screen:** In Presenter, click **Show unknown call**, then **Anthony ignores it**. Say plainly that this first call is simulated; do not place a live call yet.

> First, let's try the plain version. Anthony sees an unfamiliar number. Even though this call could matter, he has no idea who is behind it, so he lets it ring.
>
> Now let's see what changes when a business has set up a caller identity. For the live test, my approved number is registered as Twilio. The bank version on this screen is our fictional example.

## 3:00–9:00 — Build a recognizable call

**Screen:** In Twilio Console, show the prepared **Trust Hub → Registrations** pages. Point to the approved Business Profile and the existing SHAKEN/STIR status for the calling number, Voice Integrity if present, then the approved Branded Calling bundle and assigned number. Open the **Branded Calling** architecture setup page for the short Calls API example. Keep the Console pages pre-open.

> There are a few layers here, and they solve different problems. We start with the business profile, where the company establishes who it is. For the number used in this demo, SHAKEN/STIR is the network authentication piece. For Twilio's highest attestation, the number belongs to an approved Business Profile and an approved SHAKEN/STIR Trust Product. Enhanced Branded Calling requires SHAKEN/STIR to be enabled. Authentication helps establish that the caller can use this number; it isn't, by itself, the logo on the screen.
>
> Voice Integrity is another registration for the calling number. Twilio uses it to register numbers with US analytics engines that influence spam labeling. If a legitimate call is being labeled as spam, that matters to the trust story. Twilio recommends Voice Integrity alongside Enhanced Branded Calling. If this account doesn't have a Voice Integrity registration, I'll show where it goes rather than claim it's active on our number.
>
> Here is the part Anthony can actually recognize: Enhanced Branded Calling. The business submits its display name, a logo, the intended call reason, its use case and supporting details, and a signed authorization. Twilio reviews the bundle. Then the approved number is assigned to it. Supported phones may show the name and logo, and some also show the call reason. The carrier and handset affect what appears.
>
> You may have heard of CNAM, too. That's a separate caller-name service. It can help with name display, especially on landlines, but it doesn't provide the same logo and reason experience. Think of it as an additional layer of coverage for the number.
>
> The setup took more than one step; the runtime call is short. Our code asks the Calls API to call Anthony **from the already approved number**. When he answers, Twilio connects the call to ConversationRelay. ConversationRelay turns his speech into text for our application and speaks the agent's text back to him. The agent and model belong to our application, so we can decide what to ask and how to use Anthony's answer.

**Presenter note:** The live registration is for **Twilio**, not the fictional Twilio Bank. “Card security alert” on the illustrated Android phone is an **example** reason, not a confirmed value from the live bundle. The [Calls API](https://www.twilio.com/docs/voice/api/call-resource) documents an optional `CallReason` parameter marked **Branded Calls Beta**; this demo uses the already approved bundle and does not set that beta field. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) is generally available to direct customers and ISVs through reviewed Console registration. The optional [Trust Hub Compliance API](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api) for automating registration is private beta; Twilio's walkthrough focuses on ISVs, while its [registration schema](https://www.twilio.com/docs/trust-hub/trusthub-rest-api/compliance/branded-calling-registrations-resource) includes direct customers. For a toll-free number, Twilio says [CNAM changes require Support](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam).

**Twilio sources:** [Enhanced Branded Calling setup and coverage](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [SHAKEN/STIR attestation](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding) · [Voice Integrity](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity) · [CNAM](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

## 9:00–13:00 — Ask the urgent question on the branded call

**Screen:** Return to `/bank`. In the Presenter current-step box, click **Place AI agent call** (or **Place live AI agent call** in the full controls). Use **Show call preview** if live calling is unavailable. Show the mirrored phone. Answer and say clearly: **“No, I do not recognize that charge.”** Allow the agent to respond and the bank screen to update. For a preview or failed recognition, use the presenter backup **No, not mine** and label the choice as simulated.

> Let's place the actual call. The illustrated phone says Twilio Bank for our fictional story. The display name on my approved test number is Twilio, so my real handset may say “Twilio Inc.” My Samsung runs Android 13. Twilio's published support table starts the full Samsung name, logo, and call-reason display at Android 14. If you don't see all three on my handset, look at the illustrated supported-device example for what that fuller display can look like.
>
> I'm going to answer. This is a real call to my test phone, with our AI agent behind ConversationRelay. Listen for the question about the deposit and for what happens when I answer.

**Live exchange:** Say **“No, I do not recognize that charge.”** If useful, ask one follow-up in your own words to show this is a conversation, not a recording. Let the agent finish.

> There we go. Our fictional bank app recorded Anthony's answer: he does **not** recognize the $9,800 deposit. The green check means we received a response. The fraud report still needs review; we're not saying a real card has been blocked or a real bank has acted.
>
> Behind that call, Twilio sent the recognized speech to our WebSocket app. The app passed the question and answer to its agent, and Twilio spoke the reply. ConversationRelay also supports interruption, so a customer can speak while the agent is talking. That matters when someone is worried and wants to get straight to the point.

**Twilio sources:** [ConversationRelay and supported features](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [WebSocket message types and interruptions](https://www.twilio.com/docs/voice/conversationrelay/websocket-messages) · [Supported Enhanced devices](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

## 13:00–14:00 — Move from an urgent answer to a case update

**Screen:** Keep the bank dashboard visible. Point to the fictional fraud report or case status that follows the “No” answer.

> The urgent part is done: Anthony told the bank the charge wasn't his. In our demo, the bank records a fraud report so he can check what happens next. That's a different communication job. We aren't asking him to make the fraud decision again; we're just telling him where to see the case status.
>
> That update can wait a few minutes. So let's try a simple text first.

**Presenter note:** This case exists only inside the fictional demo. Twilio transports the call and later messages; the bank application owns its fraud workflow.

## 14:00–16:00 — The number-only update feels uncertain

**Screen:** In Presenter, click **Send live SMS** or **Show SMS preview**. The illustrated Messages conversation displays the full text as a presenter preview; Anthony has not opened it. Show the live phone if sent. Then click **Anthony ignores SMS** to show his unread notification.

> Here's the case-status SMS from a phone number. I'm opening the simulated conversation so you can read the full message; Anthony hasn't opened it. It says the bank received his report, and then there's this long, messy link to the case page. If I see “Twilio Bank” in a text from an unfamiliar number, that name and link alone don't prove who sent it. Anthony pauses and leaves it unopened.
>
> This is a lower-urgency update, so nothing in our story breaks if he waits. But the bank would like him to be able to recognize the message and find his case without guessing who sent the text.
>
> This SMS is a deliberate send from our application. It is **not** Twilio automatically falling back from RCS. We'll talk about fallback when we get to the RCS Messaging Service.

**Twilio sources:** [RCS sender identity compared with SMS](https://www.twilio.com/docs/rcs) · [Messages API](https://www.twilio.com/docs/messaging/api/message-resource) · [Messaging Services](https://www.twilio.com/docs/messaging/services)

## 16:00–22:00 — Set up the RCS identity and rich case update

**Screen:** Open **Twilio Console → Communications → Numbers & senders → Overview → RCS**. Show the prepared sender's **Public details** and accepted tester, then the Messaging Service sender pool. Open the **RCS** architecture setup page to show the Content API request for the case-status card, **View case** URL action, text fallback, and Messages API send. Keep the Console pages pre-open.

> This time we want the message to say who it is **before** Anthony decides whether to open the link. In Twilio Console, an RCS Sender is the business identity for the conversation. RCS business messaging doesn't simply borrow the SMS phone number.
>
> On the sender's public-details page, the business supplies its name, description, logo, banner, contact methods, privacy policy, and terms. On a compatible phone, Anthony can inspect those details from the conversation. For our fictional bank, the profile also gives us a recognizable place to put the bank's branding. For a real launch, the business identity and assets must match a business that can pass registration review.
>
> The sender profile answers **“Who is contacting me?”** The Content Template answers **“What does this update say, and what can I do?”** Our card is titled **“Fraud report received.”** It says Anthony's report about the $9,800 charge is being reviewed and includes a **View case** button. That button opens a public HTTPS URL for this demo's bank app. On a real bank site, the application would control sign-in and access to the case. We also prepare a text variant so a device that doesn't receive RCS can get an SMS or MMS fallback.

> We create this particular rich card with the Content API. Twilio's Console template builder doesn't offer the `twilio/card` type. Then the regular Messages API sends that template through our Messaging Service.
>
> To rehearse while the sender is under review, I invite my phone as a tester. I accept **Make me a tester** on the device, then use the API to send the template to that phone. Production is different: the sender goes through compliance and carrier approval before it can reach ordinary recipients. Twilio says to allow four to six weeks or longer for setup. There's a private-beta onboarding API for ISVs, but the public getting-started flow is Console-led and reviewed.
>
> Now the application code. We give the Messages API Anthony's destination, a Messaging Service SID, and the Content Template SID. The Messaging Service holds the RCS Sender and an SMS-capable sender. Twilio can attempt RCS first and use an SMS or MMS sender when RCS is unavailable. That's channel fallback. It does **not** mean Twilio reads Anthony's mind and sends a call or another message because he didn't tap a link; that follow-up decision belongs to our app.
>
> Here, the separate SMS already went out and Anthony skipped it. We're deliberately sending a new RCS request with a stronger sender identity and a clearer action.

**Presenter note:** The RCS profile's logo is 224 × 224 pixels, at most 50 KB; its Android banner is 1440 × 448 pixels, at most 200 KB. These are distinct from the 256 × 256 BMP logo required for Enhanced Branded Calling. An invited tester can receive API-sent RCS messages before the sender is production-approved. The real handset shows the **actual** test sender profile; the illustrated Twilio Bank profile is a simulation. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Tester tutorial](https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio) · [Enhanced logo rules](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

**Twilio sources:** [RCS sender setup and public details](https://www.twilio.com/docs/rcs/onboarding) · [RCS Messages API and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Card URL actions](https://www.twilio.com/docs/content/twiliocard) · [Content Template Builder limits](https://www.twilio.com/docs/content/create-templates-with-the-content-template-builder) · [RCS onboarding API private beta](https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-)

## 22:00–25:00 — RCS gets Anthony to the case

**Screen:** Return to `/bank`. In Presenter, click **Send live RCS** (or **Send live rich RCS** in the full controls) or **Show RCS preview**. If RCS arrives, show the real tester phone. In the illustrated chat, click the Twilio Bank logo or name, show **Info** and **Options**, then use **Back to chat**. Demonstrate **View case**. On the real phone, the URL action opens the hosted demo website; click **View case status** in Presenter (or **Open fictional case page** in full controls) to show Anthony's fictional case view in the shared audience window.

> Now the same case update appears in a conversation with a business name and logo. Let me open the profile. Here's the banner, the description, and the contact and policy links we just saw in Console. That's useful context when Anthony asks, “Is this really the bank?”
>
> And this time he **does** use the message. He taps **View case**, which opens the bank website and shows the fraud report's status. That is the win for RCS in our story: the urgent decision happened on the trusted call, and the branded message helped him find the follow-up instead of relying on a claim in a number-only text.
>
> Let me be precise about the demo: the phone's button opens our demo website. I advance the presenter-controlled bank screen separately so everyone on the webinar can see the case view. Neither step changes a real account.

**Presenter note:** If the request delivers as SMS/MMS fallback, the illustrated phone first shows a number-only text. Click **Show intended RCS example** in Presenter for a clearly labeled simulation of the card and business profile. The live status stays marked as fallback, and **Show live fallback view** returns to that result. Say: “This tester got the text fallback. Here's the RCS experience we configured and can show in the illustration; it was not what this phone received.” Use **View case status** in Presenter to advance the fictional case. A `twilio/card` URL action can open a website; its URL must be publicly accessible. [Card action documentation](https://www.twilio.com/docs/content/twiliocard) · [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message)

**Twilio sources:** [RCS public profile fields](https://www.twilio.com/docs/rcs/onboarding) · [RCS card URL buttons](https://www.twilio.com/docs/content/twiliocard) · [RCS sending and delivery](https://www.twilio.com/docs/rcs/send-an-rcs-message)

## 25:00–27:00 — Zoom out; where AMD belongs

**Screen:** Click **Show architecture**. Trace the general app decision into the branded call and RCS lanes, with the separate number-only text and RCS fallback underneath. Point to SHAKEN/STIR, CNAM, and Voice Integrity below the voice path; each opens a short setup guide. Click one if time allows, then use **Back to architecture**.

> Here's the general pattern beyond our fake bank. Your application notices something worth contacting a person about. It chooses a channel and sends from an identity that has already been set up. RCS can carry a branded profile, card, and action; a Messaging Service can fall back to SMS or MMS when RCS doesn't work. Branded Calling makes the caller recognizable on supported devices. Once a call is answered, ConversationRelay lets your own agent handle the conversation. The application decides what to do with the answer.
>
> One voice feature people often ask about here is Answering Machine Detection, or AMD. AMD runs **after** a call is answered and helps classify human versus machine. It can be useful if your application needs a voicemail branch. It doesn't put a name or logo on the ringing screen, so it belongs in the answered-call logic. For this live conversation I leave AMD off; synchronous detection can delay the beginning of the call.

**Twilio sources:** [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) · [Answering Machine Detection](https://www.twilio.com/docs/voice/answering-machine-detection)

## 27:00–29:00 — Another branded messaging option: Apple Messages for Business

**Screen:** Show a prepared internal beta demo only if it is ready. Otherwise, show Twilio's [Apple Messages for Business page](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business) and access request.

> RCS is one route to a branded messaging experience. Another one you may be considering is Apple Messages for Business. Twilio currently offers it as a private beta. A customer can start a conversation from an Apple entry point and interact with a branded business thread. Twilio's beta page also describes outbound transactional templates, so there is more than one way this channel could fit a customer journey.
>
> The rich features include things like links and pickers. I'm keeping this part short because our bank app isn't wired to an Apple Messages for Business sender today. If you want access, Twilio's public starting point is the request form on this page. I'd only claim a live demonstration if I have a working beta sender and flow prepared beforehand.

**Twilio sources:** [Apple Messages for Business features and beta access](https://www.twilio.com/en-us/messaging/channels/apple-messages-for-business) · [Private beta announcement](https://www.twilio.com/en-us/changelog/amb-private-beta)

## 29:00–30:00 — Close

**Screen:** Switch the shared window back to the bank-app tab and click **Show architecture** in the private Presenter window.

> We began with a call Anthony couldn't identify, so he didn't answer. The branded call gave him a reason to pick up and tell the bank the charge wasn't his. Later, he skipped a number-only case-status text. The RCS message gave the update a recognizable sender profile and a direct way into his case.
>
> For builders, the lesson is to set up the identity first, then make the app's action match the urgency. Use the call for a decision that needs a conversation. Use the branded message for a follow-up Anthony can handle when he's ready. And always plan for devices or networks that don't show the rich experience.
>
> Thanks for joining. Happy to go deeper on the Console registration, the API calls, or the voice agent.

## Code cards for the shared code tab

These are short runtime examples for a prepared RCS test sender or production-approved sender and an approved Branded Calling number. The app makes equivalent requests. Use placeholders on screen. [RCS Messages API](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Calls API](https://www.twilio.com/docs/voice/api/call-resource)

### Branded AI call from an approved number

~~~js
const relayTwiml =
  '<Response><Connect><ConversationRelay url="wss://example.com/voice-relay" /></Connect></Response>';

await client.calls.create({
  to: "+15551234567",
  from: "+15557654321",
  twiml: relayTwiml
});
~~~

The approved `from` number carries the registered caller identity where supported. The TwiML connects the answered call to the application's secure WebSocket. This example does not set the optional beta `CallReason` field. [Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [Calls API](https://www.twilio.com/docs/voice/api/call-resource) · [ConversationRelay TwiML](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)

### Separate case-status SMS from a number

~~~js
const caseUrl = new URL("/bank?case=1", process.env.PUBLIC_BASE_URL);
caseUrl.searchParams.set("utm_source", "twilio_bank_transactional_notification");
caseUrl.searchParams.set("utm_medium", "unbranded_sms_from_phone_number");
caseUrl.searchParams.set("utm_campaign", "fraud_report_case_status_follow_up");
caseUrl.searchParams.set("delivery_context", "security_notification_clickthrough");
caseUrl.searchParams.set("reference", "DEMO-CASE-STATUS-000000000000000000000000000000000000000000000000000000000000");
await client.messages.create({
  to: "+15551234567",
  from: "+18885550123",
  messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  body: "Twilio Bank: We received your report about the $9,800.00 Midlife Crisis Motors charge. View case status in your banking app: " + caseUrl.toString()
});
~~~

This deliberate number-based SMS is a separate send. It is not an RCS fallback. The URL remains visible because this send does not request link shortening. [Messages API](https://www.twilio.com/docs/messaging/api/message-resource) · [Messaging Service senders](https://www.twilio.com/docs/messaging/services) · [Link Shortening](https://www.twilio.com/docs/messaging/features/link-shortening)

### New case-status Content Template

~~~js
const caseTemplate = {
  friendly_name: "twilio_bank_case_update_webinar_demo_v2",
  language: "en",
  types: {
    "twilio/text": {
      body: "Twilio Bank: Your fraud report for the $9,800.00 Midlife Crisis Motors charge is being reviewed. View case status in your banking app."
    },
    "twilio/card": {
      title: "Fraud report received",
      body: "Your report about the $9,800.00 Midlife Crisis Motors charge is being reviewed.",
      media: ["https://demo.example.com/rcs-case-update-card.png"],
      actions: [{
        type: "URL",
        title: "View case",
        id: "view_case",
        url: "https://demo.example.com/bank?case=1"
      }]
    }
  }
};
~~~

The setup helper sends this shape to the [Twilio Content API](https://www.twilio.com/docs/content/content-api-resources) and prints a new `HX` SID. The image and button URL must be publicly accessible; use the deployed demo origin instead of `demo.example.com`. The card's URL button is supported on RCS. [Card action requirements](https://www.twilio.com/docs/content/twiliocard)

### RCS case-status card send

~~~js
await client.messages.create({
  to: "+15551234567",
  messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  contentSid: "HXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
});
~~~

The `MG` SID identifies a Messaging Service containing an RCS Sender and an SMS/MMS-capable sender. The `HX` SID is the **new** case-status Content Template stored in `TWILIO_RCS_CASE_CONTENT_SID`; it includes the card, **View case** URL action, and text variant for fallback. The old fraud-question `TWILIO_RCS_CONTENT_SID` must not be used. A `twilio/card` URL button opens a publicly accessible site. [RCS rich-content send](https://www.twilio.com/docs/rcs/send-an-rcs-message#send-an-rcs-message-that-contains-rich-content) · [Card URL button](https://www.twilio.com/docs/content/twiliocard)

### Optional AMD in a different call flow

~~~js
// Add this to a Calls API request when a human-versus-voicemail branch helps.
machineDetection: "Enable"
~~~

Twilio reports `AnsweredBy` after classification. Synchronous AMD can delay the start of the call's TwiML, so it is a follow-on design choice rather than a live addition to this conversation. [Answering Machine Detection](https://www.twilio.com/docs/voice/answering-machine-detection)
