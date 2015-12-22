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
  if (changes.$set) {
    changes.$set.updatedOn = new Date();
    changes.$set.email = 'test@test.com';
  }
};

Contact.collection = 'contacts';

module.exports = Contact;

