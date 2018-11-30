const { expect } = require('chai');
const sinon = require('sinon');
const MessageRenderer = require('../src/MessageRenderer');

describe('MessageRenderer', () => {
  describe('Rendering templates', () => {
    it('should render provided template', () => {
      const template = 'test';
      const params = { foo: 'bar' };
      const renderer = new MessageRenderer(template, params);

      sinon.stub(renderer, 'getTemplate').callsFake(() => 'Message: {{foo}}');

      const result = renderer.render(template, params);

      expect(result).to.eq('Message: bar');
    });

    it('should throw error when template doesn\'t exists', () => {
      const renderer = new MessageRenderer('/eoeoeo');
      expect(() => { renderer.render(); }).to.throw(Error);
    });
  });
});
