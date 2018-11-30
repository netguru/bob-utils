const fs = require('fs');
const path = require('path');
const Rollbar = require('rollbar');

class PluginsLoader {
  constructor(robot, configuration, enabledPlugins) {
    this.robot = robot;
    this.configuration = configuration;
    this.enabledPlugins = enabledPlugins;

    if (!configuration) {
      throw new Error('Configuration file missing, please run: yarn docs');
    }

    PluginsLoader.initRollbar();
  }

  static initRollbar() {
    Rollbar.init({
      accessToken: process.env.ROLLBAR_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true,
    });
  }

  isEnabled(pluginName) {
    return this.enabledPlugins.includes(pluginName);
  }

  loadPlugins(pluginsFolder) {
    const pluginNames = fs.readdirSync(pluginsFolder);

    pluginNames.forEach((pluginName) => {
      if (this.isEnabled(pluginName)) {
        this.loadPlugin(pluginsFolder, pluginName);
      } else {
        this.robot.logger.warning(`\x1b[31m Plugin \x1b[4m ${pluginName} \x1b[0m \x1b[31m is turned off \x1b[0m`);
      }
    });
  }

  loadPlugin(pluginsFolder, pluginName) {
    const pluginPath = path.resolve(pluginsFolder, pluginName);

    const pluginConfig = this.configuration[pluginName];

    if (!pluginConfig) {
      throw new Error(`Plugin ${pluginName} is not present in the configuration, please run: yarn docs`);
    }

    pluginConfig.forEach((envName) => {
      if (!(envName in process.env)) {
        this.robot.logger.warning(`The enviromental variable \x1b[36m ${envName} \x1b[0m is missing for plugin \x1b[35m ${pluginName} \x1b[0m`);
      }
    });

    this.robot.load(pluginPath);
  }
}

module.exports = PluginsLoader;
