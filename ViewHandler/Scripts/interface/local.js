'use strict';
// https://www.ibm.com/developerworks/lotus/library/ls-Domino_URL_cheat_sheet/

// dynamically include columnInfo.js and interface/viewHandler.js
var scripts = document.getElementsByTagName('script');	// get all scripts
var fullPath = scripts[scripts.length - 1].src;				// extract the path of this file
var newPath = fullPath.replace('interface/local.js', 'columnInfoVH.js');
document.write('<script src="' + newPath + '"></script>');
newPath = fullPath.replace('interface/local.js', 'interface/viewHandler.js');
document.write('<script src="' + newPath + '"></script>');

var gServerDomain = '';  // needed when localhost to retrieve server data
var serverColumnDesign = [];  // one entry per viewhandler container (when changing config inside the same container the design is replaced).
// if there's several datasources in the viewhandler, the design is only retrieved from the first one.

function createView(cfg) {
   console.info('local createView ', cfg.viewHandlerPath);
   ViewHandler.addPostConfigurationCallback(sharedLocalConfiguration);  // for retrieving column design from the first datastore and to fill in base columns (same for all psk viewhandlers)
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
   console.log('containerId: ' + cfg.containerId + '  configName: ' + cfg.configName);
   refreshViewHandler();
}


// triggered after createView() has been processed
// used to retrieve the design for the first datastore, and to fill in base columns
function sharedLocalConfiguration(viewConfig) {
   //console.log('sharedLocalConfiguration..' + viewConfig);

   //var designUrl = viewConfig.getSourceDbUrl(0) + '/' + viewConfig.getSourceView(0);
   ////console.log('designUrl: ' + designUrl);
   //// designUrl: /kund/psk/xagents.nsf/view.xsp/entries?uri=/names.nsf/People.simple

   //getServerDesign(viewConfig.containerId, designUrl, function (success) {    // fills in serverColumnDesign
   //   //console.log('after getServerDesign: ' + success);
   //   fillInBaseColumns(viewConfig);
   //   // well..  xagents datapathen skapas här för tillfället. behövs en pks.getData() fkn som extraherar ut allt xagents/domino specifikt och sköter bl.a. detta.
   //   //console.log('qty datastores: ' + viewConfig.dataStores.length);
   //   for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
   //      //console.log('DataStore' + i + ': ' + viewConfig.dataStores[i].url)
   //      viewConfig.dataStores[i].url = makeDataPath(viewConfig.dataStores[i].url);
   //      //console.log('  ---> ' + viewConfig.dataStores[i].url)
   //   }
   //   ViewHandler.finalizeConfiguration(viewConfig.containerId);
   //});
   //return true;   // true = pause the execution until we're finished here

   ViewHandler.finalizeConfiguration(viewConfig.containerId);
   return true;
}



function configureDatastore(viewConfig, dataStoreIndex, searchCriteria) {

   var optionalInfo = new Object();
   optionalInfo.dataStoreIndex = dataStoreIndex;
   optionalInfo.categorizedJson = false;   // TODO: ev skapa en klass med förifyllda default-värden
   optionalInfo.firstDatablock = true;
   //optionalInfo.nextIndex = 1;						// first is 1 not 0
   //optionalInfo.qtyRowsPerCall = 3000;	  	// qty of rows retrieved with each server call. note that 3000 is the maximum that domino views will return at a time
   optionalInfo.uri = viewConfig.dataStores[dataStoreIndex].url;
   optionalInfo.qtyDOMRows = 0;
   optionalInfo.searchCriteria = ''

   //if (dataStoreIndex === 0) {      // ignore the searchCriteria in additional dataStores
   //   optionalInfo.searchCriteria = $.trim(searchCriteria);

   //   if (optionalInfo.searchCriteria === '') {
   //      //globalSearch = '';
   //      optionalInfo.globalSearch = '';  // used to return the variable to the global variable inside viewHandler.js. perhaps change this
   //   }
   //   else {
   //      //globalSearch = optionalInfo.searchCriteria;		         // need to save it to use for a flag later
   //      optionalInfo.globalSearch = optionalInfo.searchCriteria;		// need to save it to use for a flag later
   //      optionalInfo.searchCriteria = '*' + optionalInfo.searchCriteria + '*';
   //   }
   //}

   //var hasCfgRestrictToCategory = false;
   //var cfgCategory = viewConfig.dataStores[dataStoreIndex].category;
   //if (typeof cfgCategory !== 'undefined')
   //   hasCfgRestrictToCategory = true;
   //else
   //   cfgCategory = ''

   //if (cfgCategory !== '') {
   //   optionalInfo.uri += '&restricttocategory=' + encodeURIComponent(cfgCategory);
   //}
   //else {
   //   if (hasCfgRestrictToCategory) {
   //      // the restricttocategory parameter was present, but without a value.
   //      // for this situation we assume the view is categorized, but we will get all rows
   //      // including the category rows. this requires special handling so a flag is set.
   //      optionalInfo.categorizedJson = true;

   //      // NEW: when &category= is sent to backend, it filters out the category rows there
   //      optionalInfo.uri += '&restricttocategory=';
   //      //console.log("       optionalInfo.categorizedJson: " + optionalInfo.categorizedJson);
   //   }
   //}
   return optionalInfo;
}



