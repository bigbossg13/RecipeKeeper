import { Link } from 'react-router-dom'
import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className={styles.card}>
      <div className={styles.imageArea}>
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderEmoji}>🍽️</span>
          </div>
        )}
        <div className={styles.sourceTag}>
          {recipe.source === 'manual' ? '📝 Family' : '🔗 Web'}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.meta}>
          <span className={styles.badge}>{recipe.cuisine}</span>
          <span className={styles.badge}>{recipe.type}</span>
        </div>
      </div>
    </Link>
  )
}
