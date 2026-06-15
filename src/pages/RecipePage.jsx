import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { CATEGORY_META } from '../data/sampleRecipes'
import styles from './RecipePage.module.css'

export default function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRecipeById, deleteRecipe } = useRecipes()
  const recipe = getRecipeById(id)

  if (!recipe) return (
    <div className={styles.notFound}>
      <p>Recipe not found.</p>
      <Link to="/" className={styles.backLink}>← Back to Home</Link>
    </div>
  )

  const meta = CATEGORY_META[recipe.category]

  function handleDelete() {
    if (confirm(`Delete "${recipe.title}"?`)) {
      deleteRecipe(recipe.id)
      navigate(`/category/${recipe.category}`)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.banner} style={{ '--cat-color': meta?.color }}>
        <div className={styles.bannerContent}>
          <Link to={`/category/${recipe.category}`} className={styles.breadcrumb}>
            ← {meta?.label}
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.sourcePill}>
              {recipe.source === 'manual'
                ? <><span>📝</span> Family Recipe</>
                : <><span>🔗</span> Web Recipe</>
              }
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          {recipe.image && (
            <img src={recipe.image} alt={recipe.title} className={styles.image} />
          )}

          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}

          {recipe.url && (
            <a href={recipe.url} target="_blank" rel="noreferrer" className={styles.urlLink}>
              View Original Recipe ↗
            </a>
          )}

          {recipe.ingredients?.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Ingredients</h2>
              <ul className={styles.ingredientsList}>
                {recipe.ingredients.map((item, i) => (
                  <li key={i} className={styles.ingredient}>
                    <span className={styles.bullet}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Instructions</h2>
              <div className={styles.instructions}>{recipe.instructions}</div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.metaCard}>
            <h3 className={styles.metaTitle}>Details</h3>
            <dl className={styles.metaList}>
              <div className={styles.metaItem}>
                <dt>Category</dt>
                <dd>{meta?.label}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Cuisine</dt>
                <dd>{recipe.cuisine || '—'}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Type</dt>
                <dd>{recipe.type || '—'}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Added</dt>
                <dd>{recipe.createdAt}</dd>
              </div>
            </dl>
          </div>

          {recipe.tags?.length > 0 && (
            <div className={styles.tagsCard}>
              <h3 className={styles.metaTitle}>Tags</h3>
              <div className={styles.tags}>
                {recipe.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Link to={`/edit/${recipe.id}`} className={styles.editBtn}>
              ✏️ Edit Recipe
            </Link>
            <button onClick={handleDelete} className={styles.deleteBtn}>
              🗑️ Delete Recipe
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
