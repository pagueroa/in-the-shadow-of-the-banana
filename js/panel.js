// ============================================================
// PANEL
// Dispatches between full panel (side panel) and basic popup
// based on whether the entry has a rendered panel file
// ============================================================

function openPanel(entry) {
  clearTempLayers();

  var entryId = entry.properties.id;

  // Clean up all existing overlays and hide static arrows
  relationLayers.forEach(function(layer) {
    layer._cancelled = true;
    if (typeof layer.stop === 'function') layer.stop();
    layer.setStyle({ opacity: 0 });
    if (layer.arrowDecorator && map.hasLayer(layer.arrowDecorator)) {
      map.removeLayer(layer.arrowDecorator);
    }
  });

  // ============================================================
  // ANIMATE CONNECTED CURVES
  // Shared function — called immediately for markers,
  // after flyTo completes for relation entries
  // ============================================================

  function animateConnectedCurves() {
  relationLayers.forEach(function(layer) {
    if (!layer.relationData) return;
    var rp = layer.relationData.properties;
    if (!rp) return;
    if (rp.source_location !== entryId &&
        rp.target_location !== entryId &&
        rp.id !== entryId) return;

    var originalOnEnd = layer.options.onEnd;
    layer._cancelled = false;
    layer.options.onEnd = function() {
      if (layer._cancelled) return;
      originalOnEnd.apply(this, arguments);
    };
    layer.setStyle({ opacity: 1 });
    layer.start();
  });
  }

  // ============================================================
  // FLY TO + ANIMATE
  // For relation entries (no geometry), fly to curve midpoint
  // first, then animate after map settles
  // ============================================================

  if (!entry.geometry) {
    var midLatLng = null;
    relationLayers.forEach(function(layer) {
      if (!layer.relationData) return;
      if (layer.relationData.properties.id !== entryId) return;
      var latlngs = layer.getLatLngs();
      if (latlngs.length > 0) {
        midLatLng = latlngs[Math.floor(latlngs.length / 2)];
      }
    });
    if (midLatLng) {
      map.once('moveend', function() {
        animateConnectedCurves();
      });
      map.flyTo(midLatLng, 10);
    } else {
      animateConnectedCurves();
    }
  } else {
    animateConnectedCurves();
  }

  activeEntry = entry;
  var p = entry.properties;
  if (p.panel_html) {
    showFullPanel(entry);
  } else {
    showPopup(entry);
  }
}

// ============================================================
// FULL PANEL
// Fetches rendered HTML from panels/[id].html and injects
// into the side panel
// ============================================================

function showFullPanel(entry) {
  var p = entry.properties;

  fetch('panels/' + p.id + '.html')
    .then(function(r) {
      if (!r.ok) throw new Error('Panel not found: ' + p.id);
      return r.text();
    })
    .then(function(html) {
      var panel = document.getElementById('side-panel');
      panel.innerHTML = '';

      // Sticky header
      var stickyHeader = document.createElement('div');
      stickyHeader.id = 'panel-sticky-header';

      var closeBtn = document.createElement('button');
      closeBtn.id          = 'panel-close';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', function() {
        panel.classList.remove('panel-open');
        panel.innerHTML = '';
        activeEntry = null;
      });
      stickyHeader.appendChild(closeBtn);

      // Scrollable content wrapper
      var contentWrapper = document.createElement('div');
      contentWrapper.id        = 'panel-scroll-content';
      contentWrapper.innerHTML = html;

      panel.appendChild(stickyHeader);
      panel.appendChild(contentWrapper);
      panel.classList.add('panel-open');

      // Apply current language
      document.getElementById('html-root').lang = currentLang;

      // Internal links
      contentWrapper.querySelectorAll('.full-panel-connection-link, .full-panel-body a').forEach(function(link) {
        link.addEventListener('click', function(e) {
          var href  = this.getAttribute('href');
          var id    = href.replace('.html', '').replace('../panels/', '').replace('panels/', '');
          var found = allEntries.find(function(e) { return e.properties.id === id; });
          if (!found) return;
          e.preventDefault();
          openPanel(found);
          if (found.properties.parent_event && found.properties.parent_event !== 'TRUE') {
            showChildEvent(found);
          }
        });
      });

      // Sequence play buttons
      var seqBtn = contentWrapper.querySelector('.sequence-play-btn');
      if (seqBtn) {
        seqBtn.addEventListener('click', function() {
          var parentId = this.getAttribute('data-parent-id');
          panel.classList.remove('panel-open');
          startSequence(parentId);
        });
      }
    })
    .catch(function(err) {
      console.error('Failed to load panel:', err);
      showPopup(entry);
    });
}

// ============================================================
// BASIC POPUP
// Shows a Leaflet popup for entries without a panel file
// ============================================================

function showPopup(entry) {
  
  var p = entry.properties;

  var typeLabel    = ui[currentLang].types[p.node_type]    || p.node_type    || '';
  var subtypeLabel = ui[currentLang].subtypes[p.node_subtype] || p.node_subtype || '';

  var content =
    '<div class="centroid-popup-type">' +
      typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '') +
    '</div>' +
    '<div class="centroid-popup-label">' + (p['label_' + currentLang] || p.label_en || '') + '</div>';

  if (p.year_start) {
    content += '<div class="centroid-popup-dates">' +
      p.year_start + (p.year_end ? ' \u2013 ' + p.year_end : '') +
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

  var latlng = null;

  if (entry.geometry) {
    var coords = entry.geometry.coordinates;
    latlng = [coords[1], coords[0]];
  } else {
    relationLayers.forEach(function(layer) {
      if (!layer.relationData) return;
      if (layer.relationData.properties.id !== p.id) return;
      var latlngs = layer.getLatLngs();
      if (latlngs.length > 0) {
        latlng = latlngs[Math.floor(latlngs.length / 2)];
      }
    });
    if (!latlng) latlng = map.getCenter();
  }

  if (latlng) {
    L.popup({ maxWidth: 260 })
      .setLatLng(latlng)
      .setContent(content)
      .openOn(map);
  }

}