'use strict';
// https://www.ibm.com/developerworks/lotus/library/ls-Domino_URL_cheat_sheet/

// dynamically include columnInfo.js and interface/viewHandler.js
var scripts = document.getElementsByTagName('script');	// get all scripts
var fullPath = scripts[scripts.length - 1].src;				// extract the path of this file
var newPath = fullPath.replace('interface/domino.js', 'columnInfoVH.js');
document.write('<script src="' + newPath + '"></script>');
newPath = fullPath.replace('interface/domino.js', 'interface/viewHandler.js');
document.write('<script src="' + newPath + '"></script>');

var gServerDomain = '';  // needed when localhost to retrieve server data
var serverColumnDesign = [];  // one entry per viewhandler container (when changing config inside the same container the design is replaced).
// if there's several datasources in the viewhandler, the design is only retrieved from the first one.

function createView(cfg) {
   //console.info('domino createView ', cfg.viewHandlerPath);
   ViewHandler.addPostConfigurationCallback(sharedDominoConfiguration);  // for retrieving column design from the first datastore and to fill in base columns (same for all psk viewhandlers)
   ViewHandler.addDataStoreConfigurator(configureDatastore);
   ViewHandler.addRetrieveDataFunction(retrieveData);

   gServerDomain = $.trim(cfg.serverDomain);

   var refreshViewHandler = function () {
      var isLocalHost = $.trim(cfg.serverDomain) !== '';
      var designName = cfg.configName; // use same view name per default
      if (typeof cfg.designName !== 'undefined' && cfg.designName != '')
         designName = cfg.designName;

      // when html files are opened through Domino they need the ?OpenFileResource suffix
      var viewHandlerPath = '/ViewHandler.html' + (!isLocalHost ? '?OpenFileResource' : '');
      if (!isLocalHost && $.trim(cfg.viewHandlerPath) !== '')
         viewHandlerPath = cfg.viewHandlerPath + viewHandlerPath;

      ViewHandler.createView(cfg.containerId, cfg.configName, viewHandlerPath, (typeof configureView === 'function' ? configureView : null));
   }
   //console.log('containerId: ' + cfg.containerId + '  configName: ' + cfg.configName);
   refreshViewHandler();
}

// triggered after createView() has been processed
// used to retrieve the design for the first datastore, and to fill in base columns
function sharedDominoConfiguration(viewConfig) {
   //console.log('sharedPskConfiguration..' + viewConfig);

   var designUrl = viewConfig.getSourceDbUrl(0) + '/' + viewConfig.getSourceView(0);
   //console.log('designUrl: ' + designUrl);
   // designUrl: /kund/psk/xagents.nsf/view.xsp/entries?uri=/names.nsf/People.simple

   getServerDesign(viewConfig.containerId, designUrl, function (success) {    // fills in serverColumnDesign
      //console.log('after getServerDesign: ' + success);
      fillInBaseColumns(viewConfig);
      // well..  xagents datapathen skapas här för tillfället. behövs en pks.getData() fkn som extraherar ut allt xagents/domino specifikt och sköter bl.a. detta.
      //console.log('qty datastores: ' + viewConfig.dataStores.length);
      for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
         //console.log('DataStore' + i + ': ' + viewConfig.dataStores[i].url)
         viewConfig.dataStores[i].url = makeDataPath(viewConfig.dataStores[i].url);
         //console.log('  ---> ' + viewConfig.dataStores[i].url)
      }
      ViewHandler.finalizeConfiguration(viewConfig.containerId);
   });
   return true;   // true = pause the execution until we're finished here
}

var getServerDesign = function (containerId, dataSourcePath, callback) {  // use empty string for serverDomain when it's the current one.
   var designUri = makeDesignPath(dataSourcePath);
   //console.log('designUri: ' + designUri + '   dataSourcePath: ' + dataSourcePath);

   $.ajax(encodeURI(designUri)).done(function (designData) {
      //console.log('SUCCESS design');
      //console.dir(designData);
      serverColumnDesign[containerId] = designData;
      callback(true);
   }
   ).fail(function (designData) {
      console.dir(designData);
      alert('Ajax call failed to retrieve view design: ' + designData.errorMsg);
   }
   );
}

