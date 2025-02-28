// routes for accounts

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();


router.get('/', (req, res) => {
    res.render('main-homepage');
});


// render login form
router.get('/login', (req, res) => {
    res.render('login-page.ejs');
});

// login form POST
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    global.db.get('SELECT * FROM users WHERE user_email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(401).send('Invalid email or password');
        }
        bcrypt.compare(password, user.user_password, (err, result) => {
            if (result) {
                req.session.user = user;
                res.redirect('/home-page');
            } else {
                res.status(401).send('Invalid email or password');
            }
        });
    });
});

// render signup form
router.get('/signup', (req, res) => {
    res.render('signup-page');
});

// signup form POST
router.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }
        global.db.run('INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)', [username, email, hash], function(err) {
            if (err) {
                return res.status(500).send('Error creating user');
            }
            res.redirect('/login-page');
        });
    });
});

// logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Could not log out.");
        }
        res.redirect('/login-page');
    });
});



module.exports = router;