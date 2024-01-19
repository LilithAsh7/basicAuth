const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const usersQueries = require('./usersQueries')
router.use(cookieParser());

function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()){ return next(); }
	    
      else { res.redirect('/') }
	}
}

router.get('/', (req, res) => {
    res.render('login');
})

router.get('/profile',  authenticationMiddleware(), (req, res) => { res.render('profile')});

router.post('/users', usersQueries.createUser);
router.get('/register', (req, res) => { 

    let header;
    if (!req.query.header) {
        header = 'Register new user';
    } else {
        header = req.query.header;
    }
    res.render('register', {header});
});

module.exports = {
    router,
    authenticationMiddleware
}