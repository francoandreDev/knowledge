# Progreso de revision pedagogica

## Ronda 2: auditoria profunda por agentes (2026-10-05 en adelante)

La revision original (tandas 1-34, mas abajo) se cerro como completa pero su
criterio era mas liviano: jerga sin glosar, puentes pedagogicos,
`interactives.json` desconectado. Esta ronda usa agentes en paralelo con un
criterio mas estricto: trazar el codigo linea por linea (no solo leerlo),
verificar que las formulas de `interactives.json` coincidan matematicamente
con los numeros que la propia unidad ya usa, y chequear la estructura
pedagogica completa de CLAUDE.md (problem-first, LevelIntro, Checkpoints,
exercises con explanation/solution, 2-3+ elementos visuales por unidad).
Se audita track por track, 3-4 unidades por agente en paralelo. Esta ronda
**no corrige nada automaticamente** — solo registra hallazgos; las
correcciones se hacen en una pasada separada cuando el usuario lo pide.

### Fix aplicado — defecto de pools, mitad `code` del proyecto completo (2026-10-05)

Tras encontrar el defecto de pools (un `poolId` agrupa dos ejercicios
_distintos_, no variantes) repetido en varias unidades de `systems` y
`git-teamwork`, se corrio un escaneo mecanico sobre los 246
`exercises.json` del proyecto completo (no solo las unidades ya auditadas),
usando dos pasadas: (1) comparar el conjunto completo de nombres de funcion
extraidos de `solution`/`starterCode`/`prompt` entre los miembros de cada
pool `code` — si son completamente disjuntos, son ejercicios distintos, no
variantes; (2) para nombrar el nuevo poolId de cada sub-grupo, cruzar contra
que funcion referencian los `tests` de cada item. Resultado: **154 pools
separados en 66 unidades** — cada funcion probada por 2+ miembros conserva
un poolId (mas angosto); cada funcion probada por un solo miembro pasa a
ser un ejercicio independiente sin poolId. No se borro ni reescribio ningun
ejercicio, solo se dejo de esconder uno al azar. Commit `c82ffc4`,
`lint`/`format`/`typecheck`/`validate:content`/`test`/`build` verificados
limpios despues.

**Esto resuelve la parte `code` del defecto** en `commit-conventions`,
`trade-off-documentation` y `transactions` (las 3 instancias originalmente
encontradas que eran de tipo `code`). **No resuelve** las instancias de tipo
`quiz` encontradas en `shared-history`, `technical-leadership` y
`working-tree` — un heuristico de solapamiento de palabras probo ser
demasiado ruidoso para confiar en el sin revision humana/de agente (misma
pregunta vista desde otro angulo tiene solapamiento de palabras bajo por
diseño, igual que una pregunta genuinamente distinta). Esas 3 quedan
pendientes para la revision por agente, unidad por unidad, igual que el
resto de hallazgos de esta ronda.

### Track `web` (17/17 unidades) — auditado 2026-10-05

11/17 SOLID sin hallazgos: `bff`, `bundling`, `client-side-caching`,
`http-request-response-basics`, `need-html-semantics-just-divs`,
`rest-graphql`, `ssr`, `component-state`, `dom-event-model`,
`stateless-auth`, `strangler-fig`.

6/17 con hallazgos, de mas a menos grave:

1. **`cdn` — bug de codigo real.** `L3-deep-dive.mdx`, `EdgeCache.get()`:
   `cached ? "MISS" : "MISS"` — ambas ramas del ternario devuelven lo mismo
   (probablemente debia ser `"STALE"` en la rama `cached`). El codigo de
   referencia no distingue stale-pero-presente de un miss real, contradiciendo
   lo que el texto dice que el codigo hace. **Sin corregir.**
2. **`css-cascade-specificity` — contradiccion pedagogica.** El texto ensena
   explicitamente que la especificidad es una tupla, no aditiva, y hasta lista
   "tratarla como aditiva" como failure mode con exercises dedicados a esa
   confusion — pero `interactives.json`'s "specificity-score" demo calcula
   `idCount*100 + classCount*10 + 1`, el mismo modelo aditivo que la unidad
   dice que esta mal, sin ninguna aclaracion. Dentro de los rangos del slider
   no llega a mostrar un caso donde el modelo aditivo falle visiblemente, pero
   refuerza un modelo mental que la propia unidad desautoriza. **Sin
   corregir.**
