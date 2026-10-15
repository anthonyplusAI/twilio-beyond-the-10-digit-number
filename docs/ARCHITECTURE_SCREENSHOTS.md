# Real Twilio Console screenshots for the architecture walkthrough

The guide uses real Console captures only. The current set has 26 PNGs across five topics. Opaque, flattened blocks mask account balances, SIDs, sender IDs, contact details, and assigned phone numbers where they appear; the Console labels, product states, and workflow remain visible. Save a single image as `N.png`, or save several for the same step as `N-1.png`, `N-2.png`, and so on. Numbered images take precedence over `N.png`; the slide shows them in numeric order at full width, one below the next. Scroll down to see each image and the instructions underneath. This works in every screenshot folder, including future folders and step numbers. PNG, JPG, JPEG, and WebP are supported. Refresh `/architecture/details` after adding files; no code change or server restart is needed.

Until a screenshot is present, the slide says **Real Console screenshot pending** and shows the documented action. Leave any screen you cannot access uncaptured; do not portray a pending registration as approved. No Console image in the site is fabricated.

Use a browser window wide enough to keep labels readable on a shared screen. Crop out the browser toolbar. Before saving, hide Auth Tokens, account balances, full SIDs and phone numbers, sender IDs, employee/contact details, personal URLs, and customer data with opaque pixel masks. Keep the product name, field labels, and status visible. For the Branded Calling capture, show the **actual approved Twilio identity**; Twilio Bank is only the fictional story.

## RCS sender — `public/architecture-shots/rcs/`

| File | Capture this actual Console view |
| --- | --- |
| `1-1.png`, `1-2.png` | **Communications → Numbers & senders → Overview → RCS → sender → Public details.** The list and settings show the demo sender as **Not Submitted**. The public profile preview remains visible; sender identifiers and contact fields are masked. |
| `2.png` | **Sender → Test.** A tester row and send control are visible, with the tester number masked. This capture does not establish production approval. |
| `3-1.png`–`3-4.png` | **Sender → Compliance registration → Google Registration.** The captures show the country selector, fee acknowledgement, registration list, and Google requirements page. The Google and US registrations are **Not Started** in the list; no submitted or approved state is shown. |
| `4-1.png`, `4-2.png` | **Sender → Compliance registration → US registration.** The list shows **Not Started** and the drawer lists required business information. It does not show a completed US form or review state. |
| `5.png` | **Communications → Messaging → Services → Messaging Service → Senders.** The RCS Sender and an SMS/MMS-capable number appear in the same service. Its RCS Sender is **Offline**, so this capture does not show production approval. The service SID, sender ID, and number are masked. |

The Messaging Service slide shows the senders used by the later Content API and Messages API slides. A service with an SMS/MMS-capable number is a prerequisite for RCS fallback. Tester access permits preapproval testing; ordinary recipients need carrier approval of the RCS Sender. This demo's `twilio/card` must be created with the **Content API** because the Console Content Template Builder does not offer that template type. The later send uses the regular **Messages API**. The separate RCS **sender-onboarding API** is private beta for ISVs; it is not needed for this Console setup. [Twilio RCS onboarding](https://www.twilio.com/docs/rcs/onboarding) · [Console template builder limits](https://www.twilio.com/docs/content/create-templates-with-the-content-template-builder) · [RCS rich-content send](https://www.twilio.com/docs/rcs/send-an-rcs-message) · [Sender-onboarding API status](https://www.twilio.com/en-us/changelog/rcs-onboarding-apis-are-now-in-private-beta-)

## Enhanced Branded Calling — `public/architecture-shots/branded-calling/`

| File | Capture this actual Console view |
| --- | --- |
| `1.png` | **Communications → Trust Hub → Profiles.** The Primary Business Profile is **Approved**. Its SID and business address are masked. |
| `2-1.png` | **Communications → Trust Hub → Registrations → Branded calling.** The US Enhanced registration is **Approved** in the list, with its SID masked. This is an existing registration, not a screen for the optional API route. |
| `2-2.png` | **Open that registration.** The approved display name, logo, call reason, and call preview are visible. The registration SID, notification email, and logo asset URL are masked. |
| `3.png` | **That registration → Assigned phone numbers.** The registration is **Approved** and its assigned number is **Branded**. The registration and phone number SIDs and both appearances of the number are masked. |

