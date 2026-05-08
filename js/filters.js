// ============================================================
// FILTERS
// Build and apply entry type and relation type filters
// Both use the same expand/collapse checkbox structure
// ============================================================

var activeEntryTypes    = {};
var activeRelationTypes = {};

// ============================================================
// UPDATE FILTER LABELS
// Updates visible text labels when language switches
// without rebuilding the entire filter structure
// ============================================================

function updateFilterLabels() {
  // Update entry type labels
  document.querySelectorAll('[id^="filter-entry-"]').forEach(function(el) {
    var id      = el.id.replace('filter-entry-', '');
    var parts   = id.split('-');
    var label   = el.parentElement.querySelector('label[for="' + el.id + '"]');
    if (!label) return;
    if (parts.length === 1) {
      label.textContent = ui[currentLang].types[parts[0]] || parts[0];
    } else {
      label.textContent = ui[currentLang].subtypes[parts[1]] || parts[1];
    }
  });

  // Update relation type labels
  document.querySelectorAll('[id^="filter-relation-"]').forEach(function(el) {
    var id    = el.id.replace('filter-relation-', '');
    var parts = id.split('-');
    var label = el.parentElement.querySelector('label[for="' + el.id + '"]');
    if (!label) return;
    if (parts.length === 1) {
      label.textContent = ui[currentLang].types[parts[0]] || parts[0];
    } else {
      label.textContent = ui[currentLang].subtypes[parts[1]] || parts[1];
    }
  });
  
  if (allEntries.length > 0 && document.getElementById('legend-panel').classList.contains('legend-open')) {
    buildLegendPanel();
  }
}

function buildFilters() {

  // ============================================================
  // COLLECT TYPES FROM LOADED DATA
  // ============================================================

  var entryTypes = {};
  allEntries.forEach(function(entry) {  
    var p    = entry.properties;
    var type = p.node_type;
    if (type === 'source') return; // sources never render as markers
    if (p.source_location || p.source_other || 
      p.target_location || p.target_other) return; // reified edges never render as entries
     if (p.parent_event && p.parent_event !== 'TRUE') return;
    if (!entryTypes[type]) entryTypes[type] = [];
    if (p.node_subtype && entryTypes[type].indexOf(p.node_subtype) === -1) {
      entryTypes[type].push(p.node_subtype);
    }
    activeEntryTypes[type] = true;
    if (p.node_subtype) activeEntryTypes[type + '/' + p.node_subtype] = true;
  });

  var relationTypes = {};
  allRelations.forEach(function(relation) {
    var type    = relation.properties.node_type;
    var subtype = relation.properties.node_subtype;
    if (!type) return;
    if (!relationTypes[type]) relationTypes[type] = [];
    if (subtype && relationTypes[type].indexOf(subtype) === -1) {
      relationTypes[type].push(subtype);
    }
    activeRelationTypes[type] = true;
    if (subtype) activeRelationTypes[type + '/' + subtype] = true;
  });

  // ============================================================
  // BUILD FILTER GROUP
  // Shared function for both entry and relation filter groups
  // ============================================================

  function buildFilterGroup(container, types, styles, activeTypes, idPrefix, labelMap, subtypeLabelMap, isRelation) {
    container.innerHTML = '';

    Object.keys(types).forEach(function(type) {
      var style = styles[type]
        ? Object.values(styles[type])[0]
        : styles.default;

      var item = document.createElement('div');
      item.className = 'filter-item';

      var cb = document.createElement('input');
      cb.type    = 'checkbox';
      cb.checked = true;
      cb.id      = idPrefix + type;

      var dot = document.createElement('span');
      dot.style.cssText = 'display:inline-flex;align-items:center;flex-shrink:0;';
      var legendRadius = style.shape === 'image' ? 8 : 4;
      dot.innerHTML = buildSVGMarker({
        color:  style.color  || '#d4c5a9',
        shape:  style.shape  || 'circle',
        radius: legendRadius,
        iconUrl: style.iconUrl
      });

      var label = document.createElement('label');
      label.htmlFor     = idPrefix + type;
      label.textContent = labelMap[type] || type;

      cb.addEventListener('change', function() {
        activeTypes[type] = this.checked;
        types[type].forEach(function(subtype) {
          activeTypes[type + '/' + subtype] = this.checked;
          var subCb = document.getElementById(idPrefix + type + '-' + subtype);
          if (subCb) subCb.checked = this.checked;
        }.bind(this));
        applyFilters();
      });

      var toggle = document.createElement('span');
      toggle.style.cssText = 'font-size:9px;color:#8a7a5a;cursor:pointer;padding:0 4px;margin-left:auto;';
      toggle.textContent   = types[type].length > 0 ? '▶' : '';

      item.appendChild(cb);
      item.appendChild(dot);
      item.appendChild(label);
      item.appendChild(toggle);
      container.appendChild(item);

      var subtypeContainer = document.createElement('div');
      subtypeContainer.style.display = 'none';

      types[type].forEach(function(subtype) {
        var subtypeStyle = styles[type] && styles[type][subtype]
          ? styles[type][subtype]
          : style;

        var subItem = document.createElement('div');
        subItem.className         = 'filter-item';
        subItem.style.paddingLeft = '20px';

        var subCb = document.createElement('input');
        subCb.type    = 'checkbox';
        subCb.checked = true;
        subCb.id      = idPrefix + type + '-' + subtype;

        var lineSample = document.createElement('span');
        lineSample.style.cssText = 'width:16px;height:0;border-top:2px dashed ' + 
        subtypeStyle.color + ';flex-shrink:0;display:inline-block;';

        var subDot = document.createElement('span');
        subDot.style.cssText = 'display:inline-flex;align-items:center;flex-shrink:0;';
        var subLegendRadius = subtypeStyle.shape === 'image' ? 8 : 4;
        subDot.innerHTML     = buildSVGMarker({
          color:  subtypeStyle.color  || '#d4c5a9',
          shape:  subtypeStyle.shape  || 'circle',
          radius: subLegendRadius,
          iconUrl: subtypeStyle.iconUrl
        });

        var subLabel = document.createElement('label');
        subLabel.htmlFor     = idPrefix + type + '-' + subtype;
        subLabel.textContent = subtypeLabelMap[subtype] || subtype;

        subCb.addEventListener('change', function() {
          activeTypes[type + '/' + subtype] = this.checked;
          var noneChecked = types[type].every(function(st) {
            return activeTypes[type + '/' + st] === false;
          });
          var parentCb = document.getElementById(idPrefix + type);
          if (parentCb) {
            parentCb.checked    = !noneChecked;
            activeTypes[type]   = !noneChecked;
          }
          applyFilters();
        });

        subItem.appendChild(subCb);
        subItem.appendChild(isRelation ? lineSample : subDot);
        subItem.appendChild(subLabel);
        subtypeContainer.appendChild(subItem);
      });

      if (types[type].length > 0) {
        toggle.addEventListener('click', function() {
          var isOpen = subtypeContainer.style.display !== 'none';
          subtypeContainer.style.display = isOpen ? 'none' : 'block';
          toggle.textContent = isOpen ? '▶' : '▼';
        });
        label.addEventListener('click', function() {
          var isOpen = subtypeContainer.style.display !== 'none';
          subtypeContainer.style.display = isOpen ? 'none' : 'block';
          toggle.textContent = isOpen ? '▶' : '▼';
        });
        container.appendChild(subtypeContainer);
      }
    });
  }

  // ============================================================
  // BUILD ENTRY FILTERS
  // ============================================================

  buildFilterGroup(
    document.getElementById('node-type-filters'),
    entryTypes,
    entryStyles,
    activeEntryTypes,
    'filter-entry-',
    ui[currentLang].types,
    ui[currentLang].subtypes,
    false
  );

  // ============================================================
  // BUILD RELATION FILTERS
  // ============================================================

  buildFilterGroup(
    document.getElementById('edge-type-filters'),
    relationTypes,
    relationStyles,
    activeRelationTypes,
    'filter-relation-',
    ui[currentLang].types,
    ui[currentLang].subtypes,
    true
  );

}

