const { expect } = require('chai');
const RespondMultiplexer = require('../src/RespondMultiplexer');

describe('RespondMultiplexer test suite', () => {
  it('should execute proper action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);

    const action = multiplexer.choose('abc');

    const result = await action.exec();

    expect(result).to.eql(1);
  });

  it('should execute pre-built default action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);

    const action = multiplexer.choose('def');

    const result = await action.exec();

    expect(result).to.eql(undefined);
  });

  it('should execute user default action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);
    multiplexer.setDefaultResponse(() => 3);

    const action = multiplexer.choose('def');

    const result = await action.exec();

    expect(result).to.eql(3);
  });
});
