import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import gravatar from 'gravatar';
import { nanoid } from 'nanoid';
import { sendVerificationEmail } from './emailService.js';

const { JWT_SECRET = 'secret-key-please-change-in-env' } = process.env;

export const registerUser = async (email, password) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(
    email,
    { s: '250', r: 'pg', d: 'retro' },
    true
  );

  const verificationToken = nanoid();

  const newUser = await User.create({
    email,
    password: hashedPassword,
    avatarURL,
    verificationToken,
    verify: false,
  });

  await sendVerificationEmail(email, verificationToken);

  const response = {
    email: newUser.email,
    subscription: newUser.subscription,
    avatarURL: newUser.avatarURL,
    verificationToken,
  };

  return response;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return null;
  }

  if (!user.verify) {
    return { notVerified: true };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
  await user.update({ token });

  return {
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  };
};

export const logoutUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return false;
  }

  await user.update({ token: null });
  return true;
};

export const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    subscription: user.subscription,
  };
};

export const updateSubscription = async (userId, subscription) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  await user.update({ subscription });
  return {
    email: user.email,
    subscription: user.subscription,
  };
};

export const findUserById = async (userId) => {
  return await User.findByPk(userId);
};

export const updateAvatar = async (userId, avatarURL) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  await user.update({ avatarURL });
  return {
    avatarURL: user.avatarURL,
  };
};

export const verifyUserByToken = async (verificationToken) => {
  const user = await User.findOne({ where: { verificationToken } });
  if (!user) {
    return null;
  }

  await user.update({ verify: true, verificationToken: null });
  return user;
};

export const resendVerification = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return null;
  }

  if (user.verify) {
    return { alreadyVerified: true };
  }

  let { verificationToken } = user;
  if (!verificationToken) {
    verificationToken = nanoid();
    await user.update({ verificationToken });
  }

  await sendVerificationEmail(email, verificationToken);
  return { sent: true };
};
