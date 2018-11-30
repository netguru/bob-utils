const Mustache = require('mustache');
const fs = require('fs');

class MessageRenderer {
  constructor(template, params = {}) {
    this.template = template;
    this.params = params;
  }

  getTemplate() {
    return fs.readFileSync(`templates/${this.template}.message`).toString();
  }

  render() {
    return Mustache.render(this.getTemplate(this.template), this.params);
  }
}

module.exports = MessageRenderer;
