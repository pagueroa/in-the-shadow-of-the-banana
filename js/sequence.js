// ============================================================
// SEQUENCE
// Guided narrative playback of parent event child sequences
// Creates temporary markers and curves on demand
// Replaces temporal bar with sequence player when active
// ============================================================

var sequenceActive   = false;
var sequenceSteps    = [];
var sequenceIndex    = 0;
var sequenceParentId = null;
var sequenceInterval = null;
var sequenceSpeed    = 2000;
var sequenceMarkers      = {};
var sequenceRelLayers    = [];
// Maps location entry id -> array of sequence_values from child relations referencing it
var sequenceLocationSeqs = {};

// ============================================================
// ENTRY POINT
// ============================================================

// Initializes and starts a sequence for a given parent entry id
function startSequence(parentId) {
  var children = allEntries.filter(function(e) {
    return e.properties.parent_event === parentId;
  });
  if (children.length === 0) return;

  // Group children by sequence_value
  var grouped = {};
  children.forEach(function(entry) {
    var seq = entry.properties.sequence_value || 0;
    if (!grouped[seq]) grouped[seq] = [];
    grouped[seq].push(entry);
  });

  sequenceSteps    = Object.keys(grouped)
    .map(Number)
    .sort(function(a, b) { return a - b; })
    .map(function(seq) { return grouped[seq]; });

  sequenceParentId = parentId;
  sequenceIndex    = 0;
  sequenceActive   = true;

  // Create temporary markers and curves for all child entries
  buildSequenceLayers(children);

  // Show sequence player, hide temporal bar
  document.getElementById('temporal-bar').style.display    = 'none';
  document.getElementById('sequence-player').style.display = 'flex';
  document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';

  // Dim all non-sequence entries
  dimNonSequenceEntries(parentId);

  // Show step 0
  showSequenceStep(0);
}

// ============================================================
// BUILD TEMPORARY LAYERS
// Creates hidden markers and curves for all child entries
// ============================================================

// Creates hidden markers and relation curves for all child entries
function buildSequenceLayers(children) {
  sequenceMarkers      = {};
  sequenceRelLayers    = [];
  sequenceLocationSeqs = {};

  children.forEach(function(entry) {
    var p = entry.properties;

    // Create marker for mapped point entries
    if (p.mapped && entry.geometry) {
      var coords = entry.geometry.coordinates;
      var latlng = [coords[1], coords[0]];
      var marker = createMarker(entry, latlng);
      marker.on('click', function() {
        openPanel(entry);
      });
      marker.addTo(map);
      var el = marker.getElement();
      if (el) el.style.opacity = '0';
      sequenceMarkers[p.id] = marker;
    }
  });

  // Group child relations by node pair so each gets a permanent offset index,
  // matching data.js — prevents curves between the same nodes from overlapping
  var seqPairs = {};
  allRelations.forEach(function(relation) {
    var rp = relation.properties;
    if (rp.parent_event !== sequenceParentId) return;
    var sourceId = rp.source_location;
    var targetId = rp.target_location;
    if (!sourceId || !targetId) return;
    if (!entryCoords[sourceId] || !entryCoords[targetId]) return;
    var key = [sourceId, targetId].sort().join('||');
    if (!seqPairs[key]) seqPairs[key] = [];
    seqPairs[key].push(relation);
  });

  Object.keys(seqPairs).forEach(function(key) {
    var group = seqPairs[key];
    group.forEach(function(relation, i) {
      var rp           = relation.properties;
      var sourceId     = rp.source_location;
      var targetId     = rp.target_location;
      var sourceCoords = entryCoords[sourceId];
      var targetCoords = entryCoords[targetId];

      var parts      = key.split('||');
      var wasSwapped = (sourceId !== parts[0]);
      var line = drawRelation(relation, sourceCoords, targetCoords, i, wasSwapped, { animated: true });

      if (!line) return;

      line.addTo(map);
      line.setStyle({ opacity: 0 });
      if (line.arrowDecorator && map.hasLayer(line.arrowDecorator)) {
        map.removeLayer(line.arrowDecorator);
      }
      sequenceRelLayers.push(line);

      // Record which seq_value references these location nodes
      var seq = rp.sequence_value || 0;
      [sourceId, targetId].forEach(function(locId) {
        if (!sequenceLocationSeqs[locId]) sequenceLocationSeqs[locId] = [];
        if (sequenceLocationSeqs[locId].indexOf(seq) === -1) {
          sequenceLocationSeqs[locId].push(seq);
        }
      });
    });
  });
}

// ============================================================
// STEP RENDERING
// ============================================================

