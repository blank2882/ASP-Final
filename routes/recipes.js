const express = require("express");
const router = express.Router();
const axios = require("axios");

const API_KEY = process.env.SPOONACULAR_API_KEY;

// popular recipe GET
router.get("/popular-recipe-list", async (req, res) => {
    try {
        const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
            params: {
                apiKey: API_KEY,
                sort: "popularity",  // sort by popularity
                number: 10           // 10 recipes
            }
        });

        // render popular recipes list
        res.render("popular-recipe-list.ejs", { recipes: response.data.results });
    } catch (error) {
        console.error("Error fetching popular recipes:", error.message);
        res.status(500).send("Failed to load popular recipes.");
    }
});

// show recipe tools and ingredients
router.get("/:id/cooking-assistant", async (req, res) => {
    const recipeId = req.params.id;
    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: { apiKey: API_KEY }
        });

        // get recipe data
        const recipe = response.data;
        const ingredients = recipe.extendedIngredients;

        // extract tools
        const instructions = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps : [];
        const tools = instructions.flatMap(step => step.equipment).filter(Boolean);

        res.render("cooking-assistant.ejs", {
            recipe,        
            ingredients,  
            tools           
        });
    } catch (error) {
        console.error("Error fetching recipe details:", error.message);
        res.status(500).send("Failed to load recipe details.");
    }
});

// step-by-step cooking instructions GET
router.get("/:id/cooking-steps", async (req, res) => {
    const recipeId = req.params.id;
    const stepNumber = parseInt(req.query.step) || 0; // get step num from query, default to 0

    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: { apiKey: API_KEY }
        });

        const recipe = response.data;
        const instructions = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps : [];

        if (instructions.length === 0) {
            return res.status(404).send("No steps found for this recipe.");
        }

        res.render("cooking-steps.ejs", {
            recipe,
            instructions,
            stepNumber
        });
    } catch (error) {
        console.error("Error fetching recipe steps:", error.message);
        res.status(500).send("Failed to load cooking steps.");
    }
});


module.exports = router;