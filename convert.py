import csv
import json
import os

# ============================================================
# CONVERT.PY
# Converts CSV source files and QGIS geometry exports into
# GeoJSON files for the web application.
#
# Inputs:
#   data/nodes.csv                  — single source of truth
#   data/plantations_geometry.geojson — QGIS export
#   data/railroads_geometry.geojson   — QGIS export
#
# Outputs:
#   data/nodes.geojson              — all entries (mapped and unmapped)
#   data/plantations.geojson        — plantation polygons
#   data/railroads.geojson          — railroad polylines
# ============================================================


def safe_int(val):
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def safe_bool(val):
    return str(val).strip().upper() == 'TRUE'


def safe_str(val):
    s = str(val).strip() if val is not None else ''
    return s if s else None


# ============================================================
# NODES TO GEOJSON
# Reads nodes.csv and outputs a single FeatureCollection.
# All entries are included — mapped and unmapped.
# Unmapped entries have geometry: null.
# ============================================================

def nodes_to_geojson(csv_file, geojson_file):
    features = []

    with open(csv_file, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:

            # Geometry — only for mapped entries with coordinates
            mapped = safe_bool(row.get('mapped'))
            try:
                lng = float(row['longitude'])
                lat = float(row['latitude'])
                geometry = {
                    "type": "Point",
                    "coordinates": [lng, lat]
                }
            except (ValueError, TypeError, KeyError):
                geometry = None
                if mapped:
                    print(f"  Warning: {row.get('id')} is mapped but has no valid coordinates")

            # Relational fields — reified edges
            directed_location = safe_bool(row.get('directed_location'))
            directed_other    = safe_bool(row.get('directed_other'))

            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    # Core
                    "id":           row['id'],
                    "label_en":     safe_str(row.get('label_en')),
                    "label_es":     safe_str(row.get('label_es')),
                    "node_type":    safe_str(row.get('node_type')),
                    "node_subtype": safe_str(row.get('node_subtype')),
                    "mapped":       mapped,

                    # Event Sequence
                    "parent_event":    safe_str(row.get('parent_event')),
                    "sequence_value":  safe_int(row.get('sequence_value')),

                    # Temporal
                    "year_start": safe_int(row.get('year_start')),
                    "year_end":   safe_int(row.get('year_end')),

                    # Spatial relations (for map bezier curves)
                    "source_location":   safe_str(row.get('source_location')),
                    "target_location":   safe_str(row.get('target_location')),
                    "directed_location": directed_location,

                    # Non-spatial relations (for network view)
                    "source_other":   safe_str(row.get('source_other')),
                    "target_other":   safe_str(row.get('target_other')),
                    "directed_other": directed_other,

                    # Content
                    "description_en": safe_str(row.get('description_en')),
                    "description_es": safe_str(row.get('description_es')),
                    "panel_html":     safe_bool(row.get('panel_html')),
                    "image_path":     safe_str(row.get('image_path')),

                    # Attribution
                    "source": safe_str(row.get('source')),
                    "citation": safe_str(row.get('citation')),
                    "page":   safe_str(row.get('page')),

                    # Country
                    "country": safe_str(row.get('country'))
                }
            }
            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open(geojson_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

    total    = len(features)
    mapped   = sum(1 for feat in features if feat['properties']['mapped'])
    unmapped = total - mapped
    relations = sum(1 for feat in features
                    if feat['properties']['source_location'] or
                       feat['properties']['source_other'])

    print(f"Nodes done — {total} entries written to {geojson_file}")
    print(f"  {mapped} mapped, {unmapped} unmapped, {relations} reified relations")


# ============================================================
# MERGE GEOMETRY
# Merges QGIS geometry exports with metadata from nodes.csv
# by matching on node_id. Used for plantations and railroads.
# ============================================================

def merge_geometry(csv_file, geometry_file, output_file, geometry_type):
    if not os.path.exists(geometry_file):
        print(f"Skipping {output_file} — geometry file not found: {geometry_file}")
        return

    # Load QGIS geometry export
    with open(geometry_file, 'r', encoding='utf-8') as f:
        geometry_data = json.load(f)

    # Build geometry lookup by id
    geometry_lookup = {}
    for feature in geometry_data['features']:
        gid = feature['properties'].get('id')
        if gid is not None:
            geometry_lookup[int(gid)] = feature['geometry']

    # Load metadata CSV — separate file per geometry type
    # with geometry_id column linking to QGIS export
    features = []
    with open(csv_file, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            geometry_id = safe_int(row.get('geometry_id'))
            geometry    = geometry_lookup.get(geometry_id)

            if geometry is None:
                print(f"  Warning: no geometry found for {row['id']} (geometry_id: {geometry_id})")
                continue

            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "node_id":    row.get('node_id', ''),
                    "label_en":   safe_str(row.get('label_en')),
                    "label_es":   safe_str(row.get('label_es')),
                    "year_start": safe_int(row.get('year_start')),
                    "year_end":   safe_int(row.get('year_end'))
                }
            }
            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

    print(f"{geometry_type} done — {len(features)} features written to {output_file}")


# ============================================================
# RUN ALL CONVERSIONS
# ============================================================

nodes_to_geojson(
    'data/nodes.csv',
    'data/nodes.geojson'
)

merge_geometry(
    'data/plantations.csv',
    'data/plantations_geometry.geojson',
    'data/plantations.geojson',
    'Plantations'
)

merge_geometry(
    'data/railroads.csv',
    'data/railroads_geometry.geojson',
    'data/railroads.geojson',
    'Railroads'
)

translations_to_js('data/translations.json', 'js/translations.js')