3. **`service-boundaries` — demo interactivo inconsistente con su propio
   grafico.** `interactives.json`'s `consumers-vs-branches` usa
   `consumers + consumers*(consumers-1)` (da 1,4,9,16) pero el `xychart-beta`
   de L2-concept.mdx para el mismo escenario muestra 1,3,8,16. Deberian
   compartir formula o el demo deberia aclarar que es una aproximacion.
   **Sin corregir.** Nota adicional (no bloqueante): `L3-deep-dive.mdx` no
   tiene ningun diagrama/tabla — todo el peso visual esta en L1/L2.
4. **`cors` — demo desconectado del contenido.** `interactives.json`'s
   "preflight-caching" gira en torno a `Access-Control-Max-Age`, un concepto
   que nunca se menciona en L1/L2/L3. **Sin corregir.** Nota adicional:
   `exercises.json` tiene solo 24 items (objetivo ~40), L2 especialmente
   delgado (6 items).
5. **`xss` — gaps estructurales.** El `<Scenario>` de L1 no se resuelve antes
   de `<LevelIntro>` (rompe la regla problem-first — las otras dos unidades de
   ese mismo lote si lo hacen bien). `exercises.json` tiene solo 22 items
   (objetivo ~40, L3 especialmente delgado con 4), y 18/22 items no tienen el
   campo `reference` del whiteboard (solo los 2 pools de L3 code lo tienen).
   **Sin corregir.**
6. **`render-performance` — ejercicios delgados.** `exercises.json` tiene 22
   items (objetivo ~40) y ninguno tiene `reference`/`learnMore`. El resto de
   la unidad (codigo, Checkpoints, interactivo) esta verificado correcto.
   **Sin corregir.**

Hallazgos menores sin corregir (type-imbalance en exercises, visuales un poco
desparejos entre niveles): `bundling`, `client-side-caching`,
`component-state`, `dom-event-model` — ninguno bloqueante.

### Track `systems` (17/17 unidades) — auditado 2026-10-05

8/17 SOLID: `horizontal-scaling`, `indexing`, `redundancy`, `process`,
`queues`, `race-conditions`, `algorithmic-complexity`, `concurrency`.

7/17 MINOR ISSUES: `logging`, `persistence`, `sockets`, `timeouts`,
`query-planning`, `trade-off-documentation`, `cap-theorem`.

2/17 NEEDS WORK (los hallazgos mas graves de esta ronda):

1. **`domain-boundaries` — el ejemplo central de L3 se contradice con su
   propio codigo.** `L3-deep-dive.mdx` afirma que `scoreBoundary(monolith,
["Shipping","Fulfillment"])` da `internalCallRatio: 0.76`,
   `externalSharedTables: []`, verdict `"clean"` — pero trazando el codigo
   contra sus propios datos (`Orders→Shipping`/`Shipping→Orders` con
   `sharedTables: ["order_items"]`) el resultado real es `0.77`,
   `["order_items"]`, verdict `"blocked"`. Un segundo numero
   (`suggestBoundary` confidence) tambien esta mal: el texto dice `0.93`, el
   codigo da `0.90` — y encima `interactives.json` para el mismo escenario
   SI calcula 0.90 correctamente, o sea el interactivo y la prosa de L3 se
   contradicen entre si. Son justo los 3 numeros que la unidad usa para
   enseniar "mide, no asumas" — ninguno coincide con lo que el codigo
   mostrado produce de verdad. **Sin corregir.**
2. **`transactions` — gap de profundidad en la propiedad mas riesgosa
   (Isolation) + bug de interactivo + exercises delgados.** La unidad define
   Isolation conceptualmente pero nunca da un ejemplo concreto de
   dirty-read/non-repeatable-read/phantom-read ni compara READ COMMITTED vs
   SERIALIZABLE con codigo — queda como pregunta abierta en el cierre de L3
   en vez de enseniarse. Ademas, `interactives.json`'s
   `phantom-stock-loss`'s `compute` devuelve `phantomStockLostTransactional:
