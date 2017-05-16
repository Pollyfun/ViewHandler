'use strict';

// const used so we don't have to fill it in in various places
// when there's just one ViewHandler frame.
var DEFAULT_CONTAINER = 'viewhandler';
var descending = 'descending';	  // convenience variable when configuring columns
var OPTION_RULE_DEFAULT = '';
var OPTION_RULE_STARTS_WITH = 'startswith';


// bridge between the container frame and the viewhandler frame
var ViewHandler = function () {

   // hierarchy illustration: https://developer.mozilla.org/en-US/docs/Inner_and_outer_windows#Nested_windows
   // members that exist for performance reasons. makes a big difference especially in IE8 and IE9
   var _iframes = [];   // one entry per iframe
   var _windows = [];   // one entry per iframe    a window object exists inside each iframe


   function getContainerId(containerId) {		// containerId is optional
      containerId = $.trim(containerId);
      if (containerId === '')
         return DEFAULT_CONTAINER;

      return containerId;
   }

   function getWindow(containerId) {		// containerId is optional
      containerId = getContainerId(containerId);	// replace '' with default container name
      //console.log('getWindow ' + containerId + ': ' + _windows[containerId]);

      if (typeof _windows[containerId] === 'undefined') {
         //console.log("   undefined VIEW containerId. CREATING! " + containerId);
         // defaultView doesn't work in IE8
         _windows[containerId] = getIframeDocument(containerId).defaultView || getIframeDocument(containerId).parentWindow;
         //console.log("   CREATED: " + _windows[containerId]);
      }
      return _windows[containerId];

      // TODO: ev använd iframe.contentWindow   https://developer.mozilla.org/en-US/docs/Inner_and_outer_windows#Nested_windows
      // The <iframe> element offers the contentWindow property, which gives you the outer window Window object containing the frame's document.
   }

   function getIframeDocument(containerId) {	// containerId is optional
      /*
		// SAVE THIS TEST:
		console.log(frameViewHandler.document);						// works in IE, Safari		undefined in Chrome, FF
		console.log(frameViewHandler.contentDocument);				// works in Chrome, FF		undefined in IE, Safari
		console.log(frameViewHandler.contentWindow.document);		// works in Chrome, FF		undefined in IE, Safari
		*/
      containerId = getContainerId(containerId);	// replace '' with default frame name
      if (typeof _iframes[containerId] === 'undefined') {
         //console.log("getIframeDocument___undefined containerId. CREATING! " + containerId + '  window.frames[containerId]: ' + window.frames[containerId]);
         //console.dir('window.frames#: ' + window.frames.length);
         //console.dir($('#' + containerId + ' iframe').length);
         //_iframes[containerId] = window.frames[containerId];		// VERY slow operation in IE8/IE9, only do it once per containerId
         _iframes[containerId] = $('#' + containerId + ' iframe')[0];  // VERY slow operation in IE8/IE9, only do it once per containerId
         //The frames property returns an array-like object, which represents all <iframe> elements in the current window.
         //The <iframe> elements can be accessed by index numbers. The index starts at 0.
      }
      //else {
      //   console.log('getIframeDocument___ALREADY defined: ' + containerId);
      //}
      if (_iframes[containerId].contentDocument) 		// FF, Chrome
         return _iframes[containerId].contentDocument;
      else //if (_iframes[containerId].document ) 		// IE, Safari
         return _iframes[containerId].document;

      // annan variant här: http://javascript.info/tutorial/frames-and-iframes     var doc = iframe.contentWindow.document
   }

   function resetFilter(containerId) {		   // containerId is optional
      //console.log('resetFilter: ' + containerId);
      getWindow(containerId).resetFilter(false);
   }

   // currently not used, but might be useful
   /*function reloadEmbeddedFrame(containerId) {	// containerId is optional
     window.frames[getContainerId(containerId)].location.reload(true);    // reload the frame to see the new pictures
     // reloading the iframe automatically triggers resizeIframe after DOM is created
  }*/

   // after creating dynamic content, the size of the iframe needs to be updated
   function resizeIframe(onlyIncrease, viewConfig) {		// if true the frame will only allow increase. viewConfg contains containerId.
      //return;
      //console.log('INTERFACE resizeIframe ' + getContainerId(containerId) + '___' + containerId + '___' + id);
      var MIN_HEIGHT = 330;	// gives a minimum space

      var resizeIframe_part2 = function () {		// only called from resizeIframe()
         var docBody = getIframeDocument(viewConfig.containerId).body;
         var newHeight = $(docBody).find('#data-area').height() + 70;		//470;
         if (newHeight < MIN_HEIGHT)
            newHeight = MIN_HEIGHT;

         //console.log('INTERFACE resizeIframe_part2 ' + docBody + '___' + id);
         if (onlyIncrease === true) {
            var oldHeight = parseInt($('#' + getContainerId(viewConfig.containerId) + ' iframe').css('height'), 10); // fix1
            if (newHeight <= oldHeight) {
               //console.log("new: " + newHeight + "  old: " + oldHeight + "  NOT allowed");
               return;	// not allowed
            }
            //else
            //console.log("new: " + newHeight + "  old: " + oldHeight + "  Allowed");
         }
         //else
         //console.log("newHeight from data-area: " + newHeight);

         //alert("resizeIframe to " + newHeight);
         //console.log("_____resizeIframe - newHeight: " + newHeight);
         if (viewConfig.useOuterScroll === true) {
            $('#' + getContainerId(viewConfig.containerId) + ' iframe').css('height', newHeight);
         }
         else {  // inner scroll:
            var doc = $('#' + getContainerId(viewConfig.containerId) + ' iframe');  // fix1
            //console.dir(doc);
            //console.log('doc height: ' + $(doc).css('height'));
            newHeight = $(doc).css('height');
            //var newWidth = $(doc).css('width');
            //console.log("SIZE from iframe. HEIGHT: " + newHeight + '  WIDTH: ' + newWidth);

            var extractedHeight = newHeight.match(/\d+/)[0] // "3"
            extractedHeight -= 22;   // compensate for body padding-top and bottom (11 each)
            extractedHeight -= 24;
            //console.log('extractedHeight: ' + extractedHeight);
            //console.log('found inside#: ' + $(docBody).find('#viewhandler').length);
            $(docBody).find('#main-area').css('height', extractedHeight);
            //$(docBody).find('#main-area').css('width', newWidth);	// skipped. auto sizes to the content width
         }
      }
      // we need a timeout here so the browser can update the dynamically created content and set the height-attributes correctly
      setTimeout(function () { resizeIframe_part2(); }, 200);	// 10 ms is too short. 100 seems ok. Dynamic DOM for the images needs to be fully constructed first	
   }

   // sets the height immediately
   function setIframeHeight(height, containerId) {	// containerId is optional
      //console.log("_____setIframeHeight: " + height);
      //	var docBody = getIframeDocument(containerId).body;
      $('#' + getContainerId(containerId) + ' iframe').css('height', height);  // fix1
   }
   function setIframeWidth(width, containerId) {	// containerId is optional
      //console.log("_____setIframeWidth: " + width);
      //	var docBody = getIframeDocument(containerId).body;
      $('#' + getContainerId(containerId) + ' iframe').css('width', width);
   }


   // it's called afterwards to refresh the current view
   function refreshWindow(unid, containerId) {			// containerId is optional
      var view = getWindow(containerId);
      if (view.refreshWindow)
         view.refreshWindow(unid);
   }

   function clickedOnParentForm(containerId) {		// containerId is optional
      //if (typeof getWindow(containerId).closeOpenDropfilters === 'undefined') {  // can happen temporarily while replacing an old iframe container with a new (changing views)
      //    console.log('clickedOnParentForm.... no iframe exists');
      //    return;
      //}
      getWindow(containerId).closeOpenDropfilters();
   }

   function getExcelColumnsParam(containerId) {				// containerId is optional
      return getWindow(containerId).getExcelColumnsParam();
   }

   // returns an array of objects containing the data specified in cfg
   function retrieveFilterData(cfg, containerId) {				// containerId is optional
      return getWindow(containerId).retrieveFilterData(cfg);
   }

   function getOffsetY(domId) {
      var object = $('#' + domId + ' iframe')[0];
      //console.log('getOffsetY: ' + object + '    domId: ' + domId);
      var y = 0;
      while (object) {
         y += object.offsetTop;
         object = object.offsetParent;
      }
      return y;
   }

   function createExcel(uri, unids) {
      //console.log('EXCEL uri: ' + uri + '  IDs: ' + unids);
      //return;

      // to succesfully submit the newly created form in IE it has to be appended to the DOM body first.
      // http://stackoverflow.com/questions/16201278/jquerys-form-submit-not-firing-for-ie-only-mvc3-app
      var form = $('<form action="' + uri + '" method="post"><input name="ids" value="' + unids + '"></input></form>');
      $('body').append(form);
      $(form).submit();
      $(form).remove();
   }



   function doFullSearch(searchCriteria, containerId) {		// containerId is optional
      //console.log('searchCriteria: ' + searchCriteria);
      return getWindow(containerId).doFullSearch(searchCriteria);
   }

   function hasGlobalSearch(containerId) {		// containerId is optional
      return getWindow(containerId).hasGlobalSearch();
   }

   function printFilters(containerId) {		// containerId is optional
      return getWindow(containerId).printFilters();
   }

   function refreshDrop(dropFilter, containerId) {		// containerId is optional
      return getWindow(containerId).refreshDropdowns(dropFilter);
   }

   function createGroup(groupName, members, rules, containerId) {		            // containerId is optional
      return getWindow(containerId).createGroup(groupName, members, rules);
   }

   function getGroupFromCollection(collection, groupName, containerId) {		    // containerId is optional
      return getWindow(containerId).getGroupFromCollection(collection, groupName);
   }

   function selectMembersFromGroup(dropFilter, group, containerId) {		        // containerId is optional
      return getWindow(containerId).selectMembersFromGroup(dropFilter, group);
   }

   function createDOMOption(value, text, selected, attributes, containerId) {		// containerId is optional      - onödig här?  ta bort containerId där fknen är generisk
      return getWindow(containerId).createDOMOption(value, text, selected, attributes);
   }

   function createActiveFilterDOM(activeFilters, containerId) {		// containerId is optional
      return getWindow(containerId).createActiveFilterDOM(activeFilters);
   }

   function query(sql, containerId) {		// containerId is optional
      return getWindow(containerId).query(sql);
   }

   function queryParam1(sql, param1, containerId) {        // containerId is optional
      return getWindow(containerId).queryParam1(sql, param1);
   }

   function getColumnInfoQty(containerId) {		// containerId is optional
      return getWindow(containerId).getColumnInfoQty();
   }

   function getColumnInfoFromTitle(title, containerId) {		// containerId is optional
      return getWindow(containerId).getColumnInfoFromTitle(title);
   }

   function getColumnInfoFromIndex(index, containerId) {		// containerId is optional
      return getWindow(containerId).getColumnInfoFromIndex(index);
   }

   function getSQLSelect(containerId) {		// containerId is optional
      return getWindow(containerId).getSQLSelect();
   }

   function extractCellValue(value, containerId) {		// containerId is optional
      return getWindow(containerId).extractCellValue(value);
   }

   // add a function to be called after createView() has completed, and before anything else
   var _sharedCallback = null;
   function addPostConfigurationCallback(sharedCallback) {
      _sharedCallback = sharedCallback;
      //console.log('addPostConfigurationCallback: ' + _sharedCallback);
   }
   function getSharedCallback() {
      return _sharedCallback;
   }

   var _dataStoreConfigurator = null;
   function addDataStoreConfigurator(dataStoreConfigurator) {
      _dataStoreConfigurator = dataStoreConfigurator;
      //console.log('addDataStoreConfigurator: ' + _dataStoreConfigurator);
   }
   function getDataStoreConfigurator() {
      return _dataStoreConfigurator;
   }

   function hasGlobalData(dataStoreIndex, containerId) {		// containerId is optional
      return getWindow(containerId).hasGlobalData(dataStoreIndex);
   }
   function createGlobalData(dataStoreIndex, data, containerId) {		// containerId is optional
      getWindow(containerId).createGlobalData(dataStoreIndex, data);
   }
   function appendGlobalData(dataStoreIndex, data, containerId) {		// containerId is optional
      //getWindow(containerId).globalData[dataStoreIndex].push(data);
      getWindow(containerId).appendGlobalData(dataStoreIndex, data);
   }
   
   function refreshProgress(qtyDOMRows, containerId) {		// containerId is optional
      getWindow(containerId).refreshProgress(qtyDOMRows);
   }

   var _retrieveDataFcn = null;
   function addRetrieveDataFunction(fcn) {
      _retrieveDataFcn = fcn;
      //console.log('addRetrieveDataFunction: ' + _retrieveDataFcn);
   }
   function getRetrieveDataFunction() {
      return _retrieveDataFcn;
   }


   function getDataStoresLooped(dataStoreIndex, searchCriteria, containerId) {		// containerId is optional
      return getWindow(containerId).getDataStoresLooped(dataStoreIndex, searchCriteria);
   }

   function finalizeConfiguration(containerId) {		// containerId is optional
      return getWindow(containerId).finalizeConfiguration();
   }

   function getViewConfig(containerId) {		// containerId is optional
      return getWindow(containerId).getViewConfig();
   }

   function refreshDOM(containerId) {		// containerId is optional
      return getWindow(containerId).refreshDOM();
   }

   // viewHandlerPath examples:
   // /ViewHandler.html                                        - html-file in local dir
   // /psk/ViewHandler.nsf/ViewHandler.html?OpenFileResource   - html-file is inside a domino .nsf file
   function createView(containerId, configName, viewHandlerPath, callback) { // containerId first. mandatory here.
      // TODO: callback mandatory..?
      callbacks[containerId] = callback;
      //console.log('createView....containerId: ' + containerId + '  configName: ' + configName + '  viewHandlerPath: ' + viewHandlerPath);

      // delete any old iframe that's being replaced
      delete _windows[containerId];
      delete _iframes[containerId];

      $('#' + containerId).empty();
      // create iframe for the viewhandler
      // TODO: autofix width. width also in css, but the header becomes visible too early (wrong width) without width here
      // seems width and height has to be here to be correct immediately
      $('#' + containerId).append('<iframe style="width: 1760px;height:400px;" frameborder="0"></iframe>');
      
      var separator = ~viewHandlerPath.indexOf('?') ? '&' : '?';
      var url =  viewHandlerPath + separator + 'containerid=' + containerId + '&configname=' + configName;
      //console.log('createView: ' + configName + '  URL: ' + url);
      $('#' + containerId + ' iframe').attr('src', url);
   }

   // public functions
   return {
      // alias:name
      getContainerId: getContainerId,
      getWindow: getWindow,
      getIframeDocument: getIframeDocument,
      resetFilter: resetFilter,
      resizeIframe: resizeIframe,
      setIframeHeight: setIframeHeight,
      setIframeWidth: setIframeWidth,
      clickedOnParentForm: clickedOnParentForm,
      refreshWindow: refreshWindow,
      getExcelColumnsParam: getExcelColumnsParam,
      retrieveFilterData: retrieveFilterData,
      getOffsetY: getOffsetY,
      createExcel: createExcel,
      doFullSearch: doFullSearch,
      hasGlobalSearch: hasGlobalSearch,

      printFilters: printFilters,     // TEMP
      refreshDrop: refreshDrop,         // TEMP   onödig nu?
      createGroup: createGroup,
      getGroupFromCollection: getGroupFromCollection,
      selectMembersFromGroup: selectMembersFromGroup,
      createDOMOption: createDOMOption,
      createActiveFilterDOM: createActiveFilterDOM,
      query: query,
      queryParam1: queryParam1,
      getColumnInfoQty: getColumnInfoQty,
      getColumnInfoFromTitle: getColumnInfoFromTitle,
      getColumnInfoFromIndex: getColumnInfoFromIndex,
      getSQLSelect: getSQLSelect,
      extractCellValue: extractCellValue,

      createView: createView,
      addPostConfigurationCallback: addPostConfigurationCallback,
      getSharedCallback: getSharedCallback,
      addDataStoreConfigurator: addDataStoreConfigurator,
      getDataStoreConfigurator: getDataStoreConfigurator,
      addRetrieveDataFunction: addRetrieveDataFunction,
      getRetrieveDataFunction: getRetrieveDataFunction,
      getDataStoresLooped: getDataStoresLooped,
      finalizeConfiguration: finalizeConfiguration,
      hasGlobalData: hasGlobalData,
      createGlobalData: createGlobalData,
      appendGlobalData: appendGlobalData,
      refreshProgress: refreshProgress,
      getViewConfig: getViewConfig,
      refreshDOM: refreshDOM
   }
}();

var callbacks = [];
function frameWasCreated(viewConfig) {
   //console.log('frameWasCreated! ' + viewConfig.containerId);
   if (typeof callbacks[viewConfig.containerId] === 'function') {
      callbacks[viewConfig.containerId](viewConfig);
      //console.log(' after callback...' + ViewHandler.getSharedCallback());
      if (typeof ViewHandler.getSharedCallback() === 'function') {
         //console.log('before shared callback..');
         var cbShared = ViewHandler.getSharedCallback();
         var pause = cbShared(viewConfig);
         //console.log('pause: ' + pause);
         return pause;
      }
   }
   else {
      console.log('<ERROR> no callback defined for: ' + viewConfig.containerId)
   }
   return false;  // no pause
}

// this function is called from other windows. from there ViewHandler.refreshEntry() cannot 
// be reached directly. Perhaps because of browser security restrictions (anonymous functions not allowed).
function refreshEntry(unid, containerId) {		// containerId is optional       probably OBSOLETE - inner window is reached directly with window.opener.refreshEntry(docunid);
   //console.log("INTERFACE. refreshEntry " + unid);
   ViewHandler.refreshWindow(unid, containerId);
}
