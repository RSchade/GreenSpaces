// initialize with toner-lite from stamen
var map = new L.map("map", {
	center: new L.LatLng(40.635, 22.945),
	zoom: 15,
	scrollWheelZoom: false
});
var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
   attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
   subdomains: 'abcd',
   minZoom: 0,
   maxZoom: 20,
   ext: 'png'
});
map.addLayer(Stamen_Toner);
// add the layers panel, make sure they are sorted when new layers are added
var layers = L.control.layers({}, {}, {sortLayers: true}).addTo(map);
// add the scale
L.control.scale().addTo(map);
// add the AirBnB cost heatmap
$.getJSON("airbnbcost.json", function(obj) {
	var heat = L.heatLayer(obj, {radius: 15}).addTo(map);
	layers.addOverlay(heat, "AirBnB Cost");
	map.removeLayer(heat);
});
// add the relative green space for 200m and 400m
var greenFill = "#30db47";
["200m", "400m"].forEach(function(radius) {
	$.getJSON(`greenSpaces_${radius}_castle.geojson`, function(obj) {
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
		layers.addBaseLayer(greenSpace, `Relative Green Space (${radius})`);
	});
});
// add like and dislike layers
var likeFill = "#30db47";
var dislikeFill = "#ff0000";
[["likedregions.geojson", "Liked Regions", likeFill],
 ["dislikedregions.geojson", "Disliked Regions", dislikeFill]].forEach(function(layerData) {
	$.getJSON(layerData[0], function(obj) {
		var region = L.geoJSON(obj, {style: function(feature) {
			// divide the fillOpacity by the size of the sample (manual update)
			return {
				stroke: 0,
				fillColor: layerData[2],
				fillOpacity: feature.properties.value/40
			}
		}}).addTo(map);
		layers.addOverlay(region, layerData[1]);
		// remove from the map initially, keep it in the layers dialog
		map.removeLayer(region);
	});
});
// add pedestrian axis layers
$.getJSON("pedestrianaxis.geojson", function(obj) {
	var pedestrianData = L.geoJSON(obj, {
		style: function(feature) {
			return {
				"color": feature.properties.color,
				"weight": 18
			};
		}
	}).addTo(map);
	layers.addOverlay(pedestrianData, "Pedestrian Data");
	map.removeLayer(pedestrianData);
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
var pinTypeNames = ["Hospital Sites", "Hotel Sites", "Mixed Use Sites",
		    "School Sites", "Abandoned Sites", "Buisiness/Municipal Sites"];
Object.keys(pinTypes).forEach(function(pinName) {
	var pin = L.icon({
		iconUrl: `icons/${pinTypes[pinName]}`,
		shadowUrl: "icons/pinshadow.svg",
		shadowSize: [30,30],
		shadowAnchor: [5,24],
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
		var imgURL = site.img.split("/");
		imgURL[imgURL.length-1] = "thumb_"+imgURL[imgURL.length-1];
		imgURL = imgURL.join("/");
		var popupHTML =
			`<h3 style="margin-bottom: 0">${site.title}</h3>
			 <h6 style="margin: 0">${site.type}</h6>
			 <a href='${site.img}' target="_blank"><img width=250 style="display: inline-block" src='${imgURL}'></a>
			 <p>${site.description}</p>`
		var curPopup = L.popup({className: "greensite-popup"})
			.setContent(popupHTML);
		curMarker.bindPopup(curPopup);
		curMarker.addTo(map);
	});
});
// Add the legend onto the bottom right corner of the map
var legend = L.control({position: 'bottomleft'});
legend.onAdd = function(map) {
	var div = L.DomUtil.create('div', 'info legend');
	div.innerHTML = `<i style="background: ${greenFill};"></i> Green Space Concentration
                         <br>
                         <i style="background-image: linear-gradient(to right, blue, green, yellow,  red);"></i> AirBnB Heatmap
			 <br>
			 <i style="background: ${likeFill};"></i> Liked Regions
			 <br>
			 <i style="background: ${dislikeFill};"></i> Disliked Regions
			 <br>
			 <i style="background-image: linear-gradient(to right, white, red);"></i> Pedestrian Levels
			 <br>
			 <i style="background-image: url(icons/residentialpin.svg);"></i> Mixed Use
			 <br>
			 <i style="background-image: url(icons/abandonedpin.svg);"></i> Abandoned
			 <br>
			 <i style="background-image: url(icons/hospitalpin.svg);"></i> Hospital
			 <br>
			 <i style="background-image: url(icons/hotelpin.svg);"></i> Hotel
			 <br>
			 <i style="background-image: url(icons/schoolpin.svg);"></i> School
			 <br>
			 <i style="background-image: url(icons/commercialpin.svg);"></i> Buisiness/Government
			`;
	return div;
};
legend.addTo(map);
