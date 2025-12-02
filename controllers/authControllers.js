import * as authServices from '../services/authServices.js';

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
    const user = await authServices.updateSubscription(req.user.id, subscription);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
