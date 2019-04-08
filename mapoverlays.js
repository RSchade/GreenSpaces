// initialize with toner-lite from stamen
var layer = new L.StamenTileLayer("toner-lite");
var map = new L.Map("map", {
    center: new L.LatLng(40.635, 22.945),
    zoom: 15
});
map.addLayer(layer);
// add the data layers
var layers = L.control.layers({},{}).addTo(map);
$.getJSON("airbnbcost.json", function(obj) {
	var heat = L.heatLayer(obj, {radius: 15}).addTo(map);
	layers.addOverlay(heat, "AirBnB Cost");
});
var greenFill = "#30db47";
$.getJSON("greenSpaces_200m.geojson", function(obj) {
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
// create the icons for the markers
var pinTypes = {
	"hospital": "hospitalpin.svg",
	"hotel": "hotelpin.svg",
	"residential": "residentialpin.svg",
	"school": "schoolpin.svg",
	"abandoned": "abandonedpin.svg",
	"commercial": "commercialpin.svg"
}
var pinTypeNames = ["Hospital Sites", "Hotel Sites", "Residential Sites",
		    "School Sites", "Abandoned Sites", "Buisiness Sites"];
Object.keys(pinTypes).forEach(function(pinName) {
	var pin = L.icon({
		iconUrl: `/icons/${pinTypes[pinName]}`,
		iconSize: [30,30],
		iconAnchor: [15,30],
		popupAnchor: [0,0]
	});
	pinTypes[pinName] = pin;
});
// add the markers with the sites
$.getJSON("newsites.json", function(obj) {
	var siteLayers = {};
	var siteKeys = Object.keys(pinTypes);
	for(var i = 0; i < pinTypeNames.length; i++) {
		var pinType = siteKeys[i];
		siteLayers[pinType] = L.layerGroup();
		siteLayers[pinType].addTo(map);
		layers.addOverlay(siteLayers[pinType], pinTypeNames[i]);
	}
	obj.forEach(function(site) {
		var options = {};
		if(site.icon) {
			options['icon'] = pinTypes[site.icon];
		} else {
			site.icon = "residential";
		}
		var curMarker = L.marker(site.coord, options);
		siteLayers[site.icon].addLayer(curMarker);
		var popupHTML =
			`<h3 style="margin-bottom: 0">${site.title}</h3>
			 <h6 style="margin: 0">${site.type}</h6>
			 <img width=250 style="display: inline-block" src='${site.img}'>
			 <p>${site.description}</p>`
		var curPopup = L.popup({className: "greensite-popup"})
			.setContent(popupHTML);
		curMarker.bindPopup(curPopup);
		curMarker.addTo(map);
	});
});
// Add the legend onto the bottom right corner of the map
var legend = L.control({position: 'bottomright'});
legend.onAdd = function(map) {
	var div = L.DomUtil.create('div', 'info legend');
	div.innerHTML = `<i style="background: ${greenFill};"></i> Green Space Concentration
                         <br>
                         <i style="background-image: linear-gradient(to right, blue, green, yellow,  red);"></i> AirBnB Heatmap
			 <br>
			 <i style="background-image: url(/icons/residentialpin.svg);"></i> Residential
			 <br>
			 <i style="background-image: url(/icons/hospitalpin.svg);"></i> Hospital
			 <br>
			 <i style="background-image: url(/icons/hotelpin.svg);"></i> Hotel
			 <br>
			 <i style="background-image: url(/icons/schoolpin.svg);"></i> School
			`;
	return div;
};
legend.addTo(map);
