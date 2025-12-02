import express from 'express';
import {
  getAllContacts,
  getOneContact,
  deleteContact,
  createContact,
  updateContact,
  updateFavorite,
} from '../controllers/contactsControllers.js';
import validateBody from '../helpers/validateBody.js';
import {
  createContactSchema,
  updateContactSchema,
} from '../schemas/contactsSchemas.js';
import { updateFavoriteSchema } from '../schemas/contactsSchemas.js';
import authenticate from '../middlewares/authenticate.js';

const contactsRouter = express.Router();

// Додаємо middleware authenticate до всіх роутів
contactsRouter.use(authenticate);

contactsRouter.get('/', getAllContacts);

contactsRouter.get('/:id', getOneContact);

contactsRouter.delete('/:id', deleteContact);

contactsRouter.post('/', validateBody(createContactSchema), createContact);

contactsRouter.put('/:id', validateBody(updateContactSchema), updateContact);

contactsRouter.patch(
  '/:contactId/favorite',
  validateBody(updateFavoriteSchema),
  updateFavorite
);

export default contactsRouter;
