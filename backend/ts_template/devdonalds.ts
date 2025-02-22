import express, { Request, Response } from "express";
const NON_EXISTING = -1;

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// Datastore interface definition
interface cookbook {
  saved_recipes: recipe[];
  saved_ingredients: ingredient[];
}

interface recipeSummary {
  name: string;
  ingredients: requiredItem[];
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Cookbook object to store recipe
const cookbook = { saved_recipes: [] as recipe[], saved_ingredients: [] as ingredient[] } as cookbook;

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

  // Removes all the invalid characters (dashes must be first so they're counted as spaces later)
  recipeName = recipeName.replace(dashes, ' ');
  recipeName = recipeName.replace(invalidAlphabet, '');
  recipeName = recipeName.replace(/\s+/g, ' ');
  recipeName = recipeName.trim();

  // Splits the string, sets the cases correctly for each word then rejoins it
  let recipeWords = recipeName.split(" ");
  recipeWords = recipeWords.map(word => word.slice(0,1).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
  recipeName = recipeWords.join(" ");

  // If word was all invalid characters
  if (recipeName.length == 0) {
    return null;
  }
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
 * required items or, if it's an ingredient, its cook time is above 0.
 * 
 * @param input Either a recipe or an ingredient and their details as input
 * @returns empty object
 */
const addEntry = (input: recipe & ingredient): {} => {
  // Filters out non-unique entry names
  if (cookbook.saved_recipes.some(entry => (entry.name === input.name)) ||
  cookbook.saved_ingredients.some(entry => (entry.name === input.name))) {
    throw new Error('Entry names must be unique, entry name already taken.');
  }

  // Decides what to do based on input types
  if (input.type === "recipe") {
    // Checks for duplicate names in required items
    const requiredNames = input.requiredItems.map(entry => entry.name);
    if (new Set(requiredNames).size != requiredNames.length) {
      throw new Error('Recipe requiredItems can only have one element per name.');
    }
    cookbook.saved_recipes.push({ name: input.name, type: input.type, requiredItems: input.requiredItems });
  } else if (input.type === "ingredient") {
    // Checks cookTime is above or equal to 0
    if (input.cookTime < 0) {
      throw new Error('cookTime can only be greater than or equal to 0');
    }
    cookbook.saved_ingredients.push({name: input.name, type: input.type, cookTime: input.cookTime});
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
const getEntry = (name: string): recipeSummary => {
  // Checks for recipe with a matching name in the cookbook
  const requestedRecipe = cookbook.saved_recipes.find(recipe => recipe.name === name);

  // Checks all required items in recipe are also valid
  const ingredients = [] as requiredItem[];
  return getRecipeInfo(name, ingredients, 0);
}

/**
 * Function that checks whether a recipe and all its ingredients and recipes
 * used to create it exist in the cookbook, and adds its overall ingredients
 * list and cook time to the given ingredient list and cookTime. Returns updated
 * ingredient list, name and cook time as a recipe summary.
 * Throws an error if the recipe does not exist.
 * 
 * @param name The name of the recipe being checked for.
 * @param ingredients The ingredients already present in the recipe.
 * @param cookTime The amount of time required to cook the recipe so far.
 * @returns recipeSummary stating the recipe's name, updated ingredients list and
 * cook time, accounting for the previous ingredient list and cooktime.
 */
const getRecipeInfo = (name: string, ingredients: requiredItem[], cookTime: number): recipeSummary => {
  // Checks recipe exists
  const requestedRecipe = cookbook.saved_recipes.find(recipe => recipe.name === name);
  if (!requestedRecipe) {
    throw new Error('Recipe with corresponding name not found.');
  }

  // Handles items in recipe
  for (const item of requestedRecipe.requiredItems) {
    // Accounts for ingredient of recipe
    const ingredient = cookbook.saved_ingredients.find(ingredient => ingredient.name === item.name);
    if (ingredient) {
      const match = ingredients.findIndex(existing => existing.name == item.name);
      // Adds ingredient to ingredients list, creating a new object if needed, then updates cook time.
      if (match == NON_EXISTING) {
         ingredients.push({name: ingredient.name, quantity: item.quantity});
      } else {
        ingredients[match].quantity += item.quantity;
      }
      cookTime += item.quantity * ingredient.cookTime;
    } else {
      // Accounts for recipe corresponding to item, or throws error if not valid recipe
      const result = getRecipeInfo(item.name, ingredients, cookTime);
      ingredients = result.ingredients;
      cookTime = result.cookTime;
    }
  }
  
  return { name, ingredients, cookTime};
}
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
