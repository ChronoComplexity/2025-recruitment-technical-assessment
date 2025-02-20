import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

export interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

export interface ingredient extends cookbookEntry {
  cookTime: number;
}

// Datastore interface definition
export interface cookbook {
  recipes: recipe[];
  ingredients: ingredient[];
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Cookbook object to store recipe
const cookbook = { recipes: [] as recipe[], ingredients: [] as ingredient[] } as cookbook;

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a parsed form that is more understandable
const parse_handwriting = (recipeName: string): string | null => {
  const dashes = /[-_]/g;
  const invalidAlphabet = /[^a-zA-Z\s]/g;
  
  // If no recipe returns null
  if (!recipeName) {
    return null;
  }

  // Removes all the invalid characters (dashes must be first so they're counted as s+)
  recipeName = recipeName.replace(dashes, ' ');
  recipeName = recipeName.replace(invalidAlphabet, '');
  recipeName = recipeName.replace(/\s+/g, ' ');

  // Splits the string, sets the cases correctly for each word then rejoins it
  let recipeWords = recipeName.split(" ");
  recipeWords = recipeWords.map(word => word.slice(0,1).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
  recipeName = recipeWords.join(" ");

  return recipeName;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const input = req.body as (recipe & ingredient);

  // Attempts to add a recipe or ingredient
  try {
    const result = addEntry(input);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Adds an entry to the cookbook if the entry name is unique, the type is either
 * recipe or ingredient, and if it's a recipe, there are no duplicate elements in its
 * required items or if it's an ingredient it's cook time is above 0.
 * 
 * @param input Either a recipe or an ingredient and their details as input
 * @returns empty object
 */
const addEntry = (input: recipe & ingredient): {} => {
  // Filters out non-unique entry names
  if (cookbook.recipes.some(entry => (entry.name === input.name)) ||
  cookbook.ingredients.some(entry => (entry.name === input.name))) {
    throw new Error('Entry names must be unique, entry name already taken.');
  }

  // Decides what to do based on input types
  if (input.type === "recipe") {
    // Checks for duplicate names in required items
    const requiredNames = input.requiredItems.map(entry => entry.name);
    if (requiredNames.some((entry, index) => index !== requiredNames.indexOf(entry))) {
      throw new Error('Recipe requiredItems can only have one element per name.');
    }
    cookbook.recipes.push(input);
  } else if (input.type === "ingredient") {
    // Checks cookTime is above or equal to 0
    if (input.cookTime < 0) {
      throw new Error('cookTime can only be greater than or equal to 0');
    }
    cookbook.ingredients.push(input);
  } else {
    throw new Error('Type can only be "recipe" or "ingredient".');
  }
  
  return {};
}

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const { name } = req.query as { name: string };

  try {
    const result = getEntry(name);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Gets the recipe corresponding to the name given if it is present in the cookbook as
 * a recipe, and all the ingredients and recipes within the recipe's required items are
 * also present in the cookbook, with all subrecipes' ingredients present in the cookbook.
 * 
 * @param name The name of the entry that we are trying to retrieve from the cookbook.
 * @returns requestedRecipe, the corresponding recipe requested
 */
const getEntry = (name: string): recipe => {
  // Checks for recipe with a matching name in the cookbook
  const requestedRecipe = cookbook.recipes.find(recipe => recipe.name === name);
  if (!requestedRecipe) {
    throw new Error('Recipe with corresponding name not found.');
  }

  // Checks all required items in recipe are also valid
  if (!validateRecipe(name)) {
    throw new Error('The recipe contains ingredients or recipes that are not in the cookbook.');
  }

  return requestedRecipe;
}

/**
 * Function that checks whether a recipe and all its ingredients and recipes
 * used to create it exist in the cookbook.
 * 
 * @param name The name of the recipe being checked for.
 * @returns boolean stating whether the recipe and all its items are valid
 */
const validateRecipe = (name: string): boolean => {
  const requestedRecipe = cookbook.recipes.find(recipe => recipe.name === name);
  // Filters out all required items that are ingredients in the cookbook.
  const requiredRecipeItems = requestedRecipe.requiredItems.filter(item => !cookbook.ingredients.some(
  ingredient => ingredient.name === item.name));

  // If there is a non-recipe left in the list, then it must be an invalid item.
  if (requiredRecipeItems.some(item => !cookbook.recipes.some(
    recipe => recipe.name === item.name))) {
    return false;
  }

  // If any of the recipes within the main recipe contains invalid items,
  //recipe is invalid.
  if (requiredRecipeItems.some(recipe => !validateRecipe(recipe.name))) {
    return false;
  }
  
  return true;
}
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
