import express from 'express';
import {
  register,
  login,
  logout,
  current,
  updateSubscription,
  updateAvatarController,
} from '../controllers/authControllers.js';
import validateBody from '../helpers/validateBody.js';
import upload from '../middlewares/upload.js';
import {
  registerSchema,
  loginSchema,
  subscriptionSchema,
} from '../schemas/authSchemas.js';
import authenticate from '../middlewares/authenticate.js';

const authRouter = express.Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/current', authenticate, current);
authRouter.patch(
  '/subscription',
  authenticate,
  validateBody(subscriptionSchema),
  updateSubscription
);
authRouter.patch(
  '/avatars',
  authenticate,
  upload.single('avatar'),
  updateAvatarController
);

export default authRouter;
