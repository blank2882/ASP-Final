const express = require('express');
const router = express.Router();

// render create group page
router.get('/create-group', (req, res) => {
    res.render('create-group');
});

// create new group POST
router.post('/create-group', (req, res) => {
    const { group_name, group_desc, meet_location, meet_date, meet_time } = req.body;

    // group leader is logged in user
    const groupLeaderId = req.session.user?.user_id;

    if (!groupLeaderId) {
        return res.status(401).send('User not logged in');
    }

    // insert create group form data into group table
    global.db.run(
        `INSERT INTO groups (group_leader, group_name, group_description, group_meet_location, group_meet_date, group_meet_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [groupLeaderId, group_name, group_desc, meet_location, meet_date, meet_time],
        function (err) {
            if (err) {
                console.error('Error creating group:', err);
                return res.status(500).send('Error creating group');
            }

            // get group_id of new created group
            const groupId = this.lastID;

            // add leader into group_members table
            global.db.run(
                `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
                [groupId, groupLeaderId],
                function (err) {
                    if (err) {
                        console.error('Error adding group leader to group_members:', err);
                        return res.status(500).send('Error adding group leader');
                    }

                    // create new group successfully, redirect to group page
                    res.redirect(`/planner/group/${groupId}`);
                }
            );
        }
    );
});

// individual group page GET
router.get('/group/:groupId', (req, res) => {
    const groupId = req.params.groupId;

    // get group information
    global.db.get(
        `SELECT * FROM groups WHERE group_id = ?`,
        [groupId],
        (err, group) => {
            if (err || !group) {
                console.error('Error fetching group details:', err);
                return res.status(404).send('Group not found');
            }

            // get member information
            global.db.all(
                `SELECT users.user_id, users.user_name 
                 FROM group_members
                 JOIN users ON group_members.user_id = users.user_id
                 WHERE group_members.group_id = ?`,
                [groupId],
                (err, members) => {
                    if (err) {
                        console.error('Error fetching group members:', err);
                        return res.status(500).send('Error fetching group members');
                    }

                    res.render('group-page', { group, members });
                }
            );
        }
    );
});



// Export the router object so index.js can access it
module.exports = router;


