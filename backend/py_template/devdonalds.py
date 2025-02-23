from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re
from json import dumps

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	RequiredItems: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cookTime: int

@dataclass
class RecipeSummary(CookbookEntry):
	name: str
	ingredients: List[RequiredItem]
	cookTime: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = {'storedRecipes': [], 'storedIngredients': []}

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipeName = data.get('input', '')
	parsedName = parse_handwriting(recipeName)
	if parsedName is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsedName}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that is more readable, or returns
# None if there is nothing to be read
def parse_handwriting(recipeName: str) -> Union[str | None]:
    # Removes all the invalid characters (dashes must be first so they're counted as spaces)
    recipeName = re.sub(r'[-_]', ' ', recipeName)
    recipeName = re.sub(r'[^a-zA-Z ]', '', recipeName)
    recipeName = re.sub(r'\s+', ' ', recipeName)
    recipeName = recipeName.strip()
    
    # Splits the string, sets the cases correctly for each word then rejoins it
    recipeWords = recipeName.split(' ')
    recipeWords = list(map(lambda word: word.capitalize(), recipeWords))
    recipeName = ' '.join(recipeWords)
    
    # If no valid characters left, returns None
    if len(recipeName) == 0:
        return None
    return recipeName

# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json(silent=True)
	try:
		result = add_entry(data)
		return result, 200
	except Exception as e:
		return str(e), 400

# Adds the entry, and throws an error if the details are invalid
def add_entry(data: Recipe | Ingredient) -> object:
	name = data['name']
	type = data['type']
 
	# Filters ingredients and recipes for duplicate names
	for i in cookbook['storedIngredients']:
		if (i.name == name):
			raise Exception("Duplicate names of recipes or ingredients not allowed in cookbook")
	for i in cookbook['storedRecipes']:
		if (i.name == name):
			raise Exception("Duplicate names of recipes or ingredients not allowed in cookbook")

	# Determines next action based on given data type
	if type == 'ingredient':
		cookTime = data['cookTime']
		# Checks cook time is valid
		if cookTime < 0:
			raise Exception("Ingredient cook time must be greater than or equal to 0")
		cookbook['storedIngredients'].append(Ingredient(name, cookTime))
	elif type == 'recipe':
		requiredItems = data['requiredItems']
		duplicateCheck = set()
		# Checks for duplicates in list
		for item in requiredItems:
			duplicateCheck.add(item['name'])
		if len(duplicateCheck) != len(requiredItems):
			raise Exception("Duplicate ingredients not allowed")
		cookbook['storedRecipes'].append(Recipe(name, requiredItems))
	else:
		# If not a valid entry type
		raise Exception("Not a valid entry type")
	return {}
    
# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	name = request.args.get('name', 1)
	try:
		result = get_recipe_info(name, [], 0, 1)
		return result, 200
	except Exception as e:
		return str(e), 400

# Adds the information of the given recipe to the given ingredients list and cooktime, given
# the name and amount, and returns a summary containing the name, overall ingredients list and
# cooktime
def get_recipe_info(name: str, ingredients: List[RequiredItem], cookTime: int, recipeQuantity: int) -> RecipeSummary:
	recipe = get_recipe(name)
	# Checks recipe exists
	if recipe == None:
		raise Exception('Recipe with corresponding name not found.')

	# Handles items in recipe
	for item in recipe.RequiredItems:
		itemName = item['name']
		itemQuantity = item['quantity']
		ingredient = get_ingredient(itemName)
		
		if (ingredient != None):
			# Adds ingredient to ingredients list, then updates cook time.
			cookTime += (ingredient.cookTime * itemQuantity * recipeQuantity)
			match = get_ingredient_index(itemName, ingredients)
			if (match != -1):
				ingredients[match]['quantity'] += recipeQuantity * itemQuantity
			else:
				ingredients.append({"name": itemName, 'quantity': (recipeQuantity * itemQuantity)})
		else:
			# Gets sub-recipe information and adds it to the existing recipe information
			result = get_recipe_info(itemName, ingredients, cookTime, itemQuantity)
			ingredients = result['ingredients']
			cookTime = result['cookTime']
  
	return {"name": name, "ingredients": ingredients, "cookTime": cookTime}


# Finds and returns the index of the ingredient with the same name, or -1
# if it is not found
def get_ingredient_index(name: str, ingredients) -> int:
	for index in range(len(ingredients)):
		if ingredients[index]['name'] == name:
			return index
	return -1

# Finds and returns the recipe, or None if it is not found
def get_recipe(name: str) -> Recipe | None:
	for recipe in cookbook['storedRecipes']:
		if recipe.name == name:
			return recipe
	return None

# Finds and returns the ingredient, or None if it is not found
def get_ingredient(name: str) -> Ingredient | None:
	for ingredient in cookbook['storedIngredients']:
		if ingredient.name == name:
			return ingredient
	return None

# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