0` constante en todo el rango del slider (el mismo anti-patron de "linea
   constante en 0" que ya se habia encontrado y corregido antes en este
   proyecto). L1 y L3 no tienen ningun elemento visual (todo esta en L2).
   `exercises.json` tiene solo 26 items (objetivo ~40, L2 particularmente
   delgado con 6). **Sin corregir.**

### Track `business-communication` (14/14 unidades) — auditado 2026-10-05

10/14 SOLID: `audience-awareness` (el unit piloto, confirmado solido),
`change-management`, `executive-summaries`, `informal-authority`,
`org-level-influence`, `pushback-frameworks`, `status-updates-build-trust`,
`upward-disagreement`, `visibility-self-promotion`,
`reading-stakeholder-incentives` (1 nitpick menor de pool, ver abajo).

4/14 MINOR ISSUES:

1. **`translating-technical-risk-business-risk` — contradiccion numerica
   real entre niveles.** L1 dice que el trafico (creciendo ~8%/mes) cruza el
   100% de capacidad "en unos 6 meses" (matematicamente correcto:
   `62*1.08^n=100` da n≈6.2) y el `interactives.json` coincide exactamente
   con ese calculo — pero L2 (prosa + su propio `xychart-beta`) y L3 dicen
   que eso pasa "alrededor de la semana 11" (~2.5 meses), usando la misma
   tasa de 8%/mes declarada. La serie de datos del chart de L2
   (62,71,82,92,108,124 en semanas 0,4,8,11,16,20) tampoco corresponde a una
   curva de crecimiento compuesto limpia al 8%/mes — implica mas bien
   ~15-16%/mes. Es el numero central que la unidad usa para fundamentar el
   caso de negocio, y L1/interactivo por un lado y L2/L3 por el otro se
   contradicen. **Sin corregir.**
2. **`conflict-resolution` — exercises muy delgados** (26 items vs ~40
   objetivo) y L3 no reutiliza el componente `&lt;Scenario&gt;` (solo
   prosa), a diferencia de las otras unidades del track. Sin
   `interactives.json` sin justificacion explicita de por que no aplica.
   **Sin corregir.**
3. **`decision-making-frameworks` — exercises delgados** (28 vs ~40) y
   algunos pools mezclan hechos distintos (`daci-roles-table-pool`:
   "Approver es singular" vs "Contributors no votan" — dos roles
   diferentes). **Sin corregir.**
4. **`building-credibility-ahead-ask` — L1 sin ningun elemento visual**
   (todo en L2/L3). Exercises ligeramente debajo del objetivo (38 vs ~40).
   **Sin corregir.**

Hallazgos menores sin corregir: `executive-summaries` (32 items, un pool
mezcla "que es BLUF" con "donde se origino BLUF"), `reading-stakeholder-incentives`
(un pool con 3 variantes algo heterogeneas), `informal-authority` (L1 sin
ningun `##`, visuales concentrados en L2), `org-level-influence` (ninguno,
la unidad mas solida del lote).

### Track `logic` (12/12 unidades) — auditado 2026-10-05

8/12 SOLID: `abstraction`, `correlation-causation`, `edge-case-reasoning`,
`induction`, `expected-value`, `fallacies`, `fermi-estimation`,
`formal-informal-logic`.

4/12 MINOR ISSUES:

1. **`boolean-logic` — bug real de renderizado.** `L1-summary.mdx`, la
   tabla "operator cheat sheet" tiene una fila rota para `||`: un `|` sin
   escapar dentro de un code span (`` ` | | ` ``) parte la celda en
   columnas extra, descuadrando esa fila de la tabla. Ademas, sin
   `interactives.json` (candidato obvio: filas de la truth table creciendo
   como 2^n segun cantidad de variables, igual al patron que `abstraction`
   ya usa). **Sin corregir.**
2. **`multi-criteria-decisions-under-ambiguity` — 2 bugs de pools.**
   `terms-misc` (L1, quiz) mezcla "que es sensitivity analysis" con "que es
   tie-breaker judgment" — dos conceptos distintos. `sensitivity-code` (L3,
   code) mezcla `topTwoGap` con `winnerHoldsAcrossAll` — dos funciones
   distintas (esta no la agarro el fix mecanico anterior). **Sin
   corregir.**
3. **`state-machines` — 1 bug de pool que el fix mecanico no agarro.**
   `combinatorics-pool` (L3, code) mezcla `totalCombinations` con
   `meaningfulPercent` — pero la solucion de `meaningfulPercent` _reutiliza_
   `totalCombinations` como helper interno, asi que el chequeo de
   "conjuntos de nombres totalmente disjuntos" del script no lo detecto (hay
   solapamiento real, aunque la pregunta principal es distinta). Tambien
   exercises delgados (~28 vs ~40). **Sin corregir.**
4. **`problem-decomposition` — 2 pools borderline.**
   `exhaustive-nonoverlap-intro-pool` y `two-properties-flowchart-pool`
   agrupan hechos relacionados pero distintos (no el mismo angulo de una
   sola pregunta). **Sin corregir.**

