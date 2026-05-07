# Data Conventions

## Entry types and subtypes

### place
Human settlements that exist independently of UFCo operations.
- `city` — populated settlements
- `public_site` — publicly accessible spaces not tied to UFCo: hospitals, courthouses
- `worker_site` — spaces claimed or used by organized labor: strike HQs, meeting points

### infrastructure
Operational apparatus of the banana economy and transport network.
- `port` — maritime entry and export points
- `railroad` — rail lines (paired with a QGIS geometry layer)
- `company_town` — UFCo-built residential and commercial settlements
- `plantation` — banana growing operations (paired with a QGIS geometry layer)
- `office` — UFCo and other corporate administrative buildings and divisional headquarters
- `vessel` — individual ships and steamers

### institution
Organized bodies with formal structure.
- `state` — government bodies and agencies
- `company` — private corporations
- `organization` — political parties, unions, civic associations

### event
Historical occurrences with temporal and spatial bounds. Only mappable events have markers.
- `strike` — organized labor actions
- `disease` — illness and epidemic outbreaks, particularly malaria and conditions tied to labor conditions
- `natural` — non-human-directed phenomena: earthquakes, floods, other natural events

### person
Individual historical actors.
- `ufco_manager` — UFCo administrative and managerial personnel
- `plantation_owner` — national landowners growing bananas under UFCo contracts
- `worker` — plantation, railroad and port laborers
- `organizer` — labor and political organizers
- `politician` — actors deriving authority from electoral mandate
- `official` — actors deriving authority from appointment
- `military` — military personnel acting under military command

### source
Primary and secondary sources. Not mapped. Subtypes defined by panel template — see render.py documentation.

---

## Relation types and subtypes

Relations are encoded as reified edge entries in the database when they carry enough metadata to warrant their own node. Simpler connections are derived at build time for the network diagram visualization.

### event relations
- `coercion` — structural, systemic pressure: scrip system, arbitrary arrests, wage manipulation, extrajudicial deportation
- `violence` — physical acts with no legal pretext: burning, shooting, physical intimidation
- `legal` — court proceedings, habeas corpus, legislation, decrees, legally-executed deportations

### information relations
- `correspondence` — personal and institutional letters, memos, internal directives
- `report` — annual reports, labor reports, government reports
- `press` — news articles and press coverage
- `advertisement` — paid promotional content including Unifruitco magazine features
- `notice` — public statements by organizations, parties, unions: manifestos, declarations, strike demands, flyers

### trade relations
- `capital` — money, credit, financial flows, land concessions
- `shipment` — physical movement of goods
- `labor` — movement and deployment of workers, recruitment, migration

---

## Ambiguous cases

### Deportation
- Deportation executed under legal order → `event / legal`
- Extrajudicial deportation → `event / coercion`

### Coercion vs violence
- `coercion` — systemic or structural acts, with or without legal pretext
- `violence` — physical acts with no legal cover

### Person subtype
When a person holds multiple roles (e.g. Manuel Mora as congressman and organizer), we assign the subtype most relevant to their function in the specific source being coded.

### Labor vs migration
Migration is encoded under `trade / labor`. The contractual vs non-contractual distinction is carried by the description or panel rather than the subtype.

---

## Naming conventions

- Entry IDs use lowercase with underscores: `puerto_limon`, `calufa`, `1934_banana_strike`
- Subtype values use underscores: `company_town`, `public_site`, `ufco_manager`
- Display labels (EN/ES) are handled separately in the ui object in config.js
- Panel markdown files are named exactly as the entry ID: `calufa.md`, `cerdas_1984.md`
- A mismatch between a panel filename and an entry ID will cause the panel not to render — this is the intended failure mode

---

## Sources

- Always cite `source` and `page` fields in the entry row
- Multiple sources separated by `|`
- Page ranges use en dash: `85–102`