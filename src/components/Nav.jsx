import { Link, useLocation } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META } from '../data/sampleRecipes'
import styles from './Nav.module.css'

export default function Nav() {
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>🍊</span>
        <span className={styles.logoText}>RecipeKeeper</span>
      </Link>

      <div className={styles.categories}>
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            to={`/category/${cat}`}
            className={`${styles.catLink} ${location.pathname === `/category/${cat}` ? styles.active : ''}`}
          >
            <span className={styles.catEmoji}>{CATEGORY_META[cat].emoji}</span>
            <span>{CATEGORY_META[cat].label}</span>
          </Link>
        ))}
      </div>

      <Link to="/add" className={styles.addBtn}>
        + Add Recipe
      </Link>
    </nav>
  )
}
