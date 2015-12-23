'use strict';
const R = require('ramda');
const OtomatkError = require('./error');
const ObjectID = require('mongodb').ObjectID;
const Bluebird = require('bluebird');

class Senecafy {
  constructor(seneca, role) {
    if (!seneca) {
      throw new Error('Invalid Seneca Instance');
    }
    if (!role) {
      throw new Error('Requires a role name for the seneca action patterns.');
    }
    this.seneca = seneca;
    this.role = role;
  }
  load(model) {
    if (!model || !R.is(Object, model)) {
      throw new Error('Invalid Model');
    }
    R.isArrayLike(model) ? R.forEach(this._generateSenecaActions.bind(this), model) : this._generateSenecaActions(model);
  }
  _transformFromDB(document) {
    if (document.value && document.lastErrorObject) {
      var upsert = {};
      if (document.lastErrorObject.updatedExisting) {
        upsert._isUpdated = true;
      }
      return R.merge(document.value, upsert);
    }
    return document;
  }
  _generateSenecaActions(model) {
    const _self = this;
    if (!model.collectionName) {
      throw new Error('Model Name is Invalid');
    }
    let Model = model;
    const name = model.collectionName;
    const roleName = this.role;
    
    this.seneca.add({ role: roleName, plugin: name, cmd: 'update' }, (args, done) => {
      let modelData = args.data || args.entity || null;
      if (!modelData || !R.is(Object, modelData)) {
        return done(new OtomatkError(`Invalid ${name} object`, 400));
      }
      if (args.id) {
        modelData._id = args.id;
      }
      if (!modelData._id) {
        return done(new OtomatkError(`ID param for updating ${name} object, cannot be null`, 400));
      }
      if (R.is(String, modelData._id)) {
        modelData._id = new ObjectID(modelData._id);
      }
      modelData = R.pickBy((v, k) => R.keys(Model.schema).indexOf(k) >= 0, modelData);
      
      return Bluebird.resolve().then(() => {
        // Not sure if validation needs to be done during update.
        // var validation = Model.helpers.validate(modelData);
        // if (validation.failed) return Bluebird.reject(validation.error);
        
        if (Model.hooks && Model.hooks.onUpdating) {
          return Model.hooks.onUpdating(modelData);
        }
        return modelData;
      }).then((doc) => {
        var changes = R.pickBy((val, key) => ['id', '_id'].indexOf(key) <= -1, doc);
        return Model.update({ _id: doc._id }, { $set: changes });
      }).then((updated) => {
        return done(null, { updated: updated });
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });

    this.seneca.add({ role: roleName, plugin: name, cmd: 'save' }, (args, done) => {
      let modelData = args.data || args.entity || null;
      let options = args.options || {};
      if (!modelData || !R.is(Object, modelData)) {
        return done(new OtomatkError(`Invalid ${name} object`, 400));
      }
      if (args.id) {
        modelData._id = args.id;
      }
      
      // Sanitize incoming object.
      modelData = R.pickBy((v, k) => R.keys(Model.schema).indexOf(k) >= 0, modelData);
      
      if (!R.isArrayLike(modelData) && (modelData._id || modelData.id)) {
        var changes = R.pickBy((val, key) => ['id', '_id'].indexOf(key) <= -1, modelData);
        // Check if provided object id is valid or not
        if (!ObjectID.isValid(modelData._id.toString())) {
          return done(new OtomatkError('Invalid ID parameter'));
        } else {
          modelData._id = R.is(String, modelData._id) ? new ObjectID(modelData._id) : modelData._id;
        }
        
        // Creating model instance to update changes.
        var ModelInstance = Model.helpers.wrapDocument(modelData, false, false);
        
        // Validate incoming object.
        var validation = Model.helpers.validate(modelData);
        if (validation.failed) return done(new OtomatkError(validation.error));
        
        ModelInstance
          .save(changes)
          .then((updated) => done(null, updated.toJSON()))
          .catch((err) => {
            return done(new OtomatkError(err));
          });
      } else {
        Model.insert(modelData, options).then((data) => {
          return done(null, data.length ? R.map(x => _self._transformFromDB(x.toJSON()), data) : _self._transformFromDB(data.toJSON()));
        }).catch((err) => {
          return done(new OtomatkError(err));
        });
      }
    });

    this.seneca.add({ role: roleName, plugin: name, cmd: 'list' }, (args, done) => {
      let query = args.query || args.data || args.entity || null;
      let fields = args.fields || {};
      let options = args.options || {};
      if (!query || !R.is(Object, query) || R.isArrayLike(query)) { query = {}; }
      if (query.id) {
        query._id = query.id;
        query = R.pickBy((val, key) => key.toLowerCase() !== 'id', query);
      }
      var Cursor = Model.find(query, fields);

      if (options && options.skip) {
        Cursor = Cursor.skip(options.skip);
      }

      if (options && options.limit) {
        Cursor = Cursor.limit(options.limit);
      }

      if (options && options.returnCursor) {
        return done(null, Cursor);
      }

      Cursor.toArray().then((data) => {
        if (data && data.length) {
          return done(null, R.map(x => x.toJSON(), data));
        }
        return done(null, []);
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });

    this.seneca.add({ role: roleName, plugin: name, cmd: 'load' }, (args, done) => {
      let query = args.query || args.data || args.entity || null;
      if (!query || !R.is(Object, query) || R.isArrayLike(query)) { query = {}; }
      if (query.id) {
        query._id = query.id;
        query = R.pickBy((val, key) => key.toLowerCase() !== 'id', query);
      }
      if (args.id) {
        query._id = args.id;
      }
      Model.findOne(query).then((data) => {
        return done(null, data ? data.toJSON() : null);
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });

    this.seneca.add({ role: roleName, plugin: name, cmd: 'remove' }, (args, done) => {
      let id = args.id || args._id || null;
      if (!ObjectID.isValid(id)) {
        return done(new OtomatkError('Invalid ID parameter'));
      }
      if (R.is(String, id)) {
        id = new ObjectID(id);
      }
      Model.remove(id).then((removed) => {
        return done(null, { removed: removed });
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });
  }
}

module.exports = Senecafy;