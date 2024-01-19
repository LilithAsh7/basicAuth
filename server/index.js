const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const router = express.Router();
const usersQueries = require('./usersQueries')
router.use(cookieParser());
const csrfProtect = csrf({ cookie: true });

function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()){ return next(); }
	    
      else { res.redirect('/') }
	}
}

// Example route for testing CSRF protection
router.get('/test-csrf', csrfProtect, (req, res) => {
    res.render('test-csrf', { csrfToken: req.csrfToken() });
});

router.post('/test-csrf', csrfProtect, (req, res) => {
    res.send('CSRF token is valid!');
});

router.get('/', csrfProtect, (req, res) => {
    res.render('login', { csrfToken: req.csrfToken() });
})

router.get('/profile',  authenticationMiddleware(), (req, res) => { res.render('profile')});

router.post('/users', csrfProtect, usersQueries.createUser);
router.get('/users/:username', usersQueries.getUserByUsername);
router.get('/register', csrfProtect, (req, res) => { 

    let header;
    if (!req.query.header) {
        header = 'Register new user';
    } else {
        header = req.query.header;
    }
    const csrfToken = req.csrfToken();
    console.log("csrfToken in register route: " + csrfToken);
    res.render('register', {csrfToken: csrfToken, header});
});

module.exports = {
    router,
    authenticationMiddleware
}