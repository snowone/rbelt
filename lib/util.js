'use strict'

var util = function() {}

// shrink replaces continuous white spaces with a single one
// and trims the result by removing leading/trailing spaces
util.shrink = function(str) {
  if (str !== null && str !== undefined) {
    return str.replace(/\s+/g, ' ').trim();
  }
  return str;
}

module.exports = util;