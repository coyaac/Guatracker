import { describe, expect, it } from 'vitest'
import { averageBedtime, buildSummary, type SummaryInput } from '../summary'
import type { Dimension } from '../goals'

const dims = (o: Partial<Record<Dimension, number>>): Record<Dimension, number> => ({
  nutrition: 0,
  snacking: 0,
  hydration: 0,
  training: 0,
  sleep: 0,
  ...o,
})

const base: SummaryInput = {
  week: '2026-W36',
  dimensions: dims({ nutrition: 90, snacking: 85, hydration: 40, training: 100, sleep: 30 }),
  prevDimensions: null,
  daysWithRecords: 6,
  avgBedtime: '02:00',
}

describe('buildSummary', () => {
  it('menos de 3 días → lowData y acción de registrar más', () => {
    const s = buildSummary({ ...base, daysWithRecords: 2 })
    expect(s.lowData).toBe(true)
    expect(s.strengths).toEqual([])
    expect(s.action).toMatch(/al menos 3 días/)
  })

  it('fortalezas: dimensiones ≥80, ordenadas desc', () => {
    const s = buildSummary(base)
    // training 100, nutrition 90, snacking 85 califican; hydration/sleep no
    expect(s.strengths[0]).toMatch(/Entrenamiento/)
    expect(s.strengths.length).toBe(3)
  })

  it('debilidades: dimensiones <60, ordenadas asc', () => {
    const s = buildSummary(base)
    // sleep 30 y hydration 40 → sleep primero
    expect(s.weaknesses[0]).toMatch(/Sueño/)
  })

  it('acción única = dimensión de menor puntaje (sueño 30)', () => {
    const s = buildSummary(base)
    expect(s.action).toMatch(/acostarte 30 minutos/)
    expect(s.action).toMatch(/02:00 → 01:30/) // promedio − 30 min
  })

  it('empate de menor puntaje se rompe por prioridad (sleep > training)', () => {
    const s = buildSummary({ ...base, dimensions: dims({ sleep: 20, training: 20, nutrition: 90, snacking: 90, hydration: 90 }) })
    expect(s.action).toMatch(/acostarte/) // sleep gana el empate
  })

  it('sin fortalezas calificadas → destaca días registrados', () => {
    const s = buildSummary({ ...base, dimensions: dims({ nutrition: 50, snacking: 50, hydration: 50, training: 50, sleep: 50 }) })
    expect(s.strengths[0]).toMatch(/Registraste 6 de 7 días/)
  })

  it('delta vs. semana anterior aparece cuando mejora ≥15', () => {
    const s = buildSummary({
      ...base,
      dimensions: dims({ hydration: 80, nutrition: 50, snacking: 50, training: 50, sleep: 50 }),
      prevDimensions: dims({ hydration: 50, nutrition: 50, snacking: 50, training: 50, sleep: 50 }),
    })
    expect(s.strengths.some((t) => /\+30 vs\. la semana pasada/.test(t))).toBe(true)
    expect(s.deltaVsPreviousWeek).toBeGreaterThan(0)
  })
})

describe('averageBedtime', () => {
  it('promedia horas cruzando medianoche', () => {
    expect(averageBedtime(['23:30', '01:50'])).toBe('00:40')
  })
  it('sin datos → null', () => {
    expect(averageBedtime([])).toBeNull()
  })
})
