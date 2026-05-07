// ============================================================
// NAVIGATION
// Handles temporary visualization of child events and
// unmapped entries activated via search, links, or panel
// ============================================================

// Temporarily renders a child event on the map when activated via search, link, or panel
function showChildEvent(entry) {
  clearTempLayers();
  var p = entry.properties;

  if (p.mapped && entry.geometry) {
    var coords = entry.geometry.coordinates;
    var latlng = [coords[1], coords[0]];
    tempMarker = createMarker(entry, latlng);
    tempMarker.addTo(map);
    map.flyTo(latlng, 10);

  } else if (p.source_location && p.target_location) {
    var sourceCoords = entryCoords[p.source_location];
    var targetCoords = entryCoords[p.target_location];
    if (sourceCoords && targetCoords) {
      tempRelationLayer = drawRelation(entry, sourceCoords, targetCoords, 0, false);
      if (tempRelationLayer) {
        tempRelationLayer.addTo(map);
        var bounds = L.latLngBounds(
          [sourceCoords[1], sourceCoords[0]],
          [targetCoords[1], targetCoords[0]]
        );
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }
}

// Removes any temporarily rendered markers or relation curves from the map
function clearTempLayers() {
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
  if (tempRelationLayer) {
    if (tempRelationLayer.arrowDecorator && map.hasLayer(tempRelationLayer.arrowDecorator)) {
      map.removeLayer(tempRelationLayer.arrowDecorator);
    }
    map.removeLayer(tempRelationLayer);
    tempRelationLayer = null;
  }
}