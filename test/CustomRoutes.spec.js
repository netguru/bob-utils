const Helper = require('hubot-test-helper');
const { expect } = require('chai');
const request = require('supertest');
const path = require('path');
const sinon = require('sinon');

const CustomRoutes = require('../src/CustomRoutes');

const helper = new Helper(path.resolve(__dirname, './factories/ScriptFactory.js'));
const token = 'a2cvf';

describe('SlackActionsMultiplexer test suite', () => {
  let room;

  beforeEach(() => {
    room = helper.createRoom();
    sinon.stub(process, 'env').value({ ...process.env, ROUTE_TOKEN: token });
  });

  afterEach(() => {
    room.destroy();
    sinon.restore();
    CustomRoutes.destroy();
  });

  it('Should be the same instance', async () => {
    const instance1 = CustomRoutes.getInstance(room.robot);
    const instance2 = CustomRoutes.getInstance(room.robot);

    expect(instance1).to.eql(instance2);
  });

  it('Should create a route and return 200', async () => {
    const router = CustomRoutes.getInstance(room.robot);
    const callback = (req, res) => res.sendStatus(200);
    const endpoint = '/test';

    router.createRoute(endpoint, callback);

    await request(room.robot.server)
      .post(endpoint)
      .set('Authorization', token)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200);
  });

  it('Should create a route and return unauthorized if wrong token', async () => {
    const router = CustomRoutes.getInstance(room.robot);
    const callback = (req, res) => res.sendStatus(200);
    const endpoint = '/test';

    router.createRoute(endpoint, callback);

    await request(room.robot.server)
      .post(endpoint)
      .set('Authorization', 'wrong')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(401);
  });

  it('Should create a route and return unauthorized if no authorization header', async () => {
    const router = CustomRoutes.getInstance(room.robot);
    const callback = (req, res) => res.sendStatus(200);
    const endpoint = '/test';

    router.createRoute(endpoint, callback);

    await request(room.robot.server)
      .post(endpoint)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(401);
  });

  it('Should catch unhandled error end return 500', async () => {
    const router = CustomRoutes.getInstance(room.robot);
    const callback = () => {
      throw new Error('Bad');
    };
    const endpoint = '/test';

    router.createRoute(endpoint, callback);

    await request(room.robot.server)
      .post(endpoint)
      .set('Authorization', token)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(500);
  });

  it('Should throw an error if the endpoint is beeing duplicated', async () => {
    const router = CustomRoutes.getInstance(room.robot);
    const callback = (req, res) => res.sendStatus(200);
    const endpoint = '/test';

    router.createRoute(endpoint, callback);

    expect(() => router.createRoute(endpoint, callback)).to.throw(`Path: ${endpoint} already existd`);
  });
});
