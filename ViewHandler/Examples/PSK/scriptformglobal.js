function Close() {
	self.close();
}
function CloseSpara() {
	if (document.forms[0].action) {
		//if (confirm("St\u00E4ng utan att spara?")) 
		if (confirm("\u00C4r du s\u00E4ker p\u00E5 att du vill st\u00E4nga f\u00F6nstret ? OBS !! detta dokument kommer inte att sparas !")) 
			self.close();
	} else {
		self.close();
	}
}
function docRemove() {
	if (confirm("\u00C4r du s\u00E4ker p\u00E5 att du vill radera dokumentet?")) {
		window.location.search='DeleteDocument';
	}
}
function doDeleteDoc() {
	if (confirm("\u00C4r du s\u00E4ker p\u00E5 att du vill radera dokumentet?")) {
		//We cannot use /0/ view when doing ?deletedocument. Replace with a view that works with deletions.
		//Create a dummy anchor tag to work with location object
		var tmpURL = document.createElement('a');
		tmpURL.href = window.location.href;
		tmpURL.pathname = window.location.pathname.replace('/0/','/vDocumentUniqueID/');
		tmpURL.search='DeleteDocument';
		window.location.href = tmpURL.href;
	}
}

function getDateMonth(){
	var x= new Date();
	var y= x.getYear();
	var m= x.getMonth()+1;
	var d= x.getDate();
	var xy=m.toString();
	var currentmonth;
	var currentDate;
	currentDate=d;
	if (xy.length=="2") {
		currentmonth=xy;
	} else {
		currentmonth="0"+xy;
	}
}
function fixNoDocsTag() {
	var noDocumentsFound;
	var tagH2, textH2; 
		if (document.getElementsByTagName) {
		noDocumentsFound = document.getElementsByTagName("H2");
	} else if (document.body.all) {
		noDocumentsFound = document.body.all.tags("H2");
	}
	for (var i = 0; i < noDocumentsFound.length; i++) {
		tagH2 = noDocumentsFound[i];
		if (document.getElementsByTagName) {
			textH2 = tagH2.innerHTML;
		} else if (document.body.all) {
			textH2 = tagH2.innerText;
		} 
		if (textH2.toLowerCase() == "no documents found") {
			// tagH2.innerHTML = '<br /><font size="2" face="Arial" color="red">Inga tr\u00E4ffar med aktuellt urval. Var v\u00E4nlig \u00E4ndra urvalskriterierna.</font>';
			tagH2.innerHTML = '<p style="font-size:1.2em; font-family:Arial; color:red;">Inga tr\u00E4ffar med aktuellt urval. Var v\u00E4nlig \u00E4ndra urvalskriterierna.</p>';
		} 
		tagH2.style.display = 'block';
	}
}
function showAnimate() {
	$('#master_view').hide();
	$('#imgWaiting').show();
}

var dbURLg;
function getdbURL(){
// h\u00E4mtar in dburl
	if (typeof dbURLg=='undefined') {
		var winLocation = window.location.href;
		//alert("winLocation ="+winLocation );
		winLocation = winLocation.toLowerCase();
		var pos = winLocation.indexOf(".nsf")+4;
		dbURLg=winLocation.substr(0, pos);
	}
	return dbURLg;
}

function getXmlHttpObject(){
	/** Gets a handle to an XMLHTTP object (the object that makes AJAX possible). */
	try{
		// Firefox, Opera 8.0+, Safari
		return new XMLHttpRequest();
	}catch(e){
		// Internet Explorer
		try{
			return new ActiveXObject("Msxml2.XMLHTTP");
		}catch (e){
			try{
				return new ActiveXObject("Microsoft.XMLHTTP");
			}catch (e){
				return null;
			}
		}
	}
}

function sendXmlHttpRequest(xmlHttp, url, fn){
	/** This function simply hides some of the setup required to use the XMLHTTP object. */
//alert("xmlHttp="+xmlHttp);
//alert("url="+url);
//alert("fn="+fn);
	if (fn) xmlHttp.onreadystatechange = fn;
	xmlHttp.open("GET", url, (fn != null));
	xmlHttp.send(null);
}
 
function dbGetViewXmlDocument(dburl, view, params){
	/** Synchronously retrieves a Lotus Notes view as an XML document. */
//alert(dburl);
	try{
		var xmlHttp = getXmlHttpObject();
		var url = dburl + "/" + view + "?ReadViewEntries";
		if ((params != null) && (params != "")) url = url + "&" + params;
		//alert("url="+url);
		sendXmlHttpRequest(xmlHttp, url, null)
		return xmlHttp.responseXML.documentElement;
	}catch(e){
		throw new Error(e.message);
	}
}

function getElementById(id, doc){
	/** Gets a page element by id. */
	doc = (doc?doc:document);
	var retval = null;
	if(doc.getElementById){
		retval = doc.getElementById(id);
	}else if(doc.all){
		retval = doc.all[id];
	}else if(doc.layers){
		retval = doc.layers[id];
	}
	return retval;
}
 
function getXMLNodeInnerText(node){
	/** Gets the inner text of any XML document node. */
	//alert("node="+node);
	var retval = "";
	if (typeof node.textContent != 'undefined'){
		retval = node.textContent;
	}else if (typeof node.innerText != 'undefined'){
		retval = node.innerText;
	}else if (typeof node.text != 'undefined'){
		retval = node.text;
	}else{
		switch (node.nodeType){
			case 3:
			case 4:
				return node.nodeValue;
				break;
			case 1:
			case 11:
				var innerText = '';
				for (var i = 0; i < node.childNodes.length; i++){
					innerText += getXMLNodeInnerText(node.childNodes[i]);
				}
				retval = innerText;
				break;
			default:
				retval = "";
		}
	}
	if (strLeft(retval, 1) == "\n")
		retval = strRight(retval, retval.length-1);
	return retval;
}
 
// Extracts a specified number of the leftmost characters in a string.
function strLeft(s, n){
	s = new String(s);
	if(n <= 0) return "";
	else if(n > String(s).length) return s;
	else return String(s).substring(0, n);
}
function Left(str, n){
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else
		return String(str).substring(0,n);
}
function LeftBack(sourceStr, keyStr){
	arr = sourceStr.split(keyStr)
	arr.pop();
	return (keyStr==null | keyStr=='') ? '' : arr.join(keyStr)
}
function leftBackString(fullString, subString) {
   if (fullString.lastIndexOf(subString) == -1) {
      return "";
   } else {
      return fullString.substring(0, fullString.lastIndexOf(subString));
   }
}
 
// Extracts a specified number of the rightmost characters in a string.
function strRight(s, n){
	if(n <= 0) return "";
	else if(n > String(s).length) return s;
	else{
		var iLen = String(s).length;
		return String(s).substring(iLen, iLen - n);
	}
}
function Right(str, n){
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else {
		var iLen = String(str).length;
		return String(str).substring(iLen, iLen - n);
	}
}
function RightBack(sourceStr, keyStr){
	arr = sourceStr.split(keyStr);
	return (sourceStr.indexOf(keyStr) == -1 | keyStr=='') ? '' : arr.pop()
}
function rightBackString(fullString, subString) {
   if (fullString.lastIndexOf(subString) == -1) {
      return "";
   } else {
      return fullString.substring(fullString.lastIndexOf(subString)+1, fullString.length);
   }
}

