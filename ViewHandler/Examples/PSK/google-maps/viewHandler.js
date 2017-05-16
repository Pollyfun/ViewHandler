
function loadMarkersVH(options) {	// used instead of loadMarkers() in google-maps/custom.js
	var addr;
	var icon;

	for (var i=0; i<options.locations.length; i++) {
		try {
			if (options.locations[i].lat === '')	// set default values if missing
				options.locations[i].lat = '0';		// string
			if (options.locations[i].lng === '')
				options.locations[i].lng = '0';
			
			addr = '';
			if (options.locations[i].lat == '') {
				if (options.locations[i].city.toUpperCase().indexOf('LAGER')==-1 && options.locations[i].street!=='' && options.locations[i].city!=='' ) {
					addr=options.locations[i].street+', '+options.locations[i].city+', Sweden';
				}
			}
			
			icon = '';
			if (options.locations[i].hasOwnProperty('icon')) {
				icon = dbHost +'/'+dbPath+'/'+options.locations[i].icon;
			}

			addMarker({position:new google.maps.LatLng(options.locations[i].lat, options.locations[i].lng), map:options.map, unid:options.locations[i].unid, address:addr, title: options.locations[i].hasOwnProperty('title') ? options.locations[i].title : ''});
			if (options.method === 'doc') {
				var marker=arrMarkers[arrMarkers.length-1];
				if (!marker.map) marker.setMap(options.map);
				options.map.setZoom(ZOOM_TARGET);
				options.map.setCenter(marker.getPosition());
				loadOverlayInfo(marker);
			}
		} catch(errAddMarker) {
			alert('Error placing marker:\n'+errAddMarker.message+'\n\nlat:'+options.locations[i].lat+'\nlng:'+options.locations[i].lng);
		}
	}

	options.map.fitBounds(bounds);
	if (options.map.zoom>ZOOM_TARGET)
		options.map.setZoom(ZOOM_TARGET);
	toggleMarkerCluster();
	var tglClusterButton = document.getElementById('togglecluster');
	if (tglClusterButton)
		google.maps.event.addDomListener(tglClusterButton, 'click', toggleMarkerCluster);
}

