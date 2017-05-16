'use strict';
var PREFIX_SORT = 'sort_';
var DEBUG_SHOW_WHERE_CLAUSE = false;
var TEXT_URVAL = 'Urval';
var TEXT_PIECES = 'st';

// the benefit och configuring inside a function instead of doing the settings of each view declaratively
// is that it simplifies code sharing between configurations.
function configureView(viewConfig) {
   //console.log('CONFIGURE viewhandler ' + viewConfig.configName);
   var configName = viewConfig.configName;
   var isLocalHost = $.trim(SERVER_DOMAIN) !== '';
   
   var cssPath = '';
   if (isLocalHost)
      cssPath = '/Examples/PSK/Statoil/';
   else
      cssPath = webdbname;
   viewConfig.setDbPath(webdbname); // needed for excel print        ie: /kund/statoil/stbygg.nsf

   // some shared code
   if (configName === 'UtrUrvalMatareOMR.simple' ||
     configName === 'UtrUrvalMatareLAG.simple' ||
     configName === 'UtrUrvalMatareGDAT.simple' ||
     configName === 'UtrUrvalMatareLEV.simple' ||
     configName === 'UtrUrvalMatareNR.simple' ||
     configName === 'UtrUrvalMatareSTN.simple') {

      viewConfig.addCss(cssPath + '/viewHandlerCustom.css');
      //viewConfig.refreshSummary = function () { refreshSummaryMatare(viewConfig); }; // funkar inte. anropas fr\u00E5n UrvalMatare d\u00E4r viewConfig inte finns att skicka in (om vi inte skapar en ny global variabel och d\u00E5 f\u00F6rsvinner po\u00E4ngen med \u00E4ndringen)
      viewConfig.refreshSummary = refreshSummaryMatare;
   }

   if (configName === 'UtrUrvalMatareOMR.simple') {
      viewConfig.addColumns([
          { title: 'Projektledare', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'SMM', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Anl nr', sort: true },
          { title: 'Stationstyp', type: COLUMN.DROPDOWN },
          { title: 'Lev datum', type: COLUMN.DROPDOWN_MULTIPLE, altFilter: true },
          { title: 'M\u00E4tartyp', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Produkt', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Betalform', type: COLUMN.DROPDOWN, width: 120 },
          { title: 'Nr', numSort: true },             // totals
          { title: 'Inst dat', type: COLUMN.DROPDOWN_MULTIPLE, altFilter: true },
          { title: 'Antal', totals: true }               // totals
      ]);
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);

      viewConfig.handleFilterOptions = function (dropFilter) {
         handleFilterOptions(dropFilter);
      };
      //viewConfig.addFilter('Stationstyp', 'Automat');
      //viewConfig.addFilter('Ingenjor', 'Anette Ejresund');  // SMM
      //viewConfig.addFilter('Ingenjor', ['Peter Andersson', 'Christian Pettersson']);  // SMM
      //viewConfig.addFilter('InvBetalform', 'KA-KO');
      //viewConfig.addFilter('ColumnField1', 'MrPerson1');
      //viewConfig.addFilter('ColumnField2', ['Programmer', 'Developer']);
      //viewConfig.addFilter('ColumnField3', 'Male');
      //viewConfig.replaceFilter('ColumnField3', 'Female');
      //viewConfig.removeFilter('ColumnField3');
      //viewConfig.replaceFilter('ColumnField2', 'LB');
   }
   else if (configName === 'UtrUrvalMatareLAG.simple') {

      viewConfig.createFullDOM = true;		// keep until multirow cells are handled
      viewConfig.addColumns([
          { title: 'AnlNr', type: COLUMN.HIDDEN },
          { title: 'SortColumn', type: COLUMN.HIDDEN },
          { title: 'Koppling', type: COLUMN.DROPDOWN_MULTIPLE, sort: true, altSort: true, altFilter: true },
          { title: 'Typ', type: COLUMN.DROPDOWN_MULTIPLE, altSort: true, altFilter: true },
          { title: 'Betalform', type: COLUMN.DROPDOWN },
          { title: 'Produkt', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Classes', type: COLUMN.CLASSES },
          { title: 'AnlNrHidden', type: COLUMN.HIDDEN },
          { title: 'DocId', type: COLUMN.HIDDEN },
          { title: 'Ant. m\u00E4t.', totals: true },
          { title: 'Ant. term.', totals: true }
      ]);
      var dataUrl = webdbname + '/' + configName;
      //console.log('LAGER addDataStore: ' + lager);
      viewConfig.addDataStore(dataUrl, lager);    // send in category also when all categories are selected

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'Koppling') {
            return cfgValues.alt;
         }
         else if (columnInfo.getTitle() === 'Anm\u00E4rkningar') {
            //console.log('Anm\u00E4rkningar#: ' + cfgValues.list.length);
            var displayList = '';
            if (cfgValues.isList) {
               displayList = '';
               for (var index in cfgValues.list) {
                  var entryValue = cfgValues.list[index];
                  displayList += entryValue + '<br>';
               }
            }
            else {
               // if it's not a list, use the display value directly (can be empty or a single entry)
               displayList = $.trim(cfgValues.display);
            }
            return displayList;
         }
         else if (columnInfo.getTitle() === 'Utrustning') {
            return cfgValues.alt;
         }
      };

      viewConfig.convertSortValue = function (columnInfo, value) {
         if (columnInfo.getTitle() === 'Ant. m\u00E4t.' || columnInfo.getTitle() === 'Ant. term.') {
            if ($.trim(value) === '') {
               value = '0';
            }
         }
         return value;  // TODO: flytta in i mitten?
      };

      viewConfig.convertFilterOptionText = function (dropFilter, filterValue, filterText, selected) {
         var columnInfo = dropFilter.getColumnInfo();
         var overrideText = filterValue;
         //console.log("..filterValue: " + filterValue + "  filterText: " + filterText);
         if (columnInfo.getTitle() === 'Typ') {
            var prefix = overrideText.substr(0, 2);
            if (prefix === 'aa') {
               overrideText = 'Terminal: ' + overrideText.substr(2);
               return overrideText;
            }
            else if (prefix === 'bb') {
               overrideText = 'M\u00E4tare: ' + overrideText.substr(2);
               return overrideText;
            }
         }
      };

      viewConfig.overrideActiveFilterValue = function (dropFilter, value) {
         //console.log("overrideActiveFilterValue  ..value: " + value + "  dropFilter: " + dropFilter);
         if (value === null)
            return value;
         var columnInfo = dropFilter.getColumnInfo();
         var text = value;

         //console.log("..value: " + value + "  text: " + text);
         if (columnInfo.getTitle() === 'Typ') {
            var prefix = text.substr(0, 2);
            if (prefix === 'aa')
               return text.substr(2);
            else if (prefix === 'bb')
               return text.substr(2);
         }
         return value;
      };

      viewConfig.refreshBackgroundRows = function () {
         return refreshBackgroundRowsLAG();
      };

      //viewConfig.addFilter('InvBetalform', 'KA-KO');
      //viewConfig.addFilter('InvProdukt', 'D-D');
   }
   else if (configName === 'UtrUrvalMatareGDAT.simple') {
      viewConfig.addColumns([
          { title: 'Projektledare', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'SMM', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Anl nr', sort: true },
          { title: 'Typ', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Produkt', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Betalform', type: COLUMN.DROPDOWN },
          { title: 'Garantitid', type: COLUMN.DROPDOWN, altFilter: true },
          { title: 'Nr', numSort: true },
          { title: 'Antal', totals: true }
      ]);
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);
   }
   else if (configName === 'UtrUrvalMatareLEV.simple') {
      viewConfig.addColumns([
          { title: 'Leverant\u00F6r', type: COLUMN.HIDDEN },
          { title: 'Projektledare', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'SMM', type: COLUMN.DROPDOWN_MULTIPLE, sort: true },
          { title: 'Stationstyp', type: COLUMN.DROPDOWN },
          { title: 'Typ', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Produkt', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Betalform', type: COLUMN.DROPDOWN },
          { title: 'Nr', numSort: true },
          { title: 'Antal', totals: true }
      ]);

      var dataUrl = webdbname + '/' + configName;
      //console.log(dataUrl + ' ' + leverantor);
      viewConfig.addDataStore(dataUrl, leverantor);   // send in category also when all categories are selected
   }
   else if (configName === 'UtrUrvalMatareNR.simple') {
      viewConfig.addColumns([
          { title: 'Projektledare', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'SMM', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Anl nr', sort: true },
          { title: 'Nr', numSort: true },
          { title: 'Typ', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Produkt', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Betalform', type: COLUMN.DROPDOWN },
          { title: 'Antal', totals: true }
      ]);
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);
   }
   else if (configName === 'UtrUrvalMatareSTN.simple') {
      viewConfig.addColumns([
          { title: 'Projektledare', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'SMM', type: COLUMN.DROPDOWN_MULTIPLE },
          { title: 'Anl nr', type: COLUMN.DROPDOWN, sort: true, altFilter: true },
          { title: 'Ort', type: COLUMN.DROPDOWN },
          { title: 'Nr', numSort: true },
          { title: 'Antal', totals: true }
      ]);
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);
   }

   // some shared code
   if (configName === 'UtrUrvalMatareOMR.simple' ||
       configName === 'UtrUrvalMatareGDAT.simple' ||
       configName === 'UtrUrvalMatareLEV.simple' ||
       configName === 'UtrUrvalMatareNR.simple' ||
       configName === 'UtrUrvalMatareSTN.simple') {

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'Anl nr' || columnInfo.getTitle() === 'Stationsdok.') {
            return cfgValues.alt;
         }
      };

      // filter on active user
      //filterPerson = "Robert Alm";	// SPARA. bra test
      //viewConfig.addFilter('Projektledare', filterPerson);
      //viewConfig.addFilter('SMM', filterPerson);
   }

   // advanced customizations
   if (configName === 'UtrUrvalMatareOMR.simple') {
      //console.log("create filtergroups for Produkt and M\u00E4tartyp");
      // for each group we add a list of values. one of these has be be matched exactly for the group option to be created.
      // note that replacing the list of values with just searching for '95' would work for the Alla_95 case, but not for
      // Alla_95-98-D since it must search for 2 different values ('95-98-D' and '95/98-D')

      // Produkt
      produktGroups.push(ViewHandler.createGroup('Alla_95', ['95', '95-98', '95/98', '95-98-D', '95-98-D-D', '95-98-D-D+', '95/98-D', '95-98-D-E85', '95-98-E85-D', '95/98-D-E85', '95-98-E85', '95/98-E85', '95/98-E85-D', '95-D', '95-D-D', '95-D-D+', '95-D-E85', '95-E85', '95-E85-D']));
      // skippa. t\u00E4cks av [95]
      produktGroups.push(ViewHandler.createGroup('Alla_95-98', ['95-98', '95/98']));
      //produktGroups.push(ViewHandler.createGroup('Alla_95-98', ['95', '98'], OPTION_RULE_AND));
      produktGroups.push(ViewHandler.createGroup('Alla_95-98-D', ['95-98-D', '95/98-D']));
      //produktGroups.push(ViewHandler.createGroup('Alla_95-98-D', ['95', '98', 'D'], OPTION_RULE_AND));
      produktGroups.push(ViewHandler.createGroup('Alla_95-98-D-E85', ['95-98-D-E85', '95/98-D-E85']));
      //produktGroups.push(ViewHandler.createGroup('Alla_95-98-D-E85', ['95', '98', 'D', 'E85''], OPTION_RULE_AND));
      produktGroups.push(ViewHandler.createGroup('Alla_95-98-E85', ['95-98-E85', '95/98-E85']));
      //produktGroups.push(ViewHandler.createGroup('Alla_95-98-E85', ['95', '98', 'E85'], OPTION_RULE_AND));

      //produktGroups.push(ViewHandler.createGroup('Alla_95-D',        ['95-D', '95-D-E85']));	// ingen synbar logik h\u00E4r, s\u00E5 har kommenterat ut den
      produktGroups.push(ViewHandler.createGroup('Alla_98', ['95-98', '95/98', '95-98-D', '95-98-D-D', '95-98-D-D+', '95/98-D', '95-98-D-E85', '95/98-D-E85', '95-98-E85', '95-98-E85-D', '95/98-E85', '95/98-E85-D']));
      // skippa. t\u00E4cks av [98]
      produktGroups.push(ViewHandler.createGroup('Alla_AdBlue', ['AdBlue', 'D-ADBLUE', 'D-B100-Adblue', 'D-B100-AdBlue']));
      // skippa. t\u00E4cks av [AdBlue] - se till att case insensitive
      produktGroups.push(ViewHandler.createGroup('Alla_D', ['95-98-D', '95-98-D-D', '95-98-D-D+', '95-98-D-E85', '95-98-E85-D', '95-D', '95-D-D', '95-D-D+', '95-D-E85', '95-E85-D', '95/98-D', '95/98-D-E85', '95/98-E85-D', 'D', 'D-ADBLUE', 'D-B100', 'D-B100-Adblue', 'D-B100-AdBlue', 'D-D', 'D-D+', 'D-E85', 'D-RME', 'E85-D']));
      // skippa. t\u00E4cks av [D]
      produktGroups.push(ViewHandler.createGroup('Alla_D+', ['95-98-D-D+', '95-D-D+', 'D-D+', 'D+']));
      // skippa. t\u00E4cks av [D+]
      produktGroups.push(ViewHandler.createGroup('Alla_E85', ['E85', '95-98-D-E85', '95/98-D-E85', '95-98-E85', '95-98-E85-D', '95/98-E85', '95/98-E85-D', '95-D-E85', '95-E85', '95-E85-D', 'D-E85', 'E85-D']));
      // skippa. t\u00E4cks av [E85]
      produktGroups.push(ViewHandler.createGroup('Alla_RME', ['RME', 'D-RME']));
      // // skippa. t\u00E4cks av [RME]

      // M\u00E4tartyp
      matartypGroups.push(ViewHandler.createGroup('Alla_AF', ['AF'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_AL', ['AL'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_C', ['C '], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_KA', ['KA'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_MLJ', ['MLJ'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_N8', ['N8'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_NL', ['NL'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_S11', ['S11'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_SK', ['SK'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_SU', ['SU'], OPTION_RULE_STARTS_WITH));
      matartypGroups.push(ViewHandler.createGroup('Alla_SX', ['SX'], OPTION_RULE_STARTS_WITH));

      // listen to your custom event from dropFilter.js

      $(window).off('afterpostprocessingdropdowns');	// remove old event
      $(window).on('afterpostprocessingdropdowns', function (e) {
         afterPostProcessingDropdowns(e.dropFilter, e.containerId)
      });
   }

   // some shared code
   if (configName === 'UtrUrvalTerminaler.simple' ||
     configName === 'UtrUrvalTerminalerSTN.simple') {
      viewConfig.addCss(cssPath + '/viewHandlerCustom.css');
   }

   if (configName === 'UtrUrvalTerminaler.simple') {
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);

      viewConfig.addColumns([
          { title: 'Anl nr', sort: true, link: true },
          { title: 'Ort', type: COLUMN.DROPDOWN, search: true },
          { title: 'Projektledare', type: COLUMN.DROPDOWN, search: true },
          //{ title: 'Nr', numSort: true },
          { title: 'Lev datum', type: COLUMN.DROPDOWN_MULTIPLE, altFilter: true },
          { title: 'Leverant\u00F6r', type: COLUMN.DROPDOWN },
          { title: 'Typ', type: COLUMN.DROPDOWN, altFilter: true },
          { title: 'Tum', numSort: true, type: COLUMN.DROPDOWN },
          { title: 'Betalform', type: COLUMN.DROPDOWN },
          { title: 'Leveransdat', type: COLUMN.DROPDOWN },
          { title: 'Garantidat', type: COLUMN.DROPDOWN, altFilter: true },
          { title: 'Inst dat', type: COLUMN.DROPDOWN_MULTIPLE, altFilter: true }
      ]);

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'Stationsdok.') {
            return cfgValues.alt;
         }
      };

      /*viewConfig.convertFilterValue = function (columnInfo, value) {    // TEST function
         if (columnInfo.getTitle() === 'Betalform') {
            return "ABC" + value;
         }
      };*/

      viewConfig.refreshProgress = function (qtyDOMRows) {
         if (qtyDOMRows === 0)
            $('#totalFysiskaTerminaler').html('&nbsp;');
         else
            $('#totalFysiskaTerminaler').html('<span style="color:red">' + qtyDOMRows + '</span>');
         $('#totalEnskildaStationer').text('');
      };

      viewConfig.refreshSummary = refreshSummaryTerminaler;
      //var filterPerson = 'Robert Alm';
      //viewConfig.addFilter('Projektledare', filterPerson);
   }
   else if (configName === 'UtrUrvalTerminalerSTN.simple') {
      var dataUrl = webdbname + '/' + configName;
      viewConfig.addDataStore(dataUrl);

      viewConfig.addColumns([
          { title: 'Anl nr', sort: true, link: false },
          { title: 'Ort', type: COLUMN.DROPDOWN, search: true },  // , altSort: true, altFilter: true
          { title: 'Nr', type: COLUMN.HIDDEN },
          { title: 'Typ', type: COLUMN.HIDDEN },
          { title: 'Tum', type: COLUMN.HIDDEN },
          { title: 'DS', type: COLUMN.HIDDEN }
      ]);

      viewConfig.preprocessData = function () {   // executed later than createFilterPanel (where columnInfos are filled in)
         // code to group by AnlNr.
         var columnInfoGroupBy = ViewHandler.getColumnInfoFromTitle('Anl nr');
         /*var sql = 'SELECT FIRST([@id]) AS [@id]';
         for (var i = 0, l = ViewHandler.getColumnInfoQty() ; i < l; i++) {    // 
             var columnInfo = ViewHandler.getColumnInfoFromIndex(i);
             sql += ', FIRST([' + columnInfo.getItemName() + ']) AS [' + columnInfo.getItemName() + ']';
         }*/
         var sql = ViewHandler.getSQLSelect();
         sql += ' FROM ' + viewConfig.dataStores[0].alias + ' GROUP BY [' + columnInfoGroupBy.getItemName() + ']';
         return sql;
      }

      viewConfig.refreshSummary = refreshSummaryTerminalerStationer;
   }

   $(window).on('filterwasupdated', function (e) {
      //console.log('filterwasupdated....');
      var activeFilters = e.filterdata;
      var filterDOM = ViewHandler.createActiveFilterDOM(activeFilters);
      $('#activefilters').children().remove();
      if (activeFilters.length > 0) {
         $('#activefilters').append(filterDOM);
         if (DEBUG_SHOW_WHERE_CLAUSE) {
            console.log(viewConfig.where)
            $('#activefilters').find('div.alert-warning').append('<div><strong>WHERE:</strong> ' + viewConfig.where.replace('<', '&lt;').replace('>', '&gt;') + '</div>');

         }
      }
      // some shared code
      if (configName === 'UtrUrvalMatareOMR.simple' ||
       configName === 'UtrUrvalMatareGDAT.simple' ||
       configName === 'UtrUrvalMatareLEV.simple' ||
       configName === 'UtrUrvalMatareNR.simple' ||
       configName === 'UtrUrvalMatareSTN.simple') {
         if (activeFilters.length > 0)
            $('div.spaceFiller').addClass('hidden');
         else
            $('div.spaceFiller').removeClass('hidden');
      }
   });
}


function refreshSummaryMatare(reset) {
   var viewConfig = ViewHandler.getViewConfig(ID_VIEWHANDLER);
   var configName = viewConfig.configName;
   //console.log('refreshSummaryMatare ' + configName);
   var qty95 = 0;
   var qty98 = 0;
   var qtyDiesel = 0;
   var qtyDieselPlus = 0;
   var qtyRME = 0;
   var qtyB100 = 0;
   var qtyE85 = 0;
   var qtyBiogas = 0;
   var qtyAdBlue = 0;
   var qtySpolarv = 0;
   var qtyFotogen = 0;
   var qtyFysiskaEnheter = 0;
   var qtyFysiskaTerminaler = 0;
   var qtyEnskildaStationer = 0;

   if (!reset) {
      var listAnlNr = new Array();

      var sql = 'SELECT FROM ' + viewConfig.dataStores[0].alias;
      if (viewConfig.where !== '')
         sql += ' WHERE ' + viewConfig.where;

      var queryResult = ViewHandler.query(sql);
      //console.log('sql: ' + sql + '   #: ' + queryResult.length);
      //qtyEnskildaStationer = queryResult.length;

      for (var i = 0; i < queryResult.length; i++) {
         var qtyDieselPlus_OnRow = 0;
         var qtyAdBlue_OnRow = 0;

         var products = queryResult[i][ViewHandler.getColumnInfoFromTitle('Produkt').getItemName()];
         if (products === undefined) {
            console.log("row " + i + " is undefined.." + "Produkt");
            continue;
         }
         products = products.toLowerCase();
         //if (i < 10) {
         //    console.log(i + ': ' + queryResult[i][ViewHandler.getColumnInfoFromTitle('Produkt').getItemName()] + '_____' + products);
         //    console.dir(queryResult[i]);
         //}

         if (products.indexOf('95') > -1)
            qty95++;
         if (products.indexOf('98') > -1)
            qty98++;
         if (products.indexOf('d+') > -1) {
            qtyDieselPlus++;
            qtyDieselPlus_OnRow++;
         }
         if (products.indexOf('rme') > -1)
            qtyRME++;
         if (products.indexOf('b100') > -1)
            qtyB100++;
         if (products.indexOf('e85') > -1)
            qtyE85++;
         if (products.indexOf('biogas') > -1)
            qtyBiogas++;
         if (products.indexOf('adblue') > -1) {
            qtyAdBlue++;
            qtyAdBlue_OnRow++;
         }
         if (products.indexOf('spolarv\u00E4tska') > -1)
            qtySpolarv++;
         if (products.indexOf('fotogen') > -1)
            qtyFotogen++;

         // Diesel requires special handling - MUST be last.
         // Since 'd' isn't unique we have to remove false positives.
         // the root cause of this is the bad data contained in the Product field.
         if (products.indexOf('d') > -1) {
            var qtyDiesel_OnRow = 0;
            qtyDiesel_OnRow = products.split('d').length - 1;
            if (qtyDiesel_OnRow > 0) {
               //var out = "#D: " + qtyDiesel_OnRow + "  in: " + products;
               qtyDiesel_OnRow -= qtyDieselPlus_OnRow;
               qtyDiesel_OnRow -= qtyAdBlue_OnRow;
               //out += "  -->" + qtyDiesel_OnRow;
               //console.log(out);
            }
            if (qtyDiesel_OnRow > 0)
               qtyDiesel++;		// just add one ('D-D' should be counted once)
         }

         // ---- LOWER SUMMARY SECTION -------------------------------------------------
         var anlNrAttributeName = configName === 'UtrUrvalMatareLAG.simple' ? 'anlnrhidden' : 'anlnr';

         var fieldName = configName === 'UtrUrvalMatareLAG.simple' ? 'anlnrhidden' : 'Anl nr';
         //console.log('anlNrAttributeName: ' + anlNrAttributeName + '   fieldName: ' + fieldName + '   itemname: ' + ViewHandler.getColumnInfoFromTitle(fieldName).getItemName());
         //queryResult[i][ViewHandler.getColumnInfoFromTitle('Produkt').getItemName()]
         //var anlNr = queryResult[i]['Sort_' + ViewHandler.getColumnInfoFromTitle(fieldName).getItemName()];
         //console.log('itemName: ' + 'Sort_' + ViewHandler.getColumnInfoFromTitle(fieldName).getItemName());
         var anlNr = ViewHandler.extractCellValue(queryResult[i][ViewHandler.getColumnInfoFromTitle(fieldName).getItemName()]);
         //var anlNr = $(rows[i]).attr(PREFIX_SORT + anlNrAttributeName);
         if (anlNr !== undefined)
            listAnlNr[anlNr] = anlNr;		// keep only unique entries
         //console.log("anlNr: " + anlNr);

         if (configName === 'UtrUrvalMatareLAG.simple') {		// Lager summarizes on two attributes
            //console.log('M\u00E4tare: ' + ViewHandler.getColumnInfoFromTitle('Ant. m\u00E4t.').getItemName());
            //var antal = queryResult[i][ViewHandler.getColumnInfoFromTitle('Ant. m\u00E4t.').getItemName()];
            var info = ViewHandler.getColumnInfoFromTitle('Ant. m\u00E4t.');
            if (info !== undefined && info !== null) {
               var antal = queryResult[i][info.getItemName()];
               if (antal !== undefined) {
                  var value = parseFloat(antal);
                  if (!isNaN(value))
                     qtyFysiskaEnheter += value;
               }
            }

            //var antalTerminaler = queryResult[i][ViewHandler.getColumnInfoFromTitle('Ant. term.').getItemName()];
            info = ViewHandler.getColumnInfoFromTitle('Ant. term.');
            if (info !== undefined && info !== null) {
               var antalTerminaler = queryResult[i][info.getItemName()];
               if (antalTerminaler !== undefined) {
                  var value = parseFloat(antalTerminaler);
                  if (!isNaN(value))
                     qtyFysiskaTerminaler += value;
               }
            }
         }
         else {	// the other 5 views summarizes on attribute 'Antal'
            //var antal = $(rows[i]).attr(PREFIX_SORT + 'antal');
            var antal = queryResult[i][ViewHandler.getColumnInfoFromTitle('Antal').getItemName()];
            if (antal !== undefined) {
               var value = parseFloat(antal);
               if (!isNaN(value))
                  qtyFysiskaEnheter += value;
            }
         }
      }
      //console.dir(listAnlNr);
      for (var key in listAnlNr) {
         //console.log("Enskild " + qtyEnskildaStationer + ": " + key);
         qtyEnskildaStationer++;
      }
      $('#qtyVisibleInfo').html(TEXT_URVAL + ':&nbsp;' + viewConfig.qtyVisible + '&nbsp;' + TEXT_PIECES);
   }
   else {   // reset. viewConfig doesn't exist yet so set 0
      $('#qtyVisibleInfo').html(TEXT_URVAL + ':&nbsp;' + 0 + '&nbsp;' + TEXT_PIECES);
   }
   $('#total95').text(qty95);
   $('#total98').text(qty98);
   $('#totalDiesel').text(qtyDiesel);
   $('#totalDieselPlus').text(qtyDieselPlus);
   $('#totalRME').text(qtyRME);
   $('#totalB100').text(qtyB100);
   $('#totalE85').text(qtyE85);
   $('#totalBiogas').text(qtyBiogas);
   $('#totalAdBlue').text(qtyAdBlue);
   $('#totalSpolarv').text(qtySpolarv);
   $('#totalFotogen').text(qtyFotogen);

   $('#totalFysiskaEnheter').text(qtyFysiskaEnheter);
   $('#totalFysiskaTerminaler').text(qtyFysiskaTerminaler);
   $('#totalEnskildaStationer').text(qtyEnskildaStationer);

   $('#totalProgress').html('&nbsp;');	// rows.length
   //console.log('QTY    : ' + viewConfig.qtyVisible);
}

function refreshSummaryTerminaler() {
   //console.log("refreshSummaryTerminaler...");
   var viewConfig = ViewHandler.getViewConfig(ID_VIEWHANDLER);
   var qtyFysiskaTerminaler = 0;
   var qtyEnskildaStationer = 0;
   qtyFysiskaTerminaler = viewConfig.qtyVisible;
   //console.dir(ViewHandler.getColumnInfoFromTitle('Anl nr'));

   var sql = 'SELECT COUNT(*) FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   sql += ' GROUP BY [' + ViewHandler.getColumnInfoFromTitle('Anl nr').getItemName() + ']';
   //console.log('sql: ' + sql);
   var queryResult = ViewHandler.query(sql);
   qtyEnskildaStationer = queryResult.length;

   //console.log("totalFysiskaTerminaler: " + qtyFysiskaTerminaler + '    totalEnskildaStationer: ' + qtyEnskildaStationer);
   $('#totalFysiskaTerminaler').text(qtyFysiskaTerminaler);
   $('#totalEnskildaStationer').text(qtyEnskildaStationer);
}

function refreshSummaryTerminalerStationer() {
   //console.log("refreshSummaryTerminalerStationer...");
   var viewConfig = ViewHandler.getViewConfig(ID_VIEWHANDLER);
   var qtyEnskildaStationer = viewConfig.qtyVisible;
   $('#totalEnskildaStationer').text(qtyEnskildaStationer);
}


function refreshBackgroundRowsLAG() {	// return true if row backgrounds were handled
   var view = ViewHandler.getIframeDocument().defaultView || ViewHandler.getIframeDocument().parentWindow;
   // this view group together master and slave rows, and use a different background class
   var docBody = ViewHandler.getIframeDocument().body;
   $(docBody).find('#data-content ul.normal').removeClass('evengroup evenrow');

   if (view.sortColumnIndex === 2) {
      var lastDocId = '';
      var useColor1 = false;
      $(docBody).find('#data-content ul.normal').each(function () {
         var docId = $(this).attr(PREFIX_SORT + 'docid');
         if (docId != lastDocId || (docId == ''))
            useColor1 = !useColor1;	  // alternate
         if (useColor1 == true)
            $(this).addClass('evengroup');
         lastDocId = docId;
      });
      return true;
   }
   return false;	// return and use the standard background rows	
}

// called from the ViewHandler frame when it's clicked
function clickedOnViewHandler() {
   //console.log("--clickedOnViewHandler--");
   closeOpenDropfilters();
}

// close open dropfilters in the outer frame
function closeOpenDropfilters() {
   $('div.bootstrap-select').removeClass('open');      // dropdowns in the container
}

var matartypGroups = [];
var produktGroups = [];

// after the filter options has been filled in, but before the bootstrap filters are refreshed
function handleFilterOptions(dropFilter) {
   //console.log("--------------handleFilterOptions-------------- B " + dropFilter.getLabel());
   var columnInfo = dropFilter.getColumnInfo();

   //console.log("--------------columnInfo-------------- " + columnInfo.getTitle());
   var collection = null;
   if (columnInfo.getTitle() === 'Produkt')
      collection = produktGroups;
   else if (columnInfo.getTitle() === 'M\u00E4tartyp')
      collection = matartypGroups;
   else
      return;

   //console.log("--------------handleFilterOptions-------------- B " + dropFilter.getLabel());
   for (var i = 0, l = collection.length; i < l; i++)
      collection[i].reset();

   var ctrl = dropFilter.getCtrl();
   //console.log('ctrl.length: ' + ctrl.length);   
   for (var i = 0, l = ctrl.length; i < l; i++) {						// loop options
      var optionValue = ctrl.options[i].value;

      for (var j = 0, m = collection.length; j < m; j++) {			// loop groups
         var group = collection[j];
         if (group.found) // already found
            continue;

         if (group.rules === OPTION_RULE_STARTS_WITH) {
            if (group.members.length > 0) {
               var member = group.members[0];
               //console.log("member: " + member + "__" + optionValue.indexOf(member));
               if (optionValue.indexOf(member) === 0)
                  group.found = true;
            }
         }
         else { 	// default rules
            for (var k = 0, n = group.members.length; k < n; k++) {	// loop group members
               var member = group.members[k];
               if (member === optionValue) {
                  group.found = true;
               }
            }
         }
      }
   }
   $(dropFilter.getCtrl()).find('option:nth-child(1)').before($(createDivider()));
   var selected = false;
   //console.log('collection.length: ' + collection.length);
   for (var i = collection.length - 1; i >= 0; i--) {
      var group = collection[i];
      if (group.found) {
         // insert new options after the (Markera allt) option
         var domOption = $('' + ViewHandler.createDOMOption(group.groupName, group.groupName, selected, ATTRIBUTE_EXCLUDED));
         $(dropFilter.getCtrl()).find('option:nth-child(1)').before(domOption);
      }
   }
}

function createDivider() {
   return '<option data-divider="true" ' + ATTRIBUTE_EXCLUDED + '></option>';
}

// after the bootstrap filters have been refreshed.
// attach group option events
function afterPostProcessingDropdowns(dropFilter, containerId) {  // keep this containerId
   var viewConfig = ViewHandler.getViewConfig(ID_VIEWHANDLER);
   var configName = viewConfig.configName;

   //console.log("--------------afterPostProcessingDropdowns-------------- B " + dropFilter + '  configName: ' + configName);
   if (containerId !== ID_VIEWHANDLER)
      return;

   if (configName === 'UtrUrvalMatareOMR.simple') {
      var columnInfo = dropFilter.getColumnInfo();
      if (columnInfo.getTitle() === 'Produkt' || columnInfo.getTitle() === 'M\u00E4tartyp') {
         var bootstrapFilter = $(dropFilter.getCtrl()).nextAll('.bootstrap-select');
         // filter Options that start with 'Alla_'
         var $texts = $(bootstrapFilter).find('li a span.text').filter(function () {
            return (/Alla_/i).test($(this).text())
         });
         //console.log('column is ' + columnInfo.getTitle() + '  texts#: ' + $texts.length);
         for (var i = 0, l = $texts.length; i < l; i++) {
            var liOption = $($texts[i]).closest('li');
            //console.log("  " + i + " " + $($texts[i]).text() + "  " + $(liOption).find('a span.text').text());
            $(liOption).off('click');
            $(liOption).on('click', function (e) {
               var groupName = $(this).find('a span.text').text();
               //console.log(" Clicked IT! " + $(this).data('original-index') + " " + groupName + "  e: " + e);
               if (columnInfo.getTitle() === 'Produkt') {
                  ViewHandler.selectMembersFromGroup(dropFilter, ViewHandler.getGroupFromCollection(produktGroups, groupName));
                  e.stopPropagation();    // don't check this option
               }
               else if (columnInfo.getTitle() === 'M\u00E4tartyp') {
                  ViewHandler.selectMembersFromGroup(dropFilter, ViewHandler.getGroupFromCollection(matartypGroups, groupName));
                  e.stopPropagation();    // don't check this option
               }
            });
         }
      }
   }
}

