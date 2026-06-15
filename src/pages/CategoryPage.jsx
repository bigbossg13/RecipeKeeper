import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CATEGORY_META, CUISINES, RECIPE_TYPES } from '../data/sampleRecipes'
import { useRecipes } from '../hooks/useRecipes'
import RecipeCard from '../components/RecipeCard'
import styles from './CategoryPage.module.css'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alpha-asc', label: 'A → Z' },
  { value: 'alpha-desc', label: 'Z → A' },
  { value: 'cuisine', label: 'By Cuisine' },
  { value: 'type', label: 'By Type' },
]

export default function CategoryPage() {
  const { category } = useParams()
  const { getRecipesByCategory } = useRecipes()
  const meta = CATEGORY_META[category]

  const [sortBy, setSortBy] = useState('newest')
  const [filterCuisine, setFilterCuisine] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')

  const allRecipes = getRecipesByCategory(category)

  const filtered = useMemo(() => {
    let result = [...allRecipes]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q)
      )
    }
    if (filterCuisine) result = result.filter(r => r.cuisine === filterCuisine)
    if (filterType) result = result.filter(r => r.type === filterType)

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc': return a.title.localeCompare(b.title)
        case 'alpha-desc': return b.title.localeCompare(a.title)
        case 'cuisine': return (a.cuisine || '').localeCompare(b.cuisine || '')
        case 'type': return (a.type || '').localeCompare(b.type || '')
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt)
        default: return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    return result
  }, [allRecipes, sortBy, filterCuisine, filterType, search])

  if (!meta) return <div className={styles.notFound}>Category not found</div>

  const availableCuisines = [...new Set(allRecipes.map(r => r.cuisine).filter(Boolean))]
  const availableTypes = [...new Set(allRecipes.map(r => r.type).filter(Boolean))]

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ '--cat-color': meta.color }}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.breadcrumb}>← Home</Link>
          <div className={styles.titleRow}>
            <span className={styles.emoji}>{meta.emoji}</span>
            <div>
              <h1 className={styles.title}>{meta.label}</h1>
              <p className={styles.description}>{meta.description}</p>
            </div>
          </div>
          <div className={styles.countBadge}>
            {allRecipes.length} {allRecipes.length === 1 ? 'recipe' : 'recipes'}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.filters}>
          <select
            className={styles.select}
            value={filterCuisine}
            onChange={e => setFilterCuisine(e.target.value)}
          >
            <option value="">All Cuisines</option>
            {availableCuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>Sort:</span>
            <div className={styles.sortPills}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.sortPill} ${sortBy === opt.value ? styles.sortPillActive : ''}`}
                  onClick={() => setSortBy(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(filterCuisine || filterType || search) && (
          <button
            className={styles.clearBtn}
            onClick={() => { setFilterCuisine(''); setFilterType(''); setSearch('') }}
          >
            Clear filters ×
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>🍽️</span>
          <p>No recipes found.</p>
          <Link to="/add" className={styles.emptyAdd}>+ Add the first one</Link>
        </div>
      ) : (
        <>
          {(sortBy === 'cuisine' || sortBy === 'type') ? (
            <GroupedGrid recipes={filtered} groupBy={sortBy === 'cuisine' ? 'cuisine' : 'type'} />
          ) : (
            <div className={styles.grid}>
              {filtered.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      )}

      <Link to="/add" className={styles.fab}>+</Link>
    </div>
  )
}

function GroupedGrid({ recipes, groupBy }) {
  const groups = useMemo(() => {
    const map = {}
    recipes.forEach(r => {
      const key = r[groupBy] || 'Other'
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [recipes, groupBy])

  return (
    <div className={styles.groupedContainer}>
      {groups.map(([group, items]) => (
        <div key={group} className={styles.group}>
          <h2 className={styles.groupTitle}>{group}</h2>
          <div className={styles.grid}>
            {items.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
