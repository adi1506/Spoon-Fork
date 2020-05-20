import Search from './models/Search';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

/**The Global state of the app:
 * Search Object
 * Current Recipe Object
 * Shopping List Object
 * Liked Recipe
 */

/**
 * SEARCH CONTROLLER
 */

const state = {};


const controlSearch = async () => {
     //1) Get Query from View
     const query = searchView.getInput();
     if (query) {
          //2) New search object and add to state
          state.search = new Search(query);

          //3) Prepare UI for results
          searchView.clearInput();
          searchView.clearResult();
          renderLoader(elements.searchRes);

          try {
               //4) Search for recipes
               await state.search.getResults();

               //5)Render results on UI
               clearLoader();

               searchView.renderResults(state.search.result);
          } catch (err) {
               console.log('Something went wrong :(');
          }
     }
};

elements.searchForm.addEventListener('submit', (e) => {
     e.preventDefault();
     controlSearch();
});

elements.searchResPages.addEventListener('click', (e) => {
     const btn = e.target.closest('.btn-inline');
     if (btn) {
          const goToPage = parseInt(btn.dataset.goto, 10);
          searchView.clearResult();
          searchView.renderResults(state.search.result, goToPage);
     }
});

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
     const id = window.location.hash.replace('#', '');
     //console.log(id);

     if (id) {
          //Prepare UI for changes
          recipeView.clearRecipe();
          renderLoader(elements.recipe);

          //Highlight current recipe
          if (state.search) searchView.highlightSelected(id);

          //Create new recipe object
          state.recipe = new Recipe(id);

          // //Only for testing purpose
          // window.r = state.recipe;

          try {
               //Get recipe data
               await state.recipe.getRecipe();
               //console.log(state.recipe.ingredients);
               state.recipe.parseIngredients();

               //Calculate servings and time
               state.recipe.calcTime();
               state.recipe.calcServings();

               //render recipe
               clearLoader();
               recipeView.renderRecipe(
                   state.recipe,
                   state.like.isLiked(id)
                   );
          } catch (err) {
               alert('Can not able to process the recipe right now :(');
          }
     }
};

//Adding multiple events for the same function
['hashchange', 'load'].forEach((event) => window.addEventListener(event, controlRecipe));


/**
 * List CONTROLLER
 */
const controlList = () => {
    //Create a new List if not yet created
    if(!state.list) state.list = new List();

    //add each ing to the list and UI
    state.recipe.ingredients.forEach(el =>
        {
            const item = state.list.addItem(el.count,el.unit,el.ingredient);
            listView.renderItem(item);
        })
}

//Handling Delete
elements.shoppingList.addEventListener('click',e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    //Handle delete
    if(e.target.matches('.shopping__delete , .shopping__delete *'))
    {
        state.list.deleteItem(id);
        listView.deleteItem(id);
    }
    else if(e.target.matches('.shopping__count-value'))
     {
         const val = parseFloat(e.target.value);
         state.list.updateCount(id,val);
     }

    
})

/**
 * Like CONTROLLER
 */

state.like = new Likes();
likesView.toggleLikeMenu(state.like.getNumLikes());
 const controlLike = () =>
 {
     if(!state.like) state.like = new Likes();
     const currentID = state.recipe.id;

     //User has not yet liked
     if(!state.like.isLiked(currentID))
     {
         //Add like to the state
         const newLike = state.like.addLikes(
             currentID,
             state.recipe.title,
             state.recipe.author,
             state.recipe.img
         )


         //Toggle the like button
         likesView.toggleLikeBtn(true);

         //Add like to the UI
        likesView.renderLiked(newLike);
     }

     //User has liked
     else
     {
         //Remove like from the state
         state.like.deleteLikes(currentID);

         //Toggle the like button
         likesView.toggleLikeBtn(false);
         //Remove like to from UI
         likesView.deleteLike(currentID);
     }
     likesView.toggleLikeMenu(state.like.getNumLikes());
 }

 window.addEventListener('load' , () => {

    state.like = new Likes();

    state.like.readStorage();

    likesView.toggleLikeMenu(state.like.getNumLikes());

    state.like.likes.forEach(like => likesView.renderLiked(like));

 })


//Handling servings button clicks

elements.recipe.addEventListener('click', (e) => {
     if (e.target.matches('.btn-decrease, .btn-decrease *')) {
          //Decrease button is clicked
          if(state.recipe.servings > 1)
          {
                state.recipe.updateServings('dec');
                recipeView.updateServingsIngredients(state.recipe);
          }
          
     } else if (e.target.matches('.btn-increase, .btn-increase *')) {
          //increase button is clicked
          state.recipe.updateServings('inc');
          recipeView.updateServingsIngredients(state.recipe);

     }
     else if(e.target.matches('.recipe__btn-add, .recipe__btn-add *'))
     {
         controlList();
     }
     else if(e.target.matches('.recipe__love, .recipe__love *'))
     {
         controlLike();
     }
     
});



