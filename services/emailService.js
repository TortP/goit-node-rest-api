import nodemailer from 'nodemailer';

const {
  UKR_NET_USER,
  UKR_NET_PASS,
  BASE_URL = 'http://localhost:3000',
} = process.env;

const transporter = nodemailer.createTransport({
  host: 'smtp.ukr.net',
  port: 465,
  secure: true,
  auth: {
    user: UKR_NET_USER,
    pass: UKR_NET_PASS,
  },
});

export const sendVerificationEmail = async (to, verificationToken) => {
  if (!UKR_NET_USER || !UKR_NET_PASS) {
    throw new Error('SMTP credentials are not set (UKR_NET_USER/UKR_NET_PASS)');
  }

  const verifyURL = `${BASE_URL}/api/auth/verify/${verificationToken}`;

  const mailOptions = {
    from: UKR_NET_USER,
    to,
    subject: 'Email verification',
    text: `Please verify your email by visiting: ${verifyURL}`,
    html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyURL}">${verifyURL}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};
