import { describe, expect, it } from 'vitest'
import { changeSince, changeSinceStart, movingAverage, type MetricPoint } from '../body'

const pts: MetricPoint[] = [
  { date: '2026-09-01', value: 82 },
  { date: '2026-09-02', value: 80 },
  { date: '2026-09-03', value: 84 },
]

describe('movingAverage', () => {
  it('suaviza: el último punto promedia la ventana de 7 días', () => {
    // los 3 caen dentro de 7 días → (82+80+84)/3 = 82
    const ma = movingAverage(pts, 7)
    expect(ma[2].value).toBe(82)
  })
  it('respeta la ventana: fuera de rango no entra', () => {
    const sparse: MetricPoint[] = [
      { date: '2026-09-01', value: 80 },
      { date: '2026-09-20', value: 90 }, // 19 días después, fuera de la ventana de 7
    ]
    const ma = movingAverage(sparse, 7)
    expect(ma[1].value).toBe(90) // solo se promedia a sí mismo
  })
  it('lista vacía no revienta', () => {
    expect(movingAverage([], 7)).toEqual([])
  })
})

describe('changeSince / changeSinceStart', () => {
  it('cambio desde el inicio = último − primero', () => {
    expect(changeSinceStart(pts)).toBe(2) // 84 − 82
  })
  it('un solo punto no tiene variación', () => {
    expect(changeSinceStart([{ date: '2026-09-01', value: 80 }])).toBeNull()
  })
  it('changeSince con referencia lo bastante antigua', () => {
    // último 09-03 (84); ref más nueva con ≥2 días de antigüedad = 09-01 (82)
    expect(changeSince(pts, 2)).toBe(2)
  })
  it('changeSince sin referencia tan atrás = null', () => {
    expect(changeSince(pts, 30)).toBeNull()
  })
})
