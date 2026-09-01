import { describe, expect, it } from 'vitest'
import { DEFAULT_GOALS } from '../goals'
import {
  bedtimeScore,
  dailyIndex,
  hydrationScore,
  nutritionScore,
  snackingScore,
  trainingScore,
  weeklyDimensions,
  weeklyIndex,
  type WeekAggregate,
} from '../scoring'

const emptyWeek: WeekAggregate = {
  fastFood: 0,
  snackSweet: 0,
  snackSalty: 0,
  sugaryDrinks: 0,
  waterByDay: [],
  strengthSessions: 0,
  swimSessions: 0,
  sleepNights: [],
  daysElapsed: 0,
}

describe('nutritionScore', () => {
  it('bajo o en meta = 100', () => {
    expect(nutritionScore(1, 1)).toBe(100)
    expect(nutritionScore(0, 1)).toBe(100)
  })
  it('escalón m+1=60, m+2=30, m+3=0', () => {
    expect(nutritionScore(2, 1)).toBe(60)
    expect(nutritionScore(3, 1)).toBe(30)
    expect(nutritionScore(4, 1)).toBe(0)
    expect(nutritionScore(10, 1)).toBe(0)
  })
})

describe('snackingScore — azucaradas cuentan doble, piso en 0', () => {
  it('en meta = 100', () => {
    expect(snackingScore(3, 0, 0, 3)).toBe(100)
  })
  it('cada exceso resta 20', () => {
    expect(snackingScore(4, 0, 0, 3)).toBe(80)
    expect(snackingScore(5, 1, 0, 3)).toBe(40)
  })
  it('una bebida azucarada cuenta como dos', () => {
    // 2 dulces + 1 azucarada(=2) = 4, meta 3 → un exceso → 80
    expect(snackingScore(2, 0, 1, 3)).toBe(80)
  })
  it('nunca baja de 0', () => {
    expect(snackingScore(20, 20, 20, 3)).toBe(0)
  })
})

describe('hydrationScore', () => {
  it('promedia el cumplimiento diario, tope 100 por día', () => {
    // día1 completo, día2 mitad → (100 + 50)/2 = 75
    expect(hydrationScore([2000, 1000], 2000)).toBe(75)
  })
  it('sin días registrados = 0, sin NaN', () => {
    expect(hydrationScore([], 2000)).toBe(0)
  })
})

describe('trainingScore', () => {
  it('cumplir ambas metas = 100', () => {
    expect(trainingScore(2, 1, 2, 1)).toBe(100)
  })
  it('solo fuerza aporta su 60%', () => {
    expect(trainingScore(2, 0, 2, 1)).toBe(60)
  })
})

describe('bedtimeScore', () => {
  it('acostarse a la hora o antes = 100', () => {
    expect(bedtimeScore('01:30', '01:30')).toBe(100)
    expect(bedtimeScore('23:00', '01:30')).toBe(100)
  })
  it('resta 10 por cada 30 min de retraso', () => {
    expect(bedtimeScore('02:00', '01:30')).toBe(90) // 30 min tarde
    expect(bedtimeScore('03:40', '01:30')).toBe(60) // 130 min → 4 bloques
  })
})

describe('semana vacía — sin NaN y score 0', () => {
  it('todas las dimensiones son números finitos', () => {
    const dims = weeklyDimensions(emptyWeek, DEFAULT_GOALS)
    for (const v of Object.values(dims)) {
      expect(Number.isFinite(v)).toBe(true)
    }
  })
  it('el índice de una semana vacía es finito (no NaN) — nutrición/picoteo parten en 100', () => {
    const idx = weeklyIndex(emptyWeek, DEFAULT_GOALS)
    expect(Number.isFinite(idx)).toBe(true)
    expect(idx).toBe(40) // 25 (nutrición) + 15 (picoteo); las diarias en 0
  })
})

describe('dailyIndex', () => {
  it('día sin ningún registro = null (sin datos, no 0)', () => {
    const d = dailyIndex(
      { waterMl: 0, fastFood: 0, snacks: 0, sleepHours: null, hadWorkout: false, hasAnyRecord: false },
      DEFAULT_GOALS,
    )
    expect(d).toBeNull()
  })
  it('día perfecto = 100', () => {
    const d = dailyIndex(
      { waterMl: 2000, fastFood: 0, snacks: 0, sleepHours: 8, hadWorkout: true, hasAnyRecord: true },
      DEFAULT_GOALS,
    )
    expect(d).toBe(100)
  })
  it('día con registro pero flojo no es null', () => {
    const d = dailyIndex(
      { waterMl: 0, fastFood: 2, snacks: 5, sleepHours: 4, hadWorkout: false, hasAnyRecord: true },
      DEFAULT_GOALS,
    )
    expect(d).toBe(0)
  })
})
