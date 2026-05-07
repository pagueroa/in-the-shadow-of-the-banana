// ============================================================
// DATA
// Data loading and initialization
// ============================================================

// ============================================================
// LOAD ALL DATA
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

Promise.all([
  fetch(config.dataFile).then(function(r) { return r.json(); }),
  fetch('data/plantations.geojson').then(function(r) { return r.json(); }),
  fetch('data/railroads.geojson').then(function(r) { return r.json(); })
])
.then(function(results) {
  var entryData      = results[0];
  var plantationData = results[1];
  var railroadData   = results[2];

  // ============================================================
  // ENTRIES
  // Split features into mapped entries and relations
  // Relations are entries with source/target fields populated
  // ============================================================

  allEntries = entryData.features;

  allEntries.forEach(function(entry) {
    var p = entry.properties;

    // Build coordinate lookup for all entries with geometry
    if (entry.geometry) {
      entryCoords[p.id] = entry.geometry.coordinates;
    }

    // Separate relations from standalone entries
    var isRelation = p.source_location || p.source_other ||
                     p.target_location || p.target_other;
    if (isRelation) {
      allRelations.push(entry);
      return;
    }

    // Skip child events — handled by sequence.js on demand
    if (p.parent_event && p.parent_event !== 'TRUE') return;

    // Render marker for mapped standalone entries
    if (!p.mapped || !entry.geometry) return;
    if (p.node_type === 'infrastructure' && p.node_subtype === 'railroad') return;

    var coords = entry.geometry.coordinates;
    var latlng = [coords[1], coords[0]];
    var marker = createMarker(entry, latlng);

    marker.on('click', function() {
      openPanel(entry);
    });

    marker.addTo(map);
    entryMarkers[p.id] = marker;
  });

  console.log(
    'Loaded ' + allEntries.length + ' entries, ' +
    Object.keys(entryMarkers).length + ' rendered on map, ' +
    allRelations.length + ' relations'
  );

  // ============================================================
  // RELATIONS
  // Group by entry pair to offset duplicate bezier curves
  // ============================================================

  var pairs = {};
  allRelations.forEach(function(relation) {
    var sourceId = relation.properties.source_location;
    var targetId = relation.properties.target_location;
    if (!sourceId || !targetId) return;

    // Skip child event relations — handled by sequence.js on demand
    if (relation.properties.parent_event &&
        relation.properties.parent_event !== 'TRUE') return;

    var sourceCoords = entryCoords[sourceId];
    var targetCoords = entryCoords[targetId];
    if (!sourceCoords || !targetCoords) return;

    var key = [sourceId, targetId].sort().join('||');
    if (!pairs[key]) pairs[key] = [];
    pairs[key].push(relation);
  });

  Object.keys(pairs).forEach(function(key) {
    var group = pairs[key];
    group.forEach(function(relation, i) {
      var sourceId     = relation.properties.source_location;
      var targetId     = relation.properties.target_location;
      var sourceCoords = entryCoords[sourceId];
      var targetCoords = entryCoords[targetId];

      // Normalize coordinate order for consistent bezier offset
      var parts            = key.split('||');
      var wasSwapped = (sourceId !== parts[0]);
      var line = drawRelation(relation, sourceCoords, targetCoords, i, false, { animated: true });
      if (!line) return;

      line.addTo(map);
      line.setStyle({ opacity: 0 });
      if (line.arrowDecorator && map.hasLayer(line.arrowDecorator)) {
        map.removeLayer(line.arrowDecorator);
      } //Just added
      relationLayers.push(line);
    });
  });

  console.log('Rendered ' + relationLayers.length + ' relation curves');

  // ============================================================
  // PLANTATIONS
  // QGIS polygon layer linked to entry ids
  // ============================================================

  var plantationLayer = L.geoJSON(plantationData, {
    style: function() { return geoStyles.plantation; },
    onEachFeature: function(feature, layer) {
      var linkedEntry = allEntries.find(function(e) {
        return e.properties.id === feature.properties.node_id;
      });
      layer.on('click', function() {
        if (linkedEntry) openPanel(linkedEntry);
      });
      layer.on('mouseover', function(e) {
        var label = linkedEntry ? t(linkedEntry, 'label') : feature.properties.node_id;
        layer.bindTooltip(label, { permanent: false, direction: 'center' }).openTooltip(e.latlng);
      });
      layer.on('mouseout', function() {
        layer.closeTooltip();
      });
    }
  });

  if (plantationData.features.length > 0) {
    plantationLayer.nodeId = plantationData.features[0].properties.node_id;
  }
  plantationLayer.addTo(map);
  geoLayers.push(plantationLayer);
  console.log('Plantations loaded');

  // ============================================================
  // RAILROADS
  // QGIS polyline layer with tick mark effect
  // ============================================================

  var railroadLayer = L.geoJSON(railroadData, {
    style: function() { return geoStyles.railroad.base; },
    onEachFeature: function(feature, layer) {
      var linkedEntry = allEntries.find(function(e) {
        return e.properties.id === feature.properties.node_id;
      });
      layer.on('click', function() {
        if (linkedEntry) openPanel(linkedEntry);
      });
      layer.on('mouseover', function(e) {
        var label = linkedEntry ? t(linkedEntry, 'label') : feature.properties.node_id;
        layer.bindTooltip(label, { permanent: false, direction: 'center' }).openTooltip(e.latlng);
      });
      layer.on('mouseout', function() {
        layer.closeTooltip();
      });
    }
  });

  var railroadTicks = L.geoJSON(railroadData, {
    style: function() { return geoStyles.railroad.ticks; }
  });

  if (railroadData.features.length > 0) {
    railroadLayer.nodeId = railroadData.features[0].properties.node_id;
    railroadTicks.nodeId = railroadData.features[0].properties.node_id;
  }

  railroadLayer.addTo(map);
  railroadTicks.addTo(map);
  geoLayers.push(railroadLayer);
  geoLayers.push(railroadTicks);
  console.log('Railroads loaded');

  // ============================================================
  // INIT
  // Build filters and temporal slider after all data is loaded
  // ============================================================

  buildFilters();
  initTemporalSlider(allEntries);

})
.catch(function(err) {
  console.error('Data loading failed:', err);
});

}); // DOMContentLoaded