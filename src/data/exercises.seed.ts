import type { Exercise } from '../db/schema'

// Biblioteca precargada (anexo del ESPEC). Los no-seguros vienen a propósito,
// para mostrarlos con advertencia en vez de que el usuario los busque sin contexto.
export const EXERCISE_SEED: Exercise[] = [
  { id: 'plancha-frontal', name: 'Plancha frontal', muscleGroup: 'core', metric: 'time', safeForScoliosis: true, cue: 'Glúteo apretado, costillas abajo, sin hundir la lumbar', isCustom: false },
  { id: 'plancha-lateral', name: 'Plancha lateral', muscleGroup: 'core', metric: 'time', safeForScoliosis: true, cue: 'Trabajar ambos lados por igual, cadera alta', isCustom: false },
  { id: 'puente-gluteos', name: 'Puente de glúteos', muscleGroup: 'glutes', metric: 'reps', safeForScoliosis: true, cue: 'Empuje desde el talón, sin arquear la lumbar', isCustom: false },
  { id: 'bird-dog', name: 'Bird-dog', muscleGroup: 'core', metric: 'reps', safeForScoliosis: true, cue: 'Movimiento lento, pelvis quieta', isCustom: false },
  { id: 'dead-bug', name: 'Dead bug', muscleGroup: 'core', metric: 'reps', safeForScoliosis: true, cue: 'Lumbar pegada al suelo todo el rango', isCustom: false },
  { id: 'remo-mancuerna', name: 'Remo con mancuerna', muscleGroup: 'back', metric: 'reps', safeForScoliosis: true, cue: 'Torso estable, sin rotar la columna', isCustom: false },
  { id: 'jalon-pecho', name: 'Jalón al pecho / dominada asistida', muscleGroup: 'back', metric: 'reps', safeForScoliosis: true, cue: 'Sin balanceo, control en la bajada', isCustom: false },
  { id: 'face-pull', name: 'Face pull', muscleGroup: 'shoulders', metric: 'reps', safeForScoliosis: true, cue: 'Excelente para la postura del escritorio', isCustom: false },
  { id: 'press-hombro', name: 'Press de hombro sentado', muscleGroup: 'shoulders', metric: 'reps', safeForScoliosis: true, cue: 'Espalda apoyada, sin arquear', isCustom: false },
  { id: 'sentadilla-goblet', name: 'Sentadilla goblet', muscleGroup: 'legs', metric: 'reps', safeForScoliosis: true, cue: 'Carga frontal, torso vertical', isCustom: false },
  { id: 'peso-muerto-rumano', name: 'Peso muerto rumano ligero', muscleGroup: 'legs', metric: 'reps', safeForScoliosis: true, cue: 'Carga conservadora, espalda neutra', isCustom: false },
  { id: 'flexion-lateral', name: 'Flexión lateral con mancuerna', muscleGroup: 'core', metric: 'reps', safeForScoliosis: false, cue: 'Carga asimétrica sobre la curva', warning: 'Carga asimétrica sobre la curva escoliótica. Evitar.', isCustom: false },
  { id: 'hiperextension', name: 'Hiperextensión cargada', muscleGroup: 'back', metric: 'reps', safeForScoliosis: false, cue: 'Compresión lumbar', warning: 'Compresión lumbar. Evitar sin supervisión.', isCustom: false },
  { id: 'sentadilla-barra', name: 'Sentadilla con barra pesada', muscleGroup: 'legs', metric: 'reps', safeForScoliosis: false, cue: 'Carga axial alta', warning: 'Carga axial alta. Solo con técnica supervisada.', isCustom: false },
]
