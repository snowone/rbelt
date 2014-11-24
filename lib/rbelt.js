'use strict'

var path    = require('path');
var fs      = require('fs');
var request = require('request');
var colors  = require('colors');
var filestoreCookie = require('tough-cookie-filestore');
var lib     = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');

var rbelt = function() {};

// the commands that we support, each command corresponds to a file in current directory
rbelt.commands = [
  'login',
  'list'         // list open review positions
];

rbelt.conf = {
  login: {
    endpoint: 'https://community.topcoder.com/tc',
    module: 'Login',
    requireLogin: false
  },
  list: {
    endpoint: 'http://community.topcoder.com/tc?module=ViewReviewAuctions&pt=',
    detailBaseURL: 'http://community.topcoder.com',
    requireLogin: true,
    filters: ['all', 'mine', 'open']
  },
  tracks: {
    14: 'Assembly',
    23: 'Conceptualization',
     6: 'Specification',
     7: 'Architecture',
     1: 'Component Design',
     2: 'Component Development',
    38: 'First2Finish',
    39: 'Code',
    13: 'Test Suites',
    36: 'Reporting',
    19: 'UI Prototype',
    24: 'RIA Build',
    35: 'Content Creation',
    26: 'Test Scenarios'
  }
};

// set up the request and its cookies
var userhome = getUserHome();
var login = false;
var cookiesFile = path.join(userhome, 'rbelt-cookies.json');
if (!fs.existsSync(cookiesFile)) {
  fs.openSync(cookiesFile, 'w');
} else {
  try {
    var cookies = require(cookiesFile);
    if (cookies['topcoder.com'] && cookies['topcoder.com']['/'] && cookies['topcoder.com']['/']['tcsso']) {
      login = cookies['topcoder.com']['/']['tcsso']['value'].length > 0;
    }
  } catch (err) {
    // we can't parse the cookies file, meaning it is empty or invalid
    // either way, not login yet
  }
}
request = request.defaults({ jar: true });
var jar = request.jar(new filestoreCookie(cookiesFile));
rbelt.request = request.defaults({ jar: jar });

rbelt.load = function(commandName, commandArgs) {
  console.log('running command ' + commandName + (commandArgs.length > 0 ? ' with arguments [' + commandArgs + ']' : ''));
  if (!login && rbelt.conf[commandName].requireLogin) {
    console.log('Please login first by ' + 'rbelt login'.green)
  }
  var command = require(lib + '/' + commandName + '.js');
  if (command) {
    command.run(commandArgs, rbelt);
  } else {
    console.log("command is not supported yet!");
  }
}

function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

module.exports = rbelt;