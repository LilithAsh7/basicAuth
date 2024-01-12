// Import and start an express app
const express = require('express');
const app = express();
const port = 3001;
// Passport for use authentication and login purposes.
const passport = require('passport');
const LocalStrategy = require('passport-local');
// Session module for implementing cookies for authentication and authorization.
const session = require('express-session');
const cookieParser = require('cookie-parser');
// Module for connecting to the session database
const pgSession = require('connect-pg-simple')(session);
// Module for working with file paths
const path = require('path');
const usersQueries = require('./server/usersQueries')
const bodyParser = require('body-parser');

require('dotenv').config();

const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.db_user,
    host: process.env.db_host,
    database: process.env.db_name,
    password: process.env.db_password,
    port: process.env.db_port
})
// Setting app to use bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());
// Removes compatibility issues and lets you use ejs files instead of just html
app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');
//Setting up cookies so that authentication can be kept track of
app.use(
    session({
      store: new pgSession({
        pool,
        tablename: 'session'
      }),
      secret: process.env.secret_key,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000}
    })
);
// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()){ return next(); }
	    
      else { res.redirect('/') }
	}
}

passport.use(new LocalStrategy(
    function(username, password, done) {
        return done(null, 'fasd');
    }
  ));

app.get('/', (req, res) => {
    res.render('login');
})

app.get('/profile',  authenticationMiddleware(), (req, res) => { res.render('profile')});


app.post('/login', passport.authenticate(
    'local', {
        successRedirect: '/profile',
        failureRedirect: '/'
}));

app.get('/logout',  authenticationMiddleware(), (req, res) => {
    req.session.destroy();
    res.redirect('/');
  })

app.post('/users', usersQueries.createUser);
app.get('/register', (req, res) => { 

    let header;
    if (!req.query.header) {
        header = 'Register new user';
    } else {
        header = req.query.header;
    }
    res.render('register', {header});
});

//Starts the application listening for api calls
app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })