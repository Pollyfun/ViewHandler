'use strict';

// dynamically include columnInfo.js and interface/viewHandler.js
var scripts = document.getElementsByTagName('script');	// get all scripts
var fullPath = scripts[scripts.length-1].src;				// extract the path of this file
var newPath = fullPath.replace('interface/psk.js', 'columnInfoVH.js');
document.write('<script src="' + newPath + '"></script>');
newPath = fullPath.replace('interface/psk.js', 'interface/viewHandler.js');
document.write('<script src="' + newPath + '"></script>');


// code that is specific for the PSK implementation of ViewHandler
var dbXAgents = '';
var serverColumnDesign = [];  // one entry per viewhandler container (when changing config inside the same container the design is replaced).
// if there's several datasources in the viewhandler, the design is only retrieved from the first one.

// fills in dbXAgents from backend
var getServerConfigInfo = function (serverDomain, viewHandlerPath, callback) {  // use empty string for serverDomain when it's the current one.
   serverDomain = $.trim(serverDomain);
   var uri = viewHandlerPath + '/GetConfigInfo?OpenAgent';
   if (serverDomain !== '')
      uri = serverDomain + uri;
   //console.log('URI: ' + uri);
   //console.log('serverDomain: ' + serverDomain);

   $.ajax(encodeURI(uri)).done(function (data) {
      if (data.error) {
         alert(data.error);
         return;
      }
      //console.dir(data);     // OBS: innehåller HTML om inte inloggad
      dbXAgents = data.xagentspath;
      if (serverDomain !== '')
         dbXAgents = serverDomain + '/' + dbXAgents;
      else
         dbXAgents = '/' + dbXAgents;

      callback(true);
   }
   ).fail(function (data) {
      // ajax called failed. can for example occur if the agent isn't found
      var message = 'ViewHandler - Ajax call failed: ' + data.errorMsg;
      alert(message);
      callback(false);
   });
}


var getServerDesign = function (containerId, dataSourcePath, callback) {  // use empty string for serverDomain when it's the current one.
   var designUri = makeXAgentsDesignPath(dataSourcePath);
   //console.log('designUri: ' + designUri + '   dataSourcePath: ' + dataSourcePath);
   
   $.ajax(encodeURI(designUri)).done(function (designData) {
      //console.log('SUCCESS design');
      serverColumnDesign[containerId] = designData;
      callback(true);
   }
   ).fail(function (designData) {
      console.dir(designData);
      alert('Ajax call failed to retrieve view design: ' + designData.errorMsg);
   }
   );
}

function makeXAgentsDesignPath(dataSourcePath) {    // serverDomain not needed here. it's set when creating the dbXAgents path
   return dbXAgents + '/view.xsp/design?uri=' + dataSourcePath;
}

function makeXAgentsDataPath(dataSourcePath) {
   return dbXAgents + '/view.xsp/entries?uri=' + dataSourcePath;
}

function makeXAgentsExcelPath(dataSourcePath) {
   return dbXAgents + '/view.xsp/export/' + dataSourcePath;   
}

function fillInBaseColumns(viewConfig) {
   var designData = serverColumnDesign[viewConfig.containerId]

   // receives an array with the view design in key/value pairs
   var columns = designData['@columns'];
   //console.log("#: " + columns.length);
   var calculatedWidth = 0;

   for (var i = 0, l = columns.length; i < l; i++) {
      var column = columns[i];
      var itemName = column['@itemname'];
      var title = column['@columnheader']['@title'];
      var width = column['@width'];			// checka json i browsern
      width *= 8;	// seems to mimic the value retrieved from 'ReadDesign'
      //console.log("M itemName: " + itemName + "   title: " + title + "   width: " + width);

      // create a config from the backend info combined the default column type (LABEL)
      var columnCfg = new columnConfig({ itemName: itemName, title: title, width: width, type: COLUMN.LABEL });
      viewConfig.addBaseColumnConfig(columnCfg);
   }
}

