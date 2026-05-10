// ============================================================
// ENTRY STYLES
// Colors, shapes, and sizes for each entry type and subtype
// ============================================================

var entryStyles = {

  place: {
    city:             { color: '#7a9ab5', shape: 'circle',   radius: 3.5  },
    public_site:      { color: '#5a7a95', shape: 'circle',   radius: 2  },
    worker_site:      { color: '#4a9a8a', shape: 'circle',   radius: 3  }
  },

  infrastructure: {
    railroad:         { color: '#8a9ea3', shape: 'square',   radius: 5  },
    company_town:     { color: '#98aeb3', shape: 'circle',   radius: 3  },
    plantation:       { color: '#a8b8bc', shape: 'circle',   radius: 3 },
    port:             { color: '#c8d4d8', shape: 'image', iconUrl: 'img/port_icon.svg', radius: 20 },
    vessel:           { color: '#b0c0c4', shape: 'triangle', radius: 3  },
    office:           { color: '#c8d4d8', shape: 'square',   radius: 2  },
  },

  institution: {
    state:            { color: '#c8d4d8', shape: 'square',   radius: 7  },
    company:          { color: '#e8a245', shape: 'hexagon',  radius: 8  },
    organization:     { color: '#4a9a8a', shape: 'circle',   radius: 7  }
  },

  event: {
    strike:           { color: '#A8C500', shape: 'image', iconUrl: 'img/strike_icon.svg', radius: 25 },
    mediation:        { color: '#c8d4d8', shape: 'square',   radius: 7  },
    confrontation:    { color: '#e8a245', shape: 'circle',  radius: 8  },
    disease:          { color: '#b8962a', shape: 'image', iconUrl: 'img/disease_icon.svg', radius: 15 },
    natural:          { color: '#8ab8d8', shape: 'image', iconUrl: 'img/nature_icon.svg', radius: 15 },
  },

  person: {
    ufco_manager:      { color: '#c8d4d8', shape: 'diamond', radius: 6 },
    plantation_owner:  { color: '#a8b8bc', shape: 'diamond', radius: 6 },
    worker:            { color: '#4a9a8a', shape: 'diamond', radius: 6 },
    organizer:         { color: '#4a9a8a', shape: 'diamond', radius: 7 },
    politician:        { color: '#c45c3a', shape: 'diamond', radius: 6 },
    official:          { color: '#b5690a', shape: 'diamond', radius: 6 },
    military:          { color: '#8a2020', shape: 'diamond', radius: 6 }
  },

  default:             { color: '#d4c5a9', shape: 'circle',  radius: 3 }

};

// ============================================================
// RELATION STYLES
// Colors, weights, and dash patterns for each relation type
// ============================================================

var relationStyles = {
 
  action: {
    coercion:           { color: '#c45c3a', weight: 1.5, dashArray: '2,2' },
    violence:           { color: '#8a2020', weight: 2,   dashArray: '2,2' },
    legal:              { color: '#7a9ab5', weight: 1,   dashArray: '4,2' },
    movement:           { color: '#7a9ab5', weight: 2,   dashArray: '2,2'}
  },
 
  information: {
    correspondence:     { color: '#8a6ab5', weight: 1.5, dashArray: '4,4' },
    report:             { color: '#6a4a95', weight: 1,   dashArray: '4,4' },
    press:              { color: '#9a8ab5', weight: 1,   dashArray: '2,4' },
    advertisement:      { color: '#e8a245', weight: 1,   dashArray: '2,4' },
    notice:             { color: '#4a9a8a', weight: 1,   dashArray: '2,4' }
  },
 
  trade: {
    capital:            { color: '#e8a245', weight: 1.5, dashArray: '8,4' },
    shipment:           { color: '#5a7a95', weight: 1.5, dashArray: '6,6' },
    labor:              { color: '#4a9a8a', weight: 1.5, dashArray: '6,4' }
  },

  migration: {
    displacement:       { color: '#c4a882', weight: 2, dashArray: '6,3' },
    deportation:        { color: '#a08878', weight: 2.5, dashArray: '6,3' }
  },
 
  default:              { color: '#d4c5a9', weight: 1, dashArray: '4,4' }
 
};

// ============================================================
// GEO LAYER STYLES
// Display styles for QGIS geometry layers
// ============================================================

var geoStyles = {
  plantation: {
    color:       '#e8a245',
    weight:      1.5,
    opacity:     0.8,
    fillColor:   '#e8a245',
    fillOpacity: 0.15
  },
  railroad: {
    base: {
      color:     '#8a8a8a',
      weight:    2,
      opacity:   0.8
    },
    ticks: {
      color:     '#ffffff',
      weight:    6,
      opacity:   0.4,
      dashArray: '1, 16',
      lineCap:   'butt',
      lineJoin:  'butt'
    }
  }
};