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
const bodyParser = require('body-parser');
const { router, authenticationMiddleware } = require('./server/index')
const sqlSecurity = require('./server/sqlSecurity')
const bcrypt = require('bcrypt')
const saltRounds = 10;

require('dotenv').config();

// Setting app to use bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());
// Removes compatibility issues and lets you use ejs files instead of just html
app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');

const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.db_user,
    host: process.env.db_host,
    database: process.env.db_name,
    password: process.env.db_password,
    port: process.env.db_port
})

passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log(username);
        console.log(password);
        const passwordIsDangerous = sqlSecurity.checkForSqlCharacters(password);
        const usernameIsDangerous = sqlSecurity.checkForSqlCharacters(username);
        if (!usernameIsDangerous && !passwordIsDangerous) {
            pool.query('SELECT * FROM users WHERE username = $1', [username], async (error, results) => {
                if (error) {
                    done(error);
                }
                  // If the result is empty then it knows that no user was found
                if (results.rows.length === 0) {
                    done(null, false);
                } else {
                    const user_id = results.rows[0].id;
                    const username = results.rows[0].username;
                    // When a user is found the supplied password gets hashed
                    const hashedPassword = results.rows[0].password;
                    // The hased password gets compared to the one in the database
                    const passwordMatch = await bcrypt.compare(password, hashedPassword);
                    if(passwordMatch){
                            return done(null, username);
                    } else {
                        done(null, false);
                    }
                    
                }
            });
        } else {
            console.log("DANGEROUS INPUT DETECTED ON USERNAME OR PASSWORD!");
            res.redirect('/');
        }
    }
  ));

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

app.post('/login', passport.authenticate(
    'local', {
        successRedirect: '/profile',
        failureRedirect: '/'
}));

app.get('/logout', authenticationMiddleware(), (req, res) => {
    req.session.destroy();
    res.redirect('/');
  })

app.use('/', router);

//Starts the application listening for api calls
app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })