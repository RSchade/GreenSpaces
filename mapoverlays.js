// initialize with toner-lite from stamen
var layer = new L.StamenTileLayer("toner-lite");
var map = new L.Map("map", {
    center: new L.LatLng(40.63, 22.945),
    zoom: 15
});
map.addLayer(layer);
// add the data layers
var layers = L.control.layers({},{}).addTo(map);
$.getJSON("airbnbcost.json", function(obj) {
	var heat = L.heatLayer(obj, {radius: 15}).addTo(map);
	layers.addOverlay(heat, "AirBnB Cost");
});
$.getJSON("greenSpaces.geojson", function(obj) {
	var highestAmt = 0;
	obj.forEach(function(feature) {
		if(highestAmt < feature.properties.greenSpaceM) {
			highestAmt = feature.properties.greenSpaceM;
		}
	});
	var greenSpace = L.geoJSON(obj, {
	   style: function(feature) {
		percent = feature.properties.greenSpaceM/highestAmt;
		return {
			stroke: 0,
			fillColor: "#30db47",
			fillOpacity: percent
		};
	   }
	}).addTo(map);
	layers.addOverlay(greenSpace, "Relative Green Space");
});
// add the markers with the sites
$.getJSON("newsites.json", function(obj) {
	obj.forEach(function(site) {
		console.log(site);
		var curMarker = L.marker(site.coord);
		var curPopup = L.popup()
			.setContent("<img width=300 src='"+site.img+"'><br><h3>"+site.title+"</h3>");
		curMarker.bindPopup(curPopup);
		curMarker.addTo(map);
	});
});