function createView(cfg) {
   //console.info('psk createView ', cfg.viewHandlerPath);    // /psk/ViewHandlerBase.nsf

   ViewHandler.addPostConfigurationCallback(sharedPskConfiguration);  // for retrieving column design from the first datastore and to fill in base columns (same for all psk viewhandlers)
   ViewHandler.addDataStoreConfigurator(configureDatastore);
   ViewHandler.addRetrieveDataFunction(retrieveData);

   var retrieveInfoFromBackend = function() {
      getServerConfigInfo($.trim(cfg.serverDomain), cfg.viewHandlerPath, function (success) {
         //console.log('after getServerConfigInfo: ' + success);
         refreshViewHandler();
      });
   }

   var refreshViewHandler = function () {
      var isCodeInsideDomino = location.href.indexOf('.nsf') > -1;
      var isLocalHost = location.href.indexOf('localhost') > -1;

      // when html files are opened through Domino they need the ?OpenFileResource suffix
      var viewHandlerPath = '/ViewHandler.html' + (isCodeInsideDomino ? '?OpenFileResource' : '');

      if (cfg.localCode !== true) { // required when frontend code is local (outside domino, but the backend agents are in the .nsf file)
         var cfgViewHandlerPath = $.trim(cfg.viewHandlerPath);
         if (!isLocalHost && cfgViewHandlerPath === '')
            cfgViewHandlerPath = '/ViewHandler/ViewHandler';   // running on server, and no path defined. use this default.
         viewHandlerPath = cfgViewHandlerPath + viewHandlerPath;
      }
      ViewHandler.createView(cfg.containerId, cfg.configName, viewHandlerPath, (typeof configureView === 'function' ? configureView : null));
   }
   //console.log('containerId: ' + cfg.containerId + '  configName: ' + cfg.configName);
   retrieveInfoFromBackend();
}

// triggered after createView() has been processed
// used to retrieve the design for the first datastore, and to fill in base columns
function sharedPskConfiguration(viewConfig) {
   //console.log('sharedPskConfiguration..' + viewConfig);

   var designUrl = viewConfig.getSourceDbUrl(0) + '/' + viewConfig.getSourceView(0);
   //console.log('designUrl: ' + designUrl);
   // designUrl: /kund/psk/xagents.nsf/view.xsp/entries?uri=/names.nsf/People.simple

   getServerDesign(viewConfig.containerId, designUrl, function (success) {    // fills in serverColumnDesign
      //console.log('after getServerDesign: ' + success);
      fillInBaseColumns(viewConfig);
      // well..  xagents datapathen skapas här för tillfället. behövs en pks.getData() fkn som extraherar ut allt xagents/domino specifikt och sköter bl.a. detta.
      //console.log('qty datastores: ' + viewConfig.dataStores.length);
      //console.log('qty datastores: ' + viewConfig.dataStores);
      for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
         //console.log('DataStore' + i + ': ' + viewConfig.dataStores[i].url)
         viewConfig.dataStores[i].url = makeXAgentsDataPath(viewConfig.dataStores[i].url);
         //console.log('  ---> ' + viewConfig.dataStores[i].url)
      }
      ViewHandler.finalizeConfiguration(viewConfig.containerId);
   });
   return true;   // true = pause the execution until we're finished here
}

function printToExcel(alwaysSendUnids, containerId) {     // alwaysSendUnids:true used for some special cases. containerId is optional
   var emptyIfDefault = true;
   if (alwaysSendUnids === true)
      emptyIfDefault = false;

   var viewConfig = ViewHandler.getViewConfig(containerId);
   var excelBase = viewConfig.configName + '.xlsx?uri=' + viewConfig.getDbPath() + '/' + viewConfig.configName;
   var cfg = new Object({ emptyIfDefault: emptyIfDefault, excel: true });
   var visibleIds = ViewHandler.retrieveFilterData(cfg, containerId);
   var idsParam = visibleIds.join(",");
   var uri = excelBase + ViewHandler.getExcelColumnsParam(containerId);
   uri = makeXAgentsExcelPath(uri);
   ViewHandler.createExcel(uri, idsParam);
}


