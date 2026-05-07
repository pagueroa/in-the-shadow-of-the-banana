// ============================================================
// BEZIER CURVES
// Renders curved polylines between two coordinate pairs
// Handles multiple relations between the same pair of entries
// by alternating curve direction and increasing offset
// ============================================================

function computeBezierPoints(lat1, lng1, lat2, lng2, index, groupSize) {
  var midLat = (lat1 + lat2) / 2;
  var midLng = (lng1 + lng2) / 2;
  var dLat   = lat2 - lat1;
  var dLng   = lng2 - lng1;
  var len    = Math.sqrt(dLat * dLat + dLng * dLng);
  if (len === 0) return [];

  // Single relation gets a gentle default curve
  // Multiple relations alternate sides with increasing offset
  var sign        = index % 2 === 0 ? 1 : -1;
  var offsetIndex = Math.floor(index / 2) + 1;
  var magnitude   = len * 0.08 * sign * offsetIndex;

  var ctrlLat = midLat + (-dLng / len * magnitude);
  var ctrlLng = midLng + (dLat  / len * magnitude);

  var points = [];
  var steps  = Math.max(150, Math.round(len * 50));

  for (var t = 0; t <= steps; t++) {
    var tt  = t / steps;
    var lat = (1-tt)*(1-tt)*lat1 + 2*(1-tt)*tt*ctrlLat + tt*tt*lat2;
    var lng = (1-tt)*(1-tt)*lng1 + 2*(1-tt)*tt*ctrlLng + tt*tt*lng2;
    points.push([lat, lng]);
  }

  return points;
}

function drawRelation(relation, sourceCoords, targetCoords, index, wasSwapped, options) {
  var style  = getRelationStyle(relation);
  var lat1   = sourceCoords[1];
  var lng1   = sourceCoords[0];
  var lat2   = targetCoords[1];
  var lng2   = targetCoords[0];

  var points = computeBezierPoints(lat1, lng1, lat2, lng2, index);
  if (points.length === 0) return null;

  var lineOptions = {
    color:     style.color,
    weight:    style.weight,
    opacity:   style.opacity,
    dashArray: style.dashArray
  };

  var p = relation.properties;

  var line;

  if (options && options.animated) {
    var latlngs = points.map(function(pt) { return L.latLng(pt[0], pt[1]); });

    // Arrow is created after animation completes via onEnd callback
    var totalDistance = latlngs.reduce(function(acc, ll, i) {
      if (i === 0) return 0;
      return acc + latlngs[i-1].distanceTo(ll);
    }, 0);

    var animOptions = L.extend({}, lineOptions, {
      autoStart:  false,
      targetSteps: 60,
      interval:   16,
      onEnd: function() {
        if (p.directed_location) {
          var fullPath = latlngs;
          var arrow = L.polylineDecorator(fullPath, {
            patterns: [{
              offset:  '25%',
              repeat:  '50%',
              symbol:  L.Symbol.arrowHead({
                pixelSize:   8,
                polygon:     false,
                pathOptions: {
                  color:   style.color,
                  opacity: style.opacity,
                  weight:  2,
                }
              })
            }]
          }).addTo(map);
          line.arrowDecorator = arrow;
        }
      }
    });

    line = L.animatedLine(latlngs, animOptions);

  } else {
    line = L.polyline(points, lineOptions);

    // Static arrows for non-animated lines
    if (p.directed_location) {
      var decoratorPath = wasSwapped ? line.getLatLngs().slice().reverse() : line.getLatLngs();
      var arrow = L.polylineDecorator(decoratorPath, {
        patterns: [{
          offset: '25%',
          repeat: '50%',
          symbol: L.Symbol.arrowHead({
            pixelSize:   8,
            polygon:     false,
            pathOptions: {
              color:   style.color,
              opacity: style.opacity,
              weight:  2
            }
          })
        }]
      }).addTo(map);
      line.arrowDecorator = arrow;
    }
  }

  var typeLabel    = ui[currentLang].types[p.node_type]    || p.node_type    || '';
  var subtypeLabel = p.node_subtype
    ? ui[currentLang].subtypes[p.node_subtype] || p.node_subtype
    : null;

  line.bindPopup(
    '<b>' + typeLabel + (subtypeLabel ? ' / ' + subtypeLabel : '') + '</b>' +
    (p.year_start
      ? '<br>' + p.year_start +
        (p.year_end && p.year_end !== p.year_start
          ? ' – ' + p.year_end : '')
      : '') +
    (p.source ? '<br>' + p.source : '') +
    (p.description_en ? '<br><i>' + (p['description_' + currentLang] || p.description_en) + '</i>' : '')
  );

  line.relationData = relation;

  return line;
}