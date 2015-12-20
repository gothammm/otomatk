const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');


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
  user = R.pickBy((v, k) => k != 'id', user);
};

User.transforms = {
  $document: {
    fromDB: document => {
      if (document.value && document.lastErrorObject) {
        var upsert = {};
        if (document.lastErrorObject.updatedExisting) {
          upsert.isUpdated = true;
        } else {
          upsert.isNew = true;
        }
        upsert.lastFetched = new Date();
        return R.merge(document.value, upsert);
      }
      document.lastFetched = new Date();
      return document;
    },
    toDB: (document, property, model) => {
      return R.pickBy((val, key) => R.keys(User.schema).indexOf(key) >= 0, document);
    }
  }
};

User.schema = {
  _id: false,
  username: { $type: String, $required: true },
  email: String,
  age: Number
};

User.collection = 'users';

module.exports = User;

