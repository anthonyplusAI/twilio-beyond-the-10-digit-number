const DEFAULT_PUBLIC_BASE_URL = 'https://twilio-branded-comms.jollymushroom-29e673c9.centralus.azurecontainerapps.io';

export const SMS_BODY_PREFIX = 'Twilio Bank: We received your report about the $9,800.00 Midlife Crisis Motors charge. View case status in your banking app: ';

export function buildSmsCaseUrl(publicBaseUrl = DEFAULT_PUBLIC_BASE_URL) {
  const url = new URL('/bank?case=1', publicBaseUrl || DEFAULT_PUBLIC_BASE_URL);
  url.searchParams.set('utm_source', 'twilio_bank_transactional_notification');
  url.searchParams.set('utm_medium', 'unbranded_sms_from_phone_number');
  url.searchParams.set('utm_campaign', 'fraud_report_case_status_follow_up');
  url.searchParams.set('delivery_context', 'security_notification_clickthrough');
  url.searchParams.set('reference', 'DEMO-CASE-STATUS-000000000000000000000000000000000000000000000000000000000000');
  return url.toString();
}

export function buildSmsBody(caseUrl) {
  return `${SMS_BODY_PREFIX}${caseUrl}`;
}
