const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');


function Address() {
  Iridium.Instance.apply(this, arguments);
};
// Inherting Iridium Instance to User instance.
require('util').inherits(Address, Iridium.Instance);

Address.onCreating = (address) => {
  address._id = address._id || address.id || new ObjectID();
  if (R.is(String, address._id)) {
    address._id = new ObjectID(address._id);
  }
  address = R.pickBy((v, k) => k != 'id', address);
};


Address.schema = {
  _id: false,
  zipcode: { $type: Number, $required: true },
  city: { $type: String, $required: true },
  state: { $type: String, $required: false }
};

Address.collection = 'address';

module.exports = Address;

