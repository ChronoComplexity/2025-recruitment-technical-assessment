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

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = null;

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
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  const dashes = /[-_]/g;
  const invalidAlphabet = /[^a-zA-Z\s]/g;

  // If no recipe
  if (!recipeName) {
    return null;
  }

  // Removes all the invalid characters (dashes must be first so they're counted as s+)
  recipeName = recipeName.replace(dashes, ' ');
  recipeName = recipeName.replace(invalidAlphabet, '');
  recipeName = recipeName.replace(/\s+/g, ' ');

  // Sets the cases correctly for each word then rejoins them
  let recipeWords = recipeName.split(" ");
  recipeWords = recipeWords.map(word => word.slice(0,1).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
  recipeName = recipeWords.join(" ");

  return recipeName;
}

/**
 * - **type** can only be "recipe" or "ingredient".
- **cookTime** can only be greater than or equal to 0
- entry **names** must be unique
- Recipe **requiredItems** can only have one element per name.
 */

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  // TODO: implement me
  
  res.status(500).send("not yet implemented!")

});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
