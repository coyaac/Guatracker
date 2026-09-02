import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { ensureExerciseSeed } from './db/repositories'
import { ensureLastWeekSummary } from './db/summaryRepo'
import './index.css'

// Al abrir: sembrar la biblioteca (idempotente) y generar el resumen de la
// semana recién cerrada si falta (RF-701, en vez de un cron de servidor).
void ensureExerciseSeed()
void ensureLastWeekSummary()

// Registra el service worker → app instalable y offline (RNF-05..07).
// ponytail: recarga en la próxima navegación al haber versión nueva;
// el aviso visible de "actualizar" (RNF-06) se pule en Fase 4.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
