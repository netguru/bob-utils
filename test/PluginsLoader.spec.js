const { expect } = require('chai');
const sinon = require('sinon');

const fs = require('fs');
const path = require('path');

const PluginsLoader = require('../src/PluginsLoader');

const errorMessages = {
  configuration: 'Configuration file missing, please run: yarn docs',
  plugin: name => `Plugin ${name} is not present in the configuration, please run: yarn docs`,
};

const pluginNames = [
  'pluginOne',
  'pluginTwo',
];

const configuration = {
  [pluginNames[0]]: [
    'AA',
    'BB',
  ],
  [pluginNames[1]]: [
    'CC',
    'DD',
  ],
};

const enabled = [
  pluginNames[0],
];

describe('PluginsLoader test scope', () => {
  describe('Constructor', () => {
    it('Should throw an error if configuration is not present', () => {
      const noConfigInit = () => new PluginsLoader({}, null, enabled);

      expect(noConfigInit).to.throw(errorMessages.configuration);
    });
  });

  describe('Instance', () => {
    let pluginsLoader;

    beforeEach(() => {
      const robot = {
        load: sinon.spy(),
        logger: {
          warning: sinon.spy(),
        },
      };

      pluginsLoader = new PluginsLoader(
        robot, configuration, enabled,
      );
    });

    afterEach(() => sinon.restore());

    it('Should load plugins and warn about missing enviromental variables', () => {
      sinon.stub(fs, 'readdirSync').returns(pluginNames);
      sinon.stub(path, 'resolve').returns('ab/acd');
      sinon.stub(process, 'env').value({ AA: 1 });

      pluginsLoader.loadPlugins('ac/dv');

      expect(pluginsLoader.robot.load.calledOnceWith('ab/acd')).to.equal(true);
      expect(pluginsLoader.robot.logger.warning.calledTwice).to.equal(true);
    });

    it('Should throw an error if plugin does not have its configuration', () => {
      sinon.stub(fs, 'readdirSync').returns(pluginNames);
      sinon.stub(path, 'resolve').returns('ab/acd');
      sinon.stub(configuration, pluginNames[0]).value(undefined);

      const loadNoConfig = () => pluginsLoader.loadPlugins('ad/d');

      expect(loadNoConfig).to.throw(errorMessages.plugin(pluginNames[0]));
    });
  });
});