Nota sobre el fix mecanico de pools (commit `c82ffc4`): estos 2 casos
nuevos confirman que tiene puntos ciegos reales (funciones helper
compartidas entre soluciones rompen el chequeo de disjuncion total) — la
revision por agente sigue siendo necesaria para encontrar el resto, no solo
para los pools tipo `quiz`.

Bugs de codigo reales adicionales encontrados en `systems` (fuera de los 2
NEEDS WORK):

3. **`timeouts` — `CircuitBreaker.canAttempt()` no limita a un solo intento
   en estado half-open** como el texto, el diagrama y el exercise
   `breaker-states-2` afirman — una vez en `"half-open"`, cualquier llamada
   concurrente pasa (`return true` sin condicion). **Sin corregir.**
4. **`logging` — test de exercise roto que nunca falla.** En
   `exercises.json`, item `sampling-decision-2`, el test usa
   `toBeCloseToOrEqual`, un metodo que no existe en el mini-API de
   `expect()` (solo soporta `toBe`/`toEqual`/`toBeTruthy`/`toThrow`) — el
   test nunca verifica nada real, pasa siempre sin importar la
   implementacion del lector. La formula en si es correcta, solo el test
   esta roto. **Sin corregir.**
5. **`persistence` — bloques de codigo en L2 mal etiquetados como
   ` ```python ` cuando no son ni Python ni JS valido** (mezclan
   `function foo(x, y):` — sintaxis de ambos lenguajes pegada). Dos
   ocurrencias en `L2-concept.mdx`. **Sin corregir.**
6. **`sockets` — `L1-summary.mdx` rompe problem-first:** abre con
   `## The minimum map` (una lista seca) antes de que aparezca el
   `&lt;Scenario&gt;`, y por lo tanto tambien el `&lt;LevelIntro&gt;` queda
   despues del primer `##` en vez de antes. **Sin corregir.**
7. **Defecto de diseno de pools, encontrado en `trade-off-documentation` Y
   `transactions`:** varios `poolId` agrupan dos tareas de codigo
   _distintas_ (no variantes de la misma pregunta) bajo el mismo pool — como
   `ExercisePanel` solo muestra una variante al azar por pool, una de las
   dos tareas queda oculta para el lector en cada vista. Ejemplos:
   `l3-weighted-score-code` (`totalWeightedScore` vs `winningOption`),
   `l3-stale-flagger-code` (`ageInDays` vs `isStaleStatus`),
   `transaction-wrapper-pool` (`runTransaction` vs `stockNeverNegative`),
   `durability-pool` (`durableCommit` vs `recoverFromLog`). **Sin
   corregir** — vale la pena revisar si este patron aparece en mas tracks.

Hallazgos menores sin corregir: `query-planning`/`timeouts` con exercises
delgados (22 items c/u); `cap-theorem`/`cors` sin elementos visuales en L3
(todo en L1/L2); `indexing`'s interactive probablemente aplana la linea de
B-tree en el chart compartido (no es bug de computo, es de escala visual —
verificar en navegador).

### Track `git-teamwork` (16/16 unidades) — auditado 2026-10-05

9/16 SOLID: `feature-flags`, `feedback-framing`, `merge`, `ownership`,
`reflog`, `rfcs`, `checkout`, `documentation-culture`,
`snapshots-manual-copies`.

6/16 MINOR ISSUES: `merge-rebase` (sin `interactives.json`, exercises
delgados 24 vs ~40), `prs` (exercises delgados 30 vs ~40, L3 sin diagramas),
`shared-history` (exercises muy delgados ~20 vs ~40 + defecto de pools),
`technical-leadership` (defecto de pools), `working-tree` (defecto de pools +
interactivo con 2 lineas que son complemento aritmetico — el mismo
anti-patron que CLAUDE.md ya marca como bug conocido corregido antes),
`branching-strategies` (exercises delgados en L2, L3 sin la pregunta de
extension "beyond this example" que las otras 3 unidades del mismo lote si
tienen).

1/16 NEEDS WORK: **`commit-conventions`** — defecto de pools (dos veces):
`bisect-implementation-pool` mezcla `bisect()` y `stepsNeeded()` (funciones
distintas, no variantes) bajo un mismo poolId, y
`conventional-commits-parsing-pool` mezcla `parseConventionalCommit` y
`groupCommitsByType` de la misma forma. Como solo se muestra una variante
por pool, una de las dos tareas de codigo queda oculta para el lector cada
vez. Tambien exercises delgados (35 vs ~40). **Sin corregir.**

