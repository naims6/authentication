import { verificationEmailTemplate } from "./generateEmailTemplate";
import { sendMail } from "../config/nodemailer";

export const sendVerificationEmail = async (
  email: string,
  fullName: string,
  otp: number,
  expiriedIn: number = 5,
) => {
  const emailBody = verificationEmailTemplate(otp, fullName, expiriedIn);

  await sendMail(email, "Email Verification", emailBody);
};