// Renders the entries for a given step index
function showSequenceStep(index) {
  sequenceIndex   = index;
  var currentStep = sequenceSteps[index];
  if (!currentStep) return;

  var currentSeq = currentStep[0].properties.sequence_value || 0;

  // Update child marker opacities
  sequenceSteps.forEach(function(step) {
    step.forEach(function(entry) {
      var marker = sequenceMarkers[entry.properties.id];
      if (!marker) return;
      var entrySeq = entry.properties.sequence_value || 0;
      if (entrySeq === currentSeq) {
        setMarkerOpacity(marker, 1.0);
      } else if (entrySeq < currentSeq) {
        setMarkerOpacity(marker, 0.4);
      } else {
        setMarkerOpacity(marker, 0);
      }
    });
  });

  // Update relation curve opacities
  sequenceRelLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var rp       = layer.relationData.properties;
    var entrySeq = rp.sequence_value || 0;

    if (entrySeq === currentSeq) {
      layer.setStyle({ opacity: 1 });
      if (layer.arrowDecorator && !map.hasLayer(layer.arrowDecorator)) {
        if (typeof layer.start !== 'function') {
          layer.arrowDecorator.addTo(map);
        }
      }
    } else if (entrySeq < currentSeq) {
      layer.setStyle({ opacity: 0.4 });
    } else {
      layer.setStyle({ opacity: 0 });
      if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
        map.removeLayer(layer.arrowDecorator);
      }
    }
    
  });

  triggerSequenceAnimation(currentSeq);

  // Highlight source_location / target_location nodes referenced by child relations
  Object.keys(sequenceLocationSeqs).forEach(function(locId) {
    var marker = entryMarkers[locId];
    if (!marker) return;
    var seqs     = sequenceLocationSeqs[locId];
    var isActive = seqs.indexOf(currentSeq) !== -1;
    var isPast   = seqs.every(function(s) { return s < currentSeq; });
    if (isActive) {
      setMarkerOpacity(marker, 1.0);
    } else if (isPast) {
      setMarkerOpacity(marker, 0.4);
    } else {
      setMarkerOpacity(marker, 0.1);
    }
  });

  // Fit map to last 2 steps
  fitMapToRecentSteps(index);

  // Build side panel card stack for this step
  showSequencePanel(currentStep, currentSeq);

  // Update player counter and title
  updateSequenceUI(index, currentStep);
}

// ============================================================
// MAP FITTING
// ============================================================

// Fits map to bounds of entries in the last 2 steps
function fitMapToRecentSteps(index) {
  var coords     = [];
  var startIndex = Math.max(0, index - 1);

  for (var i = startIndex; i <= index; i++) {
    var step = sequenceSteps[i];
    if (!step) continue;
    step.forEach(function(entry) {
      var p = entry.properties;
      // Add marker coordinates
      if (entry.geometry) {
        var c = entry.geometry.coordinates;
        coords.push([c[1], c[0]]);
      }
      // Add bezier endpoint coordinates for relation entries
      if (p.source_location && entryCoords[p.source_location]) {
        var sc = entryCoords[p.source_location];
        coords.push([sc[1], sc[0]]);
      }
      if (p.target_location && entryCoords[p.target_location]) {
        var tc = entryCoords[p.target_location];
        coords.push([tc[1], tc[0]]);
      }
    });
  }

  if (coords.length === 0) return;
  if (coords.length === 1) {
    map.flyTo(coords[0], 10);
  } else {
    map.fitBounds(L.latLngBounds(coords), { paddingTopLeft: [280, 60], paddingBottomRight: [340, 60] });
  }
}

// ============================================================
// SEQUENCE PANEL
// Builds side panel event stack for the current step
// ============================================================

