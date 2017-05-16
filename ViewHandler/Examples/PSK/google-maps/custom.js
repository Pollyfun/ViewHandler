//var ZOOM_FIRST=12;
var ZOOM_TARGET=14;
var bounds = new google.maps.LatLngBounds();

function validateRequiredInfo(boolSilent) {
	if (typeof dbPath=='undefined') {
		if (!boolSilent)
			alert('Unable to complete request.\nMissing required information \'dbPath\'');
		return false;
	}
	return true;
}
function getQSValue(arg) {
	var query = window.location.search.substring(1);
	var args = query.split("&");
	for (var i = 0; i < args.length; i++) {
		var pair = args[i].split("=");
		if (pair[0] == arg) {
			return unescape(pair[1]);
		}
	}
}
function openNewWindow(options) {
	/* { url : String [, name : String] [, features : String] [, replace : boolean] } */
	
	if (typeof options.url == 'undefined') {
		alert('Missing mandatory option "url"');
		return;
	}
	if (typeof options.name == 'undefined') options.name = '';
	if (typeof options.replace != 'boolean') options.replace = false;
	
	var oSpecs={
		top : '25',
		left : '200',
		width : '900',
		height : '900',
		channelmode : 'no',
		directories : 'yes',
		fullscreen : 'no',
		location : 'no',
		menubar : 'yes',
		resizable : 'yes',
		scrollbars : 'yes',
		status : 'no',
		titlebar : 'yes',
		toolbar : 'no'
	};
	
	var val;
	for (val in options) {
		if (oSpecs.hasOwnProperty(val)) oSpecs[val]=options[val];
	}
	
	var sSpecs='';
	for (val in oSpecs) {
		sSpecs += ((sSpecs!='') ? ', ' : '') + val + '=' + oSpecs[val];
	}
	//alert(sSpecs);
	
	var w=window.open(options.url, options.name, sSpecs, options.replace);
	w.focus();
}
function openFAAOUI(strAnlNr) {
	//var sUrl='/'+dbPath+'/AnlWebRedigera/'+strAnlNr+'?opendocument&opener=map';	// invalid form formula in this view
	var sUrl='/'+dbPath+'/fsFelanmArbord?openframeset&opener=map&anlnr='+strAnlNr;
	openNewWindow({ url:sUrl, name:'FAAO', width:'1280', height:'900' });
}
function openStation(strDocunid) {
	//var sUrl='/'+dbPath+'/AnlWebRedigera/'+strAnlnr+'?opendocument&urval=1';	// invalid form formula prevent opening documents from this view
	var sUrl='/'+dbPath+'/0/'+strDocunid+'?opendocument&opener=map';
	//openNewWindow({ url : sUrl, name : 'station', width: '850', height : '650' });
	openNewWindow({ url:sUrl, name:'' });
}
/*
function openStation(strDocunid) {
	//var urlstr='/'+dbPath+'/AnlWebRedigera/'+strAnlnr+'?opendocument&urval=1';
	var urlstr='/'+dbPath+'/0/'+strDocunid+'?opendocument&opener=map';
	var strFeatures='channelmode=no, directories=yes, fullscreen=no, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no';
	strFeatures+=', top=25, left=200, width=900, height=900';
	window.open(urlstr, '', strFeatures, false);
}
*/
function getRequest() {
	var oReq=false;
	try {
		  oReq=new XMLHttpRequest();
	} catch(tryMS) {
		try {
			oReq=new ActiveXObject("Msxml2.XMLHTTP")
		} catch(tryOlderMS) {
			try {
				oReq=new ActiveXObject("Microsoft.XMLHTTP");
			} catch(failed) {
				alert("Error initializing XMLHttpRequest!");
				oReq=false;
			}
		}
	}
	return oReq;
}
var sSiteID;
function thisSite() {
	if (typeof sSiteID == 'undefined') {
		sSiteID=window.location.hostname;
		switch (sSiteID) {
		case 'dev.psksyd.com' :
		case 'test.psksyd.com' :
			sSiteID='DEV';
			if (window.location.pathname.indexOf('qstar.nsf')>-1) {
				sSiteID = 'qstar'.concat(sSiteID);
			}
			break;
		case 'qstar.psksyd.com' :
			sSiteID='qstar';
			break;
		}
	}
	return sSiteID;
}
function bDisplayCustomLink(sLinkName) {
	switch (sLinkName) {
	case 'uiFAAO' :
		if ( thisSite() === 'qstar' || thisSite() === 'qstarDEV' ) {
			if (bInterfFAAO===true) {
				return true;
			}
		//} else {
		//	alert(thisSite()); 
		}
		break;
	}
	return false;
}
var geocoder;
function getPosByAddress(options) {
	/* currently unused due to restrictions on the service */
	if (!geocoder) geocoder = new google.maps.Geocoder();
	geocoder.geocode( {'address':options.address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var latLng = results[0].geometry.location;
			if ( latLng.lat() !== 0 ) {
				//alert(options.address+'\nlat: '+latLng.lat()+'\nlng: '+latLng.lng());
				options.marker.position=latLng;
				bounds.extend(latLng);
			}
		} else {
			alert("Geocode unsuccessful\nreason: " + status);
		}
	});
}
var map = null;
var arrMarkers = [];
var markerCluster = null;
function addMarker(options) {	//position (latLng), map, id, address, title
	var mOpt = {
			position: options.position,
		    //map: options.map,
		    docid: options.id,
		    docunid: options.unid
		}; // added to handle optional tooltip
	if (options.title) {
		mOpt.title=options.title;
	}
	
	if (options.icon!='') {
		mOpt.icon=options.icon;
	}
	
	var marker = new google.maps.Marker(mOpt);
	
	google.maps.event.addListener(marker, 'click', function() {
		map.setCenter(marker.getPosition());
		//if (map.zoom<ZOOM_FIRST) {
		//	map.setZoom(ZOOM_FIRST);
		//} else {
			if (!marker.infoLoaded) 
				loadOverlayInfo(marker);
		//}
	});
	arrMarkers.push(marker);
	if ( marker.position.lat()==0 ) {
		//if (!!address) getPosByAddress({'marker':marker, 'address':address});
		/* limit on req/s prevents the use of this service this way.
		* to use this we need to restrict the number of requests we generate
		* and update the location data/request response on our end
		* to prevent repeated requests for same station
		*/
	} else {
		bounds.extend(marker.position);
	}
}
function loadMarkers(options) {
	if (!validateRequiredInfo()) return;
	map = options.map;	// for toggleMarkerCluster
	
	var oRequest=getRequest();
	if (oRequest) {
		
		/* callback function */
		var processResponse = function(){
			if (oRequest.readyState == 4) {
				if (oRequest.status == 200) {
					//alert(oRequest.responseText);
					try { /* parse response to JSON object and process */
						var oResp=eval( '('+oRequest.responseText+')' );
						if (oResp) {
							if (oResp.hasOwnProperty('error')) {
								var e=oResp.error;
								alert('CGI script error\nscript: '+e.script+'\nmethod: '+e.method+'\nline: '+e.line+'\nerror('+e.errorcode+'): '+e.message);
								return;
							}
							try {
								if (oResp.hasmoredata===true) {
								   options.start = parseInt(oResp.poslastentry, 10) + 1;
									loadMarkers(options);
								//} else {
								//	alert('posLast: '+oResp.posLastEntry);
								}
							} catch(errRepeatrequest) {
								alert('Error repeating request:\n'+errRepeatrequest.message);
							}
							var addr;
							var icon;
							for (var i=0; i<oResp.locations.length; i++) {
								try {
									addr='';
									if (oResp.locations[i].lat=='') {
										//if (oResp.locations[i].city!=='Lager' && oResp.locations[i].street!=='' && oResp.locations[i].city!=='' ) {
										if (oResp.locations[i].city.toUpperCase().indexOf('LAGER')==-1 && oResp.locations[i].street!=='' && oResp.locations[i].city!=='' ) {
											addr=oResp.locations[i].street+', '+oResp.locations[i].city+', Sweden';
											//alert(addr);
										}
									}
									
									icon='';
									if (oResp.locations[i].hasOwnProperty('icon')) {
										icon = dbHost +'/'+dbPath+'/'+oResp.locations[i].icon;
									}
									
									//addMarker(new google.maps.LatLng(oResp.locations[i].lat, oResp.locations[i].lng), options.map, oResp.locations[i].docid, addr);
									addMarker({position:new google.maps.LatLng(oResp.locations[i].lat, oResp.locations[i].lng), map:options.map, id:oResp.locations[i].docid, address:addr, title: oResp.locations[i].hasOwnProperty('title') ? oResp.locations[i].title : ''});
									if (options.method==='doc') {
										var marker=arrMarkers[arrMarkers.length-1];
										if (!marker.map) marker.setMap(options.map);
										options.map.setZoom(ZOOM_TARGET);
										options.map.setCenter(marker.getPosition());
										loadOverlayInfo(marker);
									}
								} catch(errAddMarker) {
									alert('Error placing marker:\n'+errAddMarker.message+'\n\nlat:'+oResp.locations[i].lat+'\nlng:'+oResp.locations[i].lng);
								}
							}
							if (oResp.hasmoredata===false) {
								options.map.fitBounds(bounds);
								if (options.map.zoom>ZOOM_TARGET)
									options.map.setZoom(ZOOM_TARGET);
								//markerCluster = new MarkerClusterer(options.map, arrMarkers);
								toggleMarkerCluster();
								var tglClusterButton = document.getElementById('togglecluster');
						        if (tglClusterButton)
						        	google.maps.event.addDomListener(tglClusterButton, 'click', toggleMarkerCluster);
							}
						} else {
							alert(oRequest.responseText);
						}
					} catch(err) {
						alert('Error interpreting response:\n'+err.message+'\n\n'+oRequest.responseText);
					}
				} else {
					alert('Server request error.\nstatus:'+oRequest.status+'\n'+oRequest.statusText);
				}
			}
		};
		
		var reqUrl='/'+dbPath+'/(request.locationdata)?openagent&outputformat=JSON&method='+options.method+'&items='+options.data;
		if (options.view)
			reqUrl+='&view='+escape(options.view);
		if (options.category)
			reqUrl+='&category='+escape(options.category);
		if (options.query)
			reqUrl+='&query='+escape(options.query);
		if (options.start)
			reqUrl+='&start='+escape(options.start);
		if (options.docid)
			reqUrl+='&docid='+escape(options.docid);
		if (options.docunid)
			reqUrl+='&docunid='+escape(options.docunid);
		if (options.method!='doc') reqUrl+='&maxhits=200';
		
		/* no-cache */
		reqUrl+='&ts='+new Date().getTime();
		//alert(reqUrl);
		
		/* Ajax call */
		oRequest.open("GET", reqUrl, true);
		oRequest.onreadystatechange=processResponse;
		oRequest.send(null);
	}
}
function toggleMarkerCluster() {
	//if (markerCluster) alert(markerCluster.getTotalMarkers());
	if (!markerCluster || markerCluster.getTotalMarkers()==0) {
		/*for (var i = 0; i < arrMarkers.length; i++) { 
			arrMarkers[i].setOptions({'map': null, 'visible': false});
		}*/
		markerCluster = new MarkerClusterer(map, arrMarkers, {'maxZoom': 9});
		// markerCluster.refresh();
	} else {
		markerCluster.clearMarkers();
		// markerCluster.refresh();
		for (var i = 0; i < arrMarkers.length; i++) {
			arrMarkers[i].setOptions({'map': map, 'visible': true});
		}
	}
}
function loadOverlayInfo(overlay) {
	var oRequest=getRequest();
	if (oRequest) {
		var options={
			fields:{
				anlnr: "anlnr",
				street: "gata",
				city: "ort",
				//zip: "postnr",
				//postalAddress: "postort",
				//propertyDesignation: "fastighetsbet",
				//region: "lan",
				//county: "kommun",
				//orgno: "orgnr",
				manager: "forestandare",
				phone: "telefonnummer",
				//fax: "faxnummer",
				email: "epostadress",
				docunid: "docunid"
			}
		};
		
		/* callback function */
		var processResponse = function(){
			if (oRequest.readyState == 4) {
				if (oRequest.status == 200) {
					//alert(oRequest.responseText);
					try { /* parse response to JSON object and process */
						var oResp=eval( '('+oRequest.responseText+')' );
						if (oResp) {
							try {
								overlay.info=oResp.info;
								var tmp='<div class="markerInfo" style="overflow-x:hidden; text-overflow: ellipsis;" ><div class="title">'+overlay.info[options.fields['anlnr']]+' '+overlay.info[options.fields['street']]+' '+overlay.info[options.fields['city']]+'</div>'+
								'<div style="white-space:nowrap; padding:3px;">'+
								'<label>Föreståndare:</label>'+overlay.info[options.fields['manager']]+'<br />'+
								'<label>Telefon:</label>'+overlay.info[options.fields['phone']]+'<br />'+
								'<label>E-post:</label><a href="mailto:'+overlay.info[options.fields['email']]+'">'+overlay.info[options.fields['email']]+'</a><br />'+
								'</div>'+
								'<div class="link" style="text-align:center;">'+
								'<a href="#" onclick="javascript:openStation(\''+overlay.info[options.fields['docunid']]+'\')" >Öppna stationsdokument</a>'+
								((bDisplayCustomLink('uiFAAO')) ? '<br /><a href="#" onclick="javascript:openFAAOUI(\''+overlay.info[options.fields['anlnr']]+'\')" >Felanmälan/Arbetsorder</a>' : '') +
								'</div>';
								overlay.infoText=tmp;
						   		overlay.infoLoaded=true;
						   		overlay.InfoWindow = new google.maps.InfoWindow({
									content: overlay.infoText
								});
						   		google.maps.event.addListener(overlay, 'click', function(overlay) {
						   			if (this.map.zoom<ZOOM_TARGET) this.map.setZoom(ZOOM_TARGET);
						   			this.InfoWindow.open(this.map,this);
								});
						   		if (overlay.map.zoom<ZOOM_TARGET) overlay.map.setZoom(ZOOM_TARGET);
						   		overlay.InfoWindow.open(overlay.map,overlay);
							} catch(errUpdOverlay) {
								alert('Error updating overlay:\n'+errUpdOverlay.message+'\n\n'+oRequest.responseText);
							}
						} else {
							alert(oRequest.responseText);
						}
					} catch(err) {
						alert('Error interpreting response:\n'+err.message+'\n\n'+oRequest.responseText);
					}
				} else {
					alert('Server request error.\nstatus:'+oRequest.status+'\n'+oRequest.statusText);
				}
			}
		};
		
		var strItems='';
		var bNotFirst=false;
		for (var idx in options.fields){
			if (bNotFirst)
				strItems+=',';
			else 
				bNotFirst=true;
			strItems+=options.fields[idx];
		}
		var reqUrl='/'+dbPath+'/(request.locationdata)?openagent&outputformat=JSON&method=doc&items='+strItems;
		if (typeof(overlay.docunid) !== 'undefined' && overlay.docunid !== '')
			reqUrl += '&docunid='+overlay.docunid;
		else
			reqUrl += '&docid='+overlay.docid;
		
		/* no-cache */
		reqUrl+='&ts='+new Date().getTime();
		//alert(reqUrl);
		
		/* Ajax call */
		oRequest.open("GET", reqUrl, true);
		oRequest.onreadystatechange=processResponse;
		oRequest.send(null);
	}
}