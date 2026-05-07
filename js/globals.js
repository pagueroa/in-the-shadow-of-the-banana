// ============================================================
// GLOBALS
// Shared state variables accessible across all JS files
// Declared here so all files can reference them safely
// regardless of load order
// ============================================================

var allEntries     = [];
var entryCoords    = {};
var entryMarkers   = {};
var tempMarker = null;
var tempRelationLayer = null;
var allRelations   = [];
var relationLayers = [];
var geoLayers      = [];
var activeEntry    = null;
var currentYear    = null;
var activeCentroidEntry = null;
var activeCentroidPopup = null;
var sequenceMarkers   = {};
var sequenceRelLayers = [];