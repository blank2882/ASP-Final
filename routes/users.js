/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
* 
 */

const express = require("express");
const router = express.Router();

// GEt for organiser-homepage
// router.get('/home-page', (req, res) => {
//     const publishedEventsQuery = `
//         SELECT 
//     `;

    

//     global.db.all(publishedEventsQuery, [], (err, publishedEvents) => {
//         if (err) return res.status(500).send('Error when retrieving published events information');

//         global.db.all(createdEventsQuery, [], (err, createdEvents) => {
//             if (err) return res.status(500).send('Error when retrieving created events information');

//             res.render('organiser-homepage', { publishedEvents, createdEvents });
//         });
//     });
// });


// Export the router object so index.js can access it
module.exports = router;
