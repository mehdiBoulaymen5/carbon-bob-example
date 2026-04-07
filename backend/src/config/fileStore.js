const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const { dataDirectory, dataFilePath } = require('./storage');

const DEFAULT_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'admin123';
const DEFAULT_ADMIN_NAME = process.env.DEMO_ADMIN_NAME || 'System Administrator';

const createId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

let initialized = false;
let writeQueue = Promise.resolve();

const createInitialData = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const adminId = createId();

  return {
    users: [
      {
        id: adminId,
        email: DEFAULT_ADMIN_EMAIL,
        password_hash: passwordHash,
        name: DEFAULT_ADMIN_NAME,
        role: 'admin',
        is_active: true,
        last_login_at: null,
        created_at: now(),
        updated_at: now()
      }
    ],
    publications: [],
    refresh_tokens: [],
    audit_logs: []
  };
};

const ensureStore = async () => {
  if (initialized) {
    return;
  }

  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch (error) {
    const initialData = await createInitialData();
    await fs.writeFile(dataFilePath, JSON.stringify(initialData, null, 2), 'utf8');
  }

  initialized = true;
};

const readStore = async () => {
  await ensureStore();
  const raw = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(raw);
};

const writeStore = async (data) => {
  await ensureStore();
  writeQueue = writeQueue.then(async () => {
    const tempFile = path.join(dataDirectory, `${path.basename(dataFilePath)}.tmp`);
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempFile, dataFilePath);
  });

  return writeQueue;
};

const updateStore = async (updater) => {
  const store = await readStore();
  const result = await updater(store);
  await writeStore(store);
  return result;
};

module.exports = {
  createId,
  now,
  ensureStore,
  readStore,
  writeStore,
  updateStore
};

// Made with Bob
