'use strict';
var TEXT_URVAL = 'Urval';
var TEXT_VOLUME = 'Volym';
var TEXT_LITRES = 'liter';

// ie: '35201100' --> '35.201.100'
function splitValue(value, separatorToAdd) {
	var reverse = function(s) {
		return s.split('').reverse().join('');
	}
	// make sure it's a string
	value = $.trim(value);
	// reverse the string (to start from the right) and make chunks of 3
	value = reverse(value).match(/.{1,3}/g);
	// reverse back each chunk
	for ( var i = 0, l = value.length; i < l; i++)
		value[i] = reverse(value[i]);
	// reverse the array
	value.reverse();
	// join the chunks and use the separator between them
	return value.join(separatorToAdd);
}

function configureView(viewConfig) {
	//console.log('CONFIGURE viewhandler ' + viewConfig.configName);
	var configName = viewConfig.configName;
	viewConfig.setDbPath(webdbname); // needed for excel print        ie: /kund/preem/preembygg.nsf

	var isLocalHost = $.trim(SERVER_DOMAIN) !== '';
	var dataUrl = webdbname + '/' + configName; // perhaps if around it
	//console.log('dataUrl: ' + dataUrl + '  isLocalHost: ' + isLocalHost);
	//ie: /kund/preem/Preembygg.nsf/EmbeddedMergedDokfilBlankett
   //viewConfig.addCss(webdbname + '/viewHandlerCustom.css');
	if (isLocalHost)
	   viewConfig.addCss('/Examples/PSK/Preem' + '/viewHandlerCustom.css');       // LOCALHOST OVERRIDE
	else
	   viewConfig.addCss(webdbname + '/viewHandlerCustom.css');

	// views with restricted category
	if (configName === 'EmbeddedBetalpelare.simple'
			|| configName === 'EmbeddedMatare.simple'
			|| configName === 'EmbeddedKortpMatare.simple'
			|| configName === 'EmbeddedFlyttadeKortpMatare.simple') {
		viewConfig.addDataStore(dataUrl, siteId);
	} else if (configName === 'EmbeddedMergedDokfilBlankett') {
		// 2 views are combined in xagents backend
		var path1 = webdbname + '/EmbeddedDokfil.simple';
		var path2 = basePathBlankettModule + 'EmbeddedBlankett.json';
		dataUrl = path1 + ',' + path2;
		viewConfig.addDataStore(dataUrl, siteId);
	} else if (configName === 'EmbeddedMergedDokfilBlankettHistorik') {
		// 2 views are combined in xagents backend
		var path1 = webdbname + '/EmbeddedDokfilHistorik.simple';
		var path2 = basePathBlankettModule + 'EmbeddedBlankettArchived.json';
		dataUrl = path1 + ',' + path2;
		viewConfig.addDataStore(dataUrl, siteId);
	}
	//console.log('addDataStore: ' + dataUrl);
	viewConfig.refreshSummary = function() {
		refreshSummary(viewConfig);
	};

	if (configName === 'Anlaggning.simple'
			|| configName === 'AnlaggningAlla.simple') {
		viewConfig.addDataStore(dataUrl);
		viewConfig.createFullDOM = true;

		viewConfig.addColumns([
		   { title : 'Ort', type : COLUMN.DROPDOWN, sort : true, altSort : true, altFilter : true, search : true }, 
			{ title : 'Gata' }, 
			{ title : 'Fastighetsbeteckning', type : COLUMN.LABEL }, 
			{ title : 'Tel nr', type : COLUMN.LABEL }, 
			{ title : 'Hanter.tillst. utg\u00E5r', type : COLUMN.DROPDOWN, altSort : true, altFilter : true }, 
			{ title : 'Inv. den', type : COLUMN.DROPDOWN, altSort : true, altFilter : true }, 
			{ title : 'Fotouppladdning' }, { title : 'Konceptkategori', type : COLUMN.DROPDOWN_MULTIPLE }, 
			{ title : 'Konceptvision', type : COLUMN.DROPDOWN_MULTIPLE }, 
			{ title : 'Ingenj\u00F6r', type : COLUMN.DROPDOWN },
			{ title : 'GPSLat', type : COLUMN.HIDDEN },
			{ title : 'GPSLong', type : COLUMN.HIDDEN }
			, { title : 'Saljchef', type : COLUMN.DROPDOWN },
		]);
		
		if (configName === 'AnlaggningAlla.simple') {
			viewConfig.addColumns([
				{ title : 'Nedlagd', type : COLUMN.DROPDOWN },
				{ title : 'BsNr', numSort : true }
			]);
		}

		viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Fotouppladdning') {
				return cfgValues.alt;
			} else if (columnInfo.getTitle() === 'Gata') {
				return cfgValues.alt;
			} else if (columnInfo.getTitle() === 'Hanter.tillst. utg\u00E5r') {
				var display = '';
				if (cfgValues.isList) {
					//console.log("isList...");
					for ( var i = 0, l = cfgValues.list.length; i < l; i++) {
						if (i > 0)
							display += ', ';
						display += cfgValues.list[i];
					}
				} else
					display = cfgValues.display;
				return display;
			}
		};
	} else if (configName === 'EmbeddedMergedDokfilBlankett'
			|| configName === 'EmbeddedMergedDokfilBlankettHistorik') {
		viewConfig.addColumns(
			{ title : 'Kategori', type : COLUMN.DROPDOWN }
		);

		viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Dokumenttyp'
					|| /*columnInfo.getTitle() === 'Auto Vue' ||*/columnInfo
							.getTitle() === 'Dokumentfil'
					|| columnInfo.getTitle() === 'Flytta') {
				return cfgValues.alt;
			}
		};
	} else if (configName === 'Driftstorningar.simple') {
		viewConfig.addDataStore(dataUrl);
		viewConfig.createFullDOM = true;

		viewConfig.addColumns([
			{ title : 'M\u00E5n', numSort : true },
			{ title : 'Datum', type : COLUMN.DROPDOWN_MULTIPLE, sort : true, sortOrder : descending, altFilter : true, altSort : true },
			{ title : 'Typ', type : COLUMN.DROPDOWN_MULTIPLE, link : true, altFilter : true }
		]);
	} else if (configName === 'UtrUrvalCisternerHL.simple'
			|| configName === 'UtrUrvalCisternerSTN.simple'
			|| configName === 'UtrUrvalCisternerREP.simple') {
		viewConfig.addDataStore(dataUrl);

		if (configName === 'UtrUrvalCisternerREP.simple') {
			viewConfig.createFullDOM = true; // TODO: hantera multirader i kolumn \u00C5tg\u00E4rder
		}
		viewConfig.addColumns([
			{ title : 'Ingenj\u00F6r', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'Distriktschef', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'CisternTyp', type : COLUMN.DROPDOWN },
			{ title : 'F\u00F6rl\u00E4ggning', type : COLUMN.DROPDOWN },
			{ title : 'Anl nr', type : COLUMN.DROPDOWN },
			{ title : 'Ort', type : COLUMN.LABEL, sort : true, altSort : true },
			{ title : 'Volym', type : COLUMN.DROPDOWN, numSort : true },
			{ title : 'Produkt', type : COLUMN.DROPDOWN_MULTIPLE },
			{ title : 'Bes datum', type : COLUMN.DROPDOWN, altFilter : true, altSort : true },
			{ title : 'GPSLat', type : COLUMN.HIDDEN },
			{ title : 'GPSLong', type : COLUMN.HIDDEN }
			]);
		viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Nr'
					|| columnInfo.getTitle() === 'Stationsdokument') {
				return cfgValues.alt;
			}
		};
	} else if (configName === 'UtrUrvalCisternerHL.simple') {
		viewConfig.addColumns(
			{ title : 'Diameter', type : COLUMN.DROPDOWN, numSort : true }
		);
	} else if (configName === 'EmbeddedBetalpelare.simple') {
		viewConfig.addColumns([
			{ title : 'Terminaltyp', link : true },
			{ title : 'Antal', numSort : true, totals : true }
		//	{ title: 'Leverant\u00F6r', type: COLUMN.DROPDOWN }
		]);
	} else if (configName === 'EmbeddedMatare.simple') {
		viewConfig.addColumns([
			{ title : 'M\u00E4tartyp', link : true }, 
			{ title : 'Antal', numSort : true, totals : true }
		//	{ title: 'Leverant\u00F6r', type: COLUMN.DROPDOWN }
		]);
	} else if (configName === 'EmbeddedKortpMatare.simple') {
		viewConfig.addColumns([
			{ title : 'Internnr', link : true },
			{ title : 'Classes', type : COLUMN.CLASSES }
		]);
	} else if (configName === 'EmbeddedFlyttadeKortpMatare.simple') {
		viewConfig.addColumns([
			{ title : 'Internnr', link : true },
			{ title : 'Classes', type : COLUMN.CLASSES }
		]);
	} else if (configName === 'SkotselmanEfterregistrerade.simple') {
		viewConfig.addDataStore(dataUrl);

		viewConfig.addColumns([
			{ title : 'Anl nr', type : COLUMN.DROPDOWN },
			{ title : '\u00C4rendenr', numSort : true, link : true },
			{ title : '\u00C4rendetyp', type : COLUMN.DROPDOWN },
			{ title : 'F\u00E4rdig den', type : COLUMN.DROPDOWN_MULTIPLE, sort : true, sortOrder : descending, altFilter : true, altSort : true },
			{ title : 'Sk\u00F6tself\u00F6retag', type : COLUMN.DROPDOWN },
			{ title : 'Sk\u00F6tselman', type : COLUMN.DROPDOWN },
			{ title : 'Distriktschef', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'Status Efterreg', type : COLUMN.DROPDOWN },
			{ title : 'Efterregistrerad', type : COLUMN.DROPDOWN_MULTIPLE, sort : true, sortOrder : descending, altFilter : true, altSort : true }
			]);
		viewConfig.addFilter('_Status', 'Obehandlad');
	}

	else if (configName === 'SkotselUnderlag.simple' || configName === 'SkotselUnderlagISS.simple') {		
		
		// Sk\u00F6tselunderlag - Aktuella			category=		retrieve all of the view entries
		// Sk\u00F6tselunderlag - ISS Aktuella	category=ISS
		viewConfig.addDataStore(dataUrl, category);

		viewConfig.createFullDOM = true;
		viewConfig.addColumns([
			//{ title : 'Period', type : COLUMN.DROPDOWN_MULTIPLE, /*sortOrder: descending,*/ altSort : true, altFilter : true },
			{ title : 'Klassificering', type : COLUMN.DROPDOWN },
			{ title : 'Sk\u00F6tself\u00F6retag', type : COLUMN.DROPDOWN },
			{ title : 'Sk\u00F6tselman', type : COLUMN.DROPDOWN_MULTIPLE },
			{ title : 'Pumpar', numSort : true },
			{ title : 'Terminaler', numSort : true },
			{ title : 'Gr\u00E4sklippning', numSort : true },
			{ title : 'Saknad daglig tillsyn', numSort : true },
			{ title : 'Saknad veckotillsyn', numSort : true },
			{ title : 'Saknad m\u00E5nadstillsyn', numSort : true },
			//{ title: 'Efterregistrerad', sort: true },		// TEMP
			{ title : 'Godk\u00E4nnande', type : COLUMN.DROPDOWN, altFilter: true },
			// BsData fields
			{ title : 'Bsnr', sort : true, numSort : true }, 
			{ title : 'Typ', type : COLUMN.DROPDOWN }, 
			{ title : 'Agande', type : COLUMN.DROPDOWN },
			{ title : 'Drift', type : COLUMN.DROPDOWN },
			{ title : 'Koncept', type : COLUMN.DROPDOWN },
			{ title : 'KonceptVision', type : COLUMN.DROPDOWN },
			{ title : 'Distriktschef', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'Lan', type : COLUMN.DROPDOWN },
			{ title : 'Ing', type : COLUMN.DROPDOWN },
			{ title : 'ProjIng', type : COLUMN.DROPDOWN },
			{ title : 'Drivmedel', type : COLUMN.DROPDOWN },
			{ title : 'Kassasystem', type : COLUMN.DROPDOWN },
			{ title : 'Publik', type : COLUMN.DROPDOWN },
			{ title : 'StationsSort', type : COLUMN.DROPDOWN },
			{ title : 'Leverantor', type : COLUMN.DROPDOWN },
			{ title : 'ServiceUppdaterad', type : COLUMN.DROPDOWN },
			{ title : 'RCID', type : COLUMN.DROPDOWN },
			{ title : 'Depot', type : COLUMN.DROPDOWN, altFilter : true	},
			{ title : 'Medlem', type : COLUMN.DROPDOWN },
			{ title : 'Framtagare', type : COLUMN.DROPDOWN },
			{ title : 'Uperson', type : COLUMN.DROPDOWN },
			{ title : 'Nedlagd', type : COLUMN.DROPDOWN },
			// grouped dates:
			{ title : 'NedlagdDatum', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'ExportDate', type : COLUMN.DROPDOWN,	altFilter : true }, 
			{ title : 'gdatum', type : COLUMN.DROPDOWN, altFilter : true }, 
			{ title : 'Startad', type : COLUMN.DROPDOWN, altFilter : true }, 
			{ title : 'Idatum', type : COLUMN.DROPDOWN, altFilter : true }, 
			{ title : 'Datum', type : COLUMN.DROPDOWN, altFilter : true }, 
			{ title : 'Udatum', type : COLUMN.DROPDOWN, altFilter : true },
			{ title : 'Butiksyta', numSort : true }, 
			{ title : 'GDSAntal', numSort : true }, 
			{ title : 'GDSYta', numSort : true }, 
			{ title : 'Totalyta', numSort : true }, 
			{ title : 'Lagyta', numSort : true }, 
			{ title : 'Tvhyta', numSort : true },
			{ title : 'Forsakkr', numSort : true }, 
			{ title : 'RankTradeArea', numSort : true }
			]);
		viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Underlag') {
				return cfgValues.alt;
			} else if (columnInfo.getTitle() === 'Efterregistrerad') {
				//console.log('Efterregistrerad#: ' + cfgValues.list.length);
				var displayList = '';
				if (cfgValues.isList) {
					displayList = '';
					for ( var index in cfgValues.list) {
						var entryValue = cfgValues.list[index];
						displayList += entryValue + '<br>';
					}
				} else {
					// if it's not a list, use the display value directly (can be empty or a single entry)
					displayList = $.trim(cfgValues.display);
				}
				return displayList;
			} else if (columnInfo.getTitle() === 'Anl nr') {
				return cfgValues.alt;
			} else if (columnInfo.getTitle() === 'Godk\u00E4nnande') {
				return cfgValues.alt;
			}
			
		};
	} else if (configName === 'SkotselInfo.simple') {
		viewConfig.addDataStore(webdbname + '/' + configName); // the visible view first
		//viewConfig.addDataStore(namesDb + '/People.simple', null, 'names');	// istf f\u00F6r Sk\u00F6tselpersonal fr\u00E5n addressboken s\u00E5 visas nu F\u00F6rest\u00E5ndare
		viewConfig.createFullDOM = true;
		
		viewConfig.addColumns([
			{ title : 'Distriktschef', type : COLUMN.DROPDOWN, sort : true, search : true, altFilter : true }, // filter on lowercase
			{ title : 'Ort', type : COLUMN.DROPDOWN, altSort : true, altFilter : true, search : true },
			{ title : 'Gata' },
			{ title : 'Sk\u00F6tself\u00F6retag', type : COLUMN.DROPDOWN }
		]);

		viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Anl nr') {
				return cfgValues.alt;
			}
			/*else if (columnInfo.getTitle() === 'Gata') {
				return cfgValues.alt;
			}*/
		};
		viewConfig.convertFilterOptionText = function (dropFilter, filterValue, filterText, selected) {
			var columnInfo = dropFilter.getColumnInfo();
			if (columnInfo.getTitle() === 'Distriktschef') {
			   if (filterValue === '\u00F6\u00F6\u00F6') {
					return ' ';
				}
			}
		};

		/*viewConfig.convertDisplayValue = function(columnInfo, cfgValues) {
			if (columnInfo.getTitle() === 'Sk\u00F6tselpersonal' || columnInfo.getTitle() === 'Tel nr') {
				var value = $.trim(cfgValues.display); // make sure it's a string
				var arr = value.split('__');
				var output = '';
				for ( var i = 0, l = arr.length; i < l; i++) {
					if (i > 0)
						output += '<br>'; // each person gets its own row
					output += arr[i];
				}
				return output;
			}
		}*/
		/*viewConfig.preprocessData = function() { // executed later than createFilterPanel (where columnInfos are filled in)
			var anlList = ViewHandler.query('SELECT FROM data');
			var personList = ViewHandler.query('SELECT FROM names');

			var findPerson = function(name) {
				for ( var i = 0, l = personList.length; i < l; i++) {
					if (personList[i]['$32'] === name) {
						//console.log('findPerson: ' + name + '  found at pos ' + i);
						return combineWords(personList[i]['CellPhoneNumber'], personList[i]['OfficePhoneNumber']); // 'MailAddress'
					}
				}
				//console.log('findPerson: ' + name + '   not found');
				return '';
			};

			for ( var i = 0, l = anlList.length; i < l; i++) {
				if (anlList[i]['_skotselpersonal'] !== '') {
					var skotselPersonal = anlList[i]['_skotselpersonal'];
					//console.log(i + ': ' + skotselPersonal);
					var persons = skotselPersonal.split('__');
					var telNr = '';
					for ( var j = 0, m = persons.length; j < m; j++) {
						//console.log(j + ' ' + persons[j]);
						if (j > 0)
							telNr += '__';
						telNr += findPerson(persons[j]);
					}
					anlList[i]['_telnr'] = telNr;
				}
			}
			return '';
		}*/
	} else if (configName === 'AllaTillsyner.config') {
	   var dataUrlTillsynerArkiv = inspectionDb + '/DagligTillsynTEST.simple';
	   var dataUrlTillsynerPreem = webdbname + '/AllaTillsynerTEST.simple';
		viewConfig.addDataStore(dataUrlTillsynerArkiv, null);	// much more documents in archive-db, so add those to the default table
		viewConfig.addDataStore(dataUrlTillsynerPreem, null, 'additional');

		viewConfig.addColumns([
         { title: 'Typ', type: COLUMN.DROPDOWN, search: true },
         { title: '\u00C5r', type: COLUMN.DROPDOWN, search: true },
			{ title: 'M\u00E5nad', type: COLUMN.DROPDOWN, altSort: true, altFilter: true, search: true },
         { title: 'Reg.datum', type: COLUMN.DROPDOWN, altSort: true, altFilter: true, sort: true, sortOrder: descending, search: true }
		]);
		
		viewConfig.preprocessData = function () {   // executed later than createFilterPanel (where columnInfos are filled in)
         // add the additional store to the main store
         //console.info('data# before: ', ViewHandler.query('SELECT COUNT(*) FROM data', viewConfig.containerId)[0]['COUNT(*)']);
         var additionalList = ViewHandler.query('SELECT FROM additional', viewConfig.containerId);
         // seems like stringify is a requirement when sending object to another frame
         ViewHandler.queryParam1('SELECT * INTO data FROM ?', JSON.stringify(additionalList), viewConfig.containerId);
         //console.info('data# after:  ', ViewHandler.query('SELECT COUNT(*) FROM data', viewConfig.containerId)[0]['COUNT(*)']);
         return '';
      }
	}
}

