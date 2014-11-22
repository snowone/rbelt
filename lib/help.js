'use strict'

var help = function() {
};

help.run = function(command) {
  if (!command || command.length === 0) {
    console.log('dummy!');
    return;
  }
  console.log('command: ' + command);
}


module.exports = help;