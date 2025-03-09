-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

-- tables for user account management --
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL --encrypt/hash before storing--
);

CREATE TABLE IF NOT EXISTS diet_pref_options (
    diet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    diet_name TEXT NOT NULL UNIQUE -- ensures consistent diet pref names
);

CREATE TABLE IF NOT EXISTS users_diet_pref (
    user_id INTEGER NOT NULL, -- foreign key from users
    diet_name TEXT NOT NULL, -- foreign key from dietary_preferences

    PRIMARY KEY (user_id, diet_name), -- ensures no duplicate preferences per user
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY(diet_name) REFERENCES diet_pref_options(diet_name) ON DELETE CASCADE
);

-- tables for group planning --
CREATE TABLE IF NOT EXISTS groups (
    group_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_leader INTEGER NOT NULL, -- foreign key from users --
    group_name TEXT NOT NULL,
    group_description TEXT NOT NULL,
    group_meet_location TEXT NOT NULL,
    group_meet_date DATE NOT NULL,
    group_meet_time TIME NOT NULL,
    group_code TEXT NOT NULL UNIQUE, -- unique group code for each group --

    FOREIGN KEY(group_leader) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS group_members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups --
    user_id INTEGER NOT NULL, -- foreign key from users --

    FOREIGN KEY(group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (group_id, user_id)  -- make sure no dupe user per group
);

-- tables for group meetup food --
CREATE TABLE IF NOT EXISTS group_food (
    food_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups --
    user_id INTEGER NOT NULL, -- foreign key from users --
    food_name TEXT NOT NULL,
    food_confirmed BOOLEAN NOT NULL,

    FOREIGN KEY(group_id) REFERENCES groups(group_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS food_votes (
    food_id INTEGER NOT NULL,  -- foreign key from group_food
    group_id INTEGER NOT NULL,  -- foreign key from groups
    user_id INTEGER NOT NULL,  -- foreign key from users
    vote_value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (food_id, user_id),  -- ensures that each user can vote only once per food item

    FOREIGN KEY(food_id) REFERENCES group_food(food_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- tables for group shared shopping list --
CREATE TABLE IF NOT EXISTS shopping_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups
    user_id INTEGER NOT NULL, -- foreign key from users (autofill loged in user)
    ingredient_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    purchased BOOLEAN DEFAULT 0,
    purchased_by TEXT, 
    
    FOREIGN KEY(group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- tables for recipe and cooking assistant --
CREATE TABLE IF NOT EXISTS recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_name TEXT NOT NULL, 
    recipe_description TEXT NOT NULL,
    recipe_duration INTEGER NOT NULL CHECK(recipe_duration>0), --duration in minutes--
    recipe_servings INTEGER NOT NULL CHECK(recipe_servings>0) --minimum more than 0 servings per recipe--
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,  -- foreign key from recipes --
    ingredient_name TEXT NOT NULL,
    ingredient_qty REAL NOT NULL CHECK(ingredient_qty>0),
    ingredient_unit TEXT NOT NULL,

    FOREIGN KEY(recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_tools (
    tool_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL, -- foreign key from recipes --
    tool_name TEXT NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS steps (
    step_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL, -- foreign key from recipes --
    step_number INTEGER NOT NULL CHECK(step_number > 0),
    step_instruction TEXT NOT NULL,
    step_duration INTEGER DEFAULT 0 CHECK(step_duration >= 0),

    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    UNIQUE (recipe_id, step_number)  -- make sure no dupe steps per recipe
);

COMMIT;

-- FOR TESTING PURPOSES, uncomment if you want to test --
-- -- dummy data for testing --
-- INSERT INTO users (user_name, user_email, user_password) VALUES ('admin', 'admin@localhost', 'admin123');
-- INSERT INTO users (user_name, user_email, user_password) VALUES ('user1', 'user1@localhost', 'user123');

INSERT INTO diet_pref_options (diet_name) VALUES ('Vegetarian');
INSERT INTO diet_pref_options (diet_name) VALUES ('Vegan');
INSERT INTO diet_pref_options (diet_name) VALUES ('Seafood allergy');
INSERT INTO diet_pref_options (diet_name) VALUES ('Halal');
INSERT INTO diet_pref_options (diet_name) VALUES ('Lactose intolerant');

-- INSERT INTO users_diet_pref (user_id, diet_id) VALUES (1, 1);
-- INSERT INTO users_diet_pref (user_id, diet_id) VALUES (1, 2);

-- INSERT INTO groups (group_leader, group_name, group_description, group_meet_location, group_meet_date, group_meet_time) VALUES (1, 'Group 1', 'Group 1 Description', 'Location 1', '2021-12-01', '12:00:00');
-- INSERT INTO groups (group_leader, group_name, group_description, group_meet_location, group_meet_date, group_meet_time) VALUES (1, 'Group 2', 'Group 2 Description', 'Location 2', '2021-12-02', '13:00:00');

-- INSERT INTO group_members (group_id, user_id) VALUES (1, 1);
-- INSERT INTO group_members (group_id, user_id) VALUES (1, 2);

-- INSERT INTO group_food (group_id, food_name, food_confirmed) VALUES (1, 'Pizza', 1);
-- INSERT INTO group_food (group_id, food_name, food_confirmed) VALUES (1, 'Burger', 0);

-- INSERT INTO food_votes (food_id, user_id) VALUES (1, 1);
-- INSERT INTO food_votes (food_id, user_id) VALUES (1, 2);

-- INSERT INTO grocery_list (group_id, grocery_name, grocery_qty, grocery_unit, grocery_purchased) VALUES (1, 'Milk', 1, 'Gallon', 0);
-- INSERT INTO grocery_list (group_id, grocery_name, grocery_qty, grocery_unit, grocery_purchased) VALUES (1, 'Eggs', 12, 'Count', 1);

-- INSERT INTO recipes (recipe_name, recipe_description, recipe_duration, recipe_servings) VALUES ('Recipe 1', 'Recipe 1 Description', 30, 4);
-- INSERT INTO recipes (recipe_name, recipe_description, recipe_duration, recipe_servings) VALUES ('Recipe 2', 'Recipe 2 Description', 45, 6);

-- INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_qty, ingredient_unit) VALUES (1, 'Flour', 2, 'Cup');
-- INSERT INTO recipe_ingredients (recipe_id, ingredient_name, ingredient_qty, ingredient_unit) VALUES (1, 'Sugar', 1, 'Cup');

-- INSERT INTO recipe_tools (recipe_id, tool_name) VALUES (1, 'Oven');
-- INSERT INTO recipe_tools (recipe_id, tool_name) VALUES (1, 'Bowl');

-- INSERT INTO steps (recipe_id, step_number, step_instruction, step_duration) VALUES (1, 1, 'Step 1', 5);
-- INSERT INTO steps (recipe_id, step_number, step_instruction, step_duration) VALUES (1, 2, 'Step 2', 10);

-- -- delete data --
-- DELETE FROM users
-- WHERE user_id = 1;
-- DELETE FROM diet_pref_options
-- WHERE diet_id = 1;

-- -- check data inserted --
-- SELECT * FROM users;
-- SELECT * FROM diet_pref_options;
-- SELECT * FROM users_diet_pref;
-- SELECT * FROM groups;
-- SELECT * FROM group_members;
-- SELECT * FROM group_food;
-- SELECT * FROM food_votes;
-- SELECT * FROM grocery_list;
-- SELECT * FROM recipes;
-- SELECT * FROM recipe_ingredients;
-- SELECT * FROM recipe_tools;
-- SELECT * FROM steps;

-- -- check tables created --
-- SELECT name FROM sqlite_master WHERE type='table';

-- -- clean up --
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS diet_pref_options;
-- DROP TABLE IF EXISTS users_diet_pref;
-- DROP TABLE IF EXISTS groups;
-- DROP TABLE IF EXISTS group_members;
-- DROP TABLE IF EXISTS group_food;
-- DROP TABLE IF EXISTS food_votes;
-- DROP TABLE IF EXISTS grocery_list;
-- DROP TABLE IF EXISTS recipes;
-- DROP TABLE IF EXISTS recipe_ingredients;
-- DROP TABLE IF EXISTS recipe_tools;
-- DROP TABLE IF EXISTS steps;




