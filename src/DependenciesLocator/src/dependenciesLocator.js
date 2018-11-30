
const registry = {};

module.exports = {
  get: key => registry[key],
  set: (key, value) => {
    if (Object.prototype.hasOwnProperty.call(registry, key)) {
      return;
    }

    registry[key] = value;
  },
  forceSet: (key, value) => {
    registry[key] = value;
  },
};
