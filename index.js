/**
 * index.js
 * This is your main app entry point
 */

// Set up express, bodyparser and EJS
const express = require("express");
const session = require("express-session");
const flash = require('express-flash');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
console.log(typeof bcrypt);


// spoonacular api
require('dotenv').config();
const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";
const RANDOM_RECIPES_URL = `https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=10`;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files
app.use(flash());

//session middleware
app.use(
	session({
		secret: "feastly", 
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false }, 
	})
);

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
	if (err) {
		console.error(err);
		process.exit(1); // bail out we can't connect to the DB
	} else {
		console.log("Database connected");
		global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
	}
});

// Handle requests to the main page
app.get("/", (req, res) => {
	res.render("main-page.ejs");
});

// handle requests to the home page, return to main page if not in session
// app.get("/home-page", (req, res) => {
// 	if (!req.session.user) {
// 		return res.redirect("/main-page");
// 	}

// 	const userId = req.session.user.user_id;

// 	// Fetch the groups that the user is a member of
// 	global.db.all(
// 		`SELECT groups.group_id, groups.group_name
// 		 FROM group_members
// 		 JOIN groups ON group_members.group_id = groups.group_id
// 		 WHERE group_members.user_id = ?`,
// 		[userId],
// 		(err, groups) => {
// 			if (err) {
// 				console.error("Error fetching user groups:", err);
// 				return res.status(500).send("Error fetching user groups");
// 			}

// 			res.render("home-page.ejs", { user: req.session.user, groups, recipes: [] });
// 		}
// 	);
// });

// Add all the route handlers in usersRoutes to the app under the path /users
const generalRoutes = require("./routes/general");
app.use("/general", generalRoutes);

// Add all the route handlers in usersRoutes to the app under the path /planner
const plannerRoutes = require("./routes/planner");
app.use("/planner", plannerRoutes);

// Add all the route handlers in accountsRoutes to the app under the path /accounts
const accountsRoutes = require("./routes/accounts");
app.use("/accounts", accountsRoutes);

// Add all the route handlers in generalRoutes to the app under the path /general
// const generalRoutes = require("./routes/general");
// app.use("/general", generalRoutes);

// spoonacular api
const recipesRoutes = require("./routes/recipes");
app.use("/recipes", recipesRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
