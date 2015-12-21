'use strict';
const R = require('ramda');
const OtomatkError = require('./error');

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

    this.seneca.add({ role: roleName, plugin: name, cmd: 'save' }, (args, done) => {
      let modelData = args.data || args.entity || null;
      if (!modelData || !R.is(Object, modelData)) {
        return done(new OtomatkError(`Invalid ${name} object`, 400));
      }
      
      // Sanitize incoming object.
      modelData = R.pickBy((v, k) => R.keys(Model.schema).indexOf(k) >= 0, modelData);
      
      if (!R.isArrayLike(modelData) && (modelData._id || modelData.id) && Model.hooks.onSaving) {
        var changes = R.pickBy((val, key) => ['id', '_id'].indexOf(val) <= -1, modelData);
        Model
          .get(modelData._id || modelData.id)
          .then((m) => m.save(changes))
          .then((updated) => done(null, _self._transformFromDB(updated.toJSON())))
          .catch((err) => {
            return done(new OtomatkError(err));
          });
      } else if(modelData._id && (Model.hooks && !Model.hooks.onSaving)) {
        // Updates the document
        Model.create(modelData, { upsert: true }).then((data) => {
          return done(null, data.length ? R.map(x => _self._transformFromDB(x.toJSON()), data) : _self._transformFromDB(data.toJSON()));
        }).catch((err) => {
          return done(new OtomatkError(err));
        });
      } else {
        Model.insert(modelData).then((data) => {
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
      Model.findOne(query).then((data) => {
        return done(null, data ? data.toJSON() : null);
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });

    this.seneca.add({ role: roleName, plugin: name, cmd: 'remove' }, (args, done) => {
      let id = args.id || args._id || null;
      Model.remove(id).then((removed) => {
        return done(null, { removed: removed });
      }).catch((err) => {
        return done(new OtomatkError(err));
      });
    });
  }
}

module.exports = Senecafy;