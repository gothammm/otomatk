const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');
const Address = require('./address');


function User() {
  Iridium.Instance.apply(this, arguments);
};
// Inherting Iridium Instance to User instance.
require('util').inherits(User, Iridium.Instance);

User.schema = {
  _id: false,
  username: { $type: String, $required: true },
  email: String,
  age: Number,
  addresses: { $type: [Address.schema], $required: false }
};

User.collection = 'users';

module.exports = User;

