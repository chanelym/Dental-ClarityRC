require('dotenv').config();
// server.js

// set up ======================================================================
// get all the tools we need
let express  = require('express');
let app      = express(); //calling on express stored in line 5
let port     = process.env.PORT || 8080; //first arg looks for an env (environment) file saved in another foler
const MongoClient = require('mongodb').MongoClient
const { ObjectID } = require('mongodb')
let mongoose = require('mongoose');
let passport = require('passport');
let flash    = require('connect-flash');

let morgan       = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser   = require('body-parser');
let session      = require('express-session');

let configDB = require('./config/database.js');

let db

// configuration ===============================================================
mongoose.connect(configDB.url, { useNewUrlParser: true, useUnifiedTopology: true });
MongoClient.connect(configDB.url, { useUnifiedTopology: true }, function(err, client) {
  if (err) return console.log('MongoDB connection failed:', err.message);
  db = client.db();
  require('./app/routes.js')(app, passport, db, ObjectID);
});

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-for-local-demo', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);