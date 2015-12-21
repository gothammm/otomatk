const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');


function Address() {
  Iridium.Instance.apply(this, arguments);
};
// Inherting Iridium Instance to User instance.
require('util').inherits(Address, Iridium.Instance);

Address.schema = {
  _id: false,
  zipcode: { $type: Number, $required: true },
  city: { $type: String, $required: true },
  state: { $type: String, $required: false }
};

Address.collection = 'address';

module.exports = Address;

