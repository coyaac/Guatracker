# Prompt para Claude Design — Design System de la app

> **Antes de pegar:** el nombre de la app es **Guatracker**, ya está fijado en el prompt.
> Si tienes el `ESPEC.md`, adjúntalo también: Claude Design va a diseñar sobre requerimientos reales en vez de suposiciones.

---

Necesito que diseñes el **design system completo** de una app, y que lo entregues como un canvas con artboards: primero las fundaciones, después los componentes, y al final las pantallas reales aplicando el sistema.

## 1. El producto

**Guatracker** es una PWA mobile-first, mono-usuario, offline-first, para seguir la adherencia a un plan de recomposición corporal. No cuenta calorías ni pesa alimentos. Registra hábitos: comida rápida, picoteo, agua, entrenamiento (natación + fuerza), sueño, peso y medidas. Su pantalla principal muestra un **Índice de Adherencia Semanal de 0 a 100** compuesto por cinco dimensiones, y cada lunes entrega un resumen con puntos fuertes, puntos débiles y una sola acción para la semana.

**Usuario:** hombre joven, 1,80 m, pasa muchas horas sentado frente al computador, se acuesta muy tarde, tiene escoliosis de 32°. Usa la app en el celular, con una mano, muchas veces de noche y a oscuras.

**Momento de uso dominante:** 10 segundos, de pie o acostado, para tocar un botón. El uso largo (revisar tendencias) es semanal, no diario.

**La tensión central del diseño:** el tema es comida, cuerpo y sueño, o sea territorio donde una app puede fácilmente sentirse como un juicio. El sistema tiene que motivar por **progreso y datos**, nunca por culpa. Un día malo se ve como un dato, no como una falla moral.

## 2. Dirección visual

**Energética deportiva.** Alto contraste, números enormes, tipografía condensada, sensación de instrumento de rendimiento — como un tablero de entrenamiento, no como una app médica ni como una app de bienestar pastel.

- **Tema principal: oscuro.** Se usa de noche y el negro profundo hace que los acentos y los números peguen fuerte. El tema claro existe y está completo, pero es el secundario.
- Densidad de información alta en las vistas de análisis, densidad **baja** en el dashboard: ahí manda un número gigante.
- Nada de gradientes decorativos por todas partes, glassmorphism ni sombras difusas de moda. La energía viene del **contraste, la escala tipográfica y el color usado con disciplina**.
- Ni una sola ilustración de fitness genérica, ni siluetas de cuerpos, ni fotos de gente entrenando.

Traza una línea explícita: el sistema debe verse intenso sin volverse agresivo. Muéstrame que entendiste la diferencia.

## 3. Marca, logo e identidad

**Sobre el nombre:** *Guatracker* es un juego de palabras chileno — "guata" es la panza, en registro coloquial y cariñoso, no clínico. El nombre es autoconsciente y con humor: el usuario se está riendo un poco de sí mismo, no castigándose. La identidad tiene que sostener ese doble registro: **humor seco en la marca, seriedad en los datos**. Si la marca se pone solemne, traiciona el nombre; si la interfaz se pone chistosa, la app deja de ser creíble como instrumento de medición. El chiste vive en el logo y en el wordmark; adentro de la app manda el rigor.

También: el nombre pone la panza en el centro, y el producto **no** trata de castigar un cuerpo. Resuelve esa tensión de forma explícita — el humor tiene que ser cómplice, nunca a costa del usuario. Cuéntame cómo la resolviste.

Diseña la identidad completa de **Guatracker**:

- **Concepto de marca** en una frase, y tres palabras que definan su personalidad.
- **Wordmark**: explora cómo se articula la palabra — si "Gua" y "tracker" se diferencian por peso, color o corte, o si el logotipo se lee como una sola pieza. Prueba ambas rutas.
- **Símbolo / isotipo**: geométrico, construible en SVG simple, legible a 16 px. Explora al menos 3 rutas conceptuales antes de elegir (por ejemplo: la idea de constancia acumulada, la idea de un índice que sube, la idea de una bitácora de marcas). Muéstrame las 3 exploraciones y luego la elegida refinada.
- **Wordmark**: tipografía, tracking y ajustes ópticos definidos.
- **Lockups**: horizontal, vertical y solo símbolo, con zona de seguridad y tamaño mínimo.
- **Ícono de app**: en la grilla de 1024×1024, más cómo se ve recortado en círculo (Android) y en squircle (iOS), sobre fondo oscuro y claro.
- **Splash screen** de la PWA y **favicon** de 32 px.
- **Uso incorrecto**: 4 ejemplos de lo que no se debe hacer con el logo.

