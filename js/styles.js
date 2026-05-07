// ============================================================
// ENTRY STYLES
// Colors, shapes, and sizes for each entry type and subtype
// ============================================================

var entryStyles = {

  place: {
    city:         { color: '#7a9ab5', shape: 'circle',   radius: 3.5  },
    public_site:  { color: '#5a7a95', shape: 'circle',   radius: 2  },
    worker_site:  { color: '#4a9a8a', shape: 'circle',   radius: 3  }
  },

  infrastructure: {
    railroad:     { color: '#8a8a8a', shape: 'square',   radius: 5  },
    company_town: { color: '#c87d0a', shape: 'circle',   radius: 3  },
    plantation:   { color: '#e8a245', shape: 'circle',   radius: 3 },
    port:         { color: '#5a7a95', shape: 'triangle', radius: 5  },
    vessel:       { color: '#5a7a95', shape: 'triangle', radius: 3  },
    office:       { color: '#b5690a', shape: 'square',   radius: 2  },
  },

  institution: {
    state:        { color: '#c45c3a', shape: 'square',   radius: 7  },
    company:      { color: '#e8a245', shape: 'hexagon',  radius: 8  },
    organization: { color: '#4a9a8a', shape: 'circle',   radius: 7  }
  },

  event: {
    strike:       { color: '#4a9a8a', shape: 'star',     radius: 12  },
    disease:      { color: '#7a9ab5', shape: 'star',     radius: 4  },
    natural:      { color: '#5a7a55', shape: 'star',     radius: 4  },
  },

  person: {
    ufco_manager:      { color: '#e8a245', shape: 'diamond', radius: 6 },
    plantation_owner:  { color: '#c87d0a', shape: 'diamond', radius: 6 },
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
 
  event: {
    coercion: { color: '#c45c3a', weight: 1.5, dashArray: '2,2' },
    violence: { color: '#8a2020', weight: 2,   dashArray: '2,2' },
    legal:    { color: '#7a9ab5', weight: 1,   dashArray: '4,2' }
  },
 
  information: {
    correspondence: { color: '#8a6ab5', weight: 1.5, dashArray: '4,4' },
    report:         { color: '#6a4a95', weight: 1,   dashArray: '4,4' },
    press:          { color: '#9a8ab5', weight: 1,   dashArray: '2,4' },
    advertisement:  { color: '#e8a245', weight: 1,   dashArray: '2,4' },
    notice:         { color: '#4a9a8a', weight: 1,   dashArray: '2,4' }
  },
 
  trade: {
    capital:  { color: '#e8a245', weight: 1.5, dashArray: '8,4' },
    shipment: { color: '#5a7a95', weight: 1.5, dashArray: '6,6' },
    labor:    { color: '#4a9a8a', weight: 1.5, dashArray: '6,4' }
  },
 
  default: { color: '#d4c5a9', weight: 1, dashArray: '4,4' }
 
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
      color:   '#8a8a8a',
      weight:  2,
      opacity: 0.8
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