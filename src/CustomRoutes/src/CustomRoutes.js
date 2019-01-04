/* eslint-disable no-underscore-dangle */
const Rollbar = require('rollbar');

let instance;

class CustomRoutes {
  constructor(robot) {
    this.robot = robot;
    this.routes = [];

    this.setupMiddleware();
  }

  setupMiddleware() {
    this.robot.server._events.request.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      req.token = req.header('authorization');

      next();
    });
  }

  createRoute(path, callback, method = 'post', requireToken = true) {
    if (this.routes.includes(path)) {
      throw new Error(`Path: ${path} already existd`);
    }

    this.routes.push(path);

    this.robot.router[method](path, async (req, res) => {
      if (requireToken && req.token !== process.env.ROUTE_TOKEN) {
        return res.status(401).send('Unauthorized');
      }

      try {
        return callback(req, res);
      } catch (error) {
        Rollbar.error(error);
        return res.status(500).send('Internal Error');
      }
    });
  }
}

module.exports = {
  getInstance: (robot) => {
    if (!instance) {
      instance = new CustomRoutes(robot);
    }

    return instance;
  },
  destroy: () => {
    instance = null;
  },
};