function normalizeJson(inputData, optionalInfo, viewConfig) {
   // standardize the data and add it to gData
   //console.info('normalizeJson ');
   //console.info(inputData);
   inputData = inputData['@entries'];
   //console.info(inputData);
   var outputData = [];

   for (var i = 0, l = inputData.length; i < l; i++) {
      var inputEntry = inputData[i];
      var outputEntry = {};

      //if (i === 0) console.info('numero ino: ', inputEntry);
      //inputEntry["_tum"] = 95;
      var counter = 0;
      for (var property in inputEntry) {
         if (inputEntry.hasOwnProperty(property)) {
            //console.info(counter + ": ", property, inputEntry[property]);

            var title;
            if (property === '@id' || property === '@position')
               title = property;
            else
               title = viewConfig.getBaseColumnTitleFromItemName(property);
            //console.log(title + '___' + property);

            outputEntry[title] = '' + inputEntry[property];   // make sure it's a string. then we don't have to handle different sql where-variations
            counter++;
         }
         else
            console.log('invalid prop: ' + property);
      }
      //if (i === 0) console.info('numero uto: ', outputEntry);
      outputData.push(outputEntry);
   }
   //console.info('inputData: ', inputData);
   //console.info('outputData: ', outputData);
   return outputData;
}

function configureDatastore(viewConfig, dataStoreIndex, searchCriteria) {
   // NOTE that there seems to be no need to split upp the backend data-retrieval into several calls.
   // testing with 192.000 rows were no problem.
   // optionalInfo.qtyRowsPerCall, callAgain can probably be removed without problem. 
   // qtyRowsPerCall has to be a high number now. if it's gonna be used, start and count parameters has to be added again.

   var optionalInfo = new Object();
   optionalInfo.dataStoreIndex = dataStoreIndex;
   optionalInfo.categorizedJson = false;   // TODO: ev skapa en klass med förifyllda default-värden
   optionalInfo.firstDatablock = true;
   optionalInfo.nextIndex = 1;						// first is 1 not 0
   optionalInfo.qtyRowsPerCall = 500000;	  	// qty of rows retrieved with each server call        TODO: not really used here in psk.js. remove?
   optionalInfo.uri = viewConfig.dataStores[dataStoreIndex].url;
   optionalInfo.qtyDOMRows = 0;
   optionalInfo.searchCriteria = ''

   if (dataStoreIndex === 0) {      // ignore the searchCriteria in additional dataStores
      optionalInfo.searchCriteria = $.trim(searchCriteria);

      if (optionalInfo.searchCriteria === '') {
         //globalSearch = '';
         optionalInfo.globalSearch = '';  // used to return the variable to the global variable inside viewHandler.js. perhaps change this
      }
      else {
         //globalSearch = optionalInfo.searchCriteria;		// need to save it to use for a flag later
         optionalInfo.globalSearch = optionalInfo.searchCriteria;		// need to save it to use for a flag later
         optionalInfo.searchCriteria = '*' + optionalInfo.searchCriteria + '*';
      }
   }

   var hasCfgRestrictToCategory = false;
   var cfgCategory = viewConfig.dataStores[dataStoreIndex].category;
   if (typeof cfgCategory !== 'undefined')
      hasCfgRestrictToCategory = true;
   else
      cfgCategory = ''

   if (cfgCategory !== '') {
      optionalInfo.uri += '&category=' + encodeURIComponent(cfgCategory);
   }
   else {
      if (hasCfgRestrictToCategory) {
         // the restricttocategory parameter was present, but without a value.
         // for this situation we assume the view is categorized, but we will get all rows
         // including the category rows. this requires special handling so a flag is set.
         optionalInfo.categorizedJson = true;

         // NEW: when &category= is sent to backend, it filters out the category rows there
         optionalInfo.uri += '&category=';
         //console.log("       optionalInfo.categorizedJson: " + optionalInfo.categorizedJson);
      }
   }
   return optionalInfo;
}