**Patron confirmado y ahora recurrente — defecto de diseno de pools.**
Encontrado en 6 unidades distintas entre `systems` y `git-teamwork`
(`trade-off-documentation`, `transactions`, `shared-history`,
`technical-leadership`, `working-tree`, `commit-conventions`): un `poolId`
agrupa dos ejercicios que son preguntas/tareas genuinamente distintas (no
variantes de la misma pregunta), y como `ExercisePanel` solo muestra una
variante al azar por pool, una de las dos queda permanentemente invisible
para cualquier lector dado. Dado que ya aparecio en 2 de 2 tracks
auditados hasta ahora, vale la pena correr un escaneo estructural
(no necesariamente con agentes, podria ser un script que compare los
`prompt`/nombres de funcion dentro de cada poolId) sobre **todos** los
tracks en paralelo a seguir auditando contenido en profundidad, en vez de
esperar a toparse con el mismo defecto track por track.

Este registro acompana la revision por tandas de 4 unidades. La meta es
detectar dudas que tendria una persona con base escolar, extender sin borrar
contenido existente y validar que cada unidad responda la pregunta del
roadmap.

Avance actual: 133 de 133 unidades escritas revisadas. **Completo.** (Nota: 4
unidades adicionales de ROADMAP.md siguen en estado `planned`, sin archivos
todavia, y no cuentan en el total de 133 unidades escritas: `people-management/calibration`,
`performance-improvement-plans`, `termination-process`,
`corporate-politics/documentation-discipline` — quedan fuera de esta revision
hasta que se escriban; cuando eso pase, revisarlas siguiendo el mismo
criterio de abajo.)

## Criterio de revision

- Confirmar si L1, L2 y L3 responden la pregunta de la unidad.
- Revisar si aparecen terminos tecnicos antes de explicarlos.
- Agregar puentes pedagogicos en la misma pagina cuando el concepto sea
  prerequisito.
- Usar enlaces internos o `learnMore` cuando el detalle ya vive en otra parte
  o cuando conviene mantener el flujo principal liviano.
- No borrar contenido existente como forma de simplificar: extender, aclarar o
  corregir contradicciones.

## Tandas

