import nodemailer from "nodemailer";
import config from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: config.email_user,
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", info.response);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

export { sendMail };
