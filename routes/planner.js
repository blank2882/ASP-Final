const express = require("express");
const router = express.Router();

// function to generate 8 character alphanumeric grp code
function generateGroupCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// render create group page
router.get('/create-group', (req, res) => {
    const groupCode = generateGroupCode(); //generate unique group code
    res.render('create-group', { groupCode }); 
});

// create new group POST
router.post("/create-group", (req, res) => {
	const { group_name, group_desc, meet_location, meet_date, meet_time, group_code } = req.body;

	// group leader is current logged in user
    const groupLeaderId = req.session.user?.user_id;

    if (!groupLeaderId) {
        return res.status(401).send('User not logged in');
    }

	// insert create group form data into group table
	global.db.run(
        `INSERT INTO groups (group_leader, group_name, group_description, group_meet_location, group_meet_date, group_meet_time, group_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [groupLeaderId, group_name, group_desc, meet_location, meet_date, meet_time, group_code],
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

					// create new group successfully, redirect to group page
					res.redirect(`/planner/group/${groupId}`);
				}
			);
		}
	);
});

// join group with code POST
router.post('/join-group', (req, res) => {
    const { group_code } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    // find group using group code
    global.db.get(
        `SELECT group_id FROM groups WHERE group_code = ?`,
        [group_code],
        (err, group) => {
            if (err || !group) {
                console.error('Error finding group:', err);
                return res.status(404).send('Group not found');
            }

            const groupId = group.group_id;

            // check if already member
            global.db.get(
                `SELECT * FROM group_members WHERE group_id = ? AND user_id = ?`,
                [groupId, userId],
                (err, existingMember) => {
                    if (err) {
                        console.error('Error checking group membership:', err);
                        return res.status(500).send('Error checking group membership');
                    }

					// redirect to group page if already member
                    if (existingMember) {
                        return res.redirect(`/planner/group/${groupId}`);
                    }

                    // add if not member
                    global.db.run(
                        `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
                        [groupId, userId],
                        function (err) {
                            if (err) {
                                console.error('Error joining group:', err);
                                return res.status(500).send('Error joining group');
                            }

                            // redirect to the group page after joining
                            res.redirect(`/planner/group/${groupId}`);
                        }
                    );
                }
            );
        }
    );
});

