// routes for accounts

const express = require("express");
const router = express.Router();


router.get('/', (req, res) => {
    res.render('main-homepage');
});


// render login form
router.get('/login', (req, res) => {
    res.render('login-page.ejs');
});

// render signup form
router.get('/signup', (req, res) => {
    res.render('signup-page');
});




module.exports = router;