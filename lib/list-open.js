'use strict'

var cheerio = require('cheerio');
var colors = require('colors');
var async = require('async');

var lo = function() {}

lo.run = function(args, rbelt) {
  if (args.length === 1) {
    rbelt.request(rbelt.conf.list.endpoint + args[0], function(err, response, body) {
      var $ = cheerio.load(body);
      var reviews = [];
      $('table.statTableHolder tr').each(function(i, row) {
        // ignore the first two rows (the first one is the title and the second one is the header)
        if (i >= 2) {
          var attrs = $('td.statDk', row);
          var review = {
            challenge: $(attrs[0]).text().replace(/\s+/g, ' '),
            submissions: $(attrs[2]).text().replace(/\s+/g, ' '),
            startDate: $(attrs[3]).text().replace(/\s+/g, ' '),
            roles: {},
            detailsLink: $('a', attrs[5]).attr('href')
          };
          reviews.push(review);
        }
      });

      async.each(reviews, function(review, callback) {
        rbelt.request({url:rbelt.conf.list.detailBaseURL + review.detailsLink}, function(err, response, body) {
          var $ = cheerio.load(body);
          var roles = $('table.formFrame').eq(1);
          $('tr', roles).each(function(i, row) {
            if (i >= 3) {
              var attrs = $('td.projectCells', row);
              var roleName = $(attrs[0]).text().replace(/\s+/g, ' ');
              var role = review.roles[roleName] = {};
              role.number = $(attrs[1]).text().replace(/\s+/g, ' ');
              role.payment = $(attrs[2]).text().replace(/\s+/g, ' ');
              role.applied = $('input', attrs[3]).attr('checked') ? true : false;
              role.applicants = [];
            }
          });
          var applications = $('table.formFrame').eq(2);
          $('tr', applications).each(function(i, row) {
            if (i >= 2) {
              var attrs = $('td.projectCells', row);
              var roleName = $(attrs[1]).text().replace(/\s+/g, ' ');
              var handle = $(attrs[0]).text().replace(/\s+/g, ' ');
              var rating = $(attrs[2]).text().replace(/\s+/g, ' ');
              review.roles[roleName].applicants.push({ handle: handle, rating: rating});
            }
          });
          delete review.detailsLink;
          callback();
        });
      }, function(err) {
        if (!err) {
          for (var i = 0; i < reviews.length; i++) {
            var review = reviews[i];
            console.log('---------------------------------------------------------------------'.red);
            console.log(review.challenge.trim().green);
            console.log(('\tStart: ' + review.startDate).trim().green);
            for (var roleName in review.roles) {
              var role = review.roles[roleName];
              console.log(('\t' + roleName + (role.applied ? '√' : '')).green);
              console.log(('\t\tNumber: ' + role.number).green);
              console.log(('\t\tPayment: ' + role.payment).green);
              if (role.applicants.length > 0) {
                role.applicants.sort(function(a, b) {
                  return b.rating - a.rating;
                });
                console.log(('\t\tApplications: ').green);
                for (var j = 0; j < role.applicants.length; j++) {
                  var applicant = role.applicants[j];
                  console.log(('\t\t\t' + applicant.handle + '\t' + applicant.rating).green);
                }
              }
            }
            console.log('---------------------------------------------------------------------\n'.red);
          }
        }
      });
    });
  }
}

module.exports = lo;