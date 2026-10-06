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

### Track `security` (13/13 unidades) — auditado 2026-10-05

6/13 SOLID: `authentication-fundamentals`, `hashing`, `incident-response`,
`secrets-management`, `secure-by-design`,
`symmetric-asymmetric-encryption-basics`.

6/13 MINOR ISSUES:

1. **`authorization-models`.** `dark:text-amber-390` (shade invalido de
   Tailwind) aparece 6 veces en `exercises.json` — no aplica color en modo
   oscuro. El output `fixedUnauthorizedPaths` de `interactives.json` es
   constante-cero en todo el rango del slider (ruido visual, el
   anti-patron ya nombrado en CLAUDE.md). **Sin corregir.**
2. **`defense-depth`.** Error factico real en `L3-deep-dive.mdx`: el
   comentario de `default-deny-all.yaml` afirma que la politica se aplica
   "cluster-wide" cuando el YAML tiene `namespace: storefront` — un
   `NetworkPolicy` de Kubernetes estandar es scoped por namespace, no
   cluster-wide (eso requeriria una extension de CNI como
   `GlobalNetworkPolicy` de Calico). Tambien un stat sin respaldo ("14 dias
   → detectado en minutos") en una tabla de costos que no se establece en
   ningun lado del escenario propio de la unidad, y un mismatch de
   nombre/archivo YAML (`db-proxy-ingress.yaml` vs `db-tier-ingress`).
   **Sin corregir.**
3. **`owasp-top-10` — bug de pool.** `classify-vulnerability-shape-pool`
   (L2, quiz) mezcla reconocer _broken access control/IDOR_ con
   reconocer _SSRF_ — dos categorias de vulnerabilidad distintas, no el
   mismo concepto desde otro angulo. Ademas exercises mas delgado que el
   resto del track (~28 items, 0 quiz en L3) y sin `interactives.json` sin
   nota explicita de por que se omite. **Sin corregir.**
4. **`security-mindset` — bug de pool.** `rate-limiter` (L3, code) mezcla
   `createRateLimiter` (limite por conteo) con `createSizeLimiter` (limite
   por tamaño) — dos mitigaciones de DoS distintas, dos funciones
   distintas. **Sin corregir.**
5. **`security-testing`.** Inexactitud menor en `L3`: el comentario del
   "falso positivo que este scanner VA a levantar" en `sast-scanner.js`
   describe un comportamiento que el regex (que matchea linea por linea)
   en realidad no produce con el ejemplo mostrado — la linea citada no
   contiene ninguna keyword SQL. **Sin corregir.**
6. **`tls-https` — vacio de alcance.** A pesar del nombre de la unidad,
   ningun nivel cubre el handshake de TLS en si (ClientHello/ServerHello,
   intercambio de claves, cipher suites, forward secrecy) — cero menciones
   reales de "handshake"/"ECDHE"/"forward secrecy"/"cipher suite" en todo
   el contenido. Todo el unit queda acotado a cadena de confianza de
   certificados / validacion de dominio / phishing, que esta bien hecho
   pero es un alcance mas chico de lo que promete el titulo. Tampoco tiene
   `interactives.json` pese a que hay candidatos naturales (profundidad de
   la cadena, superficie de ataque). **Sin corregir.**

1/13 NEEDS WORK:

7. **`supply-chain-security` — defecto de pools sistemico (contenido en si
   solido).** Las 5 pools `code` de `exercises.json` agrupan funciones
   genuinamente distintas, no variantes:
   `integrity-verify` (`verifyIntegrity`/`findTampered`/`allIntact`),
   `loose-range-detector`
   (`isLooseRange`/`findLooseRanges`/`countPinnedVsLoose`),
   `sbom-component-collector`
   (`toPurl`/`flattenComponents`/`generateSBOM`),
   `scan-sbom-advisories` (`scanSBOM`/`hasCriticalFinding`),
   `typosquat-distance`
   (`levenshtein`/`findTyposquatCandidates`/`isSuspiciouslyClose`). Esto
   reduce 15 ejercicios de codigo a solo 5 expuestos al azar por vista —
   el peor caso de este defecto encontrado hasta ahora en un solo unit.
   Tambien un no-op inofensivo pero confuso en
   `integrity-check.mjs`:`algorithm.replace("sha", "sha")`. **Sin
   corregir.**

Nota: ninguno de los 13 units tenia labels explicitos de nivel, y
`LevelIntro`/`Checkpoint` estan bien ubicados en los 13 sin excepcion — el
track esta estructuralmente solido, los hallazgos son puntuales (contenido
factico + pools) mas que estructurales.

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

### Track `infra-delivery` (12/12 unidades) — auditado 2026-10-05

4/12 SOLID: `docker`, `infra-observability`, `orchestration-basics`,
`rollback-strategy`.

8/12 MINOR ISSUES, de mas a menos concreto:

1. **`cost-awareness` — bug real de interactivo.** `interactives.json`'s
   `safety-margin-vs-cost`: el texto dice que staging esta provisionado
   "roughly 3.3x el pico medido, cerca de $3,600/mes", pero `compute` es
   `900 * marginMultiplier` — $3,600/$900 = 4.0x, no 3.3x. El 3.3x viene de
   otro ratio definido en otra parte de L1/L2 contra una baseline
   distinta; arrastrar el slider a 3.3 da $2,970, no los $3,600 que cita
   el texto. **Sin corregir.**
2. **`ci-cd-pipeline-anatomy` — bug de pool.**
   `pipeline-flow-order-pool` (exercises.json) agrupa dos hechos distintos
   bajo un mismo poolId: item `-1` prueba el orden
   commit→build→test→staging→production, item `-2` prueba que un gate
   frena el pipeline al fallar un test — relacionados pero no variantes
   intercambiables de la misma pregunta. Ambos items tambien carecen de
   `learnMore` (el resto de los pools si lo tiene). **Sin corregir.**
3. **`environment-parity` — ejemplo central de L3 no reproduce lo que
   afirma.** El ejemplo de `isToday` muestra
   `console.log(isToday(Date.now()))` devolviendo `true` en laptop y
   `false` en CI, pero como ambos argumentos (`now` interno y
   `Date.now()` pasado) se computan en el mismo instante en cualquier
   entorno, la funcion en realidad siempre devuelve `true` — nunca
   reproduce el bug que el comentario afirma. El bug real que se quiere
   modelar (comparar un timestamp _guardado_ en una zona horaria contra
   "ahora" calculado en otra) es legitimo, pero el codigo mostrado no lo
   hace. Es el ejemplo central de la unidad, vale la pena corregirlo.
   **Sin corregir.**
4. **`progressive-delivery` — recurrencia del anti-patron de pares
   complementarios.** `interactives.json`'s
   `canary-percent-vs-users-affected` grafica `usersAffected` y
   `usersProtected = totalUsers - usersAffected` — complementos
   aritmeticos exactos de un total fijo, el mismo anti-patron ya nombrado
   y corregido antes en este proyecto. Ademas los 3 elementos visuales de
   la unidad estan todos clusterizados en L2 (L1 y L3 sin ninguno), y
   `exercises.json` tiene solo 20 items (10/6/4, la mitad del objetivo
   ~40). **Sin corregir.**
5. **`deployment-automation` — interactivo con linea plana.**
   `interactives.json`'s `manual-vs-automated-recovery`:
   `automatedSeconds` esta hardcodeado a `10` y nunca varia con ningun
   param, por lo que en el chart (`chartParam: stepCount`) se ve como una
   linea perfectamente plana en todo el rango — el anti-patron de "output
   constante" ya nombrado en el proyecto. Puede ser intencional (el tiempo
   de automatizacion no escala con steps) pero el texto no lo aclara.
   Tambien L1 no tiene ningun diagrama/tabla/chart propio (todo el peso
   visual esta en L2/L3). **Sin corregir.**
