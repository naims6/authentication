import { sendMail } from "../config/resend.js";
import { generateEmailTemplate } from "./generateEmailTemplate.js";

export const sendVerificationEmail = async (
  email: string,
  fullName: string,
  otp: string,
  expiredIn: number = 5,
) => {
  // const emailBody = verificationEmailTemplate(otp, fullName, expiresIn);
  const emailBody = (await generateEmailTemplate("otpVerification", {
    otp,
    fullName,
    expiredIn,
  })) as string;

  await sendMail(email, "Email Verification", emailBody);
};
