// routes for accounts

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();


// render login form
router.get('/login-page', (req, res) => {
    res.render('login-page');
});

// login form POST
router.post('/login-page', (req, res) => {
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

// render signup form with diet pref options
router.get('/signup-page', (req, res) => {
    const dietPrefQuery = 'SELECT * FROM diet_pref_options';

    global.db.all(dietPrefQuery, [], (err, dietOptions) => {
        if (err) {
            console.error('Error retrieving diet preferences:', err);
            return res.status(500).send('Error retrieving diet preferences');
        }
        res.render('signup-page', { dietOptions });
    });
});


// signup form POST
router.post('/signup-page', (req, res) => {
    const { username, email, password, dietPreferences } = req.body;

    // hash user password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        // insert user data into user table
        global.db.run(
            'INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)',
            [username, email, hash],
            function (err) {
                if (err) {
                    return res.status(500).send('Error creating user');
                }

                // get user_id to insert diet pref
                const userId = this.lastID;

                // insert user diet pref into user_diet_pref table
                if (dietPreferences && dietPreferences.length > 0) {
                    // user diet pref is parsed in as array
                    const dietNames = Array.isArray(dietPreferences) ? dietPreferences : [dietPreferences];

                    // insert for each instance in array
                    dietNames.forEach((dietName) => {
                        global.db.run(
                            'INSERT INTO users_diet_pref (user_id, diet_name) VALUES (?, ?)',
                            [userId, dietName],
                            function (err) {
                                if (err) {
                                    console.error('Error inserting diet preference:', err);
                                }
                            }
                        );
                    });
                }

                // signup success, redirect to mainpage to login
                res.redirect('/');
            }
        );
    });
});

// logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Could not log out.");
        }
        res.redirect('/');
    });
});



module.exports = router;