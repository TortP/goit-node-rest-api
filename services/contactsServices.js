import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contactsPath = path.join(__dirname, '..', 'db', 'contacts.json');

const readContacts = async () => {
  const data = await fs.readFile(contactsPath, 'utf8');
  return JSON.parse(data);
};

const writeContacts = async contacts => {
  const json = JSON.stringify(contacts, null, 2);
  await fs.writeFile(contactsPath, json);
};

async function listContacts() {
  return readContacts();
}

async function getContactById(contactId) {
  const contacts = await readContacts();
  return contacts.find(({ id }) => id === contactId) ?? null;
}

async function removeContact(contactId) {
  const contacts = await readContacts();
  const index = contacts.findIndex(({ id }) => id === contactId);
  if (index === -1) {
    return null;
  }

  const [deletedContact] = contacts.splice(index, 1);
  await writeContacts(contacts);
  return deletedContact;
}

async function addContact(name, email, phone) {
  const contacts = await readContacts();
  const newContact = {
    id: randomUUID(),
    name,
    email,
    phone,
  };

  contacts.push(newContact);
  await writeContacts(contacts);
  return newContact;
}

async function updateContact(contactId, body) {
  const contacts = await readContacts();
  const index = contacts.findIndex(({ id }) => id === contactId);
  if (index === -1) {
    return null;
  }

  contacts[index] = { ...contacts[index], ...body };
  await writeContacts(contacts);
  return contacts[index];
}

export {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};

