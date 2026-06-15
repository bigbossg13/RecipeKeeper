import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import RecipeForm from '../components/RecipeForm'
import styles from './AddRecipePage.module.css'

export default function AddRecipePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addRecipe } = useRecipes()
  const [submitted, setSubmitted] = useState(false)

  const initialMode = searchParams.get('type') === 'url' ? 'url' : 'manual'

  function handleSubmit(data) {
    const newId = addRecipe(data)
    setSubmitted(true)
    setTimeout(() => navigate(`/recipe/${newId}`), 700)
  }

  if (submitted) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>✅</div>
        <h2>Recipe Saved!</h2>
        <p>Taking you there now...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/" className={styles.breadcrumb}>← Home</Link>
        <h1 className={styles.title}>Add a Recipe</h1>
      </div>
      <RecipeForm
        initialValues={{ source: initialMode, category: 'dinner', ingredients: [''] }}
        onSubmit={handleSubmit}
        submitLabel="Save Recipe"
        backTo="/"
      />
    </div>
  )
}