function sort_unique(arr) {
    arr = arr.sort(function (a, b) { return a*1 - b*1; });
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (arr[i-1] !== arr[i]) {
            ret.push(arr[i]);
        }
    }
    return ret;
}
function replacesubstring(fullS,oldS,newS) {
	for (var i=0; i<fullS.length; i++) { 
		if (fullS.substring(i,i+oldS.length) == oldS) { 
			fullS = fullS.substring(0,i)+newS+fullS.substring(i+oldS.length,fullS.length);
		} 
	} 
	return fullS;
}
function checkUploadFileName(fileName){
	//console.log('checking filename '+fileName)
	if (fileName=='') return true;
	if (fileName==decodeURIComponent(fileName)){
		return true;
	} else {
		alert("Filnamnet p\u00E5 den lokala filen ["+fileName+"] \u00E4r fel, den inneh\u00E5ller felaktiga\ntecken i filnamnet.\nV\u00E4nligen \u00E4ndra filnamnet innan du laddar upp den.");
		return false;
	}
}
function doValidation(id, v, o, t, h) {
	if (v=='$Refresh') return true;
	/*
	if ( String(id) == String('btnSave') ) {
		var oCheck;
		oCheck=document.getElementsByName('AnlNr')[0];
		if (typeof oCheck != 'undefined') {
			if ( IsEmpty(oCheck.value) ) {
				alert('Anl\u00E4ggningsnummer saknas.');
				oCheck.focus();
				return false;
			}
		}
		for (var i=0; i<arrDateFields.length; i++) {
			oCheck=document.getElementById(arrDateFields[i]);
			if (!IsEmpty(oCheck.value)) if (!IsValidDate(oCheck.value)) {
				alert('Ogiltigt datum: "'+oCheck.value+'"\nF\u00F6r att kunna spara dokumentet m\u00E5ste du korrigera detta.');
				oCheck.focus();
				return false;
			}
		}
	}*/
	return true;
}

function AddList(bt, theList) {
	var msg = "Nytt v\u00E4rde:";
	var v = prompt(msg,"");
	if (v == null) return;
	if (v == "") return;

	var nbo = theList.options.length;
	var i; 
	var no = true;
	for (i=0; i<nbo; i++) {
		if (theList.options[i].text == v) {
			theList.options[i].selected = true;
			no = false;
			break; // the value is already in the list
		}
	}
	if (no) { // append new value (not sorted)
		theList.options.length = nbo + 1;
		theList.options[nbo] = new Option(v,v,true, true);
	}
	bt.blur();
}

function open_new_tab(sUrl, sName) {
	var w;
	if (sName) {
		w=window.open(sUrl, sName);
	} else {
		w=window.open(sUrl, '_blank');
	}
	w.focus();
}

function open_new_tab_v2(sUrl, sName, sSourceId) {
	var w;
	if (sSourceId){
		sUrl += "&srcid="+sSourceId;
	}
	if (sName) {
		w=window.open(sUrl, sName);
	} else {
		w=window.open(sUrl, '_blank');
	}
	w.focus();
}

function openUrl(urlstr) {
	location.href=urlstr;
}

function openInstallningWeblasare(urlstr) {
	var w = window.open(urlstr, 'InstallningWeblasare', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=700, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=640', false);
	w.focus();
}

function openAnlaggning(urlstr) {
	var w = window.open(urlstr, 'Anlaggning', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=100, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=900', false);
	w.focus();
}
function openArbetsorder(urlstr) {
	var w = window.open(urlstr, 'ArbOrd', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=400, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=900', false);
	w.focus();
}
function openAtt(urlstr) {
	var w = window.open(urlstr, 'attW', 'channelmode=no, directories=yes, fullscreen=no, height=600, left=200, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=800', false);
	w.focus();
}
function openBestallningsdok(urlstr) {
	var w = window.open(urlstr, 'BestDok', 'channelmode=no, directories=yes, fullscreen=no, height=700, left=200, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=560', false);
	w.focus();
}
function openCistern(urlstr) {
	var w = window.open(urlstr, 'Cistern', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=400, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=700', false);
	w.focus();
}
function openExtHelpDocument(urlstr) {
	var w = window.open(urlstr, '', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=300, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=770', false);
	w.focus();
}
function openHanteringsts(urlstr) {
	var w = window.open(urlstr, 'Hanteringsts', 'channelmode=no, directories=yes, fullscreen=no, height=600, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=670', false);
	w.focus();
}
function openHjalpmanual(urlstr) {
	var w = window.open(urlstr, 'Hjalpmanual', 'channelmode=no, directories=yes, fullscreen=no, height=760, left=400, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=800', false);
	w.focus();
}
function openHjalptexter(urlstr) {
	var w = window.open(urlstr, 'Hjalptexter', 'channelmode=no, directories=yes, fullscreen=no, height=760, left=200, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=530', false);
	w.focus();
}
function openGasaterf(urlstr) {
	var w = window.open(urlstr, 'Gasaterf', 'channelmode=no, directories=yes, fullscreen=no, height=550, left=900, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=950', false);
	w.focus();
}
function openExtWindow(urlstr) {
	var w = window.open(urlstr, '', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=300, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=770', false);
	w.focus();
}
function openExtSelfWindow(urlstr) {
	var w = window.open(urlstr, '_blank', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=300, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=770', false);
	w.focus();
}
function openExtWindowLarge(urlstr) {
	var w = window.open(urlstr, '', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=870', false);
	w.focus();
}
function openMatare(urlstr) {
	var w = window.open(urlstr, 'Matare', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=300, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=670', false);
	w.focus();
}
function openMiljorapport(urlstr) {
	var w = window.open(urlstr, 'Miljorapport', 'channelmode=no, directories=yes, fullscreen=no, height=950, left=400, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=900', false);
	w.focus();
}
function openMtNota(urlstr) {
	var w = window.open(urlstr, 'MtNota', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=850', false);
	w.focus();
}
function openUnderlag(urlstr) {
	var w = window.open(urlstr, 'Underlag', 'channelmode=no, directories=yes, fullscreen=no, height=750, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=1100', false);
	w.focus();
}
function openRevUnderlag(urlstr) {
	var w = window.open(urlstr, 'Underlag', 'channelmode=no, directories=yes, fullscreen=no, height=760, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=800', false);
	w.focus();
}
function openStationsbild(urlstr) {
	var w = window.open(urlstr, 'attW', 'channelmode=no, directories=yes, fullscreen=no, height=860, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=900', false);
	w.focus();
}
function openStnLedbelysning(urlstr) {
	var w = window.open(urlstr, 'StnLed', 'channelmode=no, directories=yes, fullscreen=no, height=1000, left=1200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=620', false);
	w.focus();
}
function openTerminaler(urlstr) {
	var w = window.open(urlstr, 'Terminaler', 'channelmode=no, directories=yes, fullscreen=no, height=600, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=720', false);
	w.focus();
}
function openTillsynHistorik(urlstr) {
	var w = window.open(urlstr, 'TillsynHistorik', 'channelmode=no, directories=yes, fullscreen=no, height=500, left=200, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=850', false);
	w.focus();
}
//Visar Karta i eget f\u00F6nster
function openKarta(urlstr) {
	var w = window.open(urlstr, 'Karta', 'channelmode=no, directories=yes, fullscreen=no, height=760, left=200, location=no, menubar=yes, resizable=yes, scrollbars=no, status=no, titlebar=yes, toolbar=no, top=25, width=785', false);
	w.focus();
}
function MenuPhotoAlbum(urlStr) {
//doMenuPhotoAlbum();
	var w = window.open(urlStr,'Fotoalbum','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1000,height=600');
	w.focus();
}
function doMenuPhotoAlbum() {
	ob=document.forms[0].menuPhotoAlbum;
	//alert(ob[ob.selectedIndex].text);
	if (!ob[ob.selectedIndex].value == '') {
		if (ob[ob.selectedIndex].text == 'Fotoalbum') {
			window.open(ob.options[ob.selectedIndex].value,'Fotoalbum','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1000,height=600');
		} else if (ob[ob.selectedIndex].text == 'L\u00E4gg in foto') {
			window.open(ob.options[ob.selectedIndex].value,'L\u00E4gg_in_foto','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=660,height=530');      
		} else  if (ob[ob.selectedIndex].text == 'Fotoarkiv') {
			window.open(ob.options[ob.selectedIndex].value,'Foto_arkiv','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1000,height=600');      
		}
	}
}

function geolocLogin(success, fail){
	//alert("start geoloc");
	var usewpid = "false";
	var is_echo = false;
	if(navigator && navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(pos) {
				if (is_echo){ return; }
				is_echo = true;
				//success(pos.coords.latitude,pos.coords.longitude);
				StatGPSLat=pos.coords.latitude;
				StatGPSLong=pos.coords.longitude;
				//alert("username"+username);
				if (username=="Anonymous"){
					return false;
				}
				getGPStation();
				//calcGPS();
			}, 
			function() {
				if (is_echo){ return; }
				is_echo = true;
				fail();
			}
		);
	} else {
    	fail();
	}
}
function geoloc(success, fail){
	//alert("start geoloc");
	var usewpid = "false";
	var is_echo = false;
	//alert("1");
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(pos) {
				if (is_echo){ return; }
				is_echo = true;
				//alert("2");
				//alert(position.coords.latitude);
				success(pos.coords.latitude,pos.coords.longitude);
				StatGPSLat=pos.coords.latitude;
				StatGPSLong=pos.coords.longitude;
				document.getElementById("StatGPSLat").value=position.coords.latitude;
				document.getElementById("StatGPSLong").value=position.coords.longitude;
				//alert("username"+username);
				if (username=="Anonymous"){
					return false;
				}
				getGPStation();
				//calcGPS();
			}, 
			function() {
				if (is_echo){ return; }
				is_echo = true;
				fail();
			}
		);
	} else {
		fail();
	}
}
/** geoloc(success, fail); */
function success(lat, lng){
	alert(lat + " , " + lng);
}
function fail(){
	alert("failed");
}

function getGPS() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showGPS, gpsError, {timeout:10000});
	} else {
		//gpsText.innerText = "No GPS Functionality.";
		// no action
	}
}
function gpsError(error) {
	 //alert("GPS Error: "+error.code+", "+error.message);
	 alert("GPS Fel: Problem med GPS Positioneringen.\nKontrollera dina inst\u00E4llningar!");
}
function showGPS(position) {
	//gpsText.innerText = "Latitude: "+position.coords.latitude+"\nLongitude: "+position.coords.longitude;
	//StatGPSLat
	var StatGPSLat=position.coords.latitude;
	var StatGPSLong=position.coords.longitude;
	//alert("StatGPSLat="+StatGPSLat);
	//alert("StatGPSLong="+StatGPSLong);
	document.getElementById("StatGPSLat").value=position.coords.latitude;
	document.getElementById("StatGPSLong").value=position.coords.longitude;
	calcGPS();
	// alternate
	// gpsText.innerHTML = "<a href='http://maps.google.com/maps?q="+position.coords.latitude+","+position.coords.longitude+"+(Your+Location)&iwloc=A&z=17'>"+position.coords.latitude+","+position.coords.longitude+"</a>";
}
function calcGPS(GPSLat,GPSLong){
	var tmpLat = document.getElementById("StatGPSLat").value;
	var tmpLat2 = replacesubstring(document.getElementById("GPSLat").value,",",".");
	var tmpLong = document.getElementById("StatGPSLong").value;
	var tmpLong2 = replacesubstring(document.getElementById("GPSLong").value,",",".");
	//alert("tmpLat2="+tmpLat2);		
	if (tmpLat==''||tmpLat2==''||tmpLong==''||tmpLong2==''){
		avstand==''
		return '';
	} else {
		//alert("test1");
		var R = 6371; // km
		var dLat = toRad(tmpLat2-tmpLat);
		//alert("dLat="+dLat);
		var dLon = toRad(tmpLong2-tmpLong);
		//alert("dLon="+dLon);
		var lat1 = toRad(tmpLat);
		var lat2 = toRad(tmpLat2);
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		//alert("a="+a);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		//alert("c="+c);
		var avstand = R * c;
		//alert("Avst\u00E5nd="+avstand);
		if (avstand=="undefined") {
			//alert("inget")
				} else {
			//alert("Avst\u00E5nd2="+dist);
			//alert("toTheRight="+toTheRight);
			//anlaggnr[anlaggnr.length] = toTheRight;
			//distance[distance.length] = dist+toTheRight;
			}
		var avstStation;
		document.getElementById("AvstandStation").value=Left(avstand,6);
		return(avstand);
	}
}
function toRad(Value) {
    /** Converts numeric degrees to radians */
	return Value * Math.PI / 180;
}

function getGPStation(){  
	//alert("start getGPStation");
	var maxResults = 10000;
	var viewName = "LookupAnlGPS";
	//var viewName = "InloggningAnlaggning"; DBCOLUMN
	var columnNumber = 0; // DBCOLUMN =1
	//alert("username="+username);
	var key = leftBackString(username,"/");
	var tmpnewvalue = "";
	var tmpoldvalue = "";
	//var xmlDoc = dbGetViewXmlDocument(dbURLg, viewName, "Count=" + maxResults); DBCOLUMN
	var xmlDoc = dbGetViewXmlDocument(dbURLg, viewName, "RestrictToCategory=" + key + "&Count=" + maxResults); //DBLOOKUP
	var viewEntries = xmlDoc.getElementsByTagName("viewentry");
	var values = new Array();
	var distance= new Array();
	var anlaggnr=new Array();

	if (viewEntries.length == 0) {
		values[values.length] = "ERROR: No Choices Found!";
	} else {
		for(var row=0; row < viewEntries.length; row++){
			var value = getXMLNodeInnerText(viewEntries[row].getElementsByTagName("entrydata")[columnNumber]);
			tmpnewvalue = value;
			if(tmpnewvalue==tmpoldvalue){
			//do nothing
				tmpoldvalue = value;
			}else{
				values[values.length] = value;
				tmpoldvalue = value;
			}
			//alert("value="+value);
			var toTheLeft = value.substring(0, value.indexOf("_\u00A42_"));
			var toTheRight = value.substring(value.indexOf("_\u00A42_")+"_\u00A42_".length, value.length);
			var GPSLat = leftBackString(value, "_\u00A41_");
			var GPSLong=rightBackString(toTheLeft, "_");
			var tmpLat2 = replacesubstring(StatGPSLat,",",".");
			var tmpLat = replacesubstring(GPSLat,",",".");
			var tmpLong2 = replacesubstring(StatGPSLong,",",".");
			var tmpLong = replacesubstring(GPSLong,",",".");
			if (tmpLat=='' || tmpLat2==''|| tmpLong=='' || tmpLong2==''){
				avstand==''
				return '';
			} else {
				var R = 6371; // km
				var dLat = toRad(tmpLat2-tmpLat);
				var dLon = toRad(tmpLong2-tmpLong);
				var lat1 = toRad(tmpLat);
				var lat2 = toRad(tmpLat2);
				var a = Math.sin(dLat/2) * Math.sin(dLat/2) +Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				var avstand = R * c;
			}
			if (avstand=="undefined") {
				//alert("inget")
			} else {
				anlaggnr[anlaggnr.length] = toTheRight;
				distance[distance.length] = avstand+toTheRight;
			}
		}
	}
	if  (distance[0]=="" || Left(distance[0],9)=="undefined" ){
		// do nothing
	} else {
		sort_unique(distance) 
		sort_unique(anlaggnr)
		//alert(usewpid);
		if (usewpid=="True"){
			navigator.geolocation.clearWatch(wpid);
			wpid=false;
		}
		if (distance[0] > 0.2){
			//alert("l\u00E4ngre \u00E4n 500 m");
			window.document.getElementById("statnr").value='';
		} else {
			//alert("mindre \u00E4n 500 m");
			var opStation=document.getElementById('open-station');
			opStation.style.visibility='visible';
			var urlstr = dbURLg+"/AnlHelaLandetWebRedigera/"+Right(distance[0],5)+"?editDocument";
			window.document.getElementById("statnr").value=Right(distance[0],5);
		}
	}
	distance[0]='';
	dist='';
}
	
function init_geo(){
	var wpid=false, map, z, op, prev_lat, prev_long, min_speed=0, max_speed=0, min_altitude=0, max_altitude=0, distance_travelled=0, min_accuracy=150, date_pos_updated="", info_string="";
	//var usewpid="True";
	if (wpid) {// If we already have a wpid which is the ID returned by navigator.geolocation.watchPosition()
		navigator.geolocation.clearWatch(wpid);
		wpid=false;
	} else {// Else...We should only ever get here right at the start of the process
		get_pos();
	}
}
				
function get_pos() {
//alert("start get_pos");
	/** Set up a watchPosition to constantly monitor the geo location provided by the browser - NOTE: !! forces a boolean response
	 *  We  use watchPosition rather than getPosition since it more easily allows (on IPhone at least) the browser/device to refine the geo location rather than simply taking the first available position
	 *  Full spec for navigator.geolocation can be foud here: http://dev.w3.org/geo/api/spec-source.html#geolocation_interface
	 */
	// First, check that the Browser is capable
	if(!!navigator.geolocation) {
		wpid=navigator.geolocation.watchPosition(geo_success, geo_error, {enableHighAccuracy:true, maximumAge:30000, timeout:27000});
	} //else {
		//op.innerHTML="ERROR: Your Browser doesnt support the Geo Location API";
		//alert("ERROR: Your Browser doesnt support the Geo Location API");
	//}
}


function geo_success(position){
	/** This is the function which is called each time the Geo location position is updated */
	if (position.coords.latitude=='' || position.coords.longitude=='' ){
		//no action, can not find geo position
		alert("Kan inte hitta GPS koordinater");
	} else {
		document.getElementById("StatGPSLat").value=position.coords.latitude;
		document.getElementById("StatGPSLong").value=position.coords.longitude;
		calcGPS();
				
	}
	if(position.coords.accuracy<=min_accuracy) {
		// We don't want to action anything if our position hasn't changed - we need this because on IPhone Safari at least, we get repeated readings of the same location with 
		// different accuracy which seems to count as a different reading - maybe it's just a very slightly different reading or maybe altitude, accuracy etc has changed
		if(prev_lat!=position.coords.latitude || prev_long!=position.coords.longitude) {
			if(position.coords.speed>max_speed)
				max_speed=position.coords.speed;
			else if(position.coords.speed<min_speed)
				min_speed=position.coords.speed;
				
			if(position.coords.altitude>max_altitude)
				max_altitude=position.coords.altitude;
			else if(position.coords.altitude<min_altitude)
				min_altitude=position.coords.altitude;
			
			prev_lat=position.coords.latitude;
			prev_long=position.coords.longitude;
			document.getElementById("StatGPSLat").value=prev_lat
			document.getElementById("StatGPSLong").value=prev_long
			if (position.coords.latitude=='' || position.coords.longitude=='' ){
				//no action, can not find geo position
				alert("Kan inte hitta GPS koordinater");
			} else {
				calcGPS();
			}
		}
		info_string="Current positon: lat="+position.coords.latitude+", long="+position.coords.longitude+" (accuracy "+Math.round(position.coords.accuracy, 1)+"m)<br />Speed: min="+(min_speed?min_speed:"Not recorded/0")+"m/s, max="+(max_speed?max_speed:"Not recorded/0")+"m/s<br />Altitude: min="+(min_altitude?min_altitude:"Not recorded/0")+"m, max="+(max_altitude?max_altitude:"Not recorded/0")+"m (accuracy "+Math.round(position.coords.altitudeAccuracy,1)+"m)<br />last reading taken at: "+current_datetime;
		//alert("info_string="+info_string);
	} else {
		info_string="Accuracy not sufficient ("+Math.round(position.coords.accuracy, 1)+"m vs "+min_accuracy+"m) - last reading taken at: "+current_datetime;
		//alert("info_string="+info_string);
	}
	//op.innerHTML=info_string;
}

function geo_error(error) {
	/** This function is called each time navigator.geolocation.watchPosition() generates an error (i.e. cannot get a Geo location reading) */
	//alert("start geo_error");
	switch(error.code) {
		case error.TIMEOUT:
			alert("Problem med GPS Positioneringen.\nKontrollera dina inst\u00E4llningar!");
		break;
	}
}