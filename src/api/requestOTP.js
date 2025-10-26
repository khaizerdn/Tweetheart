import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verification Code",
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  });
};