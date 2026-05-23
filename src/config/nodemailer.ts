import nodemailer from "nodemailer";
import config from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
});

const sendMail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: config.email_user,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export { sendMail };
