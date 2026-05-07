// ============================================================
// ANIMATED LINE
// SVG stroke-dashoffset animation for relation curves
// Renders full path immediately, reveals via dashoffset
// Consistent speed regardless of curve length
// ============================================================
L.AnimatedLine = L.Polyline.extend({

  options: {
    interval:    16,   // ms per step (~60fps)
    targetSteps: 60,   // number of animation steps
    autoStart:   true,
    onEnd:       function() {}
  },

  initialize: function(latlngs, options) {
    this.finished     = false;
    this._tid         = null;
    this._progress    = 0;
    this._totalLength = null;
    this._origDash    = options && options.dashArray ? options.dashArray : null;
    this._latlngsOrig = latlngs;
    L.Polyline.prototype.initialize.call(this, [], options);
  },

  onAdd: function(map) {
    // Render full path so SVG path element exists
    L.Polyline.prototype.onAdd.call(this, map);
    this.setLatLngs(this._latlngsOrig);
    if (this.options.autoStart) {
      this.start();
    }
  },

  onRemove: function(map) {
    this.stop();
    if (this._path) {
      this._path.removeAttribute('stroke-dasharray');
      this._path.removeAttribute('stroke-dashoffset');
      if (this._path.parentNode) {
        this._path.parentNode.removeChild(this._path);
      }
    }
    this._totalLength = null;
    this._progress    = 0;
    L.Polyline.prototype.onRemove.call(this, map);
  },

  start: function() {
    this.stop();
    this.finished  = false;
    this._progress = 0;
    this._totalLength = null;
    this._animateDash();
  },

  stop: function() {
    if (this._tid) {
      clearTimeout(this._tid);
      this._tid = null;
    }
  },

  finish: function() {
    this.stop();
    this.finished = true;
    if (this._path) {
      this._path.removeAttribute('stroke-dasharray');
      this._path.removeAttribute('stroke-dashoffset');
      if (this._origDash) {
        this._path.setAttribute('stroke-dasharray', this._origDash);
      }
    }
    this.options.onEnd.apply(this, arguments);
  },

  _animateDash: function() {
    var self = this;

    // Wait for SVG path to be ready
    if (!this._path) {
      this._tid = setTimeout(function() { self._animateDash(); }, 16);
      return;
    }

    // Initialize total length on first frame
    if (!this._totalLength) {
      this._totalLength = this._path.getTotalLength();
      if (!this._totalLength) {
        this._tid = setTimeout(function() { self._animateDash(); }, 16);
        return;
      }
      // Set up dasharray for reveal — large gap hides path initially
      this._path.setAttribute('stroke-dasharray', this._totalLength + ' ' + this._totalLength);
      this._path.setAttribute('stroke-dashoffset', this._totalLength);
    }

    var step   = this._totalLength / (this.options.targetSteps || 60);
    this._progress += step;

    var offset = Math.max(0, this._totalLength - this._progress);
    this._path.setAttribute('stroke-dashoffset', offset);

    if (offset <= 0) {
      // Animation complete — restore original dash style
      this._path.removeAttribute('stroke-dasharray');
      this._path.removeAttribute('stroke-dashoffset');
      if (this._origDash) {
        this._path.setAttribute('stroke-dasharray', this._origDash);
      }
      this.finished = true;
      this.options.onEnd.apply(this, arguments);
    } else {
      this._tid = setTimeout(function() { self._animateDash(); }, self.options.interval);
    }
  }

});

L.animatedLine = function(latlngs, options) {
  return new L.AnimatedLine(latlngs, options);
};