// Builds a stack of events in the side panel
function showSequencePanel(step, currentSeq) {
  var panel = document.getElementById('side-panel');
  panel.innerHTML = '';
  var seqHeader = document.createElement('div');
  seqHeader.id = 'seq-panel-header';

  var parentEntry = allEntries.find(function(e) {
    return e.properties.id === sequenceParentId;
  });

  var titleEl = document.createElement('div');
  titleEl.id          = 'seq-panel-title';
  titleEl.textContent = parentEntry ? t(parentEntry, 'label') : '';

  var stepEl = document.createElement('div');
  stepEl.id          = 'seq-panel-step';
  stepEl.textContent = (sequenceIndex + 1) + ' / ' + sequenceSteps.length;

  seqHeader.appendChild(titleEl);
  seqHeader.appendChild(stepEl);
  panel.appendChild(seqHeader);

  panel.classList.add('panel-open');
  activeEntry = step[0];

  step.forEach(function(entry) {
    var p            = entry.properties;
    var typeLabel    = ui[currentLang].types[p.node_type]       || p.node_type    || '';
    var subtypeLabel = ui[currentLang].subtypes[p.node_subtype] || p.node_subtype || '';

    var card = document.createElement('div');
    card.className = 'seq-card';

    var header = document.createElement('div');
    header.className = 'seq-card-header';

    // Legend symbol — outside click handler
    var symbol = document.createElement('span');
    symbol.className = 'seq-card-symbol';
    var testMarker = sequenceMarkers[p.id] || entryMarkers[p.id];
    if (testMarker) {
      symbol.innerHTML = buildSVGMarker(getEntryStyle(entry));
    } else {
      var relStyle = getRelationStyle(entry);
      symbol.innerHTML = '<svg width="24" height="10" viewBox="0 0 24 10">' +
        '<line x1="0" y1="5" x2="24" y2="5" stroke="' + relStyle.color +
        '" stroke-width="' + relStyle.weight + '"' +
        (relStyle.dashArray ? ' stroke-dasharray="' + relStyle.dashArray + '"' : '') +
        '/></svg>';
    }

    var headerMeta = document.createElement('span');
    headerMeta.className   = 'seq-card-meta';
    headerMeta.textContent = typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '');

    var headerLabel = document.createElement('span');
    headerLabel.className   = 'seq-card-label';
    headerLabel.textContent = t(entry, 'label');

    header.appendChild(symbol);
    header.appendChild(headerMeta);
    header.appendChild(headerLabel);

    // Click handler — popup and highlight only
    header.addEventListener('click', function() {

      // Clear all marker brightness for this step
      step.forEach(function(e) {
        var m = sequenceMarkers[e.properties.id] || entryMarkers[e.properties.id];
        if (m) {
          var el = m.getElement();
          if (el) el.style.filter = '';
        }
      });

      // Determine popup anchor
      var popupLatLng = null;

      // Case 1: entry has a marker
      var marker = sequenceMarkers[p.id] || entryMarkers[p.id];
      if (marker) {
        popupLatLng = marker.getLatLng();
        var el = marker.getElement();
        if (el) el.style.filter = 'brightness(3)';
      }

      // Case 2: entry is a relation — anchor to bezier midpoint
      if (!popupLatLng) {
       sequenceRelLayers.forEach(function(layer) {
        if (!layer.relationData) return;
        var rp = layer.relationData.properties;
        if (rp.id !== p.id) return;
        var latlngs = layer.getLatLngs();
        if (latlngs.length > 0) {
        popupLatLng = latlngs[Math.floor(latlngs.length / 2)];
        }
       });
      }

      // Build and open popup
      var typeLabel    = ui[currentLang].types[p.node_type]    || p.node_type    || '';
      var subtypeLabel = ui[currentLang].subtypes[p.node_subtype] || p.node_subtype || '';

      var content =
        '<div class="centroid-popup-type">' +
          typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '') +
        '</div>' +
        '<div class="centroid-popup-label">' + (p['label_' + currentLang] || p.label_en || '') + '</div>';

      if (p.year_start) {
        content += '<div class="centroid-popup-dates">' +
          p.year_start + (p.year_end && p.year_end !== p.year_start ? ' \u2013 ' + p.year_end : '') +
        '</div>';
      }

      if (p['description_' + currentLang] || p.description_en) {
        content += '<div class="centroid-popup-description">' +
          (p['description_' + currentLang] || p.description_en) +
        '</div>';
      }

      if (p.source) {
        var sourceEntry = allEntries.find(function(e) {
          return e.properties.id === p.source;
        });
        if (sourceEntry) {
          var pagePrefix = p.page && p.page.toString().match(/[-–]/) ? 'pp. ' : 'p. ';

          content += '<div class="centroid-popup-source">' +
            (sourceEntry.properties['label_' + currentLang] || sourceEntry.properties.label_en) +
            (p.page ? ', ' + pagePrefix + p.page : '') +
          '</div>';
        }
      }

      if (popupLatLng && content) {
        L.popup({ maxWidth: 260, className: 'centroid-popup', closeButton: false })
          .setLatLng(popupLatLng)
          .setContent(content)
          .openOn(map);
      }

      // Re-trigger animation on clicked card's curve
      sequenceRelLayers.forEach(function(layer) {
        if (!layer.relationData) return;
        if (layer.relationData.properties.id !== p.id) return;
        if (typeof layer.start === 'function') {
          if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
            map.removeLayer(layer.arrowDecorator);
            layer.arrowDecorator = null;
          }
          layer.start();
        }
      })
  });

    card.appendChild(header);
    panel.appendChild(card);
  });

  // Flash first card
  var firstCard = panel.querySelector('.seq-card');
  if (firstCard) {
    firstCard.classList.remove('seq-card-flash');
    void firstCard.offsetWidth;
    firstCard.classList.add('seq-card-flash');
    setTimeout(function() { firstCard.classList.remove('seq-card-flash'); }, 400);
  }
}

// ============================================================
// UI UPDATES
// ============================================================

