var map = L.map('map').setView(config.mapCenter, config.mapZoom);

map.zoomControl.setPosition('topleft');

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 19
}).addTo(map);