import { verificationEmailTemplate } from "./generateEmailTemplate";
import { sendMail } from "../config/nodemailer";

export const sendVerificationEmail = async (
  email: string,
  fullName: string,
  otp: string,
  expiresIn: number = 5,
) => {
  const emailBody = verificationEmailTemplate(otp, fullName, expiresIn);

  await sendMail(email, "Email Verification", emailBody);
};
