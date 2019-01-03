/* eslint-disable no-trailing-spaces */
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect } = chai;

const SlackIdMapper = require('../src/SlackIdMapper');

describe('Slack emails to ids mapper', () => {
  const userEmails = ['super@malpka.pl'];
  let usersIdMapper;

  const responseOk = {
    ok: true,
    members: [
      {
        id: 'P23OA23D9',
        profile: {
          email: userEmails[0],
        },
      },
      {
        id: 'W012A3CDE',
        profile: {
          email: 'hoho@email.example.com',
        },
      },
    ],
    response_metadata: {
      next_cursor: 'dXNlcjpVMEc5V0ZYTlo=',
    },
  };

  const responseOkNoMetadata = {
    ok: true,
    members: [
      {
        id: 'AADKWL',
        profile: {
          email: userEmails[0],
        },
      },
      {
        id: 'AAAQQDDD',
        profile: {
          email: 'hoho@email.example.com',
        },
      },
      {
        id: 'BOT',
        profile: {
          no_email: '',
        },
      },
    ],
    response_metadata: {
      next_cursor: '',
    },
  };

  const tick = ms => new Promise(resolve => setTimeout(resolve, ms));

  afterEach(() => sinon.restore());

  describe('requestUsers', () => {
    beforeEach(() => {
      usersIdMapper = new SlackIdMapper();
    });

    it('Should return a valid list of users from cursor', async () => {
      sinon.stub(usersIdMapper.client.users, 'list').returns(responseOk);

      const result = await usersIdMapper.requestUsers();

      expect(result).to.eql({
        members: responseOk.members,
        cursor: responseOk.response_metadata.next_cursor,
      });
    });
  });

  describe('getMappedSlackUsers', () => {
    it('Should return users with their ids', async () => {
      sinon.stub(usersIdMapper, 'requestUsers').resolves(responseOkNoMetadata);

      const result = await usersIdMapper.getMappedSlackUsers(userEmails);

      expect(result).to.deep.equal({
        [responseOkNoMetadata.members[0].profile.email]: responseOkNoMetadata.members[0].id,
      });
    });

    it('Should return users with their ids even if domains are different', async () => {
      sinon.stub(usersIdMapper, 'requestUsers').resolves(responseOkNoMetadata);

      const result = await usersIdMapper.getMappedSlackUsers(['super@malpka.com']);

      expect(result).to.deep.equal({
        'super@malpka.com': responseOkNoMetadata.members[0].id,
      });
    });

    it('Should return users after one pagination', async () => {
      const stubbedEmail = 'stub@emal.com';
      const stubbedId = 'O23SDA';

      sinon.stub(responseOk.members[0].profile, 'email').value(stubbedEmail);
      sinon.stub(responseOk.members[0], 'id').value(stubbedId);

      usersIdMapper = new SlackIdMapper({
        users: {
          list: async (params) => {
            if (!params.cursor) {
              return responseOk;
            }
            return responseOkNoMetadata;
          },
        },
      });

      const emails = [...userEmails, stubbedEmail];
      const result = await usersIdMapper.getMappedSlackUsers(emails);

      expect(result).to.deep.equal({
        [responseOkNoMetadata.members[0].profile.email]: responseOkNoMetadata.members[0].id,
        [stubbedEmail]: stubbedId,
      });
    });

    it('Should return user id', async () => {
      const stubbedEmail = 'stub@emal.com';
      const stubbedId = 'O23SDA';

      sinon.stub(responseOk.members[0].profile, 'email').value(stubbedEmail);
      sinon.stub(responseOk.members[0], 'id').value(stubbedId);

      usersIdMapper = new SlackIdMapper({
        users: {
          list: async (params) => {
            if (!params.cursor) {
              return responseOk;
            }
            return responseOkNoMetadata;
          },
        },
      });

      const result = await usersIdMapper.getUserId(stubbedEmail);

      expect(result).to.equal(stubbedId);
    });

    it('Should stop calling slack api when all users found', async () => {
      usersIdMapper = new SlackIdMapper({
        users: {
          list: async (params) => {
            if (!params.cursor) {
              return responseOk;
            }
            return responseOkNoMetadata;
          },
        },
      });

      const mapperSpy = sinon.spy(usersIdMapper, 'getMappedSlackUsers');

      const emails = [...userEmails];
      const result = await usersIdMapper.getMappedSlackUsers(emails);

      await tick(1);

      expect(result).to.deep.equal({
        [userEmails[0]]: responseOk.members[0].id,
      });

      expect(mapperSpy.calledOnce).to.equal(true);
    });


    it('Should return only available users', async () => {
      const notFoundEmail = 'notfound@emal.com';

      usersIdMapper = new SlackIdMapper({
        users: {
          list: async (params) => {
            if (!params.cursor) {
              return responseOk;
            }
            return responseOkNoMetadata;
          },
        },
      });

      const emails = [...userEmails, notFoundEmail];
      const result = await usersIdMapper.getMappedSlackUsers(emails);

      expect(result).to.deep.equal({
        [responseOkNoMetadata.members[0].profile.email]: responseOkNoMetadata.members[0].id,
      });
    });

    it('Should resolve with an empty array if no userEmails specified', async () => {
      sinon.stub(usersIdMapper, 'requestUsers').resolves(responseOkNoMetadata);

      const result = await usersIdMapper.getMappedSlackUsers();

      expect(result).to.eql({});
    });
  });
});
