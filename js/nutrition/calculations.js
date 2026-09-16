const zero = () => ({ kcal:0, protein:0, carbs:0, fat:0, fiber:0 });

export function nutritionForFood(food, quantity, unit = 'g') {
  if (!food) return zero();
  const factor = unit === 'piece' ? quantity / 100 : quantity / 100;
  const source = food.nutrientsPer100 || food;
  return {
    kcal: (Number(source.kcal) || 0) * factor,
    protein: (Number(source.protein ?? source.prot) || 0) * factor,
    carbs: (Number(source.carbs ?? source.carbo) || 0) * factor,
    fat: (Number(source.fat ?? source.grassi) || 0) * factor,
    fiber: (Number(source.fiber ?? source.fibre) || 0) * factor
  };
}

export function sumNutrition(items = []) {
  return items.reduce((total, item) => Object.keys(total).reduce((out, key) => {
    out[key] += Number(item[key]) || 0;
    return out;
  }, total), zero());
}

export function calculateOption(option, foodResolver) {
  return sumNutrition((option?.ingredients || []).map(ingredient =>
    nutritionForFood(foodResolver(ingredient.foodId), ingredient.quantity, ingredient.unit)
  ));
}

export function calculateMeal(meal, foodResolver, selections = {}) {
  const fixed = sumNutrition((meal.fixedIngredients || []).map(ingredient =>
    nutritionForFood(foodResolver(ingredient.foodId), ingredient.quantity, ingredient.unit)
  ));
  const selected = (meal.choiceGroups || []).map(group => {
    const option = group.options.find(item => item.id === selections[group.id]);
    return option ? calculateOption(option, foodResolver) : zero();
  });
  return sumNutrition([fixed, ...selected]);
}

export function calculateDay(dayTemplate, foodResolver, selections = {}) {
  return sumNutrition((dayTemplate?.meals || []).map(meal => calculateMeal(meal, foodResolver, selections)));
}

export const nutrition = Object.freeze({ nutritionForFood, sumNutrition, calculateOption, calculateMeal, calculateDay });
