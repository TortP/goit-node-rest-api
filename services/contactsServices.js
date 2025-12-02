import Contact from '../models/contact.js';

async function listContacts(userId, query = {}) {
  const { page = 1, limit = 20, favorite } = query;
  const offset = (page - 1) * limit;

  const where = { owner: userId };
  if (favorite !== undefined) {
    where.favorite = favorite === 'true';
  }

  const rows = await Contact.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    raw: true,
  });
  return rows;
}

async function getContactById(contactId, userId) {
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      owner: userId,
    },
  });
  return contact ? contact.get({ plain: true }) : null;
}

async function removeContact(contactId, userId) {
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      owner: userId,
    },
  });
  if (!contact) return null;
  const data = contact.get({ plain: true });
  await contact.destroy();
  return data;
}

async function addContact(name, email, phone, userId) {
  const newContact = await Contact.create({
    name,
    email,
    phone,
    owner: userId,
  });
  return newContact.get({ plain: true });
}

async function updateContact(contactId, body, userId) {
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      owner: userId,
    },
  });
  if (!contact) return null;
  await contact.update(body);
  return contact.get({ plain: true });
}

async function updateStatusContact(contactId, body, userId) {
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      owner: userId,
    },
  });
  if (!contact) return null;
  const { favorite } = body;
  await contact.update({ favorite });
  return contact.get({ plain: true });
}

export {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
