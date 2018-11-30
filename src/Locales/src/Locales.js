const _ = require('lodash');
const yaml = require('js-yaml');
const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');

class Locales {
  constructor(options = {}) {
    this.plugin = options.plugin;
  }

  filePath() {
    return path.resolve('src', this.plugin, 'locales.yml');
  }

  fileData() {
    return yaml.safeLoad(fs.readFileSync(this.filePath(), 'utf8'));
  }

  getDataFromFile(key) {
    let data = this.fileData();

    try {
      key.split('.').forEach((subKey) => { data = data[subKey]; });

      if (!data) {
        throw new Error();
      }
    } catch (error) {
      throw new Error(`Locale ${key} for ${this.plugin} plugin is not defined`);
    }

    return data;
  }

  static renderMessage(data, params) {
    if (typeof data === 'string') {
      return Mustache.render(data, params);
    }

    return data;
  }

  get(key, params) {
    const data = this.getDataFromFile(key);

    if (!['string', 'number'].includes(typeof data)) {
      throw new Error('Selected locale is not a string nor number');
    }

    return Locales.renderMessage(data, params);
  }

  getRandom(key, params) {
    const data = this.getDataFromFile(key);

    if (!Array.isArray(data)) {
      throw new Error('Value needs to be an array');
    }

    return Locales.renderMessage(_.sample(data), params);
  }
}

module.exports = Locales;
