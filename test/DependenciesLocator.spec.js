const { expect } = require('chai');
const dependenciesLocator = require('../src/DependenciesLocator');

describe('DependenciesLocator test suite', () => {
  it('Should get setted object', () => {
    const toSave = { foo: 'bar' };

    dependenciesLocator.set('example', toSave);

    expect(dependenciesLocator.get('example')).to.eql(toSave);
  });

  it('Should not set fot the key that already exists', () => {
    const toSave = { foo: 'bar' };

    dependenciesLocator.set('example', toSave);
    dependenciesLocator.set('example', null);

    expect(dependenciesLocator.get('example')).to.eql(toSave);
  });

  it('Should force set', () => {
    const toSave = { foo: 'bar' };

    dependenciesLocator.set('example', null);
    dependenciesLocator.forceSet('example', toSave);

    expect(dependenciesLocator.get('example')).to.eql(toSave);
  });
});
