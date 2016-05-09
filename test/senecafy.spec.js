
/* global it */
/* global describe */
/* global after */
/* global process */
/* global before */
const Iridium = require('iridium');
const Chai = require('chai');
const R = require('ramda');
const expect = Chai.expect;
const Core = Iridium.Core;
const User = require('./models/user');
const Address = require('./models/address');
const Contact = require('./models/contact');
const seneca = require('seneca')();
const Bluebird = require('bluebird');
const Otomatk = require('../index');
const Senecafy = Otomatk.Senecafy;
var db, UserModel, AddressModel, ContactModel;
var senecaRole = 'user';
var senecafy = new Senecafy(seneca, senecaRole);

seneca.actAsync = Bluebird.promisify(seneca.act);

before((done) => {
  db = new Core(process.env.DB_URI || 'mongodb://localhost/otomatk');
  return db.connect().then(() => {
    UserModel = new Iridium.Model(db, User);
    AddressModel = new Iridium.Model(db, Address);
    ContactModel = new Iridium.Model(db, Contact);
    senecafy.load([UserModel, AddressModel, ContactModel]);
    done();
  });
});

// Load up with data;
before((done) => {
  var users = [];
  for (var i = 0; i < 100; i++) {
    users.push({
      username: 'test ' + i,
      email: 'test' + i + '@test.com',
      age: i,
      addresses: [{
        city: 'Boston ' + i,
        zipcode: 5000 + i
      }]
    });
  }
  UserModel.collection.insertMany(users, (err, r) => {
    if (err) {
      return done(err);
    }
    done();
  });
});