## 4. Color

Entrégame el sistema de color completo, con valores hex y su rol semántico, no solo una paleta bonita:

- **Escalas neutras** de 12 pasos para tema oscuro y para tema claro (fondo, superficie, superficie elevada, borde sutil, borde fuerte, texto terciario, secundario, primario).
- **Color de acento primario** y su escala de 10 pasos. Debe funcionar como color de acción y de energía.
- **Color de acento secundario**, usado con moderación para destacar logros y rachas.
- **Colores semánticos**: éxito, atención, alerta, informativo, y "sin datos" (un gris que se lea claramente como ausencia y nunca como cero).
- **Cinco colores de dimensión**, uno para cada eje del índice: Alimentación, Picoteo, Hidratación, Entrenamiento, Sueño. Tienen que ser distinguibles entre sí incluso para una persona con deuteranopía, y tienen que convivir en un mismo gráfico sin pelearse.
- **Escala del índice 0–100** en cuatro tramos: <50, 50–69, 70–84, ≥85. Define el color de cada tramo y su etiqueta de texto, porque el estado **nunca se comunica solo por color**.
- Todos los tokens nombrados por rol (`--surface-raised`, `--accent-strong`, `--dim-sleep`), jamás por su apariencia (`--verde-2`).
- Incluye un **artboard de verificación de contraste** con el ratio real de cada par texto/fondo. Mínimo AA (4.5:1 en texto normal, 3:1 en texto grande y en elementos de UI), en ambos temas.

## 5. Tipografía

- Elige **dos familias como máximo**: una display condensada para números y titulares de métrica, y una sans neutra y muy legible para interfaz y texto corrido. Prioriza fuentes de Google Fonts o de sistema, porque la app se empaqueta local y no puede depender de red.
- **Los números son el protagonista del producto.** Exige cifras tabulares (`font-variant-numeric: tabular-nums`) en todo dato que cambie, para que no bailen al actualizarse.
- Escala tipográfica completa con nombre de rol, tamaño en px y rem, peso, altura de línea y tracking: `metric-hero` (el índice, muy grande), `metric-lg`, `metric-sm`, `title`, `subtitle`, `body`, `body-sm`, `label`, `caption`, `overline`.
- Reglas de uso: cuándo usar la condensada y cuándo no, largo máximo de línea, jerarquía dentro de una tarjeta.
- Muestra la escala aplicada a **texto real en español de Chile**, con tildes y ñ. Nada de lorem ipsum.

## 6. Fundaciones restantes

- **Espaciado**: escala base 4 px, tokens con nombre, y las reglas de padding interno por tipo de contenedor.
- **Grilla y layout**: mobile-first en 390 px de ancho, márgenes laterales, y cómo se comporta en 320 px, en tablet y en escritorio.
- **Radios de esquina**, **bordes** y **elevación**: en tema oscuro la jerarquía se construye con superficies más claras, no con sombras. Define esa lógica explícitamente.
- **Iconografía**: familia elegida o dibujada, grilla de 24 px, grosor de trazo, y el set completo que la app necesita (agua, comida rápida, snack, natación, pesas, sueño, peso, cintura, calendario, racha, ajustes, exportar, advertencia, editar, deshacer, más, cerrar).
- **Movimiento**: duraciones y curvas para las tres cosas que se animan de verdad — la confirmación de un registro rápido, el llenado de los anillos y la transición entre pantallas. Todo respeta `prefers-reduced-motion`.
- **Área táctil**: mínimo 44×44 px, y define dónde vive el pulgar en una pantalla de 844 px de alto.

## 7. Visualización de datos

Especifica cada gráfico como componente, con sus estados y su tratamiento de color:

- **Anillo o barra de dimensión** (×5), con su estado vacío y su estado "sin datos".
- **Número del índice** en el dashboard: el elemento más grande de toda la app.
- **Sparkline** de las últimas 8 semanas del índice.
- **Heatmap mensual** en calendario: la escala de intensidad y, de nuevo, cómo se distingue "sin datos" de "cero".
- **Línea de peso** con media móvil de 7 días en primer plano y los puntos diarios en segundo plano.
- **Línea de cintura**, que en este producto pesa más que el peso.
- **Gráfico de sueño** de 4 semanas con horas dormidas y hora de acostarse superpuestas.
- **Barras de comparación** semana actual vs. anterior.

