import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import gravatar from 'gravatar';

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

  const newUser = await User.create({
    email,
    password: hashedPassword,
    avatarURL,
  });

  return {
    email: newUser.email,
    subscription: newUser.subscription,
    avatarURL: newUser.avatarURL,
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return null;
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
