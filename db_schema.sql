-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

-- tables for user account management --
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL, --encrypt/hash before storing--
);

CREATE TABLE diet_pref_options (
    diet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    diet_name TEXT NOT NULL UNIQUE -- ensures consistent diet pref names
);


CREATE TABLE users_diet_pref (
    user_id INTEGER NOT NULL, -- foreign key from users
    diet_id INTEGER NOT NULL, -- foreign key from dietary_preferences

    PRIMARY KEY (user_id, diet_id), -- ensures no duplicate preferences per user
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY(diet_id) REFERENCES diet_pref_options(diet_id) ON DELETE CASCADE
);

-- tables for group planning --
CREATE TABLE groups (
    group_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_leader INTEGER NOT NULL, -- foreign key from users --
    group_name TEXT NOT NULL,
    group_description TEXT NOT NULL,
    group_meet_location TEXT NOT NULL,
    group_meet_date DATE NOT NULL,
    group_meet_time TIME NOT NULL,

    FOREIGN KEY(group_leader) REFERENCES users(user_id);
);

CREATE TABLE group_members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups --
    user_id INTEGER NOT NULL, -- foreign key from users --

    FOREIGN KEY(group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (group_id, user_id)  -- make sure no dupe user per group
);

-- tables for group meetup food --
CREATE TABLE group_food (
    food_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups --
    food_name TEXT NOT NULL,
    food_confirmed BOOLEAN NOT NULL,

    FOREIGN KEY(group_id) REFERENCES groups(group_id);
);

CREATE TABLE food_votes (
    food_id INTEGER NOT NULL,  -- Foreign key from group_food
    user_id INTEGER NOT NULL,  -- Foreign key from users
    PRIMARY KEY (food_id, user_id),  -- Ensures that each user can vote only once per food item

    FOREIGN KEY(food_id) REFERENCES group_food(food_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- tables for group shared grocery list --
CREATE TABLE grocery_list(
    grocery_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL, -- foreign key from groups --
    grocery_name TEXT NOT NULL,
    grocery_qty INTEGER NOT NULL,
    grocery_unit TEXT,
    grocery_purchased BOOLEAN DEFAULT 0,

    FOREIGN KEY(group_id) REFERENCES groups(group_id);
);

-- tables for recipe and cooking assistant --
CREATE TABLE recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_name TEXT NOT NULL, 
    recipe_description TEXT NOT NULL,
    recipe_duration INTEGER NOT NULL CHECK(recipe_duration>0), --duration in minutes--
    recipe_servings INTEGER NOT NULL CHECK(recipe_servings>0) --minimum more than 0 servings per recipe--
);

CREATE TABLE recipe_ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,  -- foreign key from recipes --
    ingredient_name TEXT NOT NULL,
    ingredient_qty REAL NOT NULL CHECK(ingredient_qty>0),
    ingredient_unit TEXT NOT NULL,

    FOREIGN KEY(recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE recipe_tools (
    tool_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL, -- foreign key from recipes --
    tool_name TEXT NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE steps (
    step_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL, -- foreign key from recipes --
    step_number INTEGER NOT NULL CHECK(step_number > 0),
    step_instruction TEXT NOT NULL,
    step_duration INTEGER DEFAULT 0 CHECK(step_duration >= 0),

    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    UNIQUE (recipe_id, step_number)  -- make sure no dupe steps per recipe
);


-- Insert default data (if necessary here)
INSERT INTO diet_pref_options (diet_name) 
VALUES ('Vegetarian'), ('Vegan'), ('Halal'), ('Lactose intolerant');


COMMIT;

