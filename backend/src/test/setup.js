jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  try {
    const db = require('../config/database');
    if (db && typeof db.closePool === 'function') {
      await db.closePool();
    }
  } catch (error) {
    // Ignore teardown errors when database was not initialized by the test
  }
});