| Tanda | Unidades                                                                                                                                                                                                 | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `web/http-request-response-basics`, `web/need-html-semantics-just-divs`, `web/css-cascade-specificity`, `web/dom-event-model`                                                                            | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global. Auditoria de muestreo (2026-08-25) detecto en `web/http-request-response-basics` un encabezado en espanol (regla 1), jerga TCP/DNS/TLS sin explicar y un `interactives.json` desconectado del escenario — corregido: encabezado a ingles, glosas agregadas en L1, y nuevo item `detection-time-by-poll-interval` en `interactives.json` anclado al ~40s del escenario. `lint`/`format:check`/`typecheck` reverificados OK tras la correccion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2     | `web/bundling`, `web/component-state`, `web/cors`, `web/client-side-caching`                                                                                                                             | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3     | `web/render-performance`, `web/xss`, `systems/process`, `systems/persistence`                                                                                                                            | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4     | `systems/algorithmic-complexity`, `systems/sockets`, `systems/concurrency`, `systems/race-conditions`                                                                                                    | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 5     | `systems/transactions`, `systems/indexing`, `systems/query-planning`, `systems/timeouts`                                                                                                                 | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6     | `git-teamwork/snapshots-manual-copies`, `git-teamwork/checkout`, `git-teamwork/working-tree`, `git-teamwork/merge`                                                                                       | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 7     | `git-teamwork/merge-rebase`, `git-teamwork/commit-conventions`, `git-teamwork/branching-strategies`, `git-teamwork/prs`                                                                                  | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 8     | `git-teamwork/shared-history`, `business-communication/audience-awareness`, `business-communication/status-updates-build-trust`, `business-communication/reading-stakeholder-incentives`                 | Extendida; formato OK; `typecheck` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9     | `business-communication/building-credibility-ahead-ask`, `business-communication/conflict-resolution`, `business-communication/decision-making-frameworks`, `business-communication/executive-summaries` | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 10    | `business-communication/pushback-frameworks`, `logic/boolean-logic`, `logic/edge-case-reasoning`, `logic/fallacies`                                                                                      | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 11    | `logic/formal-informal-logic`, `logic/induction`, `logic/problem-decomposition`, `logic/state-machines`                                                                                                  | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 12    | `security/security-mindset`, `security/authentication-fundamentals`, `security/authorization-models`, `security/hashing`                                                                                 | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 13    | `security/owasp-top-10`, `security/symmetric-asymmetric-encryption-basics`, `security/tls-https`, `infra-delivery/ci-cd-pipeline-anatomy`                                                                | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 14    | `infra-delivery/deployment-automation`, `infra-delivery/orchestration-basics`, `infra-delivery/infrastructure-code`, `infra-delivery/progressive-delivery`                                               | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 15    | `career-craft/leveling-expectations`, `career-craft/asking-feedback`, `career-craft/mentoring-fundamentals`, `career-craft/structured-interviewing`                                                      | Extendida; formato OK; typecheck OK; build OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 16    | `career-craft/goal-setting`, `career-craft/impact-scope-over-correctness`, `career-craft/documentation-career-tool`, `career-craft/calibration-processes`                                                | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 17    | `product-domain/understanding-user-s-problem-solution`, `product-domain/requirements-gathering`, `product-domain/domain-driven-design-basics`, `product-domain/bounded-contexts`                         | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 18    | `product-domain/validation`, `product-domain/value-framing-over-feature-framing`, `product-domain/buyer-psychology`, `corporate-politics/power-real-resource`                                            | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 19    | `corporate-politics/white`, `corporate-politics/who-holds-influence`, `corporate-politics/favor-economy`, `corporate-politics/framing`                                                                   | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 20    | `corporate-politics/strategic-ambiguity`, `corporate-politics/subtext`, `corporate-politics/credit-stealing`, `learning-craft/exposure-understanding`                                                    | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 21    | `learning-craft/feynman-technique`, `learning-craft/search-literacy`, `learning-craft/source-evaluation`, `learning-craft/spaced-repetition`                                                             | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 22    | `learning-craft/systematic-exploration`, `learning-craft/weighing-credibility`, `applied-math/asymptotic-analysis`, `applied-math/combinatorics`                                                         | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 23    | `applied-math/math-tool-prediction`, `applied-math/measurement-theory`, `applied-math/orders-magnitude`, `applied-math/probability-distributions-uniform`                                                | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 24    | `applied-math/queueing-theory-basics`, `applied-math/statistics`, `applied-math/time-series-basics`, `architecture/architecture-styles`                                                                  | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 25    | `architecture/domain-driven-design`, `architecture/event-driven-architecture`, `architecture/hexagonal-clean-architecture`, `design/design-thinking-process`                                             | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 26    | `design/information-architecture`, `design/usability-heuristics`, `design/visual-design-fundamentals`, `infra-delivery/docker`                                                                           | Extendida; formato OK; `typecheck` OK; `build` OK; `validate:content` bloqueado por frontmatter faltante global                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 27    | `infra-delivery/environment-parity`, `people-management/1`, `people-management/defining-role`, `people-management/delegation-levels`                                                                     | `environment-parity`: revisada, sin defectos (solo jerga menor no bloqueante: "content-addressed", "orchestrator"). `people-management/1`: `interactives.json` invocaba una cifra de "3 reuniones" no anclada en el contenido y que de hecho contradecia el argumento de L3 (la estructura funciona desde la primera reunion) — corregido, ahora mide aperturas protegidas por trimestre segun cadencia. Slug `1` es una decision previa deliberada (ver `PROGRESS.md`), no un defecto nuevo — no se toco. `people-management/defining-role`: faltaba `interactives.json` (agregado: senales sin probar segun slots recortados, anclado en los 3 signals/5 slots de L3), `exercises.json` estaba delgado (23 items, se amplio a 37 con 6 pools nuevos entre L1-L3), y L1 no tenia ningun elemento visual (se agrego tabla vago-vs-concreto). `people-management/delegation-levels`: `interactives.json` tenia una segunda linea de salida (`costIfCaught`) fija en 0 en todo el rango — puro ruido redundante — eliminada, el hecho de "$0" quedo en la descripcion. `lint`/`format:check`/`typecheck` reverificados OK tras las correcciones. |

