import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META, CUISINES, RECIPE_TYPES } from '../data/sampleRecipes'
import { useRecipes } from '../hooks/useRecipes'
import styles from './AddRecipePage.module.css'

const EMPTY_FORM = {
  title: '',
  category: 'dinner',
  cuisine: '',
  type: '',
  description: '',
  url: '',
  image: '',
  ingredients: [''],
  instructions: '',
  tags: '',
  source: 'manual',
}

function parseTags(str) {
  return str.split(',').map(t => t.trim()).filter(Boolean)
}

export default function AddRecipePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addRecipe } = useRecipes()

  const initialMode = searchParams.get('type') === 'url' ? 'url' : 'manual'
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ ...EMPTY_FORM, source: initialMode })
  const [urlInput, setUrlInput] = useState('')
  const [urlFetching, setUrlFetching] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  function switchMode(m) {
    setMode(m)
    setForm(prev => ({ ...prev, source: m }))
    setUrlError('')
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function setIngredient(idx, value) {
    setForm(prev => {
      const next = [...prev.ingredients]
      next[idx] = value
      return { ...prev, ingredients: next }
    })
  }

  function addIngredientRow() {
    setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, ''] }))
  }

  function removeIngredient(idx) {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }))
  }

  async function handleUrlFetch() {
    if (!urlInput.trim()) { setUrlError('Please enter a URL'); return }
    try { new URL(urlInput) } catch { setUrlError('Please enter a valid URL'); return }

    setUrlFetching(true)
    setUrlError('')

    try {
      const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(urlInput)}`
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) })
      const data = await res.json()

      if (data.status === 'success') {
        const { title, description, image } = data.data
        setForm(prev => ({
          ...prev,
          url: urlInput,
          title: (title || '').slice(0, 120),
          description: (description || '').slice(0, 500),
          image: image?.url || '',
          source: 'url',
        }))
      } else {
        throw new Error('API returned non-success status')
      }
    } catch {
      setForm(prev => ({ ...prev, url: urlInput, source: 'url' }))
      setUrlError('Could not fetch page details automatically — URL saved, please fill in the title and description below.')
    } finally {
      setUrlFetching(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.category) errs.category = 'Category is required'
    if (mode === 'url' && !form.url.trim()) errs.url = 'URL is required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const recipe = {
      ...form,
      ingredients: form.ingredients.filter(i => i.trim()),
      tags: parseTags(form.tags),
    }
    const newId = addRecipe(recipe)
    setSubmitted(true)
    setTimeout(() => navigate(`/recipe/${newId}`), 800)
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

      <div className={styles.body}>
        {/* Mode toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'url' ? styles.modeBtnActive : ''}`}
            onClick={() => switchMode('url')}
            type="button"
          >
            🔗 Save from Web
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
            onClick={() => switchMode('manual')}
            type="button"
          >
            📝 Family / Manual
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* URL mode: fetch section */}
          {mode === 'url' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recipe URL</h2>
              <p className={styles.cardSub}>Paste the link and we'll try to fetch the title and description automatically.</p>
              <div className={styles.urlRow}>
                <input
                  className={`${styles.input} ${styles.urlInput}`}
                  type="url"
                  placeholder="https://www.example.com/my-recipe"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlFetch())}
                />
                <button
                  type="button"
                  className={styles.fetchBtn}
                  onClick={handleUrlFetch}
                  disabled={urlFetching}
                >
                  {urlFetching ? 'Fetching...' : 'Fetch Info'}
                </button>
              </div>
              {urlError && <p className={styles.fieldError}>{urlError}</p>}
              {errors.url && <p className={styles.fieldError}>{errors.url}</p>}
            </div>
          )}

          {/* Core details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recipe Details</h2>

            <div className={styles.field}>
              <label className={styles.label}>Recipe Title *</label>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                type="text"
                placeholder="e.g. Grandma's Apple Pie"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
              {errors.title && <p className={styles.fieldError}>{errors.title}</p>}
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select
                  className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                  ))}
                </select>
                {errors.category && <p className={styles.fieldError}>{errors.category}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Cuisine</label>
                <select
                  className={styles.select}
                  value={form.cuisine}
                  onChange={e => set('cuisine', e.target.value)}
                >
                  <option value="">Select cuisine...</option>
                  {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Type / Dish</label>
                <select
                  className={styles.select}
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                >
                  <option value="">Select type...</option>
                  {RECIPE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="A short description or the story behind this recipe..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Image URL</label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={e => set('image', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags <span className={styles.hint}>(comma separated)</span></label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. family recipe, quick, vegetarian"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Ingredients</h2>
            <div className={styles.ingredientsBlock}>
              {form.ingredients.map((ing, i) => (
                <div key={i} className={styles.ingredientRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={`Ingredient ${i + 1}`}
                    value={ing}
                    onChange={e => setIngredient(i, e.target.value)}
                  />
                  {form.ingredients.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeIngredient(i)}
                    >×</button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addIngBtn} onClick={addIngredientRow}>
                + Add Ingredient
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Instructions</h2>
            <textarea
              className={styles.textarea}
              rows={8}
              placeholder="Write the steps to make this recipe..."
              value={form.instructions}
              onChange={e => set('instructions', e.target.value)}
            />
          </div>

          <div className={styles.submitRow}>
            <Link to="/" className={styles.cancelBtn}>Cancel</Link>
            <button type="submit" className={styles.submitBtn}>
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
