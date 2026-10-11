# Presenter guide

This guide covers webinar controls and optional live Twilio tests. Attendees can start with the [demo guide](README.md).

## Start and share

Run the local server:

    npm run dev

Open the **Presenter** URL printed in the terminal. Its fragment contains a session token, so keep that tab private. Click **Open audience window** and share only that window. The audience starts at /bank; **Show architecture** changes the same shared window to /architecture. The prominent next step ends at **Story complete**; use the lower controls to revisit a view or reset.

The banking app and iPhone/Android phone illustrations are simulations. If you also share your own handset, identify it as the live device. The demo never captures your phone.

## Run of show

| Action | What to narrate |
| --- | --- |
| Flag purchase | Anthony Dellavecchia sees a $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829. |
| Show unknown call → Anthony ignores it | An unrecognized number can cause a time-sensitive alert to be missed. |
| Rewind | Same transaction, different contact experience. |
| Show RCS preview, or Send live rich RCS | The RCS Sender provides the brand identity; the rich card adds transaction context and reply choices. The on-screen phone remains an illustration. [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Twilio card](https://www.twilio.com/docs/content/twiliocard) |
| Mark no response | This is a presenter-selected state. An application would make its own escalation decision. |
| Show call preview, or Place live call | The registered caller display name is **Twilio**. The supported iPhone illustration shows name and logo. [US Enhanced Branded Calling](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| Show Android call reason (optional) | “Card security alert” is an illustrative reason on an Android 14+ example. The actual approved reason for this bundle is unverified. [Supported device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) |
| Mark customer reached → Show architecture | Reveal the RCS-first route, text fallback, application-controlled voice step, and event log. [RCS fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Calls API](https://www.twilio.com/docs/voice/api/call-resource) |

The Twilio Bank account, merchant, charge, and illustrated phone screens are fictional. Anthony Dellavecchia is the named customer character in the story. **Show RCS preview** and **Show call preview** never contact a phone.

## Optional: send a real RCS test

A sender that is still under review can send to a device invited as a tester after the device owner accepts **Make me a tester**. Twilio documents the [RCS onboarding and invitation flow](https://www.twilio.com/docs/rcs/onboarding) and a [rich-card tester walkthrough](https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio). Use your own RCS-capable tester device. Real sender branding follows its Console profile and may differ from the fictional Twilio Bank illustration.

For an authorized Twilio sender, the profile images are ready to host:

- [Sender logo PNG](public/rcs-sender-logo.png): 224 × 224 pixels, 7,734 bytes.
- [Sender banner PNG](public/rcs-sender-banner.png): 1440 × 448 pixels, 13,802 bytes.

Both use the actual Twilio Bug. The editable SVG sources are beside the PNGs. Twilio requires the PNGs at public HTTPS URLs for the sender profile; the logo appears in conversations and the banner appears on supported Android profiles. [RCS onboarding and image requirements](https://www.twilio.com/docs/rcs/onboarding)

1. Host the sender logo and banner at public HTTPS URLs. You can upload them as Twilio **Public Assets** and click **Deploy All**. In a paid Twilio account, create an RCS Sender using those URLs and its actual business details. Invite your phone as a test device, accept the invitation on that phone, and add the sender to a Messaging Service. [Public Assets](https://www.twilio.com/docs/serverless/functions-assets/assets) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)
2. Copy .env.example to .env. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DEMO_TO_NUMBER (your accepted tester in E.164), and TWILIO_MESSAGING_SERVICE_SID.
3. Set TWILIO_RCS_CONTENT_SID to an existing HX Content Template SID with a rich card. To create the sample for this story, upload [the card image](public/rcs-alert-card.png) as a Twilio **Public Asset**, deploy it, and put its public HTTPS URL in TWILIO_RCS_MEDIA_URL. Run the command below and copy the returned HX SID into .env. The helper creates a template; it does not send a message. [Public Assets](https://www.twilio.com/docs/serverless/functions-assets/assets) · [Content API](https://www.twilio.com/docs/content/content-api-resources) · [Card format](https://www.twilio.com/docs/content/twiliocard)

       npm run create:rcs-template

4. Restart the server, use the new private Presenter URL, and click **Send live rich RCS** at the RCS step. It sends only to DEMO_TO_NUMBER. Check your actual tester phone, then click **Refresh live statuses**. API acceptance alone does not confirm delivery; Twilio says the Message resource’s From field starts with rcs: after successful RCS delivery. [RCS sending and monitoring](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Message statuses](https://www.twilio.com/docs/messaging/api/message-resource)

The sample template has a twilio/card type for RCS and a twilio/text type for fallback. Twilio can attempt RCS first and fall back to SMS or MMS when the Messaging Service has suitable senders in its pool. The architecture screen illustrates that production path. For an unapproved sender, use the accepted tester; do not count on an uninvited device to demonstrate fallback. [RCS sending and fallback](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [RCS onboarding](https://www.twilio.com/docs/rcs/onboarding)

The app does not receive inbound message webhooks. Tapping a quick reply on a real phone does not advance the bank story; use the presenter controls for the narrative. Handling replies would require an inbound [Messaging webhook](https://www.twilio.com/docs/messaging/guides/webhook-request). No public tunnel is needed for the current outbound demo; the logo, banner, and card image need public HTTPS URLs.

## Optional: place a real branded call

Set TWILIO_VOICE_FROM in .env to your number assigned to an approved US Enhanced Branded Calling bundle. Set DEMO_TO_NUMBER to your own test phone, restart the server, and use the new private Presenter URL. **Place live call from approved number** makes one outbound [Calls API](https://www.twilio.com/docs/voice/api/call-resource) request. The spoken script explicitly identifies the call as a Twilio demonstration for a fictional bank scenario.

Your approved display name is **Twilio**, not Twilio Bank. Twilio’s [US Enhanced guide](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) lists Samsung support at Android 14 or later. Your Samsung Android 13 is outside that documented range, so the actual call may display as an ordinary number. Twilio lists name, logo, and call reason for supported Android devices; its T-Mobile and Verizon iPhone entries list name and logo. “Card security alert” is only a possible registered reason in this illustration; this application does not set a reason through the outbound call request. [US Enhanced guide and device table](https://www.twilio.com/docs/voice/branded-calling/us-enhanced)

Use **Mark customer reached** only when that fits the story. A completed Call resource status can include voicemail or an IVR, so the API result alone does not establish that Anthony answered. [Call status reference](https://www.twilio.com/docs/voice/api/call-resource)

## Local operation

- The server binds to 127.0.0.1 and keeps the Twilio auth token server-side. Browser state contains only readiness flags and masked phone numbers.
- The fixed DEMO_TO_NUMBER is the only destination for real sends and calls; the presenter UI cannot change it.
- The presenter session token changes on server restart. Story state stays in memory and resets on restart or **Reset story**.
- Apple Messages for Business is outside this sample app while the separate webinar demo material is being prepared.
- After changes, run:

      npm run check
      npm test
