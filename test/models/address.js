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

Address.transforms = {
  $document: {
    fromDB: document => {
      if (document.value && document.lastErrorObject) {
        var upsert = {};
        if (document.lastErrorObject.updatedExisting) {
          upsert.isUpdated = true;
        }
        upsert.lastFetched = new Date();
        return R.merge(document.value, upsert);
      }
      document.lastFetched = new Date();
      return document;
    },
    toDB: (document, property, model) => {
      return R.pickBy((val, key) => R.keys(Address.schema).indexOf(key) >= 0, document);
    }
  }
};

Address.schema = {
  _id: false,
  zipcode: { $type: Number, $required: true },
  city: { $type: String, $required: true },
  state: { $type: String, $required: false }
};

Address.collection = 'address';

module.exports = Address;

