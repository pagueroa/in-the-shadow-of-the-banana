# In the Shadow of the Banana

Interactive map and network visualization of the United Fruit Company's Caribbean empire,
centered on corporate infrastructure, informational networks, and worker strikes.
Built with Leaflet.js. Work in progress.

## About

This project takes its name from a chapter in *Mamita Yunai* (1941) by Costa Rican novelist 
and labor organizer Carlos Luis Fallas ("Calufa"). It maps the labor conflicts, corporate 
infrastructure, and communication networks of the United Fruit Company (UFCo) in Central 
America and the Caribbean, drawing on corporate, governmental, journalistic, and worker 
sources to reconstruct how the same events were narrated, justified, contested, and silenced 
across institutional and social positions.

The project's central argument is that these records are typically studied in isolation,
assigned to separate scholarly domains and archives. Read together, they reveal how corporate
empire was simultaneously enacted by force and narrated into being.

The 1934 banana strike (*Huelga Bananera*) serves as the primary case study for the initial version.

## Sources

Currently included:
- Cerdas Mora, Jaime. "La huelga bananera de 1934. Anécdotas y enseñanzas de uno de sus dirigentes principales." Revista ABRA 3, no. 2 (1984)

Future:
- UFCo annual reports
- UFCo corporate correspondence from the "United Fruit Company Papers" (University of Toronto Mississauga)
- Creative and expressive works of Costa Rican labor organizers and writers
- Contemporaneous Costa Rican and U.S. press coverage

## Stack

- **Leaflet.js** — map rendering
- **Python** — data pipeline (`convert.py`), CSV → GeoJSON/JSON
- **QGIS** — georeferencing and geometry
- **GitHub Pages** — hosting

## Data Model

All entities are nodes (`nodes.csv`). Node types: `place`, `event`, `institution`, 
`infrastructure`, `person`, `information`, `trade`, `source`. Persons and institutions are unmapped (`mapped: FALSE`) and will 
appear in a future network view. Edges will be derived at build time by `convert.py`.

## License

This work is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).