// receives server data and fills in DOM
// then the next rows are retrieved
function retrieveData(data, optionalInfo, viewConfig) {
   //console.log('PSK - retrieveData ' + viewConfig.containerId);

   var callAgain = false;
   if (data == null) {
      // calling sequence not started yet.
      callAgain = true;
   }
   else {
      //console.info('before normalize: ', data);
      data = normalizeJson(data, optionalInfo, viewConfig)

      if (!ViewHandler.hasGlobalData(optionalInfo.dataStoreIndex, viewConfig.containerId)) {
         ViewHandler.createGlobalData(optionalInfo.dataStoreIndex, data, viewConfig.containerId)
         //console.info("type 1.");
      }
      else {         // data already exists. add more after
         //console.info("type 2.   data already exists. add more after");
         for (var i = 0; i < (data.length) ; i++) {
            ViewHandler.appendGlobalData(optionalInfo.dataStoreIndex, data[i], viewConfig.containerId);
         }
      }

      var highestPos = -1;			// pos 1.1 etc in categorized views    // TODO: move out this logic to normalize-functions
      if (data) {   // undefined if there were no hits
         //console.log('_data.length: ' + data.length, data);

         //console.log('received records#: ' + data.length);
         for (var i = 0; i < (data.length) ; i++) {
            if (i == 0 && optionalInfo.categorizedJson && optionalInfo.firstDatablock == false) {
               // categorized json and not the first block of data.
               // the first entry will be the same as the last entry in the previous block, so it's skipped.
               //console.log("skipping " + i);
               continue;
            }
            else if (optionalInfo.categorizedJson) {		// skip category rows
               //console.log('optionalInfo.categorizedJson: ' + optionalInfo.categorizedJson);
               //console.log("viewEntries[i]['@children']: " + viewEntries[i]['@children']);
               //if (data[i]['@children'] !== undefined) {
               //console.log(i + "_" + data[i]['@id']);
               if (data[i]['@id'] === '') {		// skip category rows
                  console.log("skipping " + i + "    BBB");
                  continue;
               }
            }
            //console.log("creating " + i);
            optionalInfo.qtyDOMRows++;
            highestPos = data[i]['@position'];
            //console.log('setting highestPos: ' + highestPos);
            //highestPos++;
            //console.dir(data[i]);
         }

         if (data.length < optionalInfo.qtyRowsPerCall) {
            // this was the last batch of records, so no more calls are required
            highestPos = -1;
            //console.log('LAST BATCH. QUITTING  ' + optionalInfo.qtyRowsPerCall);
         }
      }
      if (optionalInfo.firstDatablock) {        // TODO: behövs?
         optionalInfo.firstDatablock = false;
      }

      //console.log('highestPos: ' + highestPos);
      if (highestPos != -1) {
         //console.log("optionalInfo.categorizedJson: " + optionalInfo.categorizedJson);
         if (optionalInfo.categorizedJson) {
            //console.log('one..');
            callAgain = true;
            console.log('SETTING callAgain true (1)');
            // in a categorized view we don't know the hierarchical position of the next entry,
            // so we use the position of the last entry we retrieved (and filter it out when it's received)
            optionalInfo.nextIndex = highestPos;
            //console.log("optionalInfo.categorizedJson - callAgain " + callAgain + "        nextIndex: " + optionalInfo.nextIndex);
         }
         else {		// flat json
            //console.log('two..');
            //if (parseInt(highestPos, 10) < parseInt(data['@toplevelentries']), 10)		// TODO: ersätt?
            callAgain = true;
            console.log('SETTING callAgain true (2)');
            optionalInfo.nextIndex = optionalInfo.nextIndex + optionalInfo.qtyRowsPerCall;
            //console.log("highestpos: " + highestPos + "  optionalInfo.nextIndex: " + optionalInfo.nextIndex);	
         }
         //console.log('callAgain: ' + callAgain);
      }
      if (optionalInfo.searchCriteria !== '') {	// when searching all entries are retrieved in one chunk
         callAgain = false;
      }
      //console.log("highestpos: " + highestPos + "  categorizedJson: " + optionalInfo.categorizedJson);	
   }

   ViewHandler.refreshProgress(optionalInfo.qtyDOMRows, viewConfig.containerId);

   if (callAgain === true) {
      //console.log('optionalInfo.uri: ' + optionalInfo.uri);
      var uri = optionalInfo.uri; 
	   //var uri = optionalInfo.uri + getSeqParam();

      if (optionalInfo.searchCriteria !== '') {
         uri += '&search=' + encodeURIComponent(optionalInfo.searchCriteria);
      }
      //uri += '&count=200';
      //console.log("uri: " + uri);
      $.ajax(uri).done(function (data) {     // cannot encode here. it doesn't handle values with & insides it
         retrieveData(data, optionalInfo, viewConfig);
      }
      ).fail(function (data) {
         console.dir(data);
         // don't use alert() since it happens when switching between (big) views without finishing the load first
         console.log('Ajax call failed to retrieve view data: ' + data.errorMsg);
      })
   }
   else {
      //console.timeEnd("data");
      ViewHandler.getDataStoresLooped(optionalInfo.dataStoreIndex + 1, optionalInfo.searchCriteria, viewConfig.containerId);
   }
}
