import re

def parse_handwriting(recipeName: str):  
    # Removes all the invalid characters (dashes must be first so they're counted as s+)
    recipeName = re.sub(r'[-_]', ' ', recipeName)
    recipeName = re.sub(r'[^a-zA-Z ]', '', recipeName)
    recipeName = re.sub(r'\s+', ' ', recipeName)
    # Splits the string, sets the cases correctly for each word then rejoins it
  
    recipeWords = recipeName.split(' ')
    for word in recipeWords:
        word = word.capitalize()
    recipeName = ' '.join(recipeWords)
    return recipeName
print(parse_handwriting("AAAAA send help ---+ + _       aa"))
