import { useState, useEffect } from 'react'
import { SAMPLE_RECIPES } from '../data/sampleRecipes'

const STORAGE_KEY = 'recipekeeper_recipes'

export function useRecipes() {
  const [recipes, setRecipes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : SAMPLE_RECIPES
    } catch {
      return SAMPLE_RECIPES
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  function addRecipe(recipe) {
    const newRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    }
    setRecipes(prev => [newRecipe, ...prev])
    return newRecipe.id
  }

  function deleteRecipe(id) {
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  function updateRecipe(id, updates) {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  function getRecipesByCategory(category) {
    return recipes.filter(r => r.category === category)
  }

  function getRecipeById(id) {
    return recipes.find(r => r.id === id)
  }

  return { recipes, addRecipe, deleteRecipe, updateRecipe, getRecipesByCategory, getRecipeById }
}
