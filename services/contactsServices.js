import Contact from '../models/contact.js';

async function listContacts() {
  const rows = await Contact.findAll({ raw: true });
  return rows;
}

async function getContactById(contactId) {
  const contact = await Contact.findByPk(contactId);
  return contact ? contact.get({ plain: true }) : null;
}

async function removeContact(contactId) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  const data = contact.get({ plain: true });
  await contact.destroy();
  return data;
}

async function addContact(name, email, phone) {
  const newContact = await Contact.create({ name, email, phone });
  return newContact.get({ plain: true });
}

async function updateContact(contactId, body) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  await contact.update(body);
  return contact.get({ plain: true });
}

async function updateStatusContact(contactId, body) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  // Only update the favorite field to be safe
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

