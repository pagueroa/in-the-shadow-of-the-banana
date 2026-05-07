// ============================================================
// SEARCH
// Text search across entry labels and descriptions
// ============================================================

function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function searchEntries(query) {
  var results = document.getElementById('search-results');
  results.innerHTML = '';

  if (!query || query.length < 2) return;

  var q       = normalizeText(query);
  var matches = [];

  allEntries.forEach(function(entry) {
    var p     = entry.properties;
    var score = 0;

    // Search against current language label
    var label = normalizeText(t(entry, 'label'));
    if (label === q)              score += 100;
    else if (label.startsWith(q)) score += 80;
    else if (label.includes(q))   score += 60;

    // Also search against other language label in case user switches
    var labelOther = normalizeText(
      p['label_' + (currentLang === 'en' ? 'es' : 'en')] || ''
    );
    if (labelOther.includes(q)) score += 30;

    // Search description
    var desc = normalizeText(t(entry, 'description'));
    if (desc.includes(q)) score += 10;

    if (score > 0) matches.push({ entry: entry, score: score });
  });

  matches.sort(function(a, b) { return b.score - a.score; });

  if (matches.length === 0) {
    var li = document.createElement('li');
    li.textContent     = ui[currentLang].no_results;
    li.style.color     = '#5a4a2a';
    li.style.cursor    = 'default';
    results.appendChild(li);
    return;
  }

  matches.forEach(function(match) {
    var entry = match.entry;
    var p     = entry.properties;
    var li    = document.createElement('li');

    var typeLabel    = ui[currentLang].types[p.node_type]    || p.node_type;
    var subtypeLabel = ui[currentLang].subtypes[p.node_subtype] || p.node_subtype || '';

    li.innerHTML =
      '<span class="connection-label">' + t(entry, 'label') + '</span>' +
      '<span class="connection-meta">' +
        typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '') +
      '</span>';

    li.addEventListener('click', function() {
      document.getElementById('search-input').value = '';
      results.innerHTML = '';

      if (p.mapped && entry.geometry) {
        var coords = entry.geometry.coordinates;
        map.flyTo([coords[1], coords[0]], 10);
        var targetMarker = entryMarkers[p.id];
        if (targetMarker) {
          var el = targetMarker.getElement();
          if (el) {
            el.style.filter = 'brightness(2)';
            setTimeout(function() { el.style.filter = ''; }, 2000);
          }
        }
      }

      openPanel(entry);
      if (p.parent_event && p.parent_event !== 'TRUE') {
        showChildEvent(entry);
      } else if (!p.mapped) {
        showCentroid(entry);
      }
    });
    results.appendChild(li);
  });
}