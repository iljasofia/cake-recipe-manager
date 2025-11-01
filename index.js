'use strict';

const raw = require('./cake-recipes.json');
const readline = require('readline');

// ---- readline helpers ----
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

// ---- Data (array, hoofdletter-sleutels) ----
const recipes = Array.isArray(raw) ? raw : [];

// Accessors afgestemd op jouw JSON
const getName = (r) => r?.Name ?? r?.name ?? r?.Title ?? null;
const getAuthor = (r) => r?.Author ?? r?.author ?? r?.Chef ?? null;
const getIngredients = (r) => r?.Ingredients ?? r?.ingredients ?? [];

// ---- Global store voor opgeslagen ingrediënten ----
let savedIngredients = []; // cumulatief, over meerdere recepten heen

// ---- Utility ----
function mergeUnique(base, toAdd) {
  const seen = new Set(base.map((x) => String(x)));
  toAdd.forEach((x) => {
    const s = String(x);
    if (!seen.has(s)) {
      seen.add(s);
      base.push(x);
    }
  });
  return base;
}

function printRecipeDetails(recipe) {
  if (!recipe) return console.log('No recipe found.');
  console.log(`\nName: ${getName(recipe) ?? '(unnamed recipe)'}`);
  const a = getAuthor(recipe);
  if (a) console.log(`Author: ${a}`);
  if (recipe.url) console.log(`URL: ${recipe.url}`);
  if (recipe.Description) console.log(`Description: ${recipe.Description}`);
  const ing = getIngredients(recipe);
  console.log('\nIngredients:');
  if (ing.length === 0) console.log('- (none)');
  else ing.forEach((i) => console.log(`- ${i}`));
}

// ---- Functies volgens opdracht ----

// 1) Unieke auteurs (forEach)
function getUniqueAuthors(list) {
  const s = new Set();
  list.forEach((r) => {
    const a = getAuthor(r);
    if (a) s.add(a);
  });
  return [...s];
}

// 2) Namen loggen (met destructuring)
function printRecipeNames(list) {
  if (!list || list.length === 0) {
    console.log('No recipes found.');
    return;
  }
  // object destructuring met fallback voor verschillende naamvelden
  list.forEach(({ Name: NameUP, name: nameLow, Title }) => {
    const display = NameUP ?? nameLow ?? Title ?? '(unnamed recipe)';
    console.log(display);
  });
}

// 3) Recepten per auteur (filter)
function getRecipesByAuthor(list, author) {
  const q = String(author).toLowerCase();
  return list.filter((r) => (getAuthor(r) || '').toLowerCase() === q);
}

// 4) Recepten per ingrediënt (filter + some)
function getRecipesByIngredient(list, ingredient) {
  const q = String(ingredient).toLowerCase();
  return list.filter((r) =>
    getIngredients(r).some((i) => String(i).toLowerCase().includes(q))
  );
}

// 5) Recept op naam (find + includes)
function findRecipeByName(list, name) {
  const q = String(name).toLowerCase();
  return list.find((r) => (getName(r) || '').toLowerCase().includes(q));
}

// 6) Alle ingrediënten (reduce)
function getAllIngredients(list) {
  return list.reduce((all, r) => all.concat(getIngredients(r)), []);
}

// ---- Menu ----
function showMenu() {
  console.log('\nRecipe Management System Menu:');
  console.log('1. Show All Authors');
  console.log('2. Show Recipe names by Author');
  console.log('3. Show Recipe names by Ingredient');
  console.log('4. Get Recipe by Name (and optionally save ingredients)');
  console.log('5. Get All Ingredients of Saved Recipes');
  console.log('0. Exit');
}

async function main() {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    console.log('No recipes loaded. Check cake-recipes.json.');
    rl.close();
    return;
  }

  let choice;
  do {
    showMenu();
    const rawChoice = await ask('Enter a number (1-5) or 0 to exit: ');
    choice = Number.parseInt(rawChoice, 10);

    switch (choice) {
      // Show All Authors
      case 1: {
        const authors = getUniqueAuthors(recipes).sort((a, b) => a.localeCompare(b));
        console.log('\nAll Authors:');
        if (authors.length === 0) console.log('(none found)');
        else authors.forEach((a) => console.log(a));
        await ask('\nPress Enter to continue...');
        break;
      }

      // Show Recipe Names by Author
      case 2: {
        const author = await ask('Enter author name: ');
        const found = getRecipesByAuthor(recipes, author);
        console.log(`\nRecipes by ${author}:`);
        printRecipeNames(found);
        await ask('\nPress Enter to continue...');
        break;
      }

      // Show Recipe Names by Ingredient
      case 3: {
        const ingredient = await ask('Enter ingredient: ');
        const found = getRecipesByIngredient(recipes, ingredient);
        console.log(`\nRecipes containing "${ingredient}":`);
        printRecipeNames(found);
        await ask('\nPress Enter to continue...');
        break;
      }

      // Get Recipe by Name (+ save ingredients)
      case 4: {
        const name = await ask('Enter recipe name (or part of it): ');
        const recipe = findRecipeByName(recipes, name);
        console.log('\nResult:');
        printRecipeDetails(recipe);

        if (recipe) {
          const save = (await ask('\nSave this recipe’s ingredients? (y/n): ')).toLowerCase();
          if (save === 'y' || save === 'yes') {
            const ing = getIngredients(recipe);
            mergeUnique(savedIngredients, ing);
            console.log(`Saved ${ing.length} ingredients. Total saved items: ${savedIngredients.length}.`);
          } else {
            console.log('Not saved.');
          }
        }
        await ask('\nPress Enter to continue...');
        break;
      }

      // Get All Ingredients of Saved Recipes
      case 5: {
        console.log('\nAll Saved Ingredients:');
        if (savedIngredients.length === 0) {
          console.log('(none saved yet)');
        } else {
          savedIngredients.forEach((i) => console.log(`- ${i}`));
        }
        await ask('\nPress Enter to continue...');
        break;
      }

      case 0:
        console.log('Exiting...');
        break;

      default:
        console.log('Invalid input. Please enter a number between 0 and 5.');
    }
  } while (choice !== 0);

  rl.close();
}

main();
