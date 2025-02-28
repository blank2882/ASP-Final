/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
console.log(typeof bcrypt);

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files


//session middleware
app.use(session({
    secret: 'feastly', // Change this to a random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));


// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Handle requests to the main page 
app.get('/', (req, res) => {
    res.render("main-page.ejs");
});

// handle requests to the login page
app.get('/login-page', (req, res) => {
    res.render("login-page.ejs");
});

// handle requests to the signup page
app.get('/signup-page', (req, res) => {
    res.render("signup-page.ejs");
});

// handle requests to the home page, return to main page if not in session
app.get('/home-page', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/main-page');
    }
    res.render("home-page.ejs", { user: req.session.user });
});

// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);


// Add all the route handlers in usersRoutes to the app under the path /planner
const plannerRoutes = require('./routes/planner');
app.use('/planner', plannerRoutes);


// Add all the route handlers in accountsRoutes to the app under the path /accounts
const accountsRoutes = require('./routes/accounts');
app.use('/accounts', accountsRoutes);


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

