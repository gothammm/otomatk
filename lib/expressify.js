'use strict';
const R = require('ramda');
const Bluebird = require('bluebird');
const OtomatkError = require('./error');

class Expressify {
  constructor(model) {
    this.model = model;
  }
  nextErr(next) {
    return (err) => next(new OtomatkError(err));
  }
  query() {
    var _model = this.model;
    var _error = this.nextErr;
    return (req, res, next) => {
      let q = req.query.q;
      let options = req.query.options;
      let fields = req.query.fields;

      Bluebird
        .try(() => {
          let Cursor = _model.find(q, fields || {});

          if (options && options.skip) {
            Cursor = Cursor.skip(options.skip);
          }

          if (options && options.sort) {
            Cursor = Cursor.sort(options.sort);
          }

          if (options && options.limit) {
            Cursor = Cursor.limit(options.limit);
          }
          return Cursor.toArray();
        })
        .then((data) => {
          if (!data) {
            return next(new OtomatkError('Error in evaluating cursor data'));
          }
          res.json(R.map(x => x.toJSON(), data));
        })
        .catch(_error(next));
    };
  }
  detail() {
    var _model = this.model;
    var _error = this.nextErr;
    return (req, res, next) => {
      let id = req.params.id || null;
      _model.findOne(id).then((data) => {
        res.json(data.toJSON());
      }).catch(_error(next));
    };
  }
  save() {
    var _model = this.model;
    var _error = this.nextErr;
    return (req, res, next) => {
      var data = req.body || null;
      var id = req.params.id || null;
      if (!R.isArrayLike(data) && (data._id || data.id) && id) {
        var changes = R.pickBy((v, k) => ['_id', 'id'].indexOf(k), data);
        _model.get(data._id || data.id)
          .then((m) => m.save(changes))
          .then((updated) => res.json(updated.toJSON()))
          .catch(_error(next));
      } else {
        _model.create(data, { upsert: true })
          .then((data) => res.json(data.length ? R.map(x => x.toJSON()) : data.toJSON()))
          .catch(_error(next));
      }
    }
  }
  remove() {
    var _model = this.model;
    var _error = this.nextErr;
    return (req, res, next) => {
      var id = req.params.id || null;
      _model.remove(id).then((removed) => {
        res.json({ removed: removed });
      }).catch(_error(next));
    };
  }
}

module.exports = Expressify;