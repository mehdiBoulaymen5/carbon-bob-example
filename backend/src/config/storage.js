const path = require('path');

const STORAGE_MODES = {
  DATABASE: 'database',
  FILE: 'file'
};

const configuredMode = (process.env.STORAGE_MODE || '').trim().toLowerCase();

const storageMode = configuredMode === STORAGE_MODES.FILE
  ? STORAGE_MODES.FILE
  : STORAGE_MODES.DATABASE;

const dataDirectory = process.env.FILE_STORAGE_DIR
  ? path.resolve(process.env.FILE_STORAGE_DIR)
  : path.resolve(__dirname, '../../data');

const dataFilePath = process.env.FILE_STORAGE_PATH
  ? path.resolve(process.env.FILE_STORAGE_PATH)
  : path.join(dataDirectory, 'app-data.json');

const isFileStorage = () => storageMode === STORAGE_MODES.FILE;
const isDatabaseStorage = () => storageMode === STORAGE_MODES.DATABASE;

module.exports = {
  STORAGE_MODES,
  storageMode,
  dataDirectory,
  dataFilePath,
  isFileStorage,
  isDatabaseStorage
};

// Made with Bob
