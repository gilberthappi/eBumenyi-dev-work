import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: body,
    html,
  });
};
