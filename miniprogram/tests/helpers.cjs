const storage = new Map();
global.wx = {
  getStorageSync(key) { return storage.get(key) || ""; },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); },
};
const reset = () => storage.clear();
module.exports = { storage, reset };