// individual group page GET
router.get('/group/:groupId', (req, res) => {
    const groupId = req.params.groupId;

    global.db.get(
        `SELECT * FROM groups WHERE group_id = ?`,
        [groupId],
        (err, group) => {
            if (err) {
                console.error('Error fetching group:', err);
                return res.status(500).send('Error fetching group');
            }

            global.db.all(
                `SELECT users.user_id, users.user_name, 
                        GROUP_CONCAT(users_diet_pref.diet_name, ', ') AS diet_preferences
                 FROM group_members
                 JOIN users ON group_members.user_id = users.user_id
                 LEFT JOIN users_diet_pref ON users.user_id = users_diet_pref.user_id
                 WHERE group_members.group_id = ?
                 GROUP BY users.user_id, users.user_name`,
                [groupId],
                (err, members) => {
                    if (err) {
                        console.error('Error fetching group members:', err);
                        return res.status(500).send('Error fetching group members');
                    }

                    global.db.all(
                        `SELECT group_food.*, 
                                COALESCE(SUM(food_votes.vote_value), 0) AS voteCount
                         FROM group_food
                         LEFT JOIN food_votes ON group_food.food_id = food_votes.food_id
                         WHERE group_food.group_id = ?
                         GROUP BY group_food.food_id`,
                        [groupId],
                        (err, groupFood) => {
                            if (err) {
                                console.error('Error fetching group food:', err);
                                return res.status(500).send('Error fetching group food');
                            }

                            global.db.all(
                                `SELECT * FROM shopping_list WHERE group_id = ?`,
                                [groupId],
                                (err, shoppingList) => {
                                    if (err) {
                                        console.error('Error fetching shopping list:', err);
                                        return res.status(500).send('Error fetching shopping list');
                                    }

                                    res.render('group-page', {
                                        group,
                                        members,
                                        groupFood,
                                        shoppingList,
                                        user: req.session.user,
                                        messages: req.flash()
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

// suggest food POST 
router.post('/suggest-food', (req, res) => {
    const { groupId, foodName } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    global.db.run(
        `INSERT INTO group_food (group_id, user_id, food_name, food_confirmed) VALUES (?, ?, ?, ?)`,
        [groupId, userId, foodName, 0], 
        function (err) {
            if (err) {
                console.error('Error suggesting food:', err);
                req.flash('error', 'Error suggesting food');
            } else {
                req.flash('success', 'Food suggestion added successfully');
            }

            res.redirect(`/planner/group/${groupId}`);
        }
    );
});

// food voting POST 
router.post('/vote-food', (req, res) => {
    const { foodId, groupId, voteValue } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    global.db.get(
        `SELECT * FROM food_votes WHERE food_id = ? AND user_id = ?`,
        [foodId, userId],
        (err, existingVote) => {
            if (err) {
                console.error('Error voting: ', err);
                req.flash('error', 'Error voting');
                return res.redirect(`/planner/group/${groupId}#food`);
            }

            if (existingVote) {
                global.db.run(
                    `UPDATE food_votes SET vote_value = ? WHERE food_id = ? AND user_id = ?`,
                    [voteValue, foodId, userId],
                    function (err) {
                        if (err) {
                            console.error('Error updating vote:', err);
                            req.flash('error', 'Error voting');
                        } else {
                            req.flash('success', 'Voted successfully');
                        }

                        res.redirect(`/planner/group/${groupId}#food`);
                    }
                );
            } else {
                global.db.run(
                    `INSERT INTO food_votes (food_id, group_id, user_id, vote_value) VALUES (?, ?, ?, ?)`,
                    [foodId, groupId, userId, voteValue],
                    function (err) {
                        if (err) {
                            console.error('Error inserting vote:', err);
                            req.flash('error', 'Error voting');
                        } else {
                            req.flash('success', 'Voted successfully');
                        }

                        res.redirect(`/planner/group/${groupId}#food`);
                    }
                );
            }
        }
    );
});

// delete food suggestion
router.post('/delete-food', (req, res) => {
    const { foodId, groupId } = req.body;

    global.db.run(
        `DELETE FROM group_food WHERE food_id = ?`,
        [foodId],
        function (err) {
            if (err) {
                console.error('Error deleting food suggestion:', err);
                req.flash('error', 'Error deleting food suggestion');
            } else {
                req.flash('success', 'Food suggestion deleted successfully');
            }

            res.redirect(`/planner/group/${groupId}#food`);
        }
    );
});

// confirm food suggestion
router.post('/confirm-food', (req, res) => {
    const { foodId, groupId } = req.body;

    global.db.run(
        `UPDATE group_food SET food_confirmed = 1 WHERE food_id = ?`,
        [foodId],
        function (err) {
            if (err) {
                console.error('Error confirming food suggestion:', err);
                req.flash('error', 'Error confirming food suggestion');
            } else {
                req.flash('success', 'Food suggestion confirmed successfully');
            }

            res.redirect(`/planner/group/${groupId}#food`);
        }
    );
});

// add ingredient POST
router.post('/add-ingredient', (req, res) => {
    const { groupId, ingredientName, quantity, unit } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    global.db.run(
        `INSERT INTO shopping_list (group_id, user_id, ingredient_name, quantity, unit) VALUES (?, ?, ?, ?, ?)`,
        [groupId, userId, ingredientName, quantity, unit],
        function (err) {
            if (err) {
                console.error('Error adding ingredient:', err);
                req.flash('error', 'Error adding ingredient');
            } else {
                req.flash('success', 'Ingredient added successfully');
            }

            res.redirect(`/planner/group/${groupId}#shopping`);
        }
    );
});

// mark as purchased POST
router.post('/mark-purchased', (req, res) => {
    const { itemId, groupId } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    global.db.get(
        `SELECT user_name FROM users WHERE user_id = ?`,
        [userId],
        (err, user) => {
            if (err || !user) {
                console.error('Error fetching user:', err);
                req.flash('error', 'Error fetching user');
                return res.redirect(`/planner/group/${groupId}#shopping`);
            }

            global.db.run(
                `UPDATE shopping_list SET purchased = 1, purchased_by = ? WHERE id = ?`,
                [user.user_name, itemId],
                function (err) {
                    if (err) {
                        console.error('Error marking as purchased:', err);
                        req.flash('error', 'Error when marking as purchased');
                    } else {
                        req.flash('success', 'Ingredient marked as purchased');
                    }

                    res.redirect(`/planner/group/${groupId}#shopping`);
                }
            );
        }
    );
});

// delete ingredient POST
router.post('/delete-ingredient', (req, res) => {
    const { itemId, groupId } = req.body;
    const userId = req.session.user?.user_id;

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    global.db.run(
        `DELETE FROM shopping_list WHERE id = ?`,
        [itemId],
        function (err) {
            if (err) {
                console.error('Error deleting ingredient:', err);
                req.flash('error', 'Error deleting ingredient');
            } else {
                req.flash('success', 'Ingredient deleted successfully');
            }

            res.redirect(`/planner/group/${groupId}#shopping`);
        }
    );
});





// Export the router object so index.js can access it
module.exports = router;
