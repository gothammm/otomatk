const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');
const Address = require('./address');


function User() {
  Iridium.Instance.apply(this, arguments);
};
// Inherting Iridium Instance to User instance.
require('util').inherits(User, Iridium.Instance);

User.onCreating = (user) => {
  user._id = user._id || user.id || new ObjectID();
  if (R.is(String, user._id)) {
    user._id = new ObjectID(user._id);
  }
  user.addresses = user.addresses && user.addresses.length ? user.addresses : [];
  user = R.pickBy((v, k) => k != 'id', user);
};


User.schema = {
  _id: false,
  username: { $type: String, $required: true },
  email: String,
  age: Number,
  addresses: { $type: [Address.schema], $required: false }
};

User.collection = 'users';

module.exports = User;

