import json
import os
import re
import markdown
import frontmatter
from jinja2 import Environment, FileSystemLoader

# ============================================================
# RENDER.PY
# Renders panel HTML files from .md content files and
# nodes.geojson metadata.
#
# Inputs:
#   data/nodes.geojson              — entry metadata and relations
#   js/translations.js              — bilingual UI labels
#   data/panels/[id].md             — bilingual content files
#   templates/generic.html          — default template
#   templates/source.html           — template for source entries
#   templates/parent_event.html     — template for parent event entries
#
# Outputs:
#   panels/[id].html                — rendered panel pages
# ============================================================

PANELS_MD_DIR   = 'data/panels'
PANELS_OUT_DIR  = 'panels'
TEMPLATES_DIR   = 'templates'
GEOJSON_FILE    = 'data/nodes.geojson'
TRANSLATIONS_FILE = 'js/translations.js'

# ============================================================
# LOAD DATA
# ============================================================

with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
    geojson = json.load(f)

import re

with open('js/translations.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Strip var ui = and trailing semicolon
js = re.sub(r'^\s*var\s+ui\s*=\s*', '', js.strip())
js = re.sub(r';\s*$', '', js.strip())

# Strip JS single-line comments
js = re.sub(r'//[^\n]*', '', js)

tr = json.loads(js)

features = geojson['features']

# Build entry lookup by id
entry_lookup = {}
for feature in features:
    fid = feature['properties'].get('id')
    if fid:
        entry_lookup[fid] = feature

# Build relations index — for each entry id, list of relation properties that connect to it
relations_index = {}
for feature in features:
    p = feature['properties']
    is_relation = p.get('source_location') or p.get('source_other') or \
                  p.get('target_location') or p.get('target_other')
    if not is_relation:
        continue
    connected_ids = set(filter(None, [
        p.get('source_location'),
        p.get('target_location'),
        p.get('source_other'),
        p.get('target_other')
    ]))
    for cid in connected_ids:
        if cid not in relations_index:
            relations_index[cid] = []
        relations_index[cid].append(p)

# ============================================================
# HELPERS
# ============================================================

def extract_language_block(body, lang):
    """Extract the content block for a given language from bilingual markdown body."""
    pattern = r'<!--\s*' + lang + r'\s*-->(.*?)(?=<!--\s*[a-z]{2}\s*-->|$)'
    match = re.search(pattern, body, re.DOTALL)
    if match:
        return match.group(1).strip()
    return body.strip()

def render_markdown(text):
    """Convert markdown text to HTML."""
    return markdown.markdown(text, extensions=['extra'])

def get_connections(entry_id):
    """Find all entries connected to this entry via relations."""
    relations = relations_index.get(entry_id, [])
    connections = []
    for r in relations:
        ids = {
            'source_location': r.get('source_location'),
            'target_location': r.get('target_location'),
            'source_other':    r.get('source_other'),
            'target_other':    r.get('target_other')
        }
        for field, oid in ids.items():
            if oid and oid != entry_id:
                other = entry_lookup.get(oid)
                if other:
                    connections.append({
                        'id':               oid,
                        'label_en':         other['properties'].get('label_en', oid),
                        'label_es':         other['properties'].get('label_es', oid),
                        'node_type':        other['properties'].get('node_type', ''),
                        'node_subtype':     other['properties'].get('node_subtype', ''),
                        'relation_type':    r.get('node_type', ''),
                        'relation_subtype': r.get('node_subtype', ''),
                        'year_start':       r.get('year_start'),
                        'directed':         r.get('directed_location') or r.get('directed_other')
                    })
    return connections

def get_citations(source_ids_str):
    """Look up Chicago citations for pipe-separated source ids."""
    if not source_ids_str:
        return []
    citations = []
    for sid in source_ids_str.split('|'):
        sid = sid.strip()
        source = entry_lookup.get(sid)
        if source:
            citation = source['properties'].get('citation')
            if citation:
                citations.append({
                    'id':       sid,
                    'citation': citation
                })
    return citations

def get_cited_by(source_id):
    """Find all entries that cite this source."""
    cited_by = []
    for feature in features:
        p = feature['properties']
        sources = p.get('source', '') or ''
        if source_id in [s.strip() for s in sources.split('|')]:
            cited_by.append({
                'id':           p.get('id'),
                'label_en':     p.get('label_en'),
                'label_es':     p.get('label_es'),
                'node_type':    p.get('node_type'),
                'node_subtype': p.get('node_subtype')
            })
    return cited_by

def get_child_events(parent_id):
    """Find all child events of a parent event, sorted by sequence_value."""
    children = []
    for feature in features:
        p = feature['properties']
        if p.get('parent_event') == parent_id:
            children.append({
                'id':             p.get('id'),
                'label_en':       p.get('label_en'),
                'label_es':       p.get('label_es'),
                'node_type':      p.get('node_type'),
                'node_subtype':   p.get('node_subtype'),
                'sequence_value': p.get('sequence_value'),
                'description_en': p.get('description_en'),
                'description_es': p.get('description_es')
            })
    children.sort(key=lambda x: x.get('sequence_value') or 0)
    return children

def build_tags(p, post, tr):
    """Build bilingual tag lists from subtype, country, and manual frontmatter tags."""
    subtype_tag_en = tr['en']['subtypes'].get(p.get('node_subtype', ''), '') if p.get('node_subtype') else ''
    subtype_tag_es = tr['es']['subtypes'].get(p.get('node_subtype', ''), '') if p.get('node_subtype') else ''
    country_tag    = p.get('country', '')
    manual_tags_en = post.metadata.get('tags_en', [])
    manual_tags_es = post.metadata.get('tags_es', [])
    tags_en = ([subtype_tag_en] if subtype_tag_en else []) + \
              ([country_tag]    if country_tag    else []) + \
              manual_tags_en
    tags_es = ([subtype_tag_es] if subtype_tag_es else []) + \
              ([country_tag]    if country_tag    else []) + \
              manual_tags_es
    return tags_en, tags_es

def select_template(p, child_events):
    """Select the appropriate Jinja2 template based on entry type."""
    if p.get('node_type') == 'source':
        return 'source.html'
    elif child_events:
        return 'parent_event.html'
    else:
        return 'generic.html'

# ============================================================
# JINJA2 ENVIRONMENT
# ============================================================

env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

# ============================================================
# RENDER PANELS
# ============================================================

os.makedirs(PANELS_OUT_DIR, exist_ok=True)

rendered = 0
skipped  = 0

for md_filename in os.listdir(PANELS_MD_DIR):
    if not md_filename.endswith('.md'):
        continue

    entry_id = md_filename[:-3]
    entry    = entry_lookup.get(entry_id)

    if not entry:
        print(f'  Warning: no geojson entry found for {entry_id} — skipping')
        skipped += 1
        continue

    p = entry['properties']

    # Load and parse markdown file
    md_path = os.path.join(PANELS_MD_DIR, md_filename)
    post    = frontmatter.load(md_path)

    # Extract bilingual body sections
    body_en = render_markdown(extract_language_block(post.content, 'en'))
    body_es = render_markdown(extract_language_block(post.content, 'es'))

    # Build tags
    tags_en, tags_es = build_tags(p, post, tr)

    # Connections, citations, cited_by, child_events
    connections  = get_connections(entry_id)
    citations    = get_citations(p.get('source'))
    cited_by     = get_cited_by(entry_id) if p.get('node_type') == 'source' else []
    child_events = get_child_events(entry_id) if p.get('parent_event') == 'TRUE' else []

    # Select template
    template_name = select_template(p, child_events)
    template      = env.get_template(template_name)

    # Render
    html = template.render(
        id           = entry_id,
        node         = p,
        meta         = post.metadata,
        body_en      = body_en,
        body_es      = body_es,
        tags_en      = tags_en,
        tags_es      = tags_es,
        connections  = connections,
        citations    = citations,
        cited_by     = cited_by,
        child_events = child_events,
        parent_id    = p.get('parent_event'),
        tr           = tr
    )

    out_path = os.path.join(PANELS_OUT_DIR, entry_id + '.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)

    rendered += 1
    print(f'  Rendered: {entry_id}.html ({template_name})')

print(f'\nDone — {rendered} panels rendered, {skipped} skipped')