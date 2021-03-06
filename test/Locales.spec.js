const { expect } = require('chai');
const sinon = require('sinon');
const yaml = require('js-yaml');
const fs = require('fs');

const Locales = require('../src/Locales');

describe('Locales util test suite', () => {
  beforeEach(() => sinon.stub(fs, 'readFileSync').returns(''));
  afterEach(() => sinon.restore());

  describe('filePath', () => {
    it('responds with proper yml file path', () => {
      const subject = new Locales({ plugin: 'test' });

      const result = subject.filePath();

      expect(result).to.match(new RegExp('.*/src/test/config/locales.yml'));
    });
  });

  describe('get', () => {
    it('get normal key', () => {
      const subject = new Locales({ plugin: 'test' });

      sinon.stub(yaml, 'safeLoad').returns({
        first: 'First key',
        second: 123,
      });

      expect(subject.get('first')).to.eql('First key');
      expect(subject.get('second')).to.eql(123);
    });

    it('get normal key with param', () => {
      const subject = new Locales({ plugin: 'test' });

      sinon.stub(yaml, 'safeLoad').returns({
        first: 'Hello {{name}}',
        second: 'Second key',
      });

      const result = subject.get('first', { name: 'Jim' });
      const expected = 'Hello Jim';

      expect(result).to.eql(expected);
    });

    it('get nested key with param', () => {
      const subject = new Locales({ plugin: 'test' });

      sinon.stub(yaml, 'safeLoad').returns({
        first: {
          nested: 'Hello {{name}}',
        },
      });

      const result = subject.get('first.nested', { name: 'Jim' });
      const expected = 'Hello Jim';

      expect(result).to.eql(expected);
    });

    it('throws error when key doesn\'t exist', () => {
      const subject = new Locales({ plugin: 'test' });

      sinon.stub(yaml, 'safeLoad').returns({
        second: 'Second key',
      });

      const getValue = () => subject.get('first');

      expect(getValue).to.throw('Locale first for test plugin is not defined');
    });

    it('throws error when key is not string or number', () => {
      const subject = new Locales({ plugin: 'test' });

      sinon.stub(yaml, 'safeLoad').returns({
        first: { test: 'test' },
      });

      const getValue = () => subject.get('first');

      expect(getValue).to.throw('Selected locale is not a string, number nor array');
    });

    it('get random value from key if NODE_ENV is not test', () => {
      sinon.stub(process, 'env').value({ ...process.env, NODE_ENV: 'development' });

      const subject = new Locales({ plugin: 'test' });
      const data = ['first', 'second', 'third'];

      sinon.stub(yaml, 'safeLoad').returns({ values: data });

      const result = subject.get('values');

      expect(data).to.include(result);
    });

    it('get value with index 0 from array when NODE_ENV is test', () => {
      sinon.stub(process, 'env').value({ ...process.env, NODE_ENV: 'test' });

      const subject = new Locales({ plugin: 'test' });
      const data = ['first', 'second', 'third'];

      sinon.stub(yaml, 'safeLoad').returns({ values: data });

      const result = subject.get('values');

      expect(data[0]).to.equal(result);
    });

    it('get random value from nested key and renders parameter', () => {
      const subject = new Locales({ plugin: 'test' });
      const data = ['first {{value}}', 'second {{value}}', 123];
      const dataExpected = ['first test', 'second test', 123];

      sinon.stub(yaml, 'safeLoad').returns({ nested: { values: data } });

      const result = subject.get('nested.values', { value: 'test' });

      expect(dataExpected).to.include(result);
    });
  });
});
