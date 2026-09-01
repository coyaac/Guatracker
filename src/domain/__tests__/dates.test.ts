import { describe, expect, it } from 'vitest'
import { daysElapsedInWeek, isoWeekOf, sleepHours, toISODate } from '../dates'

describe('sleepHours — cruce de medianoche (RNF-22)', () => {
  it('03:40 → 09:10 son 5,5 h', () => {
    expect(sleepHours('03:40', '09:10')).toBe(5.5)
  })
  it('23:30 → 07:00 cruza medianoche y da 7,5 h', () => {
    expect(sleepHours('23:30', '07:00')).toBe(7.5)
  })
  it('misma hora exacta da 0', () => {
    expect(sleepHours('01:00', '01:00')).toBe(0)
  })
})

describe('toISODate — corte de día en America/Santiago (DST)', () => {
  it('una hora en UTC se mapea al día local chileno', () => {
    // 2026-09-01T02:00Z: en Chile (UTC-4/-3) sigue siendo 31 de agosto por la noche.
    expect(toISODate(new Date('2026-09-01T02:00:00Z'))).toBe('2026-08-31')
  })
  it('la noche del cambio de hora en Chile no rompe el corte de día', () => {
    // Chile adelanta el reloj el primer domingo de septiembre 2026 (7 sep 00:00→01:00).
    // Un instante justo después sigue cayendo el 7 de septiembre local.
    expect(toISODate(new Date('2026-09-07T05:30:00Z'))).toBe('2026-09-07')
  })
})

describe('isoWeekOf / daysElapsedInWeek', () => {
  it('un lunes es el día 1 de su semana ISO', () => {
    expect(daysElapsedInWeek('2026-08-31')).toBe(1) // 2026-08-31 es lunes
  })
  it('un domingo es el día 7', () => {
    expect(daysElapsedInWeek('2026-09-06')).toBe(7)
  })
  it('formatea la semana ISO como YYYY-Www', () => {
    expect(isoWeekOf('2026-09-01')).toMatch(/^2026-W\d{2}$/)
  })
})
