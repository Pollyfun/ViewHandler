'use strict';

// dynamically include columnInfo.js and interface/api.js
var scripts = document.getElementsByTagName('script');	// get all scripts
var fullPath = scripts[scripts.length - 1].src;				// extract the path of this file
var newPath = fullPath.replace('interface/local.js', 'columnInfoVH.js');
document.write('<script src="' + newPath + '"></script>');
newPath = fullPath.replace('interface/local.js', 'interface/api.js');
document.write('<script src="' + newPath + '"></script>');

var gServerDomain = '';  // needed when localhost to retrieve server data
var serverColumnDesign = [];  // one entry per viewhandler container (when changing config inside the same container the design is replaced).
// if there's several datasources in the viewhandler, the design is only retrieved from the first one.

function createView(cfg) {
   //console.info('local createView ', cfg.viewHandlerPath);
   ViewHandler.addPostConfigurationCallback(sharedLocalConfiguration);  // for retrieving column design from the first datastore and to fill in base columns (same for all psk viewhandlers)
   ViewHandler.addDataStoreConfigurator(configureDatastore);
   ViewHandler.addRetrieveDataFunction(retrieveData);

   gServerDomain = $.trim(cfg.serverDomain);

   var refreshViewHandler = function () {
      var isLocalHost = location.href.indexOf('localhost') > -1;

      var viewHandlerPath = '/ViewHandler.html';
      var cfgViewHandlerPath = $.trim(cfg.viewHandlerPath);
      if (!isLocalHost && cfgViewHandlerPath === '')
         cfgViewHandlerPath = '/ViewHandler/ViewHandler';   // running on server, and no path defined. use this default.
      viewHandlerPath = cfgViewHandlerPath + viewHandlerPath;

      ViewHandler.createView(cfg.containerId, cfg.configName, viewHandlerPath, (typeof configureView === 'function' ? configureView : null));
   }
   //console.log('containerId: ' + cfg.containerId + '  configName: ' + cfg.configName);
   refreshViewHandler();
}

// triggered after createView() has been processed
// used to retrieve the design for the first datastore, and to fill in base columns
function sharedLocalConfiguration(viewConfig) {
   //console.log('sharedLocalConfiguration..' + viewConfig);
   ViewHandler.finalizeConfiguration(viewConfig.containerId);
   return true;
}

function configureDatastore(viewConfig, dataStoreIndex, searchCriteria) {

   var optionalInfo = new Object();
   optionalInfo.dataStoreIndex = dataStoreIndex;
   optionalInfo.categorizedJson = false;   // TODO: ev skapa en klass med förifyllda default-värden
   optionalInfo.firstDatablock = true;
   optionalInfo.uri = viewConfig.dataStores[dataStoreIndex].url;
   optionalInfo.qtyDOMRows = 0;
   optionalInfo.searchCriteria = ''

   return optionalInfo;
}

function retrieveData(data, optionalInfo, viewConfig) {
   //console.info('local.js retrieveData() data: ', data, optionalInfo, viewConfig);

   var callAgain = false;
   if (data == null) {
      // calling sequence not started yet.
      callAgain = true;
   }
   else {
      //console.info(data);
      data = normalizeJson(data, optionalInfo, viewConfig)
      //data = JSON.parse(JSON.stringify(data));  // seems to be needed, otherwise the data is malformed after being added to the sql database
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

   ViewHandler.refreshProgress(optionalInfo.qtyDOMRows, viewConfig.containerId);

   if (callAgain === true) {
      //console.log('type: ' + typeof optionalInfo.uri);
      if (typeof optionalInfo.uri === 'undefined') { // no ordinary datasource. raw data.
         retrieveData(viewConfig.dataStores[optionalInfo.dataStoreIndex].data, optionalInfo, viewConfig);
      }
      else {
         var uri = optionalInfo.uri;
         $.ajax(uri).done(function (data) {
            retrieveData(data, optionalInfo, viewConfig);
         }
         ).fail(function (data) {
            console.dir(data);
            // don't use alert() since it happens when switching between (big) views without finishing the load first
            console.log('Ajax call failed to retrieve view data: ' + data.errorMsg);
         })
      }
   }
   else {
      ViewHandler.getDataStoresLooped(optionalInfo.dataStoreIndex + 1, optionalInfo.searchCriteria, viewConfig.containerId);
   }
}


function normalizeJson(inputData, optionalInfo, viewConfig) {
   // standardize the data and add it to gData
   var outputData = [];
   for (var i = 0, l = inputData.length; i < l; i++) {
      var inputEntry = inputData[i];
      var outputEntry = {};
      var counter = 0;
      for (var property in inputEntry) {
         if (inputEntry.hasOwnProperty(property)) {
            outputEntry[property] = '' + inputEntry[property];   // make sure it's a string. then we don't have to handle different sql where-variations
            counter++;
         }
         else
            console.log('invalid prop: ' + property);
      }
      outputData.push(outputEntry);
   }
   //console.info('inputData: ', inputData);
   //console.info('outputData: ', outputData);

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
   return outputData;
}