import { Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META } from '../data/sampleRecipes'
import { useRecipes } from '../hooks/useRecipes'
import styles from './Home.module.css'

export default function Home() {
  const { getRecipesByCategory } = useRecipes()

  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Your Kitchen, Your Story</h1>
          <p className={styles.heroSub}>
            Save recipes from the web or preserve beloved family recipes —
            all in one beautiful place.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/add" className={styles.ctaPrimary}>+ Add a Recipe</Link>
            <Link to="/category/dinner" className={styles.ctaSecondary}>Browse Recipes</Link>
          </div>
        </div>
        <div className={styles.heroDecor}>
          <div className={styles.decor1}>🍳</div>
          <div className={styles.decor2}>🥘</div>
          <div className={styles.decor3}>🍰</div>
          <div className={styles.decor4}>🥗</div>
        </div>
      </header>

      <section className={styles.categories}>
        <h2 className={styles.sectionTitle}>Browse by Category</h2>
        <p className={styles.sectionSub}>Select a category to explore and sort your recipes</p>

        <div className={styles.categoryList}>
          {CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat]
            const count = getRecipesByCategory(cat).length
            return (
              <Link key={cat} to={`/category/${cat}`} className={styles.categoryRow}>
                <div className={styles.categoryLeft}>
                  <span className={styles.categoryEmoji}>{meta.emoji}</span>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{meta.label}</span>
                    <span className={styles.categoryDesc}>{meta.description}</span>
                  </div>
                </div>
                <div className={styles.categoryRight}>
                  <span className={styles.recipeCount}>{count} {count === 1 ? 'recipe' : 'recipes'}</span>
                  <svg className={styles.arrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className={styles.addSection}>
        <div className={styles.addCard}>
          <div className={styles.addOption}>
            <span className={styles.addOptionIcon}>🔗</span>
            <h3>Save from the Web</h3>
            <p>Paste a URL from your favorite food sites and we'll save it</p>
            <Link to="/add?type=url" className={styles.addOptionBtn}>Add Web Recipe</Link>
          </div>
          <div className={styles.addDivider}></div>
          <div className={styles.addOption}>
            <span className={styles.addOptionIcon}>📝</span>
            <h3>Add a Family Recipe</h3>
            <p>Write down Grandma's secrets before they're forgotten</p>
            <Link to="/add?type=manual" className={styles.addOptionBtn}>Write Recipe</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