Reglas transversales: ejes discretos, sin gridlines pesadas, sin efectos 3D, sin leyendas separadas cuando se puede etiquetar directo, y cada gráfico legible en un ancho de 350 px.

## 8. Componentes

Diseña cada uno con **todos** sus estados (reposo, hover, foco visible, activo, deshabilitado, cargando, error) y anota su comportamiento:

Botón de registro rápido (el más importante de la app: grande, con feedback inmediato) · botón primario, secundario y fantasma · botón de deshacer · tarjeta de métrica · tarjeta de dimensión · fila de registro editable · chips de selección (tipo de picoteo, calidad de sueño) · stepper de +250 ml · input numérico · selector de hora · selector de fecha con registro retroactivo · bottom sheet de registro · barra de navegación inferior · encabezado de pantalla · indicador de racha · badge de estado del índice · **banner de advertencia para ejercicios no seguros con escoliosis** (tiene que verse serio y detener al usuario, sin dramatismo) · toast de confirmación · diálogo de confirmación destructiva · fila de ejercicio con series · tarjeta de resumen semanal · estado vacío (diseña al menos 3 variantes distintas, porque una app nueva son puros estados vacíos) · esqueleto de carga · estado de error.

## 9. Tono de voz de la interfaz

Define y ejemplifica el copy del producto en español de Chile, neutro y directo:

- Cómo se anuncia un logro sin exagerar.
- Cómo se comunica una meta incumplida **sin culpa**: "3 de 1 comidas rápidas" es un dato; "te pasaste otra vez" no va.
- Los estados vacíos.
- El resumen semanal: fortalezas, debilidades y la acción única.
- La advertencia médica del onboarding.
- Escribe una **lista negra explícita** de palabras y giros prohibidos en toda la interfaz.

## 10. Pantallas a diseñar (aplicando el sistema)

En 390×844, tema oscuro salvo donde indico:

1. **Onboarding** — 3 pantallas: aviso médico, datos iniciales, confirmación de metas.
2. **Dashboard** — el índice en grande, las 5 dimensiones, los botones de registro rápido, qué falta hoy, la racha, el sparkline de 8 semanas.
3. **Dashboard en estado vacío**, día 1 sin ningún dato.
4. **Dashboard en tema claro**, la misma pantalla, para probar que el sistema aguanta.
5. **Registro de agua** — la interacción de +250 ml con su feedback.
6. **Registro de sueño** — hora de acostarse y de despertar, cruzando la medianoche.
7. **Sesión de fuerza** — lista de ejercicios con series, incluyendo una fila con la advertencia de escoliosis activa.
8. **Peso y medidas** — el gráfico de peso con media móvil junto al de cintura.
9. **Resumen semanal** — la pantalla que justifica todo el producto: índice, desglose, fortalezas, debilidades y una sola acción.
10. **Vista mensual** — el heatmap del calendario con días sin datos incluidos.
11. **Ajustes** — metas editables, exportar datos, borrar todo.

## 11. Entregable final

Además de los artboards, entrégame:

- Un artboard con **todos los tokens en formato copiable**: variables CSS y su equivalente en la configuración de `theme.extend` de Tailwind, para tema oscuro y claro.
- Los tokens tipográficos y de espaciado listos para pegar en el código.
- Una **hoja de reglas de una página**: las 10 decisiones que mantienen coherente el sistema.

## 12. Restricciones que no se negocian

- Mobile-first real: el diseño se juzga en 390 px, no en escritorio.
- Todo el texto en español de Chile.
- Contraste AA como piso en ambos temas.
- El estado nunca se comunica solo por color.
- Nada que dependa de red: fuentes e íconos empaquetables local.
- Registrar cualquier cosa toma como máximo 3 toques desde el inicio.
- Cero lenguaje de culpa, cero fotos de cuerpos, cero conteo de calorías.

---

**Empieza por las fundaciones** (marca, color, tipografía) y muéstramelas antes de avanzar a componentes y pantallas. Si alguna decisión te parece discutible, dímela y explícame el trade-off en vez de elegir en silencio.