function retrieveData(data, optionalInfo, viewConfig) {
   var callAgain = false;
   if (data == null) {
      // calling sequence not started yet.
      callAgain = true;
   }
   else {
      console.info(data);

      data = normalizeJson(data, optionalInfo)
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
      callAgain = false;
   }

   //optionalInfo.qtyDOMRows = 55;
   ViewHandler.refreshProgress(optionalInfo.qtyDOMRows, viewConfig.containerId);

   if (callAgain === true) {
      var uri = optionalInfo.uri;

      console.log('URI: ' + uri);
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
      ViewHandler.getDataStoresLooped(optionalInfo.dataStoreIndex + 1, optionalInfo.searchCriteria, viewConfig.containerId);
   }
}


//function normalizeJson(inputData, optionalInfo) {     // psk-data
//   // standardize the data and add it to gData
//   //console.info('normalizeJson ');
//   //console.info(inputData);
//   inputData = inputData['@entries'];
//   //console.info(inputData);
//   var outputData = [];

//   for (var i = 0, l = inputData.length; i < l; i++) {
//      var inputEntry = inputData[i];
//      var outputEntry = {};

//      //if (i === 0) console.info('numero ino: ', inputEntry);
//      //inputEntry["_tum"] = 95;
//      var counter = 0;
//      for (var property in inputEntry) {
//         if (inputEntry.hasOwnProperty(property)) {
//            //console.info(counter + ": ", property, inputEntry[property]);
//            outputEntry[property] = '' + inputEntry[property];   // make sure it's a string. then we don't have to handle different sql where-variations
//            counter++;
//         }
//         else
//            console.log('invalid prop: ' + property);
//      }
//      //if (i === 0) console.info('numero uto: ', outputEntry);
//      outputData.push(outputEntry);
//   }
//   console.info('inputData: ', inputData);
//   console.info('outputData: ', outputData);

//   var data = [];
//   for (var i = 0; i < 500; i++) {
//      data[i] = {
//         title: "Task " + i,
//         duration: "5 days",
//         percentComplete: Math.round(Math.random() * 100),
//         start: "01/01/2009",
//         finish: "01/05/2009",
//         effortDriven: (i % 5 == 0)
//      };
//   }
//   console.info('testData: ', data);


//   return outputData;
//}


function normalizeJson(inputData, optionalInfo) {     // psk-data
   // standardize the data and add it to gData
   //console.info('normalizeJson ');
   //console.info(inputData);
   //inputData = inputData['@entries'];
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
            outputEntry[property] = '' + inputEntry[property];   // make sure it's a string. then we don't have to handle different sql where-variations
            counter++;
         }
         else
            console.log('invalid prop: ' + property);
      }
      //if (i === 0) console.info('numero uto: ', outputEntry);
      outputData.push(outputEntry);
   }
   console.info('inputData: ', inputData);
   console.info('outputData: ', outputData);

   //var data = [];
   //for (var i = 0; i < 500; i++) {
   //   data[i] = {
   //      title: "Task " + i,
   //      duration: "5 days",
   //      percentComplete: Math.round(Math.random() * 100),
   //      start: "01/01/2009",
   //      finish: "01/05/2009",
   //      effortDriven: (i % 5 == 0)
   //   };
   //}
   //console.info('testData: ', data);

   return outputData;
}