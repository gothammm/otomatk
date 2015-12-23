const Iridium = require('iridium');
const ObjectID = require('mongodb').ObjectID;
const R = require('ramda');


function Contact() {
  Iridium.Instance.apply(this, arguments);
};
// Inherting Iridium Instance to User instance.
require('util').inherits(Contact, Iridium.Instance);

Contact.schema = {
  _id: false,
  first_name: { $type: String, $required: true },
  last_name: { $type: String, $required: true },
  email: String
};

Contact.onSaving = (instance, changes) => {
  changes.updatedOn = new Date();
  changes.email = 'test@test.com';
};

Contact.onUpdating = (changes) => {
  changes.updatedOn = new Date();
  changes.email = 'lol@test.com'
  return changes;
};

Contact.collection = 'contacts';

module.exports = Contact;