6. **`infrastructure-code` — exercises redundantes + interactivo
   derivado.** Los 4 items de codigo de L3 (`diff-resources`,
   `diff-plan`, `detect-drift`, `find-drift`) son singletons sin poolId,
   pero `diff-resources`/`diff-plan` tienen logica de `solution` identica
   byte a byte (solo cambia el nombre de funcion), igual que
   `detect-drift`/`find-drift` — deberian haber sido 2 pools reales con
   datos de test variados, no 4 slots separados que un lector puede
   terminar resolviendo dos veces el mismo problema con otro nombre.
   Ademas `interactives.json`'s `drift-detection-delay` grafica
   `avgDetectionDelayDays = interval/2` y `worstCaseDelayDays = interval`
   — no son complementos aritmeticos literales, pero `avg` es siempre
   exactamente la mitad de `worst`, mismo espiritu del anti-patron (las
   dos lineas no aportan informacion independiente entre si). **Sin
   corregir.**
7. **`config-management` — gap menor de problem-first.** La seccion
   intermedia de `L2-concept.mdx` ("Where config actually lives") abre
   directo con una tabla comparativa sin pregunta-guia previa, a
   diferencia de las otras dos secciones de ese mismo L2 que si abren con
   una pregunta en negrita. **Sin corregir.**
