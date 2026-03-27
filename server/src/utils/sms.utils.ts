import { env } from "../config/env.config";

type SendSmsPayload = {
  to: string;
  body: string;
};

export async function sendSms({ to, body }: SendSmsPayload): Promise<void> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    if (env.NODE_ENV === "development") {
      console.log(`[DEV SMS] to=${to} message="${body}"`);
      return;
    }
    throw new Error("SMS provider is not configured on the server.");
  }

  if (fromNumber && !/^\+\d{8,15}$/.test(fromNumber)) {
    throw new Error("TWILIO_PHONE_NUMBER must be in E.164 format (for example: +14155552671).");
  }

  if (fromNumber && fromNumber === to) {
    throw new Error("TWILIO_PHONE_NUMBER cannot be the same as the recipient number. Use your Twilio sender number.");
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: to,
    Body: body,
  });
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    params.set("From", fromNumber);
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to send SMS OTP. ${errorText}`.trim());
  }
}
