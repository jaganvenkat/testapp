import { formatCurrency, formatDate, slugify, truncate, capitalise } from '@/utils/formatters'

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('supports other currencies', () => {
    expect(formatCurrency(100, 'EUR')).toContain('100')
  })
})

describe('formatDate', () => {
  it('returns Invalid date for bad input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date')
  })

  it('formats a valid date in short style', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toMatch(/\d+\/\d+\/\d+/)
  })

  it('returns just now for very recent dates', () => {
    expect(formatDate(new Date(), 'relative')).toBe('just now')
  })
})

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('handles multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })
})

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })
})

describe('capitalise', () => {
  it('capitalises the first letter', () => {
    expect(capitalise('hello')).toBe('Hello')
  })

  it('lowercases the rest', () => {
    expect(capitalise('hELLO')).toBe('Hello')
  })
})
