// ============================================================
// MARKERS
// Style lookup, SVG construction, and Leaflet marker creation
// ============================================================

function getEntryStyle(entry) {
  var type    = entry.properties.node_type;
  var subtype = entry.properties.node_subtype;
  if (entryStyles[type] && entryStyles[type][subtype]) {
    return entryStyles[type][subtype];
  }
  return entryStyles.default;
}

function buildSVGMarker(style) {
  var size  = style.radius * 2 + 8;
  var c     = size / 2;
  var r     = style.radius;
  var shape = '';

  if (style.shape === 'image') {
  shape = '<image href="' + style.iconUrl + '" x="0" y="0" width="' + size + '" height="' + size + '"/>';
  
  } else if (style.shape === 'circle') {
    shape = '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';

  } else if (style.shape === 'concentric') {
    shape = '<circle cx="' + c + '" cy="' + c + '" r="' + (r - 2) + '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>' +
    '<circle cx="' + c + '" cy="' + c + '" r="' + (r + 2) + '" fill="none" stroke="' + style.color + '" stroke-width="1.5"/>';
  
  } else if (style.shape === 'triangle') {
    var h = r * 1.8;
    shape = '<polygon points="' +
      c + ',' + (c - h) + ' ' +
      (c + h) + ',' + (c + h / 1.5) + ' ' +
      (c - h) + ',' + (c + h / 1.5) +
      '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';

  } else if (style.shape === 'square') {
    var sq = r * 1.6;
    shape = '<rect x="' + (c - sq / 2) + '" y="' + (c - sq / 2) + '" width="' + sq + '" height="' + sq + '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';

  } else if (style.shape === 'diamond') {
    shape = '<polygon points="' +
      c + ',' + (c - r) + ' ' +
      (c + r) + ',' + c + ' ' +
      c + ',' + (c + r) + ' ' +
      (c - r) + ',' + c +
      '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';

  } else if (style.shape === 'star') {
    var outer = r;
    var inner = r * 0.45;
    var pts   = [];
    for (var i = 0; i < 10; i++) {
      var angle = (Math.PI / 5) * i - Math.PI / 2;
      var rad   = i % 2 === 0 ? outer : inner;
      pts.push((c + rad * Math.cos(angle)) + ',' + (c + rad * Math.sin(angle)));
    }
    shape = '<polygon points="' + pts.join(' ') + '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';

  } else if (style.shape === 'hexagon') {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI / 3) * i - Math.PI / 6;
      pts.push((c + r * Math.cos(angle)) + ',' + (c + r * Math.sin(angle)));
    }
    shape = '<polygon points="' + pts.join(' ') + '" fill="' + style.color + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + shape + '</svg>';
}

function createMarker(entry, latlng) {
  var style = getEntryStyle(entry);
  var size  = style.radius * 2 + 8;
  var icon  = L.divIcon({
    html:       buildSVGMarker(style),
    className:  '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2]
  });
  return L.marker(latlng, { icon: icon });
}