describe('Senecafy', () => {
  it('should execute list command without any query', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'list' })
      .then((data) => {
        expect(data).to.have.length.of(100);
        expect(data).to.be.instanceOf(Array);
        done();
      })
      .catch((err) => {
        done(err);
      })
  });

  it('should list users whose age is above 50', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'list' }, { data: { age: { $gt: 50 } } })
      .then((data) => {
        expect(data).to.have.length.of.at.least(1);
        expect(data).to.be.instanceOf(Array);
        data.forEach((i) => {
          expect(i.age).to.be.above(50);
        });
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should get user by ID', (done) => {
    var id;
    UserModel.get().then((u) => u.toJSON()).then((data) => {
      id = data._id.toString();
      console.log(id);
      return seneca
        .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'load' }, { id: id });
    }).then((user) => {
      expect(user._id.toString()).to.equal(id);
      expect(user).not.to.be.null;
      expect(user).not.to.be.undefined;
      done();
    });
  });

  it('should get the user details whose age is 50', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'load' }, { data: { age: 50 } })
      .then((data) => {
        expect(data).not.to.be.null;
        expect(data).not.to.be.undefined;
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should save a new user', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, {
        data: {
          username: 'test_user500',
          email: 'test_user500@test.com',
          age: 500,
          addresses: [{
            zipcode: 15125,
            city: 'TestCity'
          }]
        },
        options: {
          w: 1
        }
      })
      .then((data) => {
        expect(data).not.to.be.null;
        expect(data).not.to.be.undefined
        expect(data._id).not.to.be.undefined;
        expect(data.age).to.equal(500);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should update an existing user', (done) => {
    var updateId;
    var preUpdateAge;
    var postUpdateAge = 400;
    var postUpdateAddresses = [{
      zipcode: 1254122,
      city: 'new city'
    }]
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, {
        data: {
          username: 'test_user200',
          email: 'test_user200@test.com',
          age: 200,
          addresses: [{
            zipcode: 15125,
            city: 'TestCity'
          }]
        },
        options: {
          w: 1
        }
      })
      .then((data) => {
        updateId = data._id.toString();
        preUpdateAge = data.age;
        if (data.addresses.length) {
          data.addresses.push(postUpdateAddresses[0]);
        } else {
          data.addresses = postUpdateAddresses;
        }
        data.age = postUpdateAge
        return seneca.actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, { id: updateId, data: data });
      })
      .then((data) => {
        expect(data).not.to.be.null;
        expect(data).not.to.be.undefined
        expect(data._id).not.to.be.undefined;
        expect(data.age).to.equal(postUpdateAge);
        expect(data.age).to.not.equal(preUpdateAge);
        expect(data._id.toString()).to.equal(updateId);
        done();
      });
  });

  it('should add a new address', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: AddressModel.collectionName, cmd: 'save' }, {
        data: {
          zipcode: 111,
          city: 'Boston',
          state: 'Commonwealth'
        },
        options: {
          w: 1
        }
      })
      .then((data) => {
        expect(data).not.to.be.null;
        expect(data).not.to.be.undefined
        expect(data._id).not.to.be.undefined;
        expect(data.city).to.equal('Boston');
        done();
      });
  });

  it('should throw a invalid object error, on trying to save a user data', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' })
      .catch((err) => {
        expect(err).not.to.be.null;
        expect(err).not.to.be.undefined;
        expect(err.reason).not.to.be.undefined;
        expect(err.reason.httpStatusCode).to.equal(400);
        expect(err.reason.message).to.equal(`Invalid ${UserModel.collectionName} object`);
        done();
      });
  });

  it('should throw a validation error, on trying to save an invalid user data', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, {
        data: {
          email: 'testlol@test.com',
          age: 125
        }
      })
      .catch((err) => {
        expect(err).not.to.be.null;
        expect(err).not.to.be.undefined;
        expect(err.reason).not.to.be.undefined;
        expect(err.reason.httpStatusCode).to.equal(400);
        expect(err.reason.message).to.have.length.of.at.least(1);
        done();
      });
  });

  it('should select age and email fields in find query', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'list' }, {
        fields: {
          email: 1,
          age: 1
        }
      })
      .then((data) => {
        expect(data).to.be.instanceOf(Array);
        expect(data).to.have.length.of.at.least(1);
        data.forEach((i) => {
          expect(R.pickBy((v, k) => k === 'username', i)).to.deep.equal({});
        });
        done();
      })
  });

  it('should fetch only 10 records', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'list' }, {
        options: {
          limit: 10
        }
      })
      .then((data) => {
        expect(data).to.be.instanceOf(Array);
        expect(data).to.have.length(10);
        done();
      });
  });

  it('should accept string _id during update', (done) => {
    seneca
      .actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, {
        data: {
          username: 'test_user200',
          email: 'test_user200@test.com',
          age: 200
        },
        options: {
          w: 1
        }
      })
      .then((data) => {
        if (data && data._id) {
          data._id = data._id.toString();
        }
        data.email = 'testnewuser200@test.com';
        return seneca.actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'save' }, { data: data });
      })
      .then((updated) => {
        expect(updated).not.to.be.null;
        expect(updated).not.to.be.undefined;
        expect(updated.email).to.equal('testnewuser200@test.com');
        done();
      })
      .catch(done);
  });

  it('should remove User of a given ID', (done) => {
    UserModel.get().then((u) => u.toJSON()).then((data) => {
      var id = data._id.toString();
      return seneca.actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'remove' }, { id: id });
    }).then((status) => {
      expect(status).not.to.be.null;
      expect(status).not.to.be.undefined;
      expect(status.removed).not.to.be.undefined;
      done();
    });
  });
  
  it('should save a new contact and override it', (done) => {
    ContactModel
    .insert({ email: 'test@test.com', first_name: 'test', last_name: 'test2' }, { w: 1 })
    .then((contact) => {
      var contactJSON = contact.toJSON();
      contactJSON.first_name = 'new test';
      return seneca.actAsync({ role: senecaRole, plugin: ContactModel.collectionName, cmd: 'save' }, {
        data: contactJSON
      });
    })
    .then((c) => {
      expect(c).not.to.be.null;
      expect(c).not.to.be.undefined;
      expect(c.first_name).to.equal('new test');
      expect(c.email).to.equal('test@test.com');
      done();
    });
  });
  
  it('should update a contact', (done) => {
    ContactModel
    .insert({ email: 'test', first_name: 'test', last_name: 'test2' }, { w: 1 })
    .then((contact) => {
      var contactJSON = contact.toJSON();
      return seneca.actAsync({ role: senecaRole, plugin: ContactModel.collectionName, cmd: 'update' }, {
        data: {
          _id: contactJSON._id,
          first_name: 'test 123'
        }
      });
    })
    .then((c) => {
      expect(c).not.to.be.null;
      expect(c).not.to.be.undefined;
      return c;
    }).then(() => {
      ContactModel
      .get({ email: 'lol@test.com' })
      .then((ins) => {
        expect(ins).not.to.be.undefined;
        expect(ins.toJSON().email).to.equal('lol@test.com');
        done();
      });
    })
    .catch(done);
  });
  
  it('should sort by age in descending order', (done) => {
    seneca.actAsync({ role: senecaRole, plugin: UserModel.collectionName, cmd: 'list' }, {
      options: {
        sort: {
          age: -1
        }
      }
    })
    .then((data) => {
      expect(data[0]).not.be.null;
      expect(data[0]).not.be.undefined;
      expect(data[0].age).to.be.above(499);
      done();
    });
  });
});

after((done) => {
  UserModel.collection.drop((err) => {
    if (err) {
      return done(err);
    }
    db.close();
    done();
  });
});