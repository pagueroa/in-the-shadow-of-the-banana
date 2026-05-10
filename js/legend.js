// ============================================================
// LEGEND
// Builds legend panel on left side of the screen
// ============================================================

function buildLegendPanel() {
  var body = document.getElementById('legend-panel-body');
  body.innerHTML = '';

  // Group entries by node_type
  var groups = {};
  allEntries.forEach(function(entry) {
    var p = entry.properties;
    if (p.source_location || p.source_other ||
        p.target_location || p.target_other) return;
    if (p.node_type === 'source') return;
    if (p.parent_event && p.parent_event !== 'TRUE') return;
    var key = p.node_type + '/' + p.node_subtype;
    if (groups[p.node_type] === undefined) groups[p.node_type] = {};
    if (!groups[p.node_type][p.node_subtype]) {
      groups[p.node_type][p.node_subtype] = true;
    }
  });

  // Entry groups
  Object.keys(groups).forEach(function(type) {
    var group = document.createElement('div');
    group.className = 'legend-group';

    var header = document.createElement('div');
    header.className   = 'legend-group-header';
    header.textContent = ui[currentLang].types[type] || type;
    group.appendChild(header);

    Object.keys(groups[type]).forEach(function(subtype) {
      var style = entryStyles[type] && entryStyles[type][subtype]
        ? entryStyles[type][subtype]
        : entryStyles.default;

      var row = document.createElement('div');
      row.className = 'legend-entry';

      var iconRadius = style.shape === 'image' ? 10 : 6;
      var icon = document.createElement('span');
      icon.style.cssText = 'display:inline-flex;align-items:center;flex-shrink:0;';
      icon.innerHTML = buildSVGMarker({
        color:   style.color,
        shape:   style.shape,
        radius:  iconRadius,
        iconUrl: style.iconUrl
      });

      var label = document.createElement('span');
      label.textContent = ui[currentLang].subtypes[subtype] || subtype;

      row.appendChild(icon);
      row.appendChild(label);
      group.appendChild(row);
    });

    body.appendChild(group);
  });

  // Relation group
  var relGroups = {};
  allRelations.forEach(function(relation) {
    var rp = relation.properties;
    if (!rp.node_type || !rp.node_subtype) return;
    if (!relGroups[rp.node_type]) relGroups[rp.node_type] = {};
    relGroups[rp.node_type][rp.node_subtype] = true;
  });

  Object.keys(relGroups).forEach(function(type) {
    var group = document.createElement('div');
    group.className = 'legend-group';

    var header = document.createElement('div');
    header.className   = 'legend-group-header';
    header.textContent = ui[currentLang].types[type] || type;
    group.appendChild(header);

    Object.keys(relGroups[type]).forEach(function(subtype) {
      var style = relationStyles[type] && relationStyles[type][subtype]
        ? relationStyles[type][subtype]
        : relationStyles.default;

      var row = document.createElement('div');
      row.className = 'legend-entry';

      var line = document.createElement('span');
      line.style.cssText = 'width:20px;height:0;border-top:2px dashed ' +
        style.color + ';flex-shrink:0;display:inline-block;';

      var label = document.createElement('span');
      label.textContent = ui[currentLang].subtypes[subtype] || subtype;

      row.appendChild(line);
      row.appendChild(label);
      group.appendChild(row);
    });

    body.appendChild(group);
  });
}

// Wire up button and close
document.getElementById('legend-btn').addEventListener('click', function() {
  var panel = document.getElementById('legend-panel');
  panel.classList.toggle('legend-open');
  document.body.classList.toggle('legend-panel-open');
  if (panel.classList.contains('legend-open')) {
    buildLegendPanel();
    this.setAttribute('data-open', 'true');
  } else {
    this.removeAttribute('data-open');
  }
});

document.getElementById('legend-panel-close').addEventListener('click', function() {
  document.getElementById('legend-panel').classList.remove('legend-open');
  document.body.classList.remove('legend-panel-open');
  document.getElementById('legend-btn').removeAttribute('data-open');
});