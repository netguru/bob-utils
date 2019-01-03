/* eslint-disable class-methods-use-this */
const slackClientFactory = require('../../clients/SlackClientFactory');

class SlackIdMapper {
  constructor(slackClient = slackClientFactory()) {
    this.client = slackClient;
  }

  retreiveCursor(metadata) {
    if (metadata && metadata.next_cursor) {
      return metadata.next_cursor;
    }

    return null;
  }

  async requestUsers(nextCursor) {
    const params = {};
    if (nextCursor) {
      params.cursor = nextCursor;
    }

    const {
      members,
      response_metadata: metadata,
    } = await this.client.users.list(params);

    const cursor = this.retreiveCursor(metadata);

    return { members, cursor };
  }

  isEqualNoDomain(googleEmail, slackEmail) {
    if (!slackEmail) {
      return false;
    }

    return slackEmail && googleEmail
      && googleEmail.replace(/\.[^.]+$/, '') === slackEmail.replace(/\.[^.]+$/, '');
  }

  mapEmailsToSlackIds(usersEmails = [], members) {
    return members.reduce((store, member) => {
      const googleEmail = usersEmails.find(
        email => this.isEqualNoDomain(email, member.profile.email),
      );

      if (!googleEmail) {
        return store;
      }

      return { ...store, [googleEmail]: member.id };
    }, {});
  }

  async getUserId(userEmail) {
    const mappedUsers = await this.getMappedSlackUsers([userEmail]);

    return mappedUsers[userEmail];
  }

  async getMappedSlackUsers(usersEmails, nextCursor = '', mappedAlready = {}) {
    const { members, cursor } = await this.requestUsers(nextCursor);

    const mappedUsers = { ...mappedAlready, ...this.mapEmailsToSlackIds(usersEmails, members) };
    const mapCount = Object.keys(mappedUsers).length;

    if (!cursor || mapCount === usersEmails.length) {
      return mappedUsers;
    }

    return this.getMappedSlackUsers(usersEmails, cursor, mappedUsers);
  }
}

module.exports = SlackIdMapper;
