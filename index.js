/**
 * index.js
 * This is your main app entry point
 */

// Set up express, bodyparser and EJS
const express = require("express");
const session = require("express-session");
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
console.log(typeof bcrypt);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files

//session middleware
app.use(
  session({
    secret: "feastly", // Change this to a random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
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
app.get("/home-page", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/main-page");
  }
  res.render("home-page.ejs", { user: req.session.user });
});

// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

// Add all the route handlers in usersRoutes to the app under the path /planner
const plannerRoutes = require("./routes/planner");
app.use("/planner", plannerRoutes);

// Add all the route handlers in accountsRoutes to the app under the path /accounts
const accountsRoutes = require("./routes/accounts");
app.use("/accounts", accountsRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

////////////////////////////* RECIPES DATABASE *////////////////////////////
// recipe database taken from the website https://eightportions.com/datasets/Recipes/
// const fs = require("fs");
// const path = require("path");

//////////* OPTION 1: Query from the JSON database itself */////////
/* // Function to read and parse JSON file
function readJSONFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

// Function to query recipes from JSON data
function queryRecipes(recipes, query) {
  const results = [];
  Object.keys(recipes).forEach((key) => {
    const recipe = recipes[key];
    if (
      recipe.title &&
      recipe.title.toLowerCase().includes(query.toLowerCase())
    ) {
      results.push(recipe);
    }
  });
  return results;
}

// Read and parse the JSON file
const recipesFilePath = path.join(
  __dirname,
  "recipes",
  "recipes_raw_nosource_fn.json"
);
const recipesData = readJSONFile(recipesFilePath);

// Example query
const searchQuery = "crab"; // Replace with your search query
const results = queryRecipes(recipesData, searchQuery); */

//////////* OPTION 2: Take the data from the JSON database and insert into the SQL database *//////////
// Function to read and parse JSON file
/* function readJSONFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

// Function to clean JSON data by removing null values
function cleanJSONData(data) {
  const cleanedData = {};
  Object.keys(data).forEach((key) => {
    const recipe = data[key];
    if (
      recipe &&
      recipe.title &&
      recipe.ingredients &&
      recipe.instructions &&
      recipe.title !== null &&
      recipe.instructions !== null
    ) {
      // Filter out null ingredients
      recipe.ingredients = recipe.ingredients.filter(
        (ingredient) => ingredient !== null
      );
      cleanedData[key] = recipe;
    }
  });
  return cleanedData;
}

// Function to parse ingredient string
function parseIngredient(ingredient) {
  const regex = /^(\d+\/\d+|\d+\.\d+|\d+)?\s*(\w+)?\s*(.*)$/;
  const match = ingredient.match(regex);
  if (match) {
    const qty = match[1] || 1; // Default to 1 if no quantity is provided
    const unit = match[2] || ""; // Default to empty string if no unit is provided
    const name = match[3];
    return { qty, unit, name };
  }
  return { qty: 1, unit: "", name: ingredient }; // Default values if parsing fails
}

// Function to insert a single recipe into the database
function insertRecipe(recipe) {
  const { title, ingredients, instructions, picture_link } = recipe;

  // Check for null values in title and instructions
  if (!title || !instructions) {
    console.error("Error: Recipe title or instructions are null");
    return;
  }

  // Insert recipe into recipes table
  global.db.run(
    "INSERT INTO recipes (recipe_name, recipe_description, recipe_duration, recipe_servings) VALUES (?, ?, ?, ?)",
    [title, instructions, 30, 4], // Adjust duration and servings as needed
    function (err) {
      if (err) {
        console.error("Error inserting recipe:", err);
        return;
      }

      const recipeId = this.lastID;

      // Insert ingredients into recipe_ingredients table
      ingredients.forEach((ingredient) => {
        if (ingredient) {
          // Check for null ingredient
          const { qty, unit, name } = parseIngredient(ingredient);
          global.db.run(
            "INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_qty, ingredient_unit) VALUES (?, ?, ?, ?)",
            [recipeId, name, qty, unit],
            function (err) {
              if (err) {
                console.error("Error inserting ingredient:", err);
              }
            }
          );
        }
      });
    }
  );
}

// Read and parse the JSON file
const recipesFilePath = path.join(
  __dirname,
  "recipes",
  "recipes_raw_nosource_fn.json"
);
const recipesData = readJSONFile(recipesFilePath);

// Clean the JSON data
const cleanedRecipesData = cleanJSONData(recipesData);

// Iterate over the cleaned recipes and insert them into the database
Object.keys(cleanedRecipesData).forEach((key) => {
  const recipe = cleanedRecipesData[key];
  insertRecipe(recipe);
}); */