The main path is **Communications → Trust Hub → Registrations → Branded calling → Create registration**. Select the US destination, Enhanced type, use case, direct-customer role, and approved Business Profile; provide the real brand and business details, sign the LOA, and submit for review. Assign the calling number during registration or after approval. Guide steps 5–8 show the optional **private-beta Compliance API** route, whose public walkthrough is labeled for ISVs; step 9 uses the regular [Calls API](https://www.twilio.com/docs/voice/api/call-resource) with the approved, assigned number. [Twilio registration path](https://www.twilio.com/docs/trust-hub/registrations/branded-calling) · [US Enhanced setup](https://www.twilio.com/docs/voice/branded-calling/us-enhanced) · [API onboarding status](https://www.twilio.com/docs/voice/branded-calling/onboard-customers-using-api)

## SHAKEN/STIR — `public/architecture-shots/shaken-stir/`

| File | Capture this actual Console view |
| --- | --- |
| `1.png` | **Communications → Trust Hub → Profiles.** The Primary Business Profile is **Approved**; its SID and business address are masked. Number assignment is not shown here. |
| `2-1.png` | **Communications → Trust Hub → Registrations → SHAKEN/STIR.** The existing registration is **Approved** in the list; its SID is masked. |
| `2-2.png` | **Create registration → Basic information.** The blank registration-friendly name and selected compliance profile fields show the Console flow. This capture is not a new submitted registration. |

[Twilio SHAKEN/STIR registration guide](https://www.twilio.com/docs/trust-hub/registrations/shaken-stir) · [Twilio Console onboarding](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding/shakenstir-onboarding-in-the-twilio-console)

US Enhanced Branded Calling lists **enabled SHAKEN/STIR** as a prerequisite. Twilio signs all US calls with an appropriate attestation level; its highest `A` attestation requires an approved Business Profile, an approved SHAKEN/STIR Trust Product, and the calling number assigned to both. For a number already set up, show its existing registration status rather than creating another one during the webinar. [US Enhanced prerequisites](https://www.twilio.com/docs/voice/branded-calling/us-enhanced#prerequisites) · [Attestation requirements](https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding#vetting-and-attestation-levels)

## CNAM — `public/architecture-shots/cnam/`

| File | Capture this actual Console view |
| --- | --- |
| `1.png` | **Communications → Trust Hub → Profiles.** The Primary Business Profile is **Approved**, with its SID and address masked. This capture does not show a local number assigned to it. |
| `2-1.png`, `2-2.png` | **Communications → Trust Hub → Registrations → CNAM.** The list shows an existing **Approved** registration; the second image shows the blank **Create registration → Basic information** form. Neither image shows its assigned numbers. |
| `3-1.png`, `3-2.png` | **Communications → Numbers & senders → Overview → number → Voice and emergency calling → Edit.** The current number configuration shows **Caller Name Lookup: Disabled**, and the edit dialog has **Disable** selected. These captures do not demonstrate CNAM lookup enabled. |

Guide steps 4–6 show an optional Trust Hub API alternative; step 7 returns to Console for Caller Name Lookup. The current Console capture shows that lookup disabled, so obtain a real enabled capture before presenting step 7 as complete. CNAM is a **public beta**. US and Canadian toll-free CNAM changes require Support; the Console and API registration here are for eligible US local numbers. [Twilio CNAM registration path](https://www.twilio.com/docs/trust-hub/registrations/cnam) · [CNAM Console and API onboarding](https://www.twilio.com/docs/voice/brand-your-calls-using-cnam)

## Voice Integrity — `public/architecture-shots/voice-integrity/`

| File | Capture this actual Console view |
| --- | --- |
| `1.png` | **Communications → Trust Hub → Profiles.** The Primary Business Profile is **Approved**, with its SID and address masked. This capture does not show an assigned calling number. |
| `2-1.png`, `2-2.png` | **Communications → Trust Hub → Registrations → Voice Integrity.** The list shows an existing **Approved** registration; the second image shows the blank **Create registration → Basic information** form. |
| `3.png` | **Open the Voice Integrity registration.** Its **Approved** status and registration details are visible. The SID and notification email are masked. The assigned phone numbers tab is present but unopened, so the capture does not show its numbers. |

The main path is Console registration and number assignment. Guide steps 4–6 show the optional **private-beta Trust Hub API** route; step 7 checks the real Console status. The current registration captures show approval but do not verify assigned numbers. [Twilio Voice Integrity registration path](https://www.twilio.com/docs/trust-hub/registrations/voice-integrity) · [Console onboarding](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding/voiceintegrity-onboarding-in-the-twilio-console) · [API status](https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity/voice-integrity-onboarding)
