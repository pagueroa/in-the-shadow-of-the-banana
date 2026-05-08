// ============================================================
// CONFIG
// Global settings, language state, UI strings, and helpers
// ============================================================

var config = {
  defaultYear: 1934,
  mapCenter:   [9.9902, -83.0338],
  mapZoom:     6,
  dataFile:    'data/nodes.geojson',
  defaultLang: 'en'
};

// ============================================================
// LANGUAGE STATE
// ============================================================

var currentLang = config.defaultLang;

function t(entry, field) {
  var val = entry.properties[field + '_' + currentLang];
  if (val) return val;
  return entry.properties[field + '_en'] || '';
}

function updateLanguage() {
  // Update html lang attribute
  document.body.classList.remove('lang-en', 'lang-es');
  document.body.classList.add('lang-' + currentLang);
  document.getElementById('html-root').lang = currentLang;

  // Update document title
  document.title = currentLang === 'en'
    ? 'In the Shadow of the Banana'
    : 'En la sombra del banano';

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (ui[currentLang][key]) el.textContent = ui[currentLang][key];
  });

  // Update all data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (ui[currentLang][key]) el.setAttribute('placeholder', ui[currentLang][key]);
  });

  // Update legend button
  var legendBtn = document.getElementById('legend-btn');
  if (legendBtn) legendBtn.textContent = ui[currentLang].legend;

  // Update language toggle buttons
  document.getElementById('lang-btn-en').classList.toggle('lang-active', currentLang === 'en');
  document.getElementById('lang-btn-es').classList.toggle('lang-active', currentLang === 'es');

  // Re-render open panel if any
  if (sequenceActive) {
    showSequencePanel(sequenceSteps[sequenceIndex]);
    updateSequenceUI(sequenceIndex);
  } else if (document.getElementById('side-panel').classList.contains('panel-open') && activeEntry) {
    openPanel(activeEntry);
  }

  // Update filter labels without rebuilding the whole filter
  if (typeof updateFilterLabels === 'function' && allEntries.length > 0) {
    updateFilterLabels();
  }
}

// ============================================================
// DOM INITIALIZATION
// All event listeners attached after DOM is ready
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // Language toggle
  document.getElementById('lang-btn-en').addEventListener('click', function() {
    currentLang = 'en';
    updateLanguage();
  });

  document.getElementById('lang-btn-es').addEventListener('click', function() {
    currentLang = 'es';
    updateLanguage();
  });

  // Temporal slider
  document.getElementById('temporal-slider').addEventListener('input', function() {
    var year = parseInt(this.value);
    document.getElementById('year-display').textContent = year;
    applyTemporalFilter(year);
  });

  // Search input
  document.getElementById('search-input').addEventListener('input', function() {
    searchEntries(this.value);
  });

  // Filter panel collapse/expand
  document.getElementById('filter-header').addEventListener('click', function() {
    var body   = document.getElementById('filter-body');
    var legend = document.getElementById('filter-legend');
    var legendHeader = document.getElementById('legend-header');
    var icon   = document.getElementById('filter-toggle-icon');
    var opening = body.classList.contains('collapsed');
    body.classList.toggle('collapsed', !opening);
    legend.classList.toggle('collapsed', opening);
    legendHeader.classList.toggle('collapsed', opening);
    icon.textContent = opening ? '▼' : '▶';
    setTimeout(function() { map.invalidateSize(); }, 350);
  });

  // Sequence player controls
  document.getElementById('seq-restart').addEventListener('click', handleSequenceRestart);
  document.getElementById('seq-prev').addEventListener('click', handleSequencePrev);
  document.getElementById('seq-play').addEventListener('click', handleSequencePlayPause);
  document.getElementById('seq-next').addEventListener('click', handleSequenceNext);
  document.getElementById('sequence-exit').addEventListener('click', exitSequence);

  // Apply default language on load
  updateLanguage();

});