| 28 | `people-management/sbi-framework`, `people-management/goal-setting`, `people-management/early-signals`, `people-management/mediation` | `sbi-framework`: sin defectos de contenido; solo faltaba un elemento visual en L1 (se agrego tabla trait-based-vs-SBI). `goal-setting`: la sigla "OKR" se usaba en `exercises.json`/L3 sin definirla nunca — corregido en L1 Key terms; "P1" (prioridad 1 de incidentes) tampoco se explicaba — glosa agregada en L2. `early-signals`: "EAP" sin explicar en L3 (glosado), `exercises.json` estaba delgado (26 items) y se amplio a 40 con 6 pools nuevos (3 en L2, 3 en L3), e `interactives.json` tenia un `compute` de funcion identidad pura (y=x, sin insight real) — corregido para incorporar el piso de "ventana minima de patron" (7 dias) del propio framework de L3. `mediation`: sin defectos; ausencia deliberada de `interactives.json` ya documentada y justificada en `PROGRESS.md`. `lint`/`format:check`/`typecheck` reverificados OK tras las correcciones. |

| 29 | `people-management/ic-excellence-management`, `people-management/onboarding-design`, `corporate-politics/documentation-discipline`, `software-design/cost-design` | `ic-excellence-management`: sin defectos. `onboarding-design`: "30/60/90" sin glosar (corregido en L1), faltaba `interactives.json` (agregado: dias-hasta-primer-aporte segun tamano del volcado de contexto, anclado en el 40-paginas/~14-dias del escenario), `exercises.json` estaba delgado (26 items, ampliado a 42 con 8 pools nuevos entre L1-L3). `corporate-politics/documentation-discipline`: **no existe todavia** — sigue en estado `planned` en `ROADMAP.md` (el script de extraccion anterior tuvo un falso positivo por matchear "done" como substring dentro del texto "CYA done well" de esa fila, no en la columna de estado real; corregido el metodo de conteo). `software-design/cost-design`: sin defectos. Bug propio detectado durante verificacion en navegador: el `compute` del nuevo item de `onboarding-design/interactives.json` referenciaba `pagesIntroducedAtOnce` directo en vez de `params.pagesIntroducedAtOnce`, dejando el output en blanco — corregido y re-verificado (40 paginas → 14 dias, reproduciendo el ~2-semanas del escenario). `lint`/`format:check`/`typecheck`/`validate:content`/`test`/`build` reverificados OK tras las correcciones. |

| 30 | `software-design/dry`, `software-design/immutability`, `software-design/naming`, `software-design/oop-design-trade-offs` | Las 4 unidades pasaron sin defectos bloqueantes. `dry`: L1 no tenia ningun elemento visual — se agrego tabla true-vs-coincidental (unico ajuste aplicado). Notas no bloqueantes sin corregir (consistente con el criterio usado en tandas previas, ej. `systems/transactions`): `immutability` tiene solo 22 exercises vs ~40 objetivo; `dry` y `naming` tienen algunos pools de `exercises.json` sin campo `reference` opcional. Se verificaron especificamente los `compute` de los 4 `interactives.json` por el bug de `params.x` encontrado en la tanda anterior — todos correctos. `lint`/`format:check`/`typecheck` reverificados OK tras la correccion. |

## Siguiente tanda sugerida

Nota: `people-management/calibration`, `performance-improvement-plans`,
`termination-process` y `corporate-politics/documentation-discipline` siguen
en estado `planned` en `ROADMAP.md` (sin archivos escritos todavia) — no se
pueden revisar hasta que existan.

| Tanda | Unidades                                                                                                                                                                   | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31    | `software-design/single-responsibility`, `software-design/solid-principles`, `sustainable-performance/attention-management`, `sustainable-performance/early-warning-signs` | Las 4 unidades pasaron sin defectos. Unica nota menor sin corregir: `early-warning-signs`' `interactives.json` tiene defaults que producen ~6.0 meses en vez de reproducir exactamente el "4 meses" del Path A de L3 (anclaje flojo, no un defecto duro segun el revisor). Se verificaron los 4 `compute` por el bug de `params.x` — todos correctos. No se corrio `check` completo porque no hubo cambios de contenido en esta tanda. |

## Siguiente tanda sugerida

Nota: `people-management/calibration`, `performance-improvement-plans`,
`termination-process` y `corporate-politics/documentation-discipline` siguen
en estado `planned` en `ROADMAP.md` (sin archivos escritos todavia) — no se
pueden revisar hasta que existan.

| Tanda | Unidades                                                                                                                                                                                               | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32    | `sustainable-performance/energy-management-across-day-week`, `sustainable-performance/myth-linear-output`, `sustainable-performance/sustainable-boundary-setting`, `testing-quality/assertions-matter` | Las 4 unidades pasaron sin defectos. `sustainable-boundary-setting` tiene solo 26 exercises vs ~40 objetivo (nota no bloqueante, sin corregir). `myth-linear-output` tiene 2 items `code` en L3 pero estan justificados: implementan la formula cuantitativa real que ya sustenta `interactives.json`, no razonamiento disfrazado de codigo. Se verificaron los 4 `compute` por el bug de `params.x` — todos correctos. No se corrio `check` completo porque no hubo cambios de contenido en esta tanda. |

