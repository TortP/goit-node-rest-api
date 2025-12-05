import * as authServices from '../services/authServices.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authServices.registerUser(email, password);

    if (!user) {
      return res.status(409).json({ message: 'Email in use' });
    }

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authServices.loginUser(email, password);

    if (!result) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    if (result.notVerified) {
      return res.status(401).json({ message: 'Email is not verified' });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const success = await authServices.logoutUser(req.user.id);

    if (!success) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const current = async (req, res, next) => {
  try {
    const user = await authServices.getCurrentUser(req.user.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const user = await authServices.updateSubscription(
      req.user.id,
      subscription
    );

    if (!user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { path: tempPath, filename } = req.file;
    const ext = path.extname(filename);
    const newFilename = `${req.user.id}${ext}`;
    const avatarsDir = path.resolve('public', 'avatars');
    const finalPath = path.join(avatarsDir, newFilename);

    // Переміщуємо файл з temp до public/avatars
    await fs.rename(tempPath, finalPath);

    const avatarURL = `/avatars/${newFilename}`;
    const result = await authServices.updateAvatar(req.user.id, avatarURL);

    if (!result) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(result);
  } catch (error) {
    // Видаляємо temp файл у разі помилки
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

export const verifyEmailController = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await authServices.verifyUserByToken(verificationToken);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmailController = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'missing required field email' });
    }

    const result = await authServices.resendVerification(email);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (result.alreadyVerified) {
      return res
        .status(400)
        .json({ message: 'Verification has already been passed' });
    }

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};