// if both words are filled in, returns a comma-separated string with them
function combineWords(word1, word2) {
	word1 = $.trim(word1);
	word2 = $.trim(word2);
	if (word1 !== '' && word2 !== '')
		return word1 + ', ' + word2;
	return $.trim(word1 + ' ' + word2);
}

// overrides viewHandler default function
function refreshSummary(viewConfig) {
	var configName = viewConfig.configName;
	console.log('refreshSummary: ' + configName);

	if (configName === 'UtrUrvalCisternerHL.simple'
			|| configName === 'UtrUrvalCisternerSTN.simple'
			|| configName === 'UtrUrvalCisternerREP.simple') {

		var volume = 0;
		var sql = 'SELECT FROM ' + viewConfig.dataStores[0].alias;
		if (viewConfig.where !== '')
			sql += ' WHERE ' + viewConfig.where;
		var queryResult = ViewHandler.query(sql);
		console.log('sql: ' + sql + '   #: ' + queryResult.length);

		for ( var i = 0; i < queryResult.length; i++) {
		   var antal = queryResult[i]['Volym'];
		   

			if (antal !== undefined) {
				var value = parseFloat(antal);
				if (!isNaN(value))
					volume += value;
			}
		}
		$('#qtyVisibleInfo').html(
				TEXT_URVAL + ':&nbsp;' + splitValue(viewConfig.qtyVisible, '.')
						+ '&nbsp;st&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + TEXT_VOLUME
						+ ': ' + splitValue(volume, '.') + ' ' + TEXT_LITRES);
	} else {
		$('#qtyVisibleInfo').html(
				TEXT_URVAL + ':&nbsp;' + viewConfig.qtyVisible + '&nbsp;st');
	}
	//console.log(viewConfig.where);
}

