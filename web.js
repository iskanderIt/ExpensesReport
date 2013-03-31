/**
* BUILD TYPE
* -------------------------------------------------------------------------------------------------
**/
var environment = "prod";

/**
* MODULE DEPENDENCIES
* -------------------------------------------------------------------------------------------------
* include any modules you will use through out the file
**/

var express = require('express')
  , less = require('less')
  , connect = require('connect')
  , everyauth = require('everyauth')
  , nconf = require('nconf')
  , Recaptcha = require('recaptcha').Recaptcha
  //, mongolian = require('mongolian')
  , mongoose = require('mongoose')
;


/**
* CONFIGURATION
* -------------------------------------------------------------------------------------------------
* load configuration settings from ENV, then settings.json.  Contains keys for OAuth logins. See 
* settings.example.json.  
**/
nconf.env().file({ file: 'settings.json' });


/**
* EVERYAUTH AUTHENTICATION
* -------------------------------------------------------------------------------------------------
* allows users to log in and register using OAuth services
**/

everyauth.debug = true;

// Configure Facebook auth
var usersById = {},
    nextUserId = 0,
    usersByFacebookId = {},
    usersByTwitId = {},
    usersByGoogleId = {};
usersByLogin = {
    'user@example.com': addUser({ email: 'user@example.com', password: 'azure' })
};

//everyauth.
//    everymodule.
//    findUserById(function (id, callback) {
//	callback(null, usersById[id]);
//    });

/**
* GOOGLE AUTHENTICATION
*/

everyauth.google
  .appId(nconf.get("google-"+environment).clientId)
  .appSecret(nconf.get("google-" + environment).clientSecret)
  .scope('https://www.googleapis.com/auth/userinfo.profile')
  .handleAuthCallbackError(function (req, res) {
      // If a user denies your app, Google will redirect the user to
      // /auth/google/callback?error=access_denied
      // This configurable route handler defines how you want to respond to
      // that.
      // If you do not configure this, everyauth renders a default fallback
      // view notifying the user that their authentication failed and why.
  })
  .findOrCreateUser(function (sess, accessToken, extra, googleUser) {

      googleUser.refreshToken = extra.refresh_token;
      googleUser.expiresIn = extra.expires_in;

      //console.log("Loggin data [sess] ", sess);
      //console.log("Loggin data [accessToken]  ", accessToken);
      //console.log("Loggin data [extra]  ", extra);
      //console.log("Loggin data [googleUser]  ", googleUser);

      // only alessandro scipioni is allowed
      everyauth.google.redirectPath('/logout');
      var retUser = usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = addUser('google', googleUser));
      if (googleUser.id == "102833435665900602206") {
          everyauth.google.redirectPath('/account');
      }
      //console.log("Loggin data [User] ", retUser);
      //console.log("Loggin data [Users] ", usersByGoogleId);
      //console.log("Loggin data [googleUser edit] ", googleUser);
      return retUser;
  });

everyauth.everymodule.findUserById(function (userId, callback) {
    var user = usersByGoogleId["102833435665900602206"].google;

    //console.log("User Found: ", user);
    
    callback(null, user);
    // User.findById(userId, callback);
    // callback has the signature, function (err, user) {...}
});

// add a user to the in memory store of users.  If you were looking to use a persistent store, this
// would be the place to start
function addUser(source, sourceUser) {
    var user;
    if (arguments.length === 1) {
        user = sourceUser = source;
        user.id = ++nextUserId;
        return usersById[nextUserId] = user;
    } else { // non-password-based
        user = usersById[++nextUserId] = { id: nextUserId };
        user[source] = sourceUser;
    }
    return user;
}




var app = module.exports = express.createServer();
everyauth.helpExpress(app);


/** 
* MONGOOSE CONFIGURATION
*
*/
// var opts = { server: { poolSize: 1, auto_reconnect: false, }, user: '', pass: '' };
// mongoose.createConnection('localhost', 'BilancioNode', 27017, opts);
// var mongoose = require('mongoose');


/**
* CONFIGURATION
* -------------------------------------------------------------------------------------------------
* set up view engine (jade), css preprocessor (less), and any custom middleware (errorHandler)
**/

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('./middleware/locals'));
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'bilancio node' }));
    app.use(everyauth.middleware());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(connect.static(__dirname + '/public'));
    app.use(app.router);
});



/**
* ERROR MANAGEMENT
* -------------------------------------------------------------------------------------------------
* error management - instead of using standard express / connect error management, we are going
* to show a custom 404 / 500 error using jade and the middleware errorHandler (see ./middleware/errorHandler.js)
**/
var errorOptions = { dumpExceptions: true, showStack: true }
app.configure('development', function () { });
app.configure('production', function () {
    errorOptions = {};
});
app.use(require('./middleware/errorHandler')(errorOptions));



/**
* ROUTING
* -------------------------------------------------------------------------------------------------
* include a route file for each major area of functionality in the site
**/
require('./routes/filter')(app);
require('./routes/home')(app);
require('./routes/report')(app);
require('./routes/account')(app);
require('./routes/operation')(app);
require('./routes/analytic')(app);

// Global Routes - this should be last!
require('./routes/global')(app);



/**
* CHAT / SOCKET.IO 
* -------------------------------------------------------------------------------------------------
* this shows a basic example of using socket.io to orchestrate chat
**/

// socket.io configuration
var buffer = [];
var io = require('socket.io').listen(app);


io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 100);
});

io.sockets.on('connection', function (socket) {
    socket.emit('messages', { buffer: buffer });
    socket.on('setname', function (name) {
        socket.set('name', name, function () {
            socket.broadcast.emit('announcement', { announcement: name + ' connected' });
        });
    });
    socket.on('message', function (message) {
        socket.get('name', function (err, name) {
            var msg = { message: [name, message] };
            buffer.push(msg);
            if (buffer.length > 15) buffer.shift();
            socket.broadcast.emit('message', msg);
        })
    });
    socket.on('disconnect', function () {
        socket.get('name', function (err, name) {
            socket.broadcast.emit('announcement', { announcement: name + ' disconnected' });
        })
    })
});


/**
* RUN
* -------------------------------------------------------------------------------------------------
* this starts up the server on the given port
**/


app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

