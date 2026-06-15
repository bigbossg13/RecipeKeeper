import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import RecipeForm, { recipeToForm } from '../components/RecipeForm'
import styles from './AddRecipePage.module.css'

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRecipeById, updateRecipe } = useRecipes()
  const [saved, setSaved] = useState(false)

  const recipe = getRecipeById(id)

  if (!recipe) {
    return (
      <div className={styles.successScreen}>
        <p>Recipe not found.</p>
        <Link to="/" className={styles.breadcrumb}>← Home</Link>
      </div>
    )
  }

  function handleSubmit(data) {
    updateRecipe(id, data)
    setSaved(true)
    setTimeout(() => navigate(`/recipe/${id}`), 700)
  }

  if (saved) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>✅</div>
        <h2>Recipe Updated!</h2>
        <p>Taking you back now...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to={`/recipe/${id}`} className={styles.breadcrumb}>← Back to Recipe</Link>
        <h1 className={styles.title}>Edit Recipe</h1>
      </div>
      <RecipeForm
        initialValues={recipeToForm(recipe)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        backTo={`/recipe/${id}`}
        isEdit
      />
    </div>
  )
}
