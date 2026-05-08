// ============================================================
// TEMPORAL FILTER
// Slider initialization and year-based visibility filtering
// ============================================================

function initTemporalSlider(entries) {
  var years = [];
  entries.forEach(function(entry) {
    var p = entry.properties;
    if (p.year_start) years.push(p.year_start);
    if (p.year_end)   years.push(p.year_end);
  });

  var minYear   = Math.min.apply(null, years);
  var maxYear   = Math.max.apply(null, years);
  var startYear = (config.defaultYear &&
                   config.defaultYear >= minYear &&
                   config.defaultYear <= maxYear)
    ? config.defaultYear
    : minYear;

  var slider = document.getElementById('temporal-slider');
  slider.min   = minYear;
  slider.max   = maxYear;
  slider.value = startYear;

  document.getElementById('year-display').textContent = startYear;
  applyTemporalFilter(startYear);
}

function applyTemporalFilter(year) {
  if (sequenceActive) return;
  currentYear = year;

  // Filter entry markers
  allEntries.forEach(function(entry) {
    var p      = entry.properties;
    var marker = entryMarkers[p.id];
    if (!marker) return;

    var active = (p.year_start === null || p.year_start <= year) &&
                 (p.year_end   === null || p.year_end   >= year);
    var el = marker.getElement();
    if (el) {
      el.style.opacity       = active ? '1' : '0';
      el.style.pointerEvents = active ? 'auto' : 'none';
    }
  });

  // Filter relation curves
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var r      = layer.relationData.properties;
    var active = (r.year_start === null || r.year_start <= year) &&
                 (r.year_end   === null || r.year_end   >= year);
    if (active) {
      if (!map.hasLayer(layer)) layer.addTo(map);
      if (layer.arrowDecorator && !map.hasLayer(layer.arrowDecorator)) layer.arrowDecorator.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) map.removeLayer(layer.arrowDecorator);
    }
  });

  // Recompute centroid if one is active
  if (activeCentroidEntry) {
    showCentroid(activeCentroidEntry);
  }
}