function makeDesignPath(dataSourcePath) {    // serverDomain not needed here. it's set when creating the dbXAgents path
   return gServerDomain + dataSourcePath + '?ReadDesign&outputformat=json';
}

function makeDataPath(dataSourcePath) {
   return gServerDomain + dataSourcePath + '?ReadViewEntries&outputformat=json';
}

function fillInBaseColumns(viewConfig) {
   var designData = serverColumnDesign[viewConfig.containerId]
   // receives an array with the view design in key/value pairs

   var columns = designData['column'];
   for (var column in columns) {
      //var columnName = columns[column]['@name'];
      var itemName = columns[column]['@name'];
      var title = columns[column]['@title'];			// key: prog name	value: title
      var width = columns[column]['@width'];			// checka json i browsern
      //width *= 8;	// seems to mimic the value retrieved from 'ReadDesign'
      width = parseInt(width, 10);
      //console.log(" itemName: " + itemName + "   title: " + title + "   width: " + width + '   isnumber: ' + (typeof arguments.width === 'number'));

      // create a config from the backend info combined the default column type (LABEL)
      var columnCfg = new columnConfig({ itemName: itemName, title: title, width: width, type: COLUMN.LABEL });
      viewConfig.addBaseColumnConfig(columnCfg);
   }
}


function normalizeJson(inputData, optionalInfo, viewConfig) {
   // standardize the data and add it to gData
   var startTime = performance.now();

   // when ReadViewEntries is called and no entries are returned, the json has this content
   // {
   //   "@timestamp": "20170111T225707,58Z"
   // }
   var outputData = [];
   
   if (inputData.hasOwnProperty('viewentry')) {
      inputData = inputData['viewentry'];
   
      for (var i = 0, l = inputData.length; i < l; i++) {
            var entry = inputData[i];
            var outputEntry = {};
            outputEntry["@position"] = entry["@position"]
            outputEntry["@id"] = entry["@unid"]
            var entryData = entry["entrydata"];

            for (var j = 0, m = entryData.length; j < m; j++) {
               var field = entryData[j];
               var text = '';

               if (field["text"]) {
                  text = field["text"][0]
               }
               else if (field["textlist"]) {
                  //console.log('textlist found...' + field["textlist"].length);
                  var textArray = field["textlist"]["text"];
                  for (var k = 0, n = textArray.length; k < n; k++) {
                     if (k > 0)
                        text += '<br/>';
                     text += textArray[k][0];
                  }
                  //console.log('TXT: ' + text);
               }
               else if (field["datetime"]) {
                  text = field["datetime"][0];         // ie: 20100527T120429,61-05
               }
               else {
                  console.info(i + '__' + j + ': NOT text, textlist or datetime..');
               }
               var title = viewConfig.getBaseColumnTitleFromItemName(field["@name"]);
               //console.info(j + ": " + field["@name"] + "   text: ", text, "   title: " + title, viewConfig.baseColumnConfigs.length);
               //outputEntry[field["@name"]] = '' + text;
               outputEntry[title] = '' + text;
               // make sure it's a string. then we don't have to handle different sql where-variations
               // this operation is quick 75 million times in 0.1 second: http://jsperf.com/number-to-string/2
               // numeric sorting in columns and dropdown filters is done by settings numSort:true
            }
            outputData.push(outputEntry);
            //if (i === 0)
            //   //console.info('numero uno: ', outputEntry);
      }
      var topLevelEntries = inputData['@toplevelentries'];
      //console.info('@toplevelentries: ', topLevelEntries, '  inputData#: ', inputData.length);
      //console.info(inputData);
   }
   //console.info(inputData, outputData);
   //console.info('  looptime: ' + (performance.now() - startTime));
   return outputData;
}


