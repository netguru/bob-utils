const { expect } = require('chai');
const ObjectToArray = require('../src/ObjectToArray');

describe('ObjectToArray test suite', () => {
  it('should transform deep object to array #1', () => {
    const object = {
      a: {
        b: 1,
      },
    };
    const expected = [{ name: 'a', b: 1 }];
    const result = ObjectToArray(object);

    expect(result).to.eql(expected);
  });

  it('should transform multiple object to array #1', () => {
    const object = {
      a: {
        b: 1,
      },
      b: {
        c: 1,
      },
    };
    const expected = [{ name: 'a', b: 1 }, { name: 'b', c: 1 }];
    const result = ObjectToArray(object);

    expect(result).to.eql(expected);
  });
});
