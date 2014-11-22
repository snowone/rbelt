var colors = require('colors');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var login = function() {
};

var request;
login.run = function(args, rbelt) {
  if (args.length == 0) {
    request = rbelt.request;
    rl.question('Username:', function(username) {
      hidden('Password:', function(password) {
        rl.close();
        doLogin(username, password, rbelt.conf.login, function(success) {
          if (success) {
            console.log('You have login successfully!'.green);
          } else {
            console.log('Login failed. Try again please.'.red);
          }
        });
      });
    });
  } else {
    rl.close();
  }
}

login.help = function() {

}

function doLogin(username, password, conf, callback) {
  request.post({
      url: conf.endpoint,
      form: {
        module: conf.module,
        username: username,
        password: password
      }
    },
    function(err, response, body){
      callback(body.indexOf('Username or password incorrect.') == -1);
    }
  );
}

// the function pipes the query to stdout and replace the input from stdin with *'s
function hidden(query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });

    rl.question(query, function(value) {
        rl.history = rl.history.slice(1);
        callback(value);
    });
}

module.exports = login;