8. **`staff-level-release-engineering-strategy` — L1 sin estructura de
   encabezados.** `L1-summary.mdx` no tiene ningun `##` — pasa
   directamente de `<Scenario>` a `<LevelIntro>` a una lista sin
   encabezar, saltandose el patron de "## The shape of the problem" /
   "## Key terms" que usan las otras 3 unidades del track y el resto del
   proyecto — no rompe ninguna regla puntual pero rompe la paridad
   estructural y deja sin un puente explicito hacia L2/L3. El uso
   narrativo de "staff-level" en el contenido es correcto (nunca se usa
   como tag de clasificacion, cumple la excepcion de la regla 3). **Sin
   corregir.**

Ningun unit del track califico NEEDS WORK. Codigo/config (Dockerfiles,
TypeScript, YAML, el motor plan/apply de `infrastructure-code`, la
maquina de estados de `rollback-strategy`) se verifico correcto en los 12
casos — todos los hallazgos son de `interactives.json`/`exercises.json`/
estructura, no errores logicos en el codigo de referencia.

### Track `applied-math` (15/15 unidades) — auditado 2026-10-06

Track de matematica — los agentes recomputaron a mano (y en varios casos
ejecutando el codigo real en Node) cada formula, tabla y chart para
detectar errores numericos silenciosos, no solo revisar estructura.

6/15 SOLID: `asymptotic-analysis`, `capacity-planning-math` (nota menor:
L3 no tiene ningun elemento visual propio — todo el peso visual esta en
L1/L2), `expected-value`, `linear-algebra-basics-vectors-matrices-where`,
`probability-distributions-uniform`, `time-series-basics`.

7/15 MINOR ISSUES:

1. **`statistics` — numero mal calculado.** `L3-deep-dive.mdx` afirma que
   `neededSampleSizeForSignificance(0.12, 0.18)` da `300`, pero ejecutando
   la funcion real (con el redondeo de `Math.round()` que aplica
   internamente) el primer `n` donde `|z| >= 1.96` es **260**, no 300
   (verificado: n=250 da z≈1.879 — no significativo, n=260 da z≈1.965 —
   significativo). El resto de la unidad (two-proportion z-test del
   escenario, interactivo, exercises) se verifico correcto. **Sin
   corregir.**
2. **`queueing-theory-basics` — error de redaccion numerica en un
   Checkpoint.** El Checkpoint de L2 dice "Arrival rate rises from λ = 8
   to λ = 9 — a 1.5-request increase" cuando 9−8=1, no 1.5; la respuesta
   del propio Checkpoint usa correctamente la caida de capacidad libre de
   2 a 1 (consistente con un aumento de 1, no 1.5). El resto de la
   unidad (formulas M/M/1, simulacion con PRNG semillada reproducida
   exactamente en Node) se verifico correcto. **Sin corregir.**
