const faker = require('faker');
const _ = require('lodash');

const UserFactory = (properties = {}) => {
  const user = {
    id: faker.random.uuid(),
    name: faker.name.firstName(),
    profile: {},
  };

  const profile = {
    real_name: `${user.name} ${faker.name.lastName()}`,
    title: faker.name.jobTitle(),
    phone: faker.phone.phoneNumber(),
    skype: faker.internet.userName(),
    email: faker.internet.email(),
    fields: {},
  };

  _.merge(user.profile, profile);
  _.merge(user, properties);

  user.setProfileField = (field, value) => {
    user.profile[field] = value;
    return user;
  };

  user.setCustomProfileField = (field, value) => {
    user.profile.fields[field] = {
      label: field,
      value,
    };
    return user;
  };
  return user;
};

module.exports = UserFactory;
