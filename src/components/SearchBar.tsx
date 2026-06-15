'use client'

interface Props {
  query:       string
  category:    string
  categories:  string[]
  onQuery:     (q: string) => void
  onCategory:  (c: string) => void
  onReset:     () => void
}

export default function SearchBar({ query, category, categories, onQuery, onCategory, onReset }: Props) {
  const isDirty = query !== '' || category !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <input
          type="search"
          data-testid="search-input"
          aria-label="Search products"
          placeholder="Search products…"
          value={query}
          onChange={e => onQuery(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <select
        data-testid="category-select"
        aria-label="Filter by category"
        value={category}
        onChange={e => onCategory(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All categories</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {isDirty && (
        <button
          data-testid="search-reset"
          aria-label="Clear search"
          onClick={onReset}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  )
}
