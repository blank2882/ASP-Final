const express = require("express");
const router = express.Router();

// render create group page
router.get("/create-group", (req, res) => {
  res.render("create-group");
});

// create new group POST
router.post("/create-group", (req, res) => {
  const { group_name, group_desc, meet_location, meet_date, meet_time } =
    req.body;

  // group leader is logged in user
  const groupLeaderId = req.session.user?.user_id;

  if (!groupLeaderId) {
    return res.status(401).send("User not logged in");
  }

  // insert create group form data into group table
  global.db.run(
    `INSERT INTO groups (group_leader, group_name, group_description, group_meet_location, group_meet_date, group_meet_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
    [
      groupLeaderId,
      group_name,
      group_desc,
      meet_location,
      meet_date,
      meet_time,
    ],
    function (err) {
      if (err) {
        console.error("Error creating group:", err);
        return res.status(500).send("Error creating group");
      }

      // get group_id of new created group
      const groupId = this.lastID;

      // add leader into group_members table
      global.db.run(
        `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
        [groupId, groupLeaderId],
        function (err) {
          if (err) {
            console.error("Error adding group leader to group_members:", err);
            return res.status(500).send("Error adding group leader");
          }

          // insert 2 rows of dummy data into group food table after the group is created
          global.db.run(
            `INSERT INTO group_food (group_id, food_name, food_confirmed) VALUES (?, ?, ?)`,
            [groupId, "Chicken Burger", 0],
            function (err) {
              if (err) {
                console.error("Error creating group food:", err);
                return res.status(500).send("Error creating group food");
              }
            }
          );

          global.db.run(
            `INSERT INTO group_food (group_id, food_name, food_confirmed) VALUES (?, ?, ?)`,
            [groupId, "Beef Burger", 0],
            function (err) {
              if (err) {
                console.error("Error creating group food:", err);
                return res.status(500).send("Error creating group food");
              }
            }
          );

          // create new group successfully, redirect to group page
          res.redirect(`/planner/group/${groupId}`);
        }
      );
    }
  );
});

// Food voting POST
router.post("/vote", (req, res) => {
  const { foodId, groupId } = req.body;
  const userId = req.session.user?.user_id;

  if (!userId) {
    return res.status(401).send("User not logged in");
  }

  // check if the user has already voted for this food item in the specific group
  global.db.get(
    `SELECT * FROM food_votes WHERE user_id = ? AND group_id = ?`,
    [userId, groupId],
    (err, row) => {
      if (err) {
        console.error("Error checking existing vote:", err);
        return res.status(500).send("Error checking existing vote");
      }

      if (row) {
        // user has already voted for this group, update the vote
        global.db.run(
          `UPDATE food_votes SET food_id = ? WHERE user_id = ? AND group_id = ?`,
          [foodId, userId, groupId],
          (err) => {
            if (err) {
              console.error("Error updating vote:", err);
              return res.status(500).send("Error updating vote");
            }
            res.redirect(`/planner/group/${groupId}`);
          }
        );
      } else {
        // user has not voted for this group, insert a new vote
        global.db.run(
          `INSERT INTO food_votes (user_id, group_id, food_id) VALUES (?, ?, ?)`,
          [userId, groupId, foodId],
          (err) => {
            if (err) {
              console.error("Error inserting vote:", err);
              return res.status(500).send("Error inserting vote");
            }
            res.redirect(`/planner/group/${groupId}`);
          }
        );
      }
    }
  );
});

// add shopping list item POST
router.post("/add-shopping-item", (req, res) => {
  const { groupId, foodName, ingredientName, quantity, unit } = req.body;

  global.db.run(
    `INSERT INTO shopping_list (group_id, food_name, ingredient_name, quantity, unit, purchased, purchased_by)
     VALUES (?, ?, ?, ?, ?, 0, '')`,
    [groupId, foodName, ingredientName, quantity, unit],
    function (err) {
      if (err) {
        console.error("Error adding shopping list item:", err);
        return res.status(500).send("Error adding shopping list item");
      }
      res.redirect(`/planner/group/${groupId}`);
    }
  );
});

// update purchased status POST
router.post("/update-purchased-status", (req, res) => {
  const { itemId, purchased } = req.body;

  global.db.run(
    `UPDATE shopping_list SET purchased = ? WHERE id = ?`,
    [purchased ? 1 : 0, itemId],
    function (err) {
      if (err) {
        console.error("Error updating purchased status:", err);
        return res.status(500).json({ success: false, message: "Error updating purchased status" });
      }
      res.json({ success: true });
    }
  );
});

// update purchased by POST
router.post("/update-purchased-by", (req, res) => {
  const { itemId, purchasedBy } = req.body;

  global.db.run(
    `UPDATE shopping_list SET purchased_by = ? WHERE id = ?`,
    [purchasedBy, itemId],
    function (err) {
      if (err) {
        console.error("Error updating purchased by:", err);
        return res.status(500).json({ success: false, message: "Error updating purchased by" });
      }
      res.json({ success: true });
    }
  );
});

// finalise menu POST
router.post("/finalise-menu/:groupId", (req, res) => {
  const groupId = req.params.groupId;

  // get the food item with the most votes for the specific group
  global.db.get(
    `SELECT group_food.food_id, group_food.food_name, COUNT(food_votes.food_id) AS vote_count
     FROM group_food
     LEFT JOIN food_votes ON group_food.food_id = food_votes.food_id
     WHERE group_food.group_id = ?
     GROUP BY group_food.food_id
     ORDER BY vote_count DESC
     LIMIT 1`,
    [groupId],
    (err, food) => {
      if (err) {
        console.error("Error fetching food votes:", err);
        return res.status(500).send("Error fetching food votes");
      }

      if (food) {
        // update the food item to be confirmed
        global.db.run(
          `UPDATE group_food SET food_confirmed = 1 WHERE food_id = ?`,
          [food.food_id],
          (err) => {
            if (err) {
              console.error("Error confirming food:", err);
              return res.status(500).send("Error confirming food");
            }

            res.json({ success: true, confirmedItems: [food] });
          }
        );
      } else {
        res.json({ success: false, message: "No food items to confirm" });
      }
    }
  );
});

// individual group page GET
router.get("/group/:groupId", (req, res) => {
  const groupId = req.params.groupId;

  global.db.get(
    `SELECT * FROM groups WHERE group_id = ?`,
    [groupId],
    (err, group) => {
      if (err) {
        console.error("Error fetching group:", err);
        return res.status(500).send("Error fetching group");
      }

      global.db.all(
        `SELECT * FROM group_members WHERE group_id = ?`,
        [groupId],
        (err, members) => {
          if (err) {
            console.error("Error fetching group members:", err);
            return res.status(500).send("Error fetching group members");
          }

          global.db.all(
            `SELECT * FROM group_food WHERE group_id = ?`,
            [groupId],
            (err, groupFood) => {
              if (err) {
                console.error("Error fetching group food:", err);
                return res.status(500).send("Error fetching group food");
              }

              global.db.all(
                `SELECT * FROM shopping_list WHERE group_id = ?`,
                [groupId],
                (err, shoppingList) => {
                  if (err) {
                    console.error("Error fetching shopping list:", err);
                    return res.status(500).send("Error fetching shopping list");
                  }

                  res.render("group-page", {
                    group,
                    members,
                    groupFood,
                    shoppingList
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Export the router object so index.js can access it
module.exports = router;
