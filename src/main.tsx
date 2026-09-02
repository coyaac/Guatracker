import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ensureExerciseSeed } from './db/repositories'
import { ensureLastWeekSummary } from './db/summaryRepo'
import './index.css'

// El service worker se registra desde <ReloadPrompt> (useRegisterSW) para poder
// mostrar el aviso de "actualizar" cuando hay versión nueva (RNF-06).

// Al abrir: sembrar la biblioteca (idempotente) y generar el resumen de la
// semana recién cerrada si falta (RF-701, en vez de un cron de servidor).
void ensureExerciseSeed()
void ensureLastWeekSummary()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
