# Otomatk

A tiny REST-like mapper for [Iridium](http://sierrasoftworks.github.io/Iridium/) models with [Seneca](http://senecajs.org/) micro-services toolkit and express.js

### Status
[![Build Status](https://travis-ci.org/peek4y/otomatk.svg?branch=master)](https://travis-ci.org/peek4y/otomatk)
## TODO
* More test cases

## Install

```javascript
npm install --save otomatk
```

## Using with Express.js

```javascript
const Otomatk = require('otomatk');
const Expressify = Otomatk.Expressify;
const app = require('express')();

// Generate REST Middlewares for Iridium Model.
const item = new Expressify(ItemModel);

// Usage.
app.get('/', item.get());
app.post('/', item.save());
app.put('/:id', item.save());
app.delete('/:id', item.remove());
app.get('/:id', item.detail());
```

## Using with seneca.
```javascript
const Otomatk = require('otomatk');
const Senecafy = Otomatk.Senecafy;
const seneca = require('seneca')();

// You can provide your own seneca role name.
var senecafy = new Senecafy(seneca, rolename);

senecafy.load([IridiumModel]) 

// You can also send as a single iridium model
senecafy.load(IridiumModel);


// Using the senecafied action patterns of the model.
seneca.act({ role: rolename, plugin: IridiumModel.collectionName, cmd: 'list' }, (err, data) => {
  // Other logic.  
}); 
```

## Available Commands
```
// Similar to seneca data entities.
{ cmd: 'save' } // usage - { cmd: 'save', data: <data object to be saved> }
{ cmd: 'list' } // usage - { cmd: 'list', options: { sort: <mongo field sort indexspecification>, limit: <limit value>, skip: <skip value> }, fields: <field selection> } 
{ cmd: 'remove' } // usage - { cmd: 'remove', id: <object id of record to be removed> }
{ cmd: 'load' } // load - { cmd: 'load', id: <object id to be loaded> }
```

**NOTE:** The plugin name for all the senecafied patterns are mostly the name of the Iridium Collection/Model (Model.collectionName)


