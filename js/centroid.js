// ============================================================
// CENTROID
// Places unmapped entries on the map by computing the centroid
// of the location coordinates of their connected relations
// ============================================================

function showCentroid(entry) {
  closeCentroid();

  var p = entry.properties;
  activeCentroidEntry = entry;

  // Find all relations where this entry appears as source_other or target_other
  var connectedRelations = allRelations.filter(function(relation) {
    return relation.properties.source_other === p.id || relation.properties.target_other === p.id;
  });

  // Collect location ids and coordinates from those relations
  var locations = [];
  connectedRelations.forEach(function(relation) {
    if (relation.properties.source_location && entryCoords[relation.properties.source_location]) {
      locations.push({
        id:     relation.properties.source_location,
        coords: entryCoords[relation.properties.source_location]
      });
    }
    if (relation.properties.target_location && entryCoords[relation.properties.target_location]) {
      locations.push({
        id:     relation.properties.target_location,
        coords: entryCoords[relation.properties.target_location]
      });
    }
  });

  // Filter to only locations visible under current temporal filter
  if (currentYear !== null) {
    locations = locations.filter(function(loc) {
      var locEntry = allEntries.find(function(e) {
        return e.properties.id === loc.id;
      });
      if (!locEntry) return true;
      var lp = locEntry.properties;
      return (lp.year_start === null || lp.year_start <= currentYear) &&
             (lp.year_end   === null || lp.year_end   >= currentYear);
    });
  }

  // If no geographic anchor found, just open the panel
  if (locations.length === 0) {
    openPanel(entry);
    return;
  }

  // Compute centroid
  var avgLat = 0;
  var avgLng = 0;
  locations.forEach(function(loc) {
    avgLat += loc.coords[1];
    avgLng += loc.coords[0];
  });
  avgLat /= locations.length;
  avgLng /= locations.length;

  // Build popup content
  var typeLabel    = ui[currentLang].types[p.node_type]       || p.node_type;
  var subtypeLabel = ui[currentLang].subtypes[p.node_subtype] || p.node_subtype || '';

  var content = '<div class="centroid-popup-type">' +
    typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '') +
    '</div>';

  if (p.image_path) {
    content += '<img class="centroid-popup-image" src="' + p.image_path +
      '" alt="' + t(entry, 'label') + '"/>';
  }

  content += '<div class="centroid-popup-label">' + t(entry, 'label') + '</div>';

  if (p.year_start) {
    content += '<div class="centroid-popup-dates">' +
      p.year_start + (p.year_end ? ' – ' + p.year_end : '') +
      '</div>';
  }

  if (p.description_en || p.description_es) {
    content += '<div class="centroid-popup-description">' +
      t(entry, 'description') +
      '</div>';
  }

  // Show popup at centroid
  activeCentroidPopup = L.popup({
    className:   'centroid-popup',
    closeButton: true,
    autoClose:   false,
    maxWidth:    220
  })
    .setLatLng([avgLat, avgLng])
    .setContent(content)
    .openOn(map);

  // Fit map to show all connected locations plus centroid
  var bounds = L.latLngBounds(locations.map(function(loc) {
    return [loc.coords[1], loc.coords[0]];
  }));
  bounds.extend([avgLat, avgLng]);
  map.fitBounds(bounds, { padding: [60, 60] });

  // Highlight connected relation curves, dim others
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var r  = layer.relationData;
    var rp = r.properties;
    if (rp.source_other === p.id || rp.target_other === p.id) {
      layer.setStyle({
        opacity: 1,
        weight:  (getRelationStyle(r).weight || 1) + 1
      });
    } else {
      layer.setStyle({ opacity: 0.1 });
    }
  });

  // Open side panel
  openPanel(entry);

  // Reset styles when popup is closed
  activeCentroidPopup.on('remove', function() {
    closeCentroid();
  });
}

function closeCentroid() {
  if (activeCentroidPopup) {
    map.closePopup(activeCentroidPopup);
    activeCentroidPopup = null;
  }
  activeCentroidEntry = null;
  resetRelationStyles();
}

function resetRelationStyles() {
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var style = getRelationStyle(layer.relationData);
    layer.setStyle({
      opacity: style.opacity,
      weight:  style.weight
    });
    if (layer.arrowDecorator) {
      if (!map.hasLayer(layer.arrowDecorator)) layer.arrowDecorator.addTo(map);
    }
  });
}

function highlightRelations(entryId) {
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var r  = layer.relationData;
    var rp = r.properties;
    if (rp.source_other    === entryId || rp.target_other    === entryId ||
        rp.source_location === entryId || rp.target_location === entryId) {
      layer.setStyle({
        opacity: 1,
        weight:  (getRelationStyle(r).weight || 1) + 1
      });
    } else {
      layer.setStyle({ opacity: 0.1 });
      if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
        map.removeLayer(layer.arrowDecorator);
      }
    }
  });
}