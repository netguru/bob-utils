const { expect } = require('chai');
const MessageBuilder = require('../src/MessageBuilder');

describe('MessageBuilder', () => {
  describe('Passing params', () => {
    it('should build message using constructor params', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });

      const result = builder.buildMessage();
      expect(result).to.eql({ text: 'Hello world' });
    });

    it('should build message using added params', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addField({ x: 'y' });
      builder.addField({ z: 'x' });

      const result = builder.buildMessage();
      expect(result).to.eql({ text: 'Hello world', x: 'y', z: 'x' });
    });

    it('should build message using params given in buildMessage()', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addField({ x: 'y' });

      const result = builder.buildMessage({ z: 'x' });
      expect(result).to.eql({ text: 'Hello world', x: 'y', z: 'x' });
    });

    it('should build message with attachments', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addAttachment({ name: 'eoeo' });

      const result = builder.buildMessage();
      expect(result).to.eql({ text: 'Hello world', attachments: [{ name: 'eoeo' }] });
    });

    it('should operate with chain methods', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addField({ x: 'y' }).addAttachment({ name: 'eoeo' });

      const result = builder.buildMessage({ z: 'x' });
      expect(result).to.eql({
        text: 'Hello world', x: 'y', z: 'x', attachments: [{ name: 'eoeo' }],
      });
    });

    it('should build message with blocks', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addBlock({ name: 'eoeo' });

      const result = builder.buildMessage();
      expect(result).to.eql({ text: 'Hello world', blocks: [{ name: 'eoeo' }] });
    });

    it('should operate with chain methods on blocks', () => {
      const builder = new MessageBuilder({ text: 'Hello world' });
      builder.addBlock({ name: 'eoeo' }).addBlock({ name: 'foo' });

      const result = builder.buildMessage();
      expect(result).to.eql({
        text: 'Hello world', blocks: [{ name: 'eoeo' }, { name: 'foo' }],
      });
    });
  });

  describe('Other functions', () => {
    it('disables links previews', () => {
      const builder = new MessageBuilder();
      builder.disableLinksPreview();

      const result = builder.buildMessage({ text: 'elo' });
      expect(result).to.eql({ text: 'elo', unfurl_links: false, unfurl_media: false });
    });
  });
});
