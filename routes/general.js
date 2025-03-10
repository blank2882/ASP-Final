const express = require("express");
const router = express.Router();


router.get('/home-page', (req, res) => {
    if (!req.session.user) {
        return res.redirect("/main-page");
    }

    const userId = req.session.user.user_id;

    // Fetch the groups that the user is a member of, excluding past groups and sorted by date
    global.db.all(
        `SELECT groups.group_id, groups.group_name, groups.group_description, 
                groups.group_meet_location, groups.group_meet_date, groups.group_meet_time
         FROM group_members
         JOIN groups ON group_members.group_id = groups.group_id
         WHERE group_members.user_id = ? 
         AND groups.group_meet_date >= DATE('now') -- Exclude groups with dates before today
         ORDER BY groups.group_meet_date ASC`,
        [userId],
        (err, groups) => {
            if (err) {
                console.error("Error fetching user groups:", err);
                return res.status(500).send("Error fetching user groups");
            }

            res.render("home-page.ejs", { user: req.session.user, groups });
        }
    );
});

module.exports = router;