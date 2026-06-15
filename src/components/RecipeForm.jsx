import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META, CUISINES, RECIPE_TYPES } from '../data/sampleRecipes'
import styles from '../pages/AddRecipePage.module.css'

function parseTags(tagInput) {
  if (Array.isArray(tagInput)) return tagInput
  return tagInput.split(',').map(t => t.trim()).filter(Boolean)
}

function splitLines(text) {
  return text
    .split(/\n|•|·|‣|⁃/)
    .map(l => l.replace(/^[\s\-*–—]+/, '').trim())
    .filter(Boolean)
}

export function recipeToForm(recipe) {
  return {
    ...recipe,
    tags: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : (recipe.tags || ''),
    ingredients: recipe.ingredients?.length ? recipe.ingredients : [''],
  }
}

async function fetchRecipeData(url) {
  // Step 1: microlink for title/description/image
  const microlinkRes = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(10000) }
  )
  const microlinkData = await microlinkRes.json()
  const meta = microlinkData.status === 'success' ? microlinkData.data : {}

  // Step 2: fetch raw HTML via CORS proxy to extract JSON-LD ingredients
  let ingredients = []
  try {
    const proxyRes = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const proxyData = await proxyRes.json()
    const html = proxyData.contents || ''

    // Parse all JSON-LD blocks
    const ldScripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    for (const [, json] of ldScripts) {
      try {
        const parsed = JSON.parse(json.trim())
        const schemas = Array.isArray(parsed) ? parsed : [parsed]
        for (const schema of schemas) {
          const recipe = schema['@type'] === 'Recipe' ? schema
            : schema['@graph']?.find(n => n['@type'] === 'Recipe')
          if (recipe?.recipeIngredient?.length) {
            ingredients = recipe.recipeIngredient.map(i => String(i).trim()).filter(Boolean)
            break
          }
        }
        if (ingredients.length) break
      } catch { /* malformed JSON-LD, skip */ }
    }
  } catch { /* proxy unavailable, skip */ }

  return {
    title: (meta.title || '').slice(0, 120),
    description: (meta.description || '').slice(0, 500),
    image: meta.image?.url || '',
    ingredients,
  }
}

export default function RecipeForm({ initialValues, onSubmit, submitLabel = 'Save Recipe', backTo = '/', isEdit = false }) {
  const [mode, setMode] = useState(initialValues?.source || 'manual')
  const [form, setForm] = useState(initialValues || {
    title: '', category: 'dinner', cuisine: '', type: '',
    description: '', url: '', image: '', ingredients: [''],
    instructions: '', tags: '', source: 'manual',
  })
  const [urlInput, setUrlInput] = useState(initialValues?.url || '')
  const [urlFetching, setUrlFetching] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [errors, setErrors] = useState({})
  const [bulkPasteMode, setBulkPasteMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

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

  // Paste multi-line text into a single ingredient field → split into rows
  function handleIngredientPaste(e, idx) {
    const pasted = e.clipboardData.getData('text')
    if (!pasted.includes('\n') && !pasted.includes('•')) return // single line, let it be
    e.preventDefault()
    const lines = splitLines(pasted)
    if (!lines.length) return
    setForm(prev => {
      const copy = [...prev.ingredients]
      copy.splice(idx, 1, ...lines)
      // keep a trailing empty slot if not already there
      if (copy[copy.length - 1].trim() !== '') copy.push('')
      return { ...prev, ingredients: copy }
    })
  }

  function addIngredientRow() {
    setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, ''] }))
  }

  function removeIngredient(idx) {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }))
  }

  function applyBulkPaste() {
    const lines = splitLines(bulkText)
    if (!lines.length) return
    setForm(prev => ({ ...prev, ingredients: [...lines, ''] }))
    setBulkText('')
    setBulkPasteMode(false)
  }

  async function handleUrlFetch() {
    if (!urlInput.trim()) { setUrlError('Please enter a URL'); return }
    try { new URL(urlInput) } catch { setUrlError('Please enter a valid URL'); return }

    setUrlFetching(true)
    setUrlError('')

    try {
      const { title, description, image, ingredients } = await fetchRecipeData(urlInput)
      setForm(prev => ({
        ...prev,
        url: urlInput,
        source: 'url',
        title: title || prev.title,
        description: description || prev.description,
        image: image || prev.image,
        ingredients: ingredients.length ? [...ingredients, ''] : prev.ingredients,
      }))
      if (!ingredients.length) {
        setUrlError('Title and description fetched. Ingredients could not be detected — paste them in below.')
      }
    } catch {
      setForm(prev => ({ ...prev, url: urlInput, source: 'url' }))
      setUrlError('Could not fetch page details — URL saved, please fill in the details below.')
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
    onSubmit({
      ...form,
      ingredients: form.ingredients.filter(i => i.trim()),
      tags: parseTags(form.tags),
    })
  }

  return (
    <div className={styles.body}>
      {!isEdit && (
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
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {mode === 'url' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recipe URL</h2>
            <p className={styles.cardSub}>Paste the link — we'll fetch the title, description, image, and ingredients automatically.</p>
            <div className={styles.urlRow}>
              <input
                className={`${styles.input} ${styles.urlInput}`}
                type="url"
                placeholder="https://www.example.com/my-recipe"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlFetch())}
              />
              <button type="button" className={styles.fetchBtn} onClick={handleUrlFetch} disabled={urlFetching}>
                {urlFetching ? 'Fetching...' : 'Fetch Info'}
              </button>
            </div>
            {urlError && <p className={styles.fieldError}>{urlError}</p>}
            {errors.url && <p className={styles.fieldError}>{errors.url}</p>}
          </div>
        )}

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
              <select className={styles.select} value={form.cuisine} onChange={e => set('cuisine', e.target.value)}>
                <option value="">Select cuisine...</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Type / Dish</label>
              <select className={styles.select} value={form.type} onChange={e => set('type', e.target.value)}>
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

        <div className={styles.card}>
          <div className={styles.ingredientHeader}>
            <h2 className={styles.cardTitle}>Ingredients</h2>
            <button
              type="button"
              className={styles.bulkToggle}
              onClick={() => setBulkPasteMode(p => !p)}
            >
              {bulkPasteMode ? '↩ Back to list' : '📋 Paste a list'}
            </button>
          </div>

          {bulkPasteMode ? (
            <div className={styles.bulkPasteArea}>
              <p className={styles.cardSub}>Paste your ingredient list below — one per line, or separated by bullet points.</p>
              <textarea
                className={styles.textarea}
                rows={8}
                autoFocus
                placeholder={"1 cup flour\n2 eggs\n½ tsp salt\n..."}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
              <button
                type="button"
                className={styles.fetchBtn}
                onClick={applyBulkPaste}
                disabled={!bulkText.trim()}
              >
                Add to List
              </button>
            </div>
          ) : (
            <div className={styles.ingredientsBlock}>
              <p className={styles.cardSub}>Tip: paste a multi-line list into any field and it'll auto-split into rows.</p>
              {form.ingredients.map((ing, i) => (
                <div key={i} className={styles.ingredientRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={`Ingredient ${i + 1}`}
                    value={ing}
                    onChange={e => setIngredient(i, e.target.value)}
                    onPaste={e => handleIngredientPaste(e, i)}
                  />
                  {form.ingredients.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeIngredient(i)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addIngBtn} onClick={addIngredientRow}>
                + Add Ingredient
              </button>
            </div>
          )}
        </div>

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
          <Link to={backTo} className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn}>{submitLabel}</button>
        </div>
      </form>
    </div>
  )
}