3. **`quantitative-modeling-design-decisions` — eje de chart mal
   etiquetado.** El `xychart-beta` de L2 ("Total monthly cost vs.
   volume") tiene labels de eje X redondos (`15M/20M/25M/.../45M`) pero
   los valores graficados en realidad corresponden a los volumenes reales
   de los meses 1,3,5,7,9,11,12 del cronograma de crecimiento (≈15M,
   20.45M, 25.91M, etc.), no a los volumenes redondos que dicen las
   etiquetas — confirmado recomputando el costo en el volumen redondo real
   (20M → 9250) contra el valor que muestra el chart (9490, que en
   realidad coincide con el mes 3 real de 20.45M). La leccion cualitativa
   (crossover ~16.9M) sigue siendo correcta via algebra, pero el chart
   esta mal rotulado contra sus propios datos. **Sin corregir.**
4. **`orders-magnitude` — explicacion de exercise sin editar + linea
   plana en interactivo.** `exercises.json`, item `conversion-factor-3`:
   el campo `explanation` quedo con texto de borrador sin terminar,
   autocontradictorio ("...producing a 1,000×1,000... no, exactly the
   1,000x error..."). Ademas `interactives.json`'s output `correctGB` es
   constante (siempre 10 GB) en todo el rango del slider — el anti-patron
   de "linea plana" que CLAUDE.md pide evitar, mejor mover a texto fijo en
   la descripcion. **Sin corregir.**
5. **`measurement-theory` — 2 hallazgos.** `exercises.json`, item
   `goodhart-formula-2` (implementa `proxyScore`, una funcion lineal
   simple sin termino de correlacion/penalizacion): sus campos
   `reference`/`learnMore` son copia literal del OTRO exercise
   (`goodhart-formula-1`, sobre `realTarget`) — describen una formula de
   penalizacion cuadratica que no tiene nada que ver con `proxyScore`. Un
   lector que falle este exercise y abra el whiteboard vera la
   explicacion de la funcion equivocada. Ademas, el `xychart` de L2
   termina en `98` para pressure=100, pero la formula real
   (`min(100, 40+0.6×pressure)`, reproducida identica en L3/interactives)
   da exactamente `100` en ese punto — los otros 4 puntos del chart si
   coinciden con la formula, solo el ultimo parece ajustado a mano para
   calzar con la narrativa del equipo B. **Sin corregir.**
6. **`math-tool-prediction` — chart con 2 valores mal calculados.** El
   `xychart-beta` de L3 ("Wait-time multiplier vs. traffic-growth
   multiplier") da `[1.0, 2.1, 3.6, 6.0]`, pero recalculando la formula
   exacta usada dos parrafos antes (`relativeWaitTime(u)/baseline`, con
   `u = 0.6 × growth`) el resultado correcto es `[1.0, 1.56, 2.67, 6.0]`
   — los 2 puntos intermedios estan mal (deberian ser ≈1.6 y ≈2.7, no 2.1
   y 3.6); solo los extremos coinciden. Contradice directamente el codigo
   `capacity-plan.mjs` renderizado arriba en el mismo archivo. **Sin
   corregir.**
7. **`graph-theory-basics` — inconsistencia numerica menor.** `L1-summary.mdx`
   dice "Six cities, five listed routes" pero la tabla de hechos y el
   diagrama mermaid solo tienen 5 nodos (SEA/DEN/ORD/ATL/MIA) — deberia
   decir "Five cities" (el resto de la unidad, incluida la matriz de
   adyacencia de L2 con "25 celdas" para 5 nodos, es consistente). **Sin
   corregir.**

2/15 NEEDS WORK:

8. **`combinatorics` — bug numerico real en el ejemplo central de L3,
   con efecto cascada.** El `console.log` de `findUncoveredPairs` en
   `L3-deep-dive.mdx` afirma el output
   `[['newCheckoutUI','promoCode'], ['applePay','promoCode'],
['applePay','expressShipping']]`, pero ejecutando el codigo real
   contra los 8 `adHocTestCases` del mismo archivo (verificado en Node) el
   resultado real es `[['newCheckoutUI','expressShipping'],
['applePay','promoCode'], ['applePay','expressShipping']]` — el primer
   par sin cubrir es `newCheckoutUI`/`expressShipping`, no
   `newCheckoutUI`/`promoCode` (ese par si esta cubierto). El error se
   propaga: la seccion "Extend it" (agregar un 9no test case) afirma que
   queda "un par sin cubrir" cuando en realidad quedan dos; y 2 items de
   `exercises.json` (`which-pairs-missed-1`, `ninth-test-case-1`) repiten
   la respuesta incorrecta como la "correcta". Ademas un test de
   `exercises.json` (`find-uncovered-pairs-2`) espera `[['b','c']]` pero
   la `solution` provista por el propio pool devuelve
   `[['a','c'],['b','c']]` contra ese input — un lector que implemente la
   funcion correctamente reprueba el test. **Sin corregir.**
9. **`unit-economics` — 2 charts cuyos datos no corresponden a la formula
   que la propia unidad establece.** El `xychart-beta` de L3 ("cumulative
   revenue vs. cumulative cost") usa una linea de costo que no seria la
   formula `cost(users) = 3200 + 0.66×users` establecida 2 parrafos antes
   — en x=283 el chart muestra cost=$5,000 cuando la formula da ≈$3,387,
   y la prosa afirma que el break-even ocurre en 283 "justo donde la
   linea de revenue cruza la de costo", pero con los valores graficados
   NO cruzan ahi (si cruzarian con el valor correcto de la formula). Solo
   x=0 coincide. Por separado, el `xychart-beta` de L2 (costo por unidad
   en función del volumen, con un escalon de costo fijo en 2000K) tiene 3
   puntos post-escalon que no corresponden a ninguna formula de costo fijo
   consistente (implican $12,000/$10,000/$9,000 de costo fijo nuevo segun
   el punto) — parecen elegidos a mano por efecto visual. El resto de la
   unidad (aritmetica de prosa, codigo TS, interactivos, exercises) se
   verifico extensamente correcto. **Sin corregir.**

Cross-cutting: ningun unit del track usa labels explicitos de nivel; la
estructura pedagogica (Scenario/LevelIntro/Checkpoint/extend-question) es
consistente en los 15. Todos los hallazgos de esta ronda son errores
numericos puntuales en prosa/charts/exercises, no errores de logica en el
codigo de referencia (salvo el test roto de `combinatorics`).