// Updates step counter and parent event title in the sequence player
function updateSequenceUI(index) {
  var counter = document.getElementById('sequence-step-counter');
  var title   = document.getElementById('sequence-title');

  counter.textContent = (index + 1) + ' / ' + sequenceSteps.length;

  if (title && sequenceParentId) {
    var parentEntry = allEntries.find(function(e) {
      return e.properties.id === sequenceParentId;
    });
    if (parentEntry) title.textContent = t(parentEntry, 'label');
  }
}

// ============================================================
// DIMMING
// ============================================================

// Dims all non-sequence entries on the map
function dimNonSequenceEntries(parentId) {
  allEntries.forEach(function(entry) {
    var marker = entryMarkers[entry.properties.id];
    if (!marker) return;
    setMarkerOpacity(marker, 0.1);
  });

  relationLayers.forEach(function(layer) {
    layer.setStyle({ opacity: 0.1 });
    if (layer.arrowDecorator) {
      layer.arrowDecorator.setStyle({ opacity: 0.1 });
    }
  });
}

// ============================================================
// HELPER
// ============================================================

// Sets opacity on a Leaflet marker element
function setMarkerOpacity(marker, opacity) {
  var el = marker.getElement();
  if (el) el.style.opacity = opacity;
}

// ============================================================
// EXIT
// ============================================================

// Exits sequence mode, removes temp layers, restores normal map state
function exitSequence() {
  stopAutoPlay();
  sequenceActive   = false;
  sequenceSteps    = [];
  sequenceIndex    = 0;
  sequenceParentId = null;

  // Remove temporary sequence markers
  Object.keys(sequenceMarkers).forEach(function(id) {
    map.removeLayer(sequenceMarkers[id]);
  });
  sequenceMarkers = {};

  // Remove temporary sequence relation curves
  sequenceRelLayers.forEach(function(layer) {
    if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
      map.removeLayer(layer.arrowDecorator);
    }
    map.removeLayer(layer);
  });
  sequenceRelLayers    = [];
  sequenceLocationSeqs = {};

  // Close side panel
  var panel = document.getElementById('side-panel');
  panel.classList.remove('panel-open');
  panel.innerHTML = '';
  activeEntry = null;

  // Restore temporal bar, hide sequence player
  document.getElementById('temporal-bar').style.display    = 'flex';
  document.getElementById('sequence-player').style.display = 'none';

  // Restore all entry marker opacities
  allEntries.forEach(function(entry) {
    var marker = entryMarkers[entry.properties.id];
    if (marker) setMarkerOpacity(marker, 1);
  });

  // Restore relation styles
  resetRelationStyles();

  // Reapply temporal filter
  if (currentYear !== null) applyTemporalFilter(currentYear);
}

// ============================================================
// AUTO-PLAY
// ============================================================

// Starts auto-play stepping through the sequence
function startAutoPlay() {
  stopAutoPlay();
  sequenceInterval = setInterval(function() {
    if (sequenceIndex < sequenceSteps.length - 1) {
      showSequenceStep(sequenceIndex + 1);
    } else {
      stopAutoPlay();
      document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';
    }
  }, sequenceSpeed);
}

// Stops auto-play
function stopAutoPlay() {
  if (sequenceInterval) {
    clearInterval(sequenceInterval);
    sequenceInterval = null;
  }
}

// ============================================================
// PLAYER CONTROLS
// ============================================================

// Handles play/pause button toggle
function handleSequencePlayPause() {
  if (sequenceInterval) {
    stopAutoPlay();
    document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';
  } else {
    startAutoPlay();
    document.getElementById('seq-play').innerHTML = '⏸ <span data-i18n="pause">' + ui[currentLang].pause + '</span>';
  }
}

// Steps backward one step
function handleSequencePrev() {
  stopAutoPlay();
  document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';
  if (sequenceIndex > 0) showSequenceStep(sequenceIndex - 1);
}

// Steps forward one step
function handleSequenceNext() {
  stopAutoPlay();
  document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';
  if (sequenceIndex < sequenceSteps.length - 1) {
    showSequenceStep(sequenceIndex + 1);
  }
}

// Restarts sequence from step 0
function handleSequenceRestart() {
  stopAutoPlay();
  document.getElementById('seq-play').innerHTML = '▶ <span data-i18n="play">' + ui[currentLang].play + '</span>';
  dimNonSequenceEntries(sequenceParentId);
  showSequenceStep(0);
}

// ============================================================
// ANIMATION
// Triggers or re-triggers animation on sequence curves
// ============================================================

function triggerSequenceAnimation(targetSeq) {
  sequenceRelLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var rp = layer.relationData.properties;
    if ((rp.sequence_value || 0) !== targetSeq) return;
    if (typeof layer.start === 'function') {
      // Remove existing arrow so it re-emerges with animation
      if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
        map.removeLayer(layer.arrowDecorator);
        layer.arrowDecorator = null;
      }
      layer.start();
    }
  });
}