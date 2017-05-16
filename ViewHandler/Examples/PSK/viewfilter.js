var oldOnClick = null;

function openAnlaggning(urlstr) {
	window.open(urlstr, 'Anlaggning', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=900', false);
}
function openCistern(urlstr) {
	window.open(urlstr, 'Matare', 'channelmode=no, directories=yes, fullscreen=no, height=600, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=700', false);
}
function openHanteringsts(urlstr) {
	window.open(urlstr, 'Hanteringsts', 'channelmode=no, directories=yes, fullscreen=no, height=600, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=670', false);
}
function openMatare(urlstr) {
	window.open(urlstr, 'Matare', 'channelmode=no, directories=yes, fullscreen=no, height=800, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=720', false);
}
function openMiljorapport(urlstr) {
	window.open(urlstr, 'Miljorapport', 'channelmode=no, directories=yes, fullscreen=no, height=900, left=400, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=870', false);
}
function openRevUnderlag(urlstr) {
	window.open(urlstr, 'attW', 'channelmode=no, directories=yes, fullscreen=no, height=760, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=800', false);
}
function openTerminal(urlstr) {
	window.open(urlstr, 'Terminaler', 'channelmode=no, directories=yes, fullscreen=no, height=800, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=720', false);
}
function openUnderlag(urlstr) {
	window.open(urlstr, 'Underlag', 'channelmode=no, directories=yes, fullscreen=no, height=720, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=750', false);
}
function openExtWindow(urlstr) {
	window.open(urlstr, '', 'channelmode=no, directories=yes, fullscreen=no, height=960, left=200, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no, top=25, width=770', false);
}
function Close(urlStr) {
	self.close();
}
function CloseSpara(urlStr) {
	if (confirm("\u00C4r du s\u00E4ker p\u00E5 att du vill st\u00E4nga f\u00F6nstret ? OBS !! detta dokument kommer inte att sparas !")) 
		self.close();
}
function openUrl(urlstr) {
	location.href=urlstr;
}
function exportToExcel() {
	var strExportURL=document.getElementById('exporturl').value;
	if (strExportURL!='') {
		document.location.replace(strExportURL);
		alert("Notera att det f\u00F6r vissa vyer kan ta ganska l\u00E5ng tid (upp till ett par minuter) att h\u00E4mta ut denna information.");
	}
}
function fixNoDocsTag(){
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
			tagH2.innerHTML = '<br /><font size="2" face="Arial" color ="red">Inga tr\u00E4ffar med aktuellt urval. Var v\u00E4nlig \u00E4ndra urvalskriterierna.</font>';
		} 
		tagH2.style.display = "block";
	}
}
function showAnimate() {
	$('#master_view').hide();
	$('#imgWaiting').show();
}

$(document).ready( function() {
	var button = $('#Nollstall')[0];
	if (typeof(button) == "undefined")
		return;

	oldOnClick = button.onclick;
	button.click = ( function() {
		showAnimate();
		oldOnClick();
	});
	$(document).scrollTop(0);
})
