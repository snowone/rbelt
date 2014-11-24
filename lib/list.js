'use strict'

var cheerio = require('cheerio');
var colors  = require('colors');
var async   = require('async');
var util    = require('./util.js')

var lo = function() {}

lo.run = function(args, rbelt) {
  if (args.length >= 1) {

    var filter = 'all';
    if (args.length >= 2) {
      filter = args[1];
      if (rbelt.conf.list.filters.indexOf(filter.toLowerCase()) == -1) {
        console.log('Filter is not supported.'.red);
        lo.help(rbelt);
        return;
      }
      filter = args[1].toLowerCase();
    }

    rbelt.request(rbelt.conf.list.endpoint + args[0], function(err, response, body) {
      var $ = cheerio.load(body);
      var reviews = [];

      // parse the review opppotunites page to get all listed projects
      $('table.statTableHolder tr').each(function(i, row) {
        // ignore the first two rows (the first one is the title and the second one is the header)
        if (i >= 2) {
          var attrs = $('td.statDk', row);
          reviews.push({
            challenge: util.shrink($(attrs[0]).text()),
            submissions: util.shrink($(attrs[2]).text()),
            startDate: util.shrink($(attrs[3]).text()),
            roles: {},
            detailsLink: $('a', attrs[5]).attr('href')
          });
        }
      });

      // go through each project to retrieve the details (payment, number of open positions etc.)
      async.eachSeries(reviews, function(review, callback) {
        rbelt.request({url:rbelt.conf.list.detailBaseURL + review.detailsLink}, function(err, response, body) {
          if (!body) {
            console.log(('Failed to load ' + review.detailsLink).red);
            return;
          }
          var $ = cheerio.load(body);
          var roles = $('table.formFrame').eq(1);
          $('tr', roles).each(function(i, row) {
            if (i >= 3) {
              // there is a title row, a header row and a white line
              var attrs = $('td.projectCells', row);
              review.roles[util.shrink($(attrs[0]).text())] = {
                number: util.shrink($(attrs[1]).text()),
                payment: util.shrink($(attrs[2]).text()),
                applied: $('input', attrs[3]).attr('checked') ? true : false,
                applicants: []
              };
            }
          });
          var applications = $('table.formFrame').eq(2);
          $('tr', applications).each(function(i, row) {
            if (i >= 2) {
              var attrs = $('td.projectCells', row);
              review.roles[util.shrink($(attrs[1]).text())].applicants.push(
                {
                  handle: util.shrink($(attrs[0]).text()),
                  rating: util.shrink($(attrs[2]).text())}
              );
            }
          });

          // details link is an intermediate data, we do not need it
          delete review.detailsLink;
          callback();
        });
      }, function(err) {
        if (!err) {
          renderReviews(reviews, filter);
        }
      });
    });
  } else {
    console.log('rbelt list track_id filter'.red);
  }
}

// print help message
lo.help = function(rbelt) {
  console.log('Usage  : rbelt list <track_id> <filter>'.green);
  console.log('Tracks : '.green);
  console.log('\t' + JSON.stringify(rbelt.conf.tracks).green);
  console.log('Filters: '.green);
  console.log('\t' + JSON.stringify(rbelt.conf.list.filters).green);
}

// render reviews
function renderReviews(reviews, filter) {

  var mine = true, open = true;
  if (filter === 'mine') {
    open = false;
  } else if (filter === 'open') {
    mine = false;
  }

  for (var i = 0; i < reviews.length; i++) {

    var review = reviews[i];
    if (!mine || !open) {
      var applied = false;
      for (var roleName in review.roles) {
        if (review.roles[roleName].applied) {
          applied = true;
          break;
        }
      }
      if (mine && !applied || open && applied) {
        continue;
      }
    }
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

module.exports = lo;