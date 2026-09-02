import { describe, expect, it } from 'vitest'
import { parseBackup } from '../backup'

const valid = {
  app: 'guatracker',
  schema: 5,
  exportedAt: 1_700_000_000_000,
  data: {
    food: [{ id: 'a', date: '2026-09-01', category: 'meal', quality: 'fast', name: 'completos', quantity: 1, createdAt: 1 }],
    days: [{ date: '2026-09-01', waterMl: 500, realMealsLogged: false, zeroDrinks: 0 }],
  },
}

describe('parseBackup (RNF-23)', () => {
  it('acepta un respaldo válido', () => {
    expect(() => parseBackup(valid)).not.toThrow()
  })
  it('rechaza un JSON ajeno (sin app guatracker)', () => {
    expect(() => parseBackup({ app: 'otra-cosa', schema: 5, exportedAt: 1, data: {} })).toThrow()
  })
  it('rechaza fechas corruptas', () => {
    const bad = { ...valid, data: { days: [{ date: 'ayer', waterMl: 1, realMealsLogged: false, zeroDrinks: 0 }] } }
    expect(() => parseBackup(bad)).toThrow()
  })
  it('rechaza una categoría de comida inválida', () => {
    const bad = { ...valid, data: { food: [{ id: 'x', date: '2026-09-01', category: 'pizza', createdAt: 1 }] } }
    expect(() => parseBackup(bad)).toThrow()
  })
})