function configureDatastore(viewConfig, dataStoreIndex, searchCriteria) {

   var optionalInfo = new Object();
   optionalInfo.dataStoreIndex = dataStoreIndex;
   optionalInfo.categorizedJson = false;   // TODO: ev skapa en klass med förifyllda default-värden
   optionalInfo.firstDatablock = true;
   optionalInfo.nextIndex = 1;						// first is 1 not 0
   optionalInfo.qtyRowsPerCall = 3000;	  	// qty of rows retrieved with each server call. note that 3000 is the maximum that domino views will return at a time
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
         //globalSearch = optionalInfo.searchCriteria;		         // need to save it to use for a flag later
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
      optionalInfo.uri += '&restricttocategory=' + encodeURIComponent(cfgCategory);
   }
   else {
      if (hasCfgRestrictToCategory) {
         // the restricttocategory parameter was present, but without a value.
         // for this situation we assume the view is categorized, but we will get all rows
         // including the category rows. this requires special handling so a flag is set.
         optionalInfo.categorizedJson = true;

         // NEW: when &category= is sent to backend, it filters out the category rows there
         optionalInfo.uri += '&restricttocategory=';
         //console.log("       optionalInfo.categorizedJson: " + optionalInfo.categorizedJson);
      }
   }
   return optionalInfo;
}


function retrieveData(data, optionalInfo, viewConfig) {
   var callAgain = false;
   if (data == null) {
      // calling sequence not started yet.
      callAgain = true;
   }
   else {
      data = normalizeJson(data, optionalInfo, viewConfig)
      //data = JSON.parse(JSON.stringify(data));  // seems to be needed, otherwise the data is malformed after being added to the sql database
      //console.info('normalized: ', data);
      if (!ViewHandler.hasGlobalData(optionalInfo.dataStoreIndex, viewConfig.containerId)) {
         ViewHandler.createGlobalData(optionalInfo.dataStoreIndex, data, viewConfig.containerId)
         //console.info("type 1");
      }
      else {         // data already exists. add more after
         //console.info("type 2   data already exists. add more after");
         for (var i = 0; i < (data.length) ; i++) {
            ViewHandler.appendGlobalData(optionalInfo.dataStoreIndex, data[i], viewConfig.containerId);
         }
      }

      var highestPos = -1;			// pos 1.1 etc in categorized views    // TODO: move out this logic to normalize-functions
      if (data) {   // undefined if there were no hits
         //console.log('_data.length: ' + data.length);

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
            //console.log('SETTING callAgain true (1)');
            // in a categorized view we don't know the hierarchical position of the next entry,
            // so we use the position of the last entry we retrieved (and filter it out when it's received)
            optionalInfo.nextIndex = highestPos;
            //console.log("optionalInfo.categorizedJson - callAgain " + callAgain + "        nextIndex: " + optionalInfo.nextIndex);
         }
         else {		// flat json
            //console.log('two..');
            //if (parseInt(highestPos, 10) < parseInt(data['@toplevelentries']), 10)		// TODO: ersätt?
            callAgain = true;
            //console.log('SETTING callAgain true (2)');
            optionalInfo.nextIndex = optionalInfo.nextIndex + optionalInfo.qtyRowsPerCall;
            //console.log("highestpos: " + highestPos + "  optionalInfo.nextIndex: " + optionalInfo.nextIndex);	
         }
         //console.log('callAgain: ' + callAgain);
      }

      if (optionalInfo.searchCriteria !== '') {	// when searching all entries are retrieved in one chunk
         callAgain = false;
      }
      //console.log("highestpos: " + highestPos + "  categorizedJson: " + optionalInfo.categorizedJson);	
      //callAgain = false;
   }

   ViewHandler.refreshProgress(optionalInfo.qtyDOMRows, viewConfig.containerId);

   if (callAgain === true) {
      //console.log('optionalInfo.uri: ' + optionalInfo.uri);
      var uri = optionalInfo.uri;
	   //var uri = optionalInfo.uri + getSeqParam();    

      if (optionalInfo.searchCriteria !== '') {
         //uri += '&search=' + encodeURIComponent(optionalInfo.searchCriteria);
         // TODO: use frontend-search
      }
      //else {
         uri += '&start=' + optionalInfo.nextIndex;
         uri += '&count=' + optionalInfo.qtyRowsPerCall;
      //}
      //else: skip start and count-parameters
      //console.log("call again - start: " + optionalInfo.nextIndex);
      //console.log("uri: " + uri);
      //console.log("ENCODE uri: " + uri);

      //$.ajax(encodeURI(uri)).done(function(data) {		// cannot encode here. it doesn't handle values with & insides it
      $.ajax(uri).done(function (data) {
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