## Siguiente tanda sugerida

Nota: `people-management/calibration`, `performance-improvement-plans`,
`termination-process` y `corporate-politics/documentation-discipline` siguen
en estado `planned` en `ROADMAP.md` (sin archivos escritos todavia) — no se
pueden revisar hasta que existan.

| Tanda | Unidades                                                                                                                     | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 33    | `testing-quality/bdd`, `testing-quality/case-automated-testing`, `testing-quality/flaky-tests`, `testing-quality/tdd-basics` | `bdd`: `interactives.json` tenia una segunda linea de salida (`behaviorBasedBroken`) fija en 0 en todo el rango — mismo patron de ruido redundante detectado y corregido en `delegation-levels` (tanda 27) — eliminada, el hecho "0 broken" quedo en la descripcion. `case-automated-testing`: sin defectos. `flaky-tests`: solo 22 exercises vs ~40 objetivo y "TTL" sin glosar (notas no bloqueantes, sin corregir). `tdd-basics`: sin `interactives.json` pero plausiblemente justificado (el tema es una maquina de estados, no una relacion numerica obvia para un slider) y 2 pools de codigo sin `reference` opcional (notas no bloqueantes, sin corregir). `lint`/`format:check`/`typecheck` reverificados OK tras la correccion. |

| 34 | `testing-quality/test-doubles`, `testing-quality/test-pyramid` | Ambas unidades pasaron sin defectos — ningun `interactives.json` tenia el patron de linea constante/redundante, ningun `compute` tenia el bug de `params.x`, ambas con 40 exercises exactos (13/13/14). No se corrio `check` completo porque no hubo cambios de contenido en esta tanda. |

## Cierre de la revision

Las 133 unidades escritas del proyecto quedaron revisadas al terminar la
tanda 34. Resumen de lo encontrado a lo largo de las 34 tandas:

- La mayoria de las unidades (alrededor del 90%) pasaron sin defectos.
- Los defectos reales encontrados y corregidos fueron, en su mayoria, de
  tres tipos: (1) jerga sin glosar en el primer uso (TCP/DNS/TLS, EAP, OKR,
  P1, "30/60/90"), (2) `interactives.json` con lineas de salida redundantes
  — ya sea una linea constante en 0 (`delegation-levels`, `bdd`) o una
  formula ficticia no anclada en el contenido de la unidad
  (`http-request-response-basics`, `people-management/1`) — y (3)
  `exercises.json` o `interactives.json` faltantes cuando el contenido si
  tenia una relacion cuantificable real que no se exploto
  (`defining-role`, `onboarding-design`).
- Un bug real de codigo (no de contenido pedagogico) se encontro y corrigio
  en `onboarding-design/interactives.json`: el `compute` referenciaba el
  parametro sin el prefijo `params.`, dejando el output en blanco. Se
  verifico especificamente este patron en el resto de las unidades
  revisadas desde entonces (tandas 30-34) sin encontrar otra instancia.
- Notas no bloqueantes documentadas pero sin corregir (por ser
  subjetivas o de bajo impacto, siguiendo el mismo criterio usado desde
  el principio de la revision): varias unidades con `exercises.json` mas
  delgado que el objetivo piloto de ~40 items (`systems/transactions`,
  `immutability`, `sustainable-boundary-setting`, `flaky-tests`), y un
  puñado de jerga menor de un solo uso sin glosar
  ("content-addressed", "orchestrator", "TTL").

Las 4 unidades que quedaban en `planned` (`people-management/calibration`,
`performance-improvement-plans`, `termination-process`,
`corporate-politics/documentation-discipline`) se escribieron el
2026-08-25, aplicando directamente el mismo criterio de la revision
durante la redaccion (Scenario + Mermaid + tabla + xychart-beta por
unidad, `interactives.json` con una relacion real no redundante,
~24 items de `exercises.json` cada una). `bun run check` paso limpio
y las 4 quedaron verificadas en navegador (sliders, grading de
exercises, diagramas). Quedan marcadas `done` en `ROADMAP.md`, pero
no pasaron por una revision independiente posterior al estilo de las
34 tandas — serian candidatas a una tanda 35 si se quiere ese mismo
nivel de verificacion cruzada.
