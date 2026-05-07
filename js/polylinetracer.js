// ============================================================
// POLYLINE TRACER
// SVG stroke-dashoffset animation for information/
// correspondence relations — reads as signal or transmission
// Extends L.Polyline — a moving window traces the full path
// ============================================================

L.PolylineTracer = L.Polyline.extend({

  options: {
    length:    '40%',  // tracer window as % of total path length
    distance:  8,      // pixels per step
    interval:  16,     // ms per step (~60fps)
    autoStart: true,
    onEnd:     function() {}
  },

  initialize: function(latlngs, options) {
    options = options || {};
    options.dashArray = undefined; // reserved for animation

    L.Polyline.prototype.initialize.call(this, latlngs, options);

    this._progress      = 0;
    this._offset        = 0;
    this._totalDistance = this._getTotalDistance();
    this._timer         = null;
  },

  onAdd: function(map) {
    L.Polyline.prototype.onAdd.call(this, map);
    if (this.options.autoStart) {
      this.start();
    }
  },

  start: function() {
    this.stop();
    this._progress = 0;
    this._offset   = 0;
    this._step();
  },

  stop: function() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },

  finish: function() {
    this.stop();
    this._progress = 1;
    if (this._path) {
      this._offset = this._totalLength;
      this._path.setAttribute('stroke-dashoffset',
        -(this._offset - this._tracerLength));
    }
    this.options.onEnd.apply(this, arguments);
  },

  _step: function() {
    var self = this;

    if (!this._totalLength) {
      this._totalLength  = this._path ? this._path.getTotalLength() : 0;
    }
    if (!this._totalLength) {
      // SVG not ready yet — retry
      this._timer = setTimeout(function() { self._step(); }, 32);
      return;
    }

    this._tracerLength   = this._getTracerLength();
    this._metersPerPixel = this._totalDistance / this._totalLength;
    this._offset        += this.options.distance;
    this._progress       = this._offset / this._totalLength;

    this._path.setAttribute('stroke-dashoffset',
      -(this._offset - this._tracerLength));

    this._timer = setTimeout(function() {
      if (self._progress >= 1) {
        self._progress = 1;
        self.options.onEnd.apply(self, arguments);
      } else {
        self._step();
      }
    }, this.options.interval);
  },

  _getTotalDistance: function() {
    var i, len, dist = 0,
        latlngs = this._latlngs || [];
    for (i = 0, len = latlngs.length - 1; i < len; i++) {
      dist += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    return dist;
  },

  _getTracerLength: function() {
    if (!this._totalLength) return 0;
    if (typeof this.options.length === 'string') {
      var pct = parseFloat(this.options.length.split('%')[0]);
      return this._totalLength * (pct / 100);
    }
    return this.options.length;
  },

  _updatePath: function() {
    L.Polyline.prototype._updatePath.call(this);

    if (!this._path) return;
    this._totalLength  = this._path.getTotalLength();
    this._tracerLength = this._getTracerLength();
    this._metersPerPixel = this._totalDistance / this._totalLength;
    this._offset       = this._progress * this._totalLength;

    this._path.setAttribute('stroke-dasharray',
      this._tracerLength + ' ' + this._totalLength);
    this._path.setAttribute('stroke-dashoffset',
      -(this._offset - this._tracerLength));
  }

});

L.polylineTracer = function(latlngs, options) {
  return new L.PolylineTracer(latlngs, options);
};