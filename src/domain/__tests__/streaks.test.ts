import { describe, expect, it } from 'vitest'
import { currentStreak } from '../streaks'

describe('currentStreak', () => {
  it('cuenta días consecutivos hacia atrás desde hoy', () => {
    const q = new Set(['2026-09-01', '2026-08-31', '2026-08-30'])
    expect(currentStreak(q, '2026-09-01')).toBe(3)
  })

  it('un hueco corta la racha', () => {
    const q = new Set(['2026-09-01', '2026-08-30']) // falta 08-31
    expect(currentStreak(q, '2026-09-01')).toBe(1)
  })

  it('hoy sin registrar pero ayer sí: la racha sigue desde ayer', () => {
    const q = new Set(['2026-08-31', '2026-08-30'])
    expect(currentStreak(q, '2026-09-01')).toBe(2)
  })

  it('ni hoy ni ayer califican → 0, sin drama', () => {
    const q = new Set(['2026-08-28'])
    expect(currentStreak(q, '2026-09-01')).toBe(0)
  })

  it('conjunto vacío → 0', () => {
    expect(currentStreak(new Set(), '2026-09-01')).toBe(0)
  })
})