// ============================================================
// APPLY FILTERS
// Show/hide markers, relation curves, and geo layers
// ============================================================

function applyFilters() {

  if (sequenceActive) return;

  // Entry markers
  allEntries.forEach(function(entry) {
    var p      = entry.properties;
    var marker = entryMarkers[p.id];
    if (!marker) return;
    if (p.parent_event && p.parent_event !== 'TRUE') return;

    var typeVisible    = activeEntryTypes[p.node_type] !== false;
    var subtypeVisible = !p.node_subtype ||
      activeEntryTypes[p.node_type + '/' + p.node_subtype] !== false;
    var visible = typeVisible && subtypeVisible;

    var el = marker.getElement();
    if (el) {
      el.style.opacity       = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
    }
  });

  // Relation curves
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var r = layer.relationData;
    var rp = r.properties;
    if (rp.parent_event && rp.parent_event !== 'TRUE') return;

    var typeVisible    = activeRelationTypes[rp.node_type] !== false;
    var subtypeVisible = !rp.node_subtype ||
      activeRelationTypes[rp.node_type + '/' + rp.node_subtype] !== false;

    var sourceEntry = rp.source_location
      ? allEntries.find(function(e) { return e.properties.id === rp.source_location; })
      : null;
    var targetEntry = rp.target_location
      ? allEntries.find(function(e) { return e.properties.id === rp.target_location; })
      : null;

    var sourceVisible = !sourceEntry || !sourceEntry.properties.mapped ||
      (activeEntryTypes[sourceEntry.properties.node_type] !== false &&
       (!sourceEntry.properties.node_subtype ||
        activeEntryTypes[sourceEntry.properties.node_type + '/' +
          sourceEntry.properties.node_subtype] !== false));

    var targetVisible = !targetEntry || !targetEntry.properties.mapped ||
      (activeEntryTypes[targetEntry.properties.node_type] !== false &&
       (!targetEntry.properties.node_subtype ||
        activeEntryTypes[targetEntry.properties.node_type + '/' +
          targetEntry.properties.node_subtype] !== false));

    var visible = typeVisible && subtypeVisible && sourceVisible && targetVisible;

    if (visible) {
      if (!map.hasLayer(layer)) layer.addTo(map);
      if (layer.arrowDecorator && !map.hasLayer(layer.arrowDecorator)) layer.arrowDecorator.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) map.removeLayer(layer.arrowDecorator);
    }
    
  });

  // Geo layers
  geoLayers.forEach(function(layer) {
    if (!layer.nodeId) return;
    var linkedEntry = allEntries.find(function(e) {
      return e.properties.id === layer.nodeId;
    });
    if (!linkedEntry) return;

    var p              = linkedEntry.properties;
    var typeVisible    = activeEntryTypes[p.node_type] !== false;
    var subtypeVisible = !p.node_subtype ||
      activeEntryTypes[p.node_type + '/' + p.node_subtype] !== false;
    var visible = typeVisible && subtypeVisible;

    if (visible) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  });

}