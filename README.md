# Otomatk

A tiny REST-like mapper for Iridium models with seneca micro-services toolkit and express.js

## Install

```javascript
npm install --save otomatk
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
{ cmd: 'save' }
{ cmd: 'list' }
{ cmd: 'remove' }
{ cmd: 'load' } 
```

**NOTE:** The plugin name for all the senecafied patterns are mostly the name of the Iridium Collection/Model (Model.collectionName)

