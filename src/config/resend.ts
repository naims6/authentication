import { Resend } from "resend";
import config from "./env.js";

const resend = new Resend(config.resend_api_key);

const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT SUCCESS:", data);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { sendMail };
