'use strict';

var TABLE_FILTERS = 'filters';
var PREFIX_SORT = 'sort_';
var DATA_SEPARATOR = '||';			// separates display/alt/sort/filter values in a cell
var SORT_ARROW_WIDTH = 14;
var ICON_FONT_BASE = 'glyphicon';
var ICON_ARROW_UP = 'glyphicon-arrow-up';			// when Sass is used, a generic class (ie: sortarrowup) could be used here instead. and the bootstrap-class 'glyphicon-arrow-up' could be added in the .css (making it possible to override the bootstrap layout)
var ICON_ARROW_DOWN = 'glyphicon-arrow-down';
var DISABLE_CACHE = true;		// use true during development
var ROW_NORMAL = 'normal';
var ROW_TOTALS = 'totals';
var OPTION_RULE_DEFAULT = '';
var OPTION_RULE_STARTS_WITH = 'startswith';  // ev: flytta ut till gemensam fil (interface / viewHandler)

// variables used when calculating qty of DOM rows to create
var STANDARD_ROW_HEIGHT = 24; // pixels
var windowMinY = Infinity;
var windowMaxY = -1;
var BUFFER_HEIGHT = 20 * STANDARD_ROW_HEIGHT;            // render these before and after the center render area
var WINDOW_HEIGHT = 20 * STANDARD_ROW_HEIGHT;

var spinner;
var viewConfig;
var columnInfos = [];
var sortColumnIndex = -1;
var sortAscending = true;

var bodyWidth = '100%';	// todo: probably can replace this (used when innerScroll=true)
//var fullWidth = 1000;
var ulWidth = '100%';

var globalData = [];	// contains all the jsondata. appending after each call. one per dataStore
var globalSearch = '';


function getRowSelector() {
   return '#data-content ul.' + ROW_NORMAL;
}
rowSelector = getRowSelector;		// declared inside dropFilter.js

$(function () {
   //console.log('start iframe........................');
   // set some widths based on the width of the iframe body
   //fullWidth = parseInt($('body').css('width').replace('px',''), 10);	// doesn't work in IE8/IE9 (returns 34687px)
   //var width2 = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;   
   //width2 = 2000;
   //fullWidth = width2;    
   //console.log('fullWidth: ' + fullWidth);		// 34687
   var paramContainerId = $.trim(getURLParameter('containerid'));      // id for the container
   var paramConfigName = $.trim(getURLParameter('configname'));
   //console.log('RECEIVED paramContainerId: ' + paramContainerId);
   //console.log('RECEIVED paramConfigName: ' + paramConfigName);

   //$('#main-area').css('width', '100%');
   showSpinner();      // later than createFilterPanel(). otherwise the filterpanel appear before it's filled in

   // subscribe to dropFilter events
   $(window).on('filtercontentwasupdated', function (e) {
      handleFilterOptions(e.excludeDropFilter);                     // first way to pass parameter
   });
   $(window).on('filterupdate_start', function (e, dropdown) {      // second way to pass parameter. TODO: choose best one
      handleFilterUpdateStart(dropdown);
   });
   $(window).on('filterupdate_end', function (e, dropdown) {
      //console.log('on filterupdate_end ' + dropdown);
      handleFilterUpdateEnd(dropdown);
   });
   addEventListeners();

   overrideTranslation();
   createLocalFilterTable(); // före addFilter
   var pauseForAsync = initViewConfiguration(paramContainerId, paramConfigName);	// creates the viewConfig. important to do this before the viewConfig is referenced

   if (pauseForAsync !== true) {
      //console.log('no pause');
      finalizeConfiguration();     // proceed immediately
   }
   else {
      //console.log('pausing for now..');
   }
});


function finalizeConfiguration() {
   preprocessViewConfiguration();      // add .css files

   if (viewConfig.dataStores.length === 0) {
      console.log('<ERROR> no datastores configured');
      return;
   }
   //console.log('finalizeConfiguration - viewConfig.configName: ' + viewConfig.configName);
   $('#data-content').attr('config', viewConfig.configName);

   createLocalDatabase();
   getDataStoresLooped(0, '');
}

function getViewConfig() {
   return viewConfig;
}

function refreshDOM() {
   generateDOM(true, false);
}

function preprocessViewConfiguration() {
   var html = '';
   for (var i = 0, l = viewConfig.cssFiles.length; i < l; i++) {
      //console.log('APPEND CSS: ' + viewConfig.cssFiles[i]);
      $('head').append('<link rel="stylesheet" href="' + viewConfig.cssFiles[i] + '">');
   }
}

function getURLParameter(name) {
   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}
function hasUrlParameter(name, url) {
   if (!url) url = window.location.href;
   name = name.replace(/[\[\]]/g, "\\$&");
   var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
       results = regex.exec(url);
   if (!results)
      return false;

   return true;
}

// not perfect to override 'constants', but without a real language module this'll have to do
function overrideTranslation() {
   if (typeof parent.translateWord !== 'undefined') {
      TEXT_STATUS_DROPDOWN_OPTION_UNSELECT = '(' + parent.translateWord('unselect') + ')';	// for single-select
      TEXT_ALL = parent.translateWord('all');	               // for multi-select
      TEXT_NONE = parent.translateWord('none');	               // for multi-select
   }
}

function createLocalFilterTable() {		// merge to createLocalDatabase - addFilter() funkar inte nu om inte denna skapas först
   alasql('CREATE TABLE ' + TABLE_FILTERS);
} 

function createLocalDatabase() {
   //console.log('__________________________________________________________________________________________________________________________________');
   for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
      //console.log('createLocalDatabase DataStore' + i + ': ' + viewConfig.dataStores[i].alias);
      alasql('CREATE TABLE ' + viewConfig.dataStores[i].alias);
   }

   alasql.fn.EXTRACT_NUMERIC = function (value) {
      // ex: 13s --> 13, 1a --> 1
      // TODO: just extract the initial numbers, not all numbers
      if (typeof value === 'undefined')
         return value;
      //var before = value;
      //value === '' ? '0' : value;
      value = $.trim(value);      // make a string so replace() is sure to exist
      value = value.replace(/\D/g, '');
      //if (before != value)
      //console.log(before + " ---> " + value);
      return value;
   }

   alasql.fn.EXTRACT_SORTVALUE = function (value) {
      var sortValue = extractSortValue(value);	// extract display, alt, sort, filter, (list)
      //console.log(sortValue + '___' + value);
      return sortValue;
   }

   // used when creating the filter-column
   alasql.fn.EXTRACT_FILTERVALUE = function (value) {   // returns array of values (most often only 1)
      //console.info('info', value);
      var cfgValues = extractFilterValue(value); // extract filterValue, filterText
      //console.log('EXTRACT_FILTERVALUE ' + cfgValues.filterValue + ', ' + cfgValues.filterText + ' ----->    ' + transformFilterValue(cfgValues.filterValue, cfgValues.filterText));
      return transformFilterValue(cfgValues.filterValue, cfgValues.filterText);
   }

   // transforms the backend value to a value that's better for sql-matching
   //          ie: 08,09,12  Augusti,September,December  -->   08_____Augusti, 09_____September, 12_____December
   // ie: 08,09,12  Augusti,September,December  -->   [08,Augusti], [09,September], [12,December]
   var transformFilterValue = function (arrFilterValue, arrFilterText) {
      var updatedValue = [];
      arrFilterValue = arrFilterValue.split(ATTRIBUTE_SEPARATOR);
      arrFilterText = arrFilterText.split(ATTRIBUTE_SEPARATOR);
      for (var i = 0, l = arrFilterValue.length; i < l; i++) {
         // create a value/display array for each entry
         var valueToAdd = [arrFilterValue[i], arrFilterText[i]];
         updatedValue.push(valueToAdd);
      }
      return updatedValue;
   }
}

// ---------------------- column functions ----------------------------------------------
function getColumnInfoQty() {
   return columnInfos.length;
}
function getColumnInfoFromIndex(index) {
   if (index < columnInfos.length)
      return columnInfos[index];

   return null;
}

function getColumnInfoFromTitle(title) {
   //console.log('getColumnInfoFromTitle: ' + title + '   QTY: ' + columnInfos.length);
   title = title.toLowerCase();
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      if (columnInfos[i].getTitle().toLowerCase() == title)
         return columnInfos[i];
      //console.info(i, columnInfos[i].getTitle().toLowerCase());
   }
   return null;
}

function getTimeStamp() {
   return new Date().getTime().toString();
}

// during development, a unique sequence parameter is used to avoid cache-problems. should be disabled in production.
function getSeqParam() {
   if (DISABLE_CACHE)
      return '&seq=' + getTimeStamp();
   return '';
}


// fills in baseColumn design from the data. used if no baseColumn design were provided from the server
function extractBaseColumnsFromData() {
   //console.log('extractBaseColumnsFromData____');
   console.dir(globalData);
   if (globalData[0].length === 0) {
      console.log('<ERROR>No data. Cannot extract columns...');
      return; // TODO: real exit
   }
   var document = globalData[0][0];
   //console.dir(document);
   for (var item in document) {
      var value = document[item];
      //console.info('extracting ' + item + '    ' + value);
      if (item.indexOf('@') === 0)
         continue;      // skip @id and @position

      viewConfig.addBaseColumnConfig(new columnConfig({ title: item, itemName: item, type: COLUMN.LABEL, width: 100 }));
   }
}

function mergeColumnDesign() {
   //console.log('mergeColumnDesign');
   if (viewConfig.baseColumnConfigs.length === 0)
      extractBaseColumnsFromData(); // fills in viewConfig.baseColumnConfigs

   if (viewConfig.baseColumnConfigs.length === 0) {
      console.log('<ERROR>no base-columns exist.');      // TODO: ev tillåta detta ifall viewConfig.columns.length > 0
      return; // TODO: real exit
   }

   // first transform values in viewConfig.columns to the user column configs
   /*for (var i = 0, l = viewConfig.columns.length; i < l; i++) {
      //console.log('transforming ' + i);
      //console.dir(viewConfig.columns[i]);
      viewConfig.addColumnConfig(new columnConfig(viewConfig.columns[i]));
   }
   for (var i = 0, l = viewConfig.columns.length; i < l; i++) {
      var columnCfg = viewConfig.columns[i];
      //console.log(i + ": " + columnCfg.title);
   }*/

   var calculatedWidth = 0;
   for (var i = 0, l = viewConfig.baseColumnConfigs.length; i < l; i++) {
      var columnCfg = viewConfig.baseColumnConfigs[i];

      if (typeof columnCfg.width === 'undefined')
         columnCfg.width = 199;

      var userCfg = viewConfig.getColumnConfig(columnCfg.title);
      if (userCfg !== null) {		// user configured settings override backend settings
         columnCfg.overrideWith(userCfg);
         //console.log("user-column DEFINED: " + columnCfg.title + "_____" + columnCfg.name + "_____" + columnCfg.width + "_____" + columnCfg.link);
      }
      //else
      //   console.log("didn't find title: " + columnCfg.title);

      // check for valid column types
      if (columnCfg.type == COLUMN.HIDDEN || columnCfg.type == COLUMN.LABEL || columnCfg.type == COLUMN.TEXT_SEARCH || columnCfg.type == COLUMN.DROPDOWN || columnCfg.type == COLUMN.DROPDOWN_MULTIPLE || columnCfg.type == COLUMN.CLASSES) {
         var newColumnInfo = new columnInfo(columnCfg);
         // create console warnings for invalid combinations
         //console.info('adding ' + columnInfos.length + ' ' + columnCfg.title, newColumnInfo);
         columnInfos.push(newColumnInfo);
      }
      // count the width of visible columns
      if (columnCfg.type == COLUMN.LABEL || columnCfg.type == COLUMN.TEXT_SEARCH || columnCfg.type == COLUMN.DROPDOWN || columnCfg.type == COLUMN.DROPDOWN_MULTIPLE)
         calculatedWidth += columnCfg.width;		// can be from backend or viewConfig
      //console.log(i + ": " + columnCfg.title + "             width: " + columnCfg.width);
      if (columnCfg.totals === true)
         viewConfig.showTotals = true;
   }
   var bodyWidth = calculatedWidth + 55;
   if (viewConfig.useOuterScroll !== true)   // inner scroll
      bodyWidth += 16;

   /*$('body').css('width', bodyWidth);
   // set the iframe width
   $(parent.document.body).find('#' + viewConfig.containerId + ' iframe').css('width', bodyWidth + 20);*/
}

function createFilterPanel() {
   //console.log('createFilterPanel____');
   // fill in filter row	
   var panelWidth = 0;
   var columnIndex = 0;
   var filterRow = $('#filter-row');
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      var tmpColumnInfo = columnInfos[i];

      if (tmpColumnInfo.getType() == COLUMN.LABEL || tmpColumnInfo.getType() == COLUMN.TEXT_SEARCH || tmpColumnInfo.getType() == COLUMN.DROPDOWN || tmpColumnInfo.getType() == COLUMN.DROPDOWN_MULTIPLE) {

         var id = PREFIX_FILTER + tmpColumnInfo.getDataKey();	// connect dropfilter with the 'filter_' attribute on the row
         var sortArrowId = PREFIX_SORT_ARROW + tmpColumnInfo.getDataKey();
         // TODO check min():
         var ctrlWidth = tmpColumnInfo.getWidth() - SORT_ARROW_WIDTH - 4;  // 4 is for padding (fixa sen)
         var columnCtrl;

         switch (tmpColumnInfo.getType()) {
            case COLUMN.LABEL:
               columnCtrl = '<span class="vertalign" style="float:left; width:' + ctrlWidth + 'px"' +
					// since we have a name label, we might as well add a sort-event on it
					' onclick="sortColumn(' + i + ');">' + tmpColumnInfo.getLabel() + '</span>';
               break;
            case COLUMN.TEXT_SEARCH:
               columnCtrl = '<input type="text" id="' + id + '" style="width:' + ctrlWidth + 'px"/>';
               break;
            case COLUMN.DROPDOWN:
               var extraAttributes = '';
               if (tmpColumnInfo.hasSearch()) {
                  extraAttributes = 'data-live-search="true"';
                  //console.log('HAS search: ' + tmpColumnInfo.getLabel());
               }
               columnCtrl = '<select size="15" class="selectpicker dropfield hideduringload" id="' + id + '" data-width="' + ctrlWidth + 'px" data-size="auto" ' + extraAttributes + '/>';
               break;
            case COLUMN.DROPDOWN_MULTIPLE:
               //var extraAttributes = 'title="' + tmpColumnInfo.getTitle() + '" data-selected-text-format="count>1"';
               var extraAttributes = 'title="' + tmpColumnInfo.getDataKey() + '"" data-actions-box="true"';
               /*if (tmpColumnInfo.hasSearch()) {     // not functional yet
                  extraAttributes += ' data-live-search="true"';
                  console.log('HAS search: ' + tmpColumnInfo.getLabel());
               }*/
               columnCtrl = '<select size="15" multiple class="selectpicker dropfield hideduringload" id="' + id + '" data-width="' + ctrlWidth + 'px" data-size="auto" ' + extraAttributes + '/>';
               break;
            default:
               break;
         }

         //panelWidth += ctrlWidth;

         // create sort arrow
         var hiddenCode = viewConfig.skipSortArrows ? ' hidden' : '';
         var sortOrderClass = tmpColumnInfo.isSortDescending() ? ICON_ARROW_DOWN : ICON_ARROW_UP;

         filterRow.append($('<li style="width:' + tmpColumnInfo.getWidth() + 'px; overflow:visible" column="' + i + '">' +
					columnCtrl +
					'<span id="' + sortArrowId + '" class="' + hiddenCode + ' sortArrow opaque softhideduringload ' + ICON_FONT_BASE + ' ' + sortOrderClass + '" onclick="sortColumn(' + i + ');"></span>' +
					'</li>'));
         // note that ICON_ARROW_UP and opaque has to be added to all to make the columns clickable from the beginning			
         if (tmpColumnInfo.getType() == COLUMN.DROPDOWN || tmpColumnInfo.getType() == COLUMN.DROPDOWN_MULTIPLE) { // has to be done later than appending so the ctrl exist

            var newDropFilter = new dropFilter(id, tmpColumnInfo.getDataKey(), tmpColumnInfo.getLabel(), tmpColumnInfo, tmpColumnInfo.getTag());
            newDropFilter.setNumSort(tmpColumnInfo.isNumSort());
            dropfilters.push(newDropFilter);
            //console.log("creating dropFilter " + id + "__DataKey:" + tmpColumnInfo.getDataKey() + "__label:" + tmpColumnInfo.getLabel() + "   isNumSort:" + tmpColumnInfo.isNumSort());
         }
         panelWidth += parseInt(tmpColumnInfo.getWidth(), 10);  // parseInt was needed here
         //console.log(panelWidth + '____' + tmpColumnInfo.getWidth());
         columnIndex++;   // (antagligen fel ifall dolda kolumner mitt i)  // - testa	
      }
   }
   //console.log('______________________________________panelWidth: ' + panelWidth);
   //panelWidth += 33;

   //$('#data-area').css('margin-right','100px');

   //padding-right:10px
   var RIGHTSIDE_PADDING = 10;	// create some space between the filter/data and the rightside scroll
   $('#data-area').css('padding-right', RIGHTSIDE_PADDING + 'px');

   if (viewConfig.useOuterScroll !== true) {    // inner scroll
      var padding = extractNumber($('#filter-row').css('padding-left')) + extractNumber($('#filter-row').css('padding-right'));
      //console.log('left: ' + parseInt($('#filter-row').css('padding-left'), 10) + '  right: ' + parseInt($('#filter-row').css('padding-right')), 10);
      //console.log('padding: ' + padding);
      //console.log('panelWidth: ' + panelWidth + '  padding: ' + padding);  // panelWidth: 06414420812014480128104104888810410412080104  padding: 31
      $('#filter-row').css('width', panelWidth + padding);
      $('#data-area').css('width', panelWidth + padding + 2 + RIGHTSIDE_PADDING);		// TODO: 2 är baserat på praktisk test som får högerlinjen på filterpanel och data-area att ligga i linje
      //console.log('filter-area: ' + $('#filter-area').length);
      var topOffset = 10;
      //console.log('topOffset: ' + topOffset + '___' + $('#filter-area').css('top'));
      var $win = $(window);
      var startLeft = $('#filter-area').position().left;

      $(window).scroll(function () {
         //refreshInnerScrollPositions();        // not needed after moving the scroll below the filterpanel
         //console.log('scrollLeft: ' + $win.scrollLeft());
         //$('#filter-area').css('left', 20 -$win.scrollLeft());
         $('#filter-area').css('left', startLeft - $win.scrollLeft());
         generateDOM(false, true);
      });
      refreshInnerScrollPositions();	// initial positioning
   }
}


function refreshInnerScrollPositions() {
   var topOffset = 10; //parseInt($("#filter-area").css('top'), 10);			// 10		(equals body padding)
   // TODO: for some annoying reason the width and position:absolute is lost after the top is updated
   $('#filter-area.innerScroll').css({
      //'top': $(this).scrollTop() + topOffset,
      'top': topOffset,
      'position': 'fixed',
      'width': bodyWidth - 20
   });
   /*$('#overlay.innerScroll').css({
       //'top': $(this).scrollTop(),
       'position' : 'fixed',
       'width' : bodyWidth-20
   });*/
}


function getDataStoresLooped(dataStoreIndex, searchCriteria) {   // one time per dataStore

   if (dataStoreIndex < viewConfig.dataStores.length) {
      //console.log('getDataStoresLooped DataStore' + dataStoreIndex + ': ' + viewConfig.dataStores[dataStoreIndex].alias + '  searchCriteria: ' + searchCriteria);
      
      var dataStoreConfigurator = parent.ViewHandler.getDataStoreConfigurator();
      var optionalInfo = dataStoreConfigurator(viewConfig, dataStoreIndex, searchCriteria);
      globalSearch = optionalInfo.globalSearch;
      delete optionalInfo.globalSearch;   // just used as return value. delete before it's used anyplace more.
      //console.log('before retrieveData: ' + optionalInfo.uri);

      var retrieveDataFcn = parent.ViewHandler.getRetrieveDataFunction();
      //console.info('CALLING ', viewConfig);
      retrieveDataFcn(null, optionalInfo, viewConfig);         // start the retrieval sequence           TODO: viewConfig.containerId is used, not all viewConfig. skicka på annat vis? containerId/optionalInfo.containerId?
      // when done call: getDataStoresLooped(optionalInfo.dataStoreIndex + 1, optionalInfo.searchCriteria);
   }
   else {
      //console.log('no more dataStores. continuing..');
      processData();
   }
}


function processData() {
   //console.log('processData: ___________________________________' + viewConfig.dataStores[0].alias + '   initializing: ' + viewConfig.initializing);

   if (viewConfig.useOuterScroll === true) {
      parent.ViewHandler.setIframeHeight(2000, viewConfig.containerId);	// make the frame fill at least the visible page
      parent.ViewHandler.resizeIframe(true, viewConfig);
   }
   else {      // inner scroll
      resizeInnerScrollFrame();
   }
   $(rowSelector()).css('width', ulWidth);	// to give background lines full length
   $('#data-area').removeClass('hidden');

   if (viewConfig.initializing === true) {
      mergeColumnDesign();
      createFilterPanel();
   }   

   for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
      //console.log('processData DataStore' + i + ': ' + viewConfig.dataStores[i].alias);
      // save the data to the database
      var sql = 'SELECT * INTO ' + viewConfig.dataStores[i].alias + ' FROM ?';
      alasql(sql, [globalData[i]]);
      //console.dir(alasql('SELECT FROM ' + viewConfig.dataStores[i].alias));
   }

   //console.dir(alasql('SELECT FROM data'));
   if (viewConfig.preprocessData !== null) {
      var sql = viewConfig.preprocessData();
      //console.log('PREPROCESSING ....! ' + sql);
      if (sql !== '') {  // if sql-code is returned it's processed here
         var processedData = alasql(sql);
         alasql('DELETE FROM ' + viewConfig.dataStores[0].alias);
         alasql('SELECT * INTO ' + viewConfig.dataStores[0].alias + ' FROM ?', [processedData]);
      }
   }
   //else
   //    console.log('NO PREPROCESSING!');

   createSortFields();
   createFilterFields();
   //console.info('ALL DATA: ', alasql('SELECT FROM data'));

   setSortColumn(getDefaultSortColumn(), true);
   // make the data panel visible
   $('#filter-area').find('*').removeClass('hideduringload softhideduringload');	// make the hidden filter controls visible

   if (viewConfig.initializing !== true) {
      viewConfig.clearFilters();   // clear active filters)    should be between setSortColumn() and resreshDropdowns() just like in resetFilter()
   }

   viewConfig.initializing = false;
   //console.info('SELECT FROM data: ', alasql('SELECT FROM data'));
   refreshDropdowns();
   //console.timeEnd('processData');
}

function refreshScrollAreaHeight() {
   if (viewConfig.createFullDOM === true) {
      //console.log('refreshScrollAreaHeight exiting - creating full DOM');
      return;
   }
   //console.log('refreshScrollAreaHeight: ' + viewConfig.dataStores[0].alias);
   var sql = 'SELECT COUNT(*) FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var resultQty = alasql(sql);
   viewConfig.qtyTotal = resultQty[0]['COUNT(*)'];
   var scrollAreaHeight = viewConfig.qtyTotal * STANDARD_ROW_HEIGHT;
   
   if (viewConfig.showTotals) {
      scrollAreaHeight += STANDARD_ROW_HEIGHT;
   }
   // there's some problem in IE/Edge where the last row is cut in half. add margin to handle it.
   var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
   if (!isChrome) {
       scrollAreaHeight += 14;
   }
   $('#data-area div.panel-default').css('height', scrollAreaHeight);
   viewConfig.scrollAreaHeight = scrollAreaHeight;
   //console.log('viewConfig.qtyTotal: ' + viewConfig.qtyTotal + '  scrollAreaHeight: ' + scrollAreaHeight); // 57240
   //console.log('viewConfig.showTotals: ' + viewConfig.showTotals);
}

function refreshDropdowns(excludeDropFilter) {
   //console.log('refreshDropdowns.........');
   showSpinner();
   closeOpenDropfilters(excludeDropFilter);

   fillInDropDowns(excludeDropFilter);

   if (1) {
      // send event to all subscribers
      var event = $.Event('filtercontentwasupdated');  // USED to call handleFilterOptions()
      event.excludeDropFilter = excludeDropFilter;     // is undefined here if no active filter (like when initializing)
      //console.log('triggering ' + event.excludeDropFilter);
      $(window).trigger(event);                        // should be after the filter options has been filled in, but before the bootstrap filters are refreshed
      //console.log('filtercontentwasupdated SEND'/*, e*/);

      /* To subscribe to this event do:
         $(window).on('filtercontentwasupdated', function (e) {
           ...
           });
      */
   }
   refreshSelectPickers(excludeDropFilter);
   dropdownsPostProcessing(excludeDropFilter);
   refreshSelectedRow();
   refreshScrollAreaHeight();
   refreshSummary();       // also if no dropdowns
   generateDOM(true, false);
}

var idSelectedRow = '';
// called after the filter has been updated. if the selected row is no longer in the active filter then the selection is removed.
function refreshSelectedRow() {
   if (idSelectedRow === '')
      return;
   var sql = 'SELECT COUNT(*) FROM ' + viewConfig.dataStores[0].alias;
   sql += ' WHERE '
   if (viewConfig.where !== '') {
      sql += '(' + viewConfig.where;
      sql += ' AND [@id]="' + idSelectedRow + '") ';
   }
   else {
      sql += ' [@id]="' + idSelectedRow + '" ';
   }
   sql += viewConfig.orderBy;
   var resultArray = alasql(sql);
   if (resultArray[0]['COUNT(*)'] < 1) {
      idSelectedRow = '';
   }
}

function addEventListeners() {
   addEvent(parent.window, 'resize', function (event) {
      // when inner scroll is used we want to update the iframe height every time the window height changes
      if (viewConfig.useOuterScroll !== true) {    // inner scroll
         resizeInnerScrollFrame();
      }
   });

   var body = document.getElementsByTagName('body')[0];
   /*body.addEventListener('click', function () {
	   clickedOnPage();
	}, false);*/
   addEvent(body, 'click', function (event) {
      //console.log('body click ');
      clickedOnPage();
   });

   generateDOM(true, false);
}

function resizeInnerScrollFrame() {
   //console.log('resizeInnerScrollFrame');
   if (parent === null) {
      console.log('<warning>resizeInnerScrollFrame - parent is null!');
      return;
   }
   else {
      //console.log('not null!!');
   }
   var parentWidth = $(parent).width();
   //console.log('parent width: ' + parentWidth);
   parent.ViewHandler.setIframeWidth(parentWidth, viewConfig.containerId);
   //$('html').css('width', parentWidth);

   /* TODO
   this height doesn't work so great when it's an embedded view that's starting after under the viewport.
   example:
   parentHeight: 765          (viewport height)
   iframeOffsetY: 1034        from the top of the page to the iframe start
   innerFrameHeight: -289     

   kan behöva en förutbestämd höjd på iframen.
      från config:
        viewConfig.height = 100;    exact height
        viewConfig.height = 0;      use available height (måste dock finnas ett minimum)
        viewConfig.height = -1;     set height so all rows are visible (no inner scroll used)
   */

   // the real height (changing window size or showing debug window affects it)
   // note that if a frameset is used, this is the height inside the iframe
   // (for example $$ViewTemplate rather than the global viewport height)
   var parentHeight = $(parent).height();    // TODO: when Windows GUI is zoomed in (like 125% etc) this number is off..
   // offset from the beginning of the parent to the beginning of the iframe
   var iframeOffsetY = parent.ViewHandler.getOffsetY(viewConfig.containerId);
   var innerFrameHeight = parentHeight - iframeOffsetY - 20; // -20 is needed to remove the outerscroll from St1 Myndighetsärenden i IE. so just always use it.
   //innerFrameHeight += 20;   // skapar extra outerscrollar
   innerFrameHeight = Math.max(innerFrameHeight, 216);	// set minimum height (important for viewhandlers that start under the visible viewport)
   parent.ViewHandler.setIframeHeight(innerFrameHeight, viewConfig.containerId);
   $('html').css('height', innerFrameHeight);
   //console.log('resizeInnerScrollFrame parentHeight: ' + parentHeight + '  iframeOffsetY: ' + iframeOffsetY + '  innerFrameHeight: ' + innerFrameHeight);
   parent.ViewHandler.resizeIframe(false, viewConfig); // behövs nu efter ändring av browser-fönster storlek
}

function createHeightFillerDOMRow(height) {
   height -= 2;   // needed to make the last row look correct when hover or selected
   return '<ul style="height:' + height + 'px;margin-bottom:0px"></ul>';
}

function createDOMRow(viewEntry, rowType, replacing) {
   var rowUNID = viewEntry['@id'];	// UNID is included automatically (not a column)
   //console.info('rowUNID: ' + rowUNID);
   var rowCode = '';
   var classes = rowType;
   var attributes = 'id="' + rowUNID + '"';
   
   for (var i = 0, l = getColumnInfoQty() ; i < l; i++) {		// since the columns from xagent are unsorted, we'll loop the design-columns 
      var columnInfo = getColumnInfoFromIndex(i);
      var field = columnInfo.getItemName();
      //var cfgValues = extractValues(viewEntry, field);	// extract display, alt, sort, filter, (list)
      var cfgValues = extractValues(viewEntry[field]);
      //console.log("cfgValues.filter: " + cfgValues.filter);
      //console.log("itemName: " + field);
      //console.info(viewEntry);

      if (columnInfo.getType() === COLUMN.LABEL || columnInfo.getType() === COLUMN.TEXT_SEARCH || columnInfo.getType() === COLUMN.DROPDOWN || columnInfo.getType() === COLUMN.DROPDOWN_MULTIPLE) {
         // create a sort-attribute on each row

         rowCode += convertDisplayValue(columnInfo, cfgValues, extractUnidFromId(rowUNID));
         //console.log(columnInfo.getTitle() + " cfgValues.filter: " + cfgValues.filter + "---" + columnInfo.getType());
         var title = sanitizeValue(columnInfo.getDataKey());  // sanitize probably not needed here
         var sortValue = convertSortValue(columnInfo, cfgValues.sort);
         var attrName = PREFIX_SORT + title;
         attributes += ' ' + attrName + '="' + sortValue + '"';

         if (columnInfo.getType() === COLUMN.DROPDOWN || columnInfo.getType() === COLUMN.DROPDOWN_MULTIPLE) {
            // create a filter-attribute on each row
            var attrName = PREFIX_FILTER + title;
            attributes += ' ' + attrName + '="' + convertFilterValue(columnInfo, cfgValues.filter) + '"';
         }
      }
      else if (columnInfo.getType() == COLUMN.CLASSES) {
         if (cfgValues.display !== '')
            classes += ' ' + cfgValues.display;
      }
      else if (columnInfo.getType() == COLUMN.HIDDEN) {	// sort-attributes are created also for hidden columns. can be used for summary and other things
         var attrName = PREFIX_SORT + sanitizeValue(columnInfo.getDataKey());
         //console.log("   stamping hidden field " + attrName);
         attributes += ' ' + attrName + '="' + convertSortValue(columnInfo, cfgValues.display) + '"';
      }
   }

   if (viewConfig.createFullDOM !== true) {
      attributes += ' style="height:' + STANDARD_ROW_HEIGHT + 'px;"';
      //console.log('limit: ' + attributes);
   }

   //console.log("rowCode: " + rowCode);
   attributes += ' unid="' + rowUNID + '"';
   rowCode = '<ul class="' + classes + '" ' + attributes + '>' + rowCode + '</ul>';

   if (replacing === true) {
      var newDOMRow = $(rowCode);
      //console.log("replacing..............." + rowUNID);

      var oldRow = $('#' + rowUNID);
      if ($(oldRow).length > 0) { 			// replace existing row
         $(oldRow).before(newDOMRow);
         // make sure to use the same width
         $(newDOMRow).css('width', $(oldRow).css('width'))
         // delete old row
         $(oldRow).remove();
         //console.log("replace row");
         return;
      }
   }
   // if not replacing, or if old row not found	
   // NOTE: a string is returned. it's important to not create or append the DOM for each row, but instead
   //       to create many simultaneously (200 rows atm). for old browser this makes a big performance difference.
   return rowCode;
}

//// these two functions used for multi-replace characters 
//// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
//function escapeRegExp(string) {
//   return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
//}
//function replaceAll(string, find, replace) {
//   string = $.trim(string);	// remove undefined
//   return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
//}

//// use this when some values aren't allowed. for example / inside a attribute-name
//function sanitizeValue(value) {
//   //return value.replace('/', '').replace('/', '');
//   return replaceAll(value, '/', '');
//}

//function sanitizeSortFilterValue(value) {
//   return replaceAll(value, '"', '');
//}

// this is the default code that created the DOM cell content. this can be overridden to format the cell in any choosen way.
// for performance reason only a string should be returned, not a DOM object since they're really slow in IE.
function convertDisplayValue(columnInfo, cfgValues, optUnid) {
   var customHtml = viewConfig.convertDisplayValue(columnInfo, cfgValues, optUnid);
   if (typeof customHtml !== 'undefined') {
      if (customHtml.substr(0, 3) === '<li')
         return customHtml;
      else
         return createStandardLi(columnInfo, customHtml);
   }
   else {                // generic cases only
      return convertDisplayValue_Generic(columnInfo, cfgValues, optUnid);
   }
}


function createStandardLi(columnInfo, content) {	// content is put inside the <li>
   return '<li itemname="' + columnInfo.getItemName() + '" style="width:' + columnInfo.getWidth() + 'px">' + content + '</li>';
}

// handles generic cases (basic link etc). called from convertDisplayValue()-functions
function convertDisplayValue_Generic(columnInfo, cfgValues, optUnid) {
   // here we handle some common cases	
   if (columnInfo.isLink()) {		// create a link
      if (cfgValues.display != '')
         cfgValues.display = '<a href="javascript:openUNID(\'' + optUnid + '\', \'' + viewConfig.configName + '\');">' + cfgValues.display + '</a>';
      return createStandardLi(columnInfo, cfgValues.display);
   }
   else
      return createStandardLi(columnInfo, cfgValues.display);
}

function doFullSearch(searchCriteria) {
   //console.log('INTERNAL searchCriteria: ' + searchCriteria);     // the search string
   showSpinner();
   // old data has to be cleared before retrieving new filtered data
   for (var i = 0, l = viewConfig.dataStores.length; i < l; i++) {
      //console.dir(alasql('SELECT FROM [' + viewConfig.dataStores[i].alias + ']'));
      //console.log('clearing DataStore' + i + ': ' + viewConfig.dataStores[i].alias + '   (#: ' + qtyDeleted + ')');
      var sql = 'DELETE FROM [' + viewConfig.dataStores[i].alias + ']';
      var qtyDeleted = alasql(sql);
   }
   globalData = [];	// clear
   getDataStoresLooped(0, searchCriteria);
}

function extractUnidFromId(id) {
   // ids contains replicaid.unid	ex: C1257C7E0036D03E.BE3C205897809E76C1257E59005C9666
   id = $.trim(id);
   if (id === '')
      return '';
   return id.substr(id.indexOf('.') + 1);
}

// default code. this can be overridden to format the sortvalue in any choosen way.
// the sortvalue is added as a PREFIX_SORT-attribute to the ul-row
function convertSortValue(columnInfo, value) {
   var output = viewConfig.convertSortValue(columnInfo, value);
   if (typeof output !== 'undefined') {
      return sanitizeSortFilterValue(output);
   }
   else {
      return sanitizeSortFilterValue(value);
   }
}

// default code. this can be overridden to format the filtervalue in any choosen way.
// the filtervalue is added as a PREFIX_FILTER-attribute to the ul-row
function convertFilterValue(columnInfo, value) {
   var output = viewConfig.convertFilterValue(columnInfo, value);
   if (typeof output !== 'undefined') {
      return sanitizeSortFilterValue(output);
   }
   else {
      return sanitizeSortFilterValue(value);
   }
}


// this is the default code that can be overridden to format the content in any choosen way.
function convertFilterOptionText(dropFilter, filterValue, filterText, selected) {
   var overrideText = viewConfig.convertFilterOptionText(dropFilter, filterValue, filterText, selected);   // returns 'undefined' if the function is not overridden

   if (typeof overrideText !== 'undefined') {
      //console.log('overrideText: ' + overrideText);
      return createDOMOption(filterValue, overrideText, selected);
   }
   else {
      return createDOMOption(filterValue, filterText, selected);
   }
}

// default code. this can be overridden to manipulate the filter options in any choosen way.
function handleFilterOptions(excludeDropFilter) {
   //console.log('___________________________handleFilterOptions_________________________________');
   // call one time for each dropFilter, since there's no easy access to dropFilters from the outside
   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('NOT6 ' + excludeDropFilter.getLabel() + ' skipping..');
         continue;
      }
      //console.log('   ' + i + ' dropFilter: ' + dropFilter.getLabel());
      viewConfig.handleFilterOptions(dropFilter);
   }
}

function overrideActiveFilterValue(dropFilter, value) {
   var output = viewConfig.overrideActiveFilterValue(dropFilter, value);
   if (typeof output !== 'undefined') {
      return output;
   }
   else {
      return value;
   }
}


function refreshProgress(qtyDOMRows) {
   viewConfig.refreshProgress(qtyDOMRows);
   // no default progress
}

function refreshSummary() {
   viewConfig.refreshSummary();
   // no default summary
}



// this can be overridden. it should return true if background rows were handled.
function refreshBackgroundRows() {
   ////// add a 'lastrow' class to the last visible row
   ////$('#data-content ul.lastrow').removeClass('lastrow');
   ////var visibleRows = $('#data-content ul.normal, #data-content ul.totals');
   ////if (visibleRows.length > 0)
   ////	$(visibleRows[visibleRows.length-1]).addClass('lastrow');

   // override logic for backround rows
   if (viewConfig.refreshBackgroundRows())
      return;	// rows were handled, skip out.

   // standard background rows
   $('#data-content ul.normal').removeClass('evenrow');
   var count = 0;
   $('#data-content ul.normal').each(function () {
      if (count % 2 === 0)
         $(this).addClass('evenrow');
      count++;
   });
}

// contains the values from a backend view cell
function valuesContainer() {
   this.display = '';
   this.alt = '';			// alternative display content
   this.sort = '';
   this.filter = '';
   this.list = '';		// eller [] ??
   this.isList = false;
}

function extractValues(fieldValue) {
   var cfgValues = new valuesContainer();

   cfgValues.isList = (Object.prototype.toString.call(fieldValue) === '[object Array]');

   if (cfgValues.isList) {
      cfgValues.list = fieldValue;
      fieldValue = fieldValue[0];		// just the first entry
      //console.log("is a list: " + '' + ". #: " + cfgValues.list.length);
   }
   else {
      //console.log('not a list ' + '' + ': ' + fieldValue);
      //console.dir(fieldValue);
   }

   // use trim to make the value into a string		
   var values = $.trim(fieldValue).split(DATA_SEPARATOR);

   //console.log('length: ' + values.length);

   if (values.length === 1) {
      cfgValues.display = values[0];
      cfgValues.sort = values[0];
      cfgValues.filterValue = values[0];
      cfgValues.filterText = values[0];
      //if (itemName === '$51') 
      //console.log("1");
   }
   else if (values.length === 2) {
      cfgValues.display = values[0];
      cfgValues.alt = values[1];
      cfgValues.sort = values[0];
      cfgValues.filterValue = values[0];
      cfgValues.filterText = values[0];
      //if (itemName === '$51') 
      //console.log("2");
   }
   else if (values.length === 3) {
      cfgValues.display = values[0];
      cfgValues.alt = values[1];
      cfgValues.sort = values[2];
      cfgValues.filterValue = values[2];		// use sort also for filter
      cfgValues.filterText = values[2];		// use sort also for filter
      //if (itemName === '$51') 
      //console.log("3");
   }
   else if (values.length === 4) {
      cfgValues.display = values[0];
      cfgValues.alt = values[1];
      cfgValues.sort = values[2];
      cfgValues.filterValue = values[3];
      cfgValues.filterText = values[3];
      //if (itemName === '$51') 
      //console.log("4");
   }
   else if (values.length === 5) {
      cfgValues.display = values[0];
      cfgValues.alt = values[1];
      cfgValues.sort = values[2];
      cfgValues.filterValue = values[3];
      cfgValues.filterText = values[4];      // different value / text for dropdown
      //if (itemName === '$51') 
      //console.log("4");
   }
   return cfgValues;
}

function extractFilterValue(fieldValue) {
   var cfgValues = new valuesContainer();

   cfgValues.isList = (Object.prototype.toString.call(fieldValue) === '[object Array]');

   if (cfgValues.isList) {
      cfgValues.list = fieldValue;
      fieldValue = fieldValue[0];		// just the first entry
      //console.log("is a list: " + itemName + ". #: " + cfgValues.list.length);
   }
   // use trim to make the value into a string		
   var values = $.trim(fieldValue).split(DATA_SEPARATOR);
   //console.log('values.length ' + values.length);

   if (values.length === 1) {
      //cfgValues.filter = values[0];
      cfgValues.filterValue = values[0];
      cfgValues.filterText = values[0];
   }
   else if (values.length === 2) {
      //cfgValues.filter = values[0];
      cfgValues.filterValue = values[0];
      cfgValues.filterText = values[0];
   }
   else if (values.length === 3) {
      //cfgValues.filter = values[2];		// use sort also for filter
      cfgValues.filterValue = values[2];
      cfgValues.filterText = values[2];
   }
   else if (values.length === 4) {
      //cfgValues.filter = values[3];
      cfgValues.filterValue = values[3];
      cfgValues.filterText = values[3];
   }
   else if (values.length === 5) {
      //cfgValues.filter = values[3];
      cfgValues.filterValue = values[3];
      cfgValues.filterText = values[4];
   }
   //return cfgValues.filter;
   return cfgValues;
}


function extractSortValue(fieldValue) {
   var cfgValues = new valuesContainer();

   cfgValues.isList = (Object.prototype.toString.call(fieldValue) === '[object Array]');

   if (cfgValues.isList) {
      cfgValues.list = fieldValue;
      fieldValue = fieldValue[0];		// just the first entry
      //console.log("is a list: " + itemName + ". #: " + cfgValues.list.length);
   }
   // use trim to make the value into a string		
   var values = $.trim(fieldValue).split(DATA_SEPARATOR);
   //console.log('values.length ' + values.length);

   if (values.length === 1) {
      cfgValues.sort = values[0];
   }
   else if (values.length === 2) {
      cfgValues.sort = values[0];
   }
   else if (values.length === 3) {
      cfgValues.sort = values[2];
   }
   else if (values.length === 4 || values.length === 5) {
      cfgValues.sort = values[2];
   }

   return cfgValues.sort;
}

// if a ||-separator exist, the part before it is returned.
// if no separator exists, the full string is returned.
function extractCellValue(value) {
   //value = $trim(value);						// handles undefined/null		(no jquery here yet)
   var index = value.indexOf(DATA_SEPARATOR);
   if (index > -1)
      value = value.substr(0, index);
   return value;
}

function createDOMOption(value, text, selected, attributes) {
   attributes = $.trim(attributes);

   if (selected)
      attributes += ' selected';		// best way to set selected since it doesn't trigger a new event	
   if (text === '')
      text = ' ';

   return '<option ' + attributes + ' value="' + value + '">' + text + '</option>';
}


function clearDropdownTooltips() {
   // removed for now since they're not showing useful info
   $('button.selectpicker').attr('title', '');
}

function dropdownsPostProcessing(excludeDropFilter) {
   //console.log('____________dropdownsPostProcessing_________________');

   // fill in the title on top of each 
   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      var columnInfo = dropFilter.getColumnInfo();    // note that columnInfo is null when dropfilters are used without columninfo. test with isObject(columnInfo)

      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('i: ' + i + ' ' + dropFilter.getLabel() + '     RETURNING');
         //continue;   // excludeDropFilter also needs to update the title
      }
      //console.log('i: ' + i + '__' + dropFilter);// + '____' + columnInfo);

      var bootstrapFilter = $(dropFilter.getCtrl()).nextAll('.bootstrap-select');
      if (dropFilter.isMultiple()) {
         $(bootstrapFilter).find('span.filter-option').text(dropFilter.getLabel() + ' (' + dropFilter.getQtySelected() + ')');
         //console.log('    ....step B1..' + $(bootstrapFilter).find('span.filter-option').length + '_____' + dropFilter.getQtySelected());
         $(bootstrapFilter).find('button.bs-select-all').text(TEXT_ALL);
         $(bootstrapFilter).find('button.bs-deselect-all').text(TEXT_NONE);


         $(bootstrapFilter).find('button.bs-select-all').off('click');
         $(bootstrapFilter).find('button.bs-select-all').on('click', function (e) {
            var bsFilter = $(this).closest('div.bootstrap-select');
            //console.log('found ancestor: ' + bsFilter.length);
            var ctrl = $(bsFilter).siblings('select');
            //console.log('found select: ' + ctrl.length);

            var inputDropFilter = getDropFilterFromCtrl(ctrl[0]);
            //console.log(" Clicked select-all! " + inputDropFilter.getLabel());
            selectAllMembers(inputDropFilter);
            e.stopPropagation();    // skip the autogenerated select-all event
         });

         $(bootstrapFilter).find('button.bs-deselect-all').off('click');
         $(bootstrapFilter).find('button.bs-deselect-all').on('click', function (e) {
            var bsFilter = $(this).closest('div.bootstrap-select');
            //console.log('found ancestor: ' + bsFilter.length);
            var ctrl = $(bsFilter).siblings('select');
            //console.log('found select: ' + ctrl.length);
            var inputDropFilter = getDropFilterFromCtrl(ctrl[0]);
            //console.log(" Clicked deselect-all! " + inputDropFilter.getLabel());
            selectNoMembers(inputDropFilter);
            e.stopPropagation();    // skip the autogenerated deselect-all event
         });
      }
      else {
         $(bootstrapFilter).find('span.filter-option').text(dropFilter.getLabel());
         //console.log('    ....step B2..' + $(bootstrapFilter).find('span.filter-option').length);
      }
   }

   // NOTE: after refresh on a selectpicker the events are lost. so they have to be added again here
   var dropfieldsSelector = 'select.selectpicker.dropfield';
   $(dropfieldsSelector).off('change');	// remove old event
   $(dropfieldsSelector).change(function (e) {
      selectChange(e.currentTarget);
   })

   clearDropdownTooltips();

   //return;
   // call one time for each dropFilter, since there's no easy access to dropFilters from the outside
   var event = $.Event('afterpostprocessingdropdowns');
   event.containerId = viewConfig.containerId;
   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('i: ' + i + ' ' + dropFilter.getLabel() + '     RETURNING b');
         //continue;
      }
      event.dropFilter = dropFilter;
      parent.$('body').trigger(event);
   }
}

function selectAllMembers(dropFilter) {
   //console.log('selectAllMembers : ' + dropFilter.getLabel());
   var selectableOptions = $(dropFilter.getCtrl()).find('option:not([' + ATTRIBUTE_EXCLUDED + '])');
   $(selectableOptions).prop("selected", true);        // works..

   viewConfig.removeFilter(dropFilter.getColumnInfo().getItemName());
   refreshDropdowns(dropFilter);
}

function selectNoMembers(dropFilter) {
   //console.log('selectNoMembers : ' + dropFilter.getLabel());

   if (dropFilter.isMultiple()) {
      var options = $(dropFilter.getCtrl()).find('option:selected');
      //console.log('options #: ' + options.length);
      $(options).removeAttr('selected');

      viewConfig.replaceFilter(dropFilter.getColumnInfo().getItemName(), null);
      refreshDropdowns(dropFilter);
   }
}

// if nothing is selected, hide the empty row from the dropdown list
function selectChange(select) {
   //console.log("selectChange - value was selected! " + select + "  options: " + $(select).children().length);	
   if ($(select).children().length == 0)
      return;

   filterUpdate(select);
}

function enableResetFilter(value) {   // RETIRED. finns ingen sådan knapp inuti
   console.log('enableResetFilter: ' + $('#bnResetFilter').length);
   $('#bnResetFilter').prop('disabled', !value);
   if (!value)
      $('#bnResetFilter').tooltip('hide');
}


function getDefaultSortColumn() {
   var defaultColumn = 0;		// value used if no sort column has been specified

   // finds the first column with the sort=true (any additional ones are ignored)
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      if (columnInfos[i].isSort() === true) {
         return i;
      }
   }
   return defaultColumn;
}

function showSpinner(overrideTarget) {	// must be [object HTMLUListElement] if used

   //console.log("overrideTarget: " + overrideTarget);	
   var target = document.getElementById('loading_image');
   var top = 41;
   if (overrideTarget) {
      target = overrideTarget;
      top = 0;
   }

   var opts = {
      lines: 13, // The number of lines to draw
      length: 20, // The length of each line
      width: 10, // The line thickness
      radius: 30, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow

      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: top, // Top position relative to parent in px		// 'auto'
      left: 'auto' // Left position relative to parent in px
   };
   hideSpinner();
   spinner = null;
   if (!spinner) {
      spinner = new Spinner(opts).spin(target);
   }
   else {
      spinner.opts.top = top;
      spinner.spin(target);
   }
   //console.log("top: " + spinner.opts.top);
}

function hideSpinner() {
   if (!spinner)
      return;

   spinner.stop();
}

//   this function is sent (indirectly) as a parameter when opening forms from the view. 
// it's called afterwards to refresh the current view
//function refreshWindow(unid) {
function refreshEntry(unid) {
   console.log('TODO: refreshEntry unid: ' + unid + '. Exiting.');
   // metaId (replicaId.unid)

   unid = $.trim(unid);
   if (unid == '')
      return;
   if ($('#' + unid).length == 0)
      return

   var params = '&unid=' + unid;
   var sourceDbUrl = viewConfig.getSourceDbUrl(0);
   params += '&sourcedb=' + sourceDbUrl.substr(1, sourceDbUrl.length - 1);  // remove first '/' since session.Getdatabase() doesn't handle it.
   params += '&sourceview=' + viewConfig.getSourceView(0);

   var uri = dbViewHandler + '/RetrieveData?OpenAgent' + params;
   //alert("uri: " + uri);
   //console.log(uri);
   //return;
   var optionalInfo = new Object();
   optionalInfo.unid = unid;	// needed when it's a delete (no viewentries returned)
   //console.log("unid to refresh: " + optionalInfo.unid);

   $.ajax(encodeURI(uri)).done(function (data) {
      //console.dir(data);
      var jsonObjects = null;		// null it here for easy comparison later
      // first check if error is set
      for (var key in data) {		// should only be one instance
         if (key == 'error') {
            var message = data[key];		// error message for output
            var errormessage = 'Projects System - Ajax call returned error-data: ' + message;
            alert(errormessage);
            return;
         }
         else if (key == '@entries') {
            jsonObjects = data;
            break;
         }
      }
      if (jsonObjects == null) {	// if no data, or if invalid data
         var message = 'Projects System - Invalid data returned from the agent. jsonObjects is null';
         alert(message);
         return;
      }
      afterRefreshView(jsonObjects, optionalInfo);
   }
	).fail(function (data) {
	   // ajax called failed. can for example occur if the agent isn't found
	   var message = 'ViewHandler - Ajax call failed: ' + data.errorMsg;
	   alert(message);
	}
	).always(function () { }
	)
}


function afterRefreshView(jsonObjects, optionalInfo) {
   //console.dir(jsonObjects);
   var viewEntries = jsonObjects['@entries'];
   if (viewEntries) {   // undefined it there were no hits
      //console.log("#: " + viewEntries.length);

      if (viewEntries.length === 0) {
         // probably a delete. remove the row from the DOM
         if ($.trim(optionalInfo.unid) != '')
            $('#' + optionalInfo.unid).remove();
      }
      else {
         for (var i = 0, l = viewEntries.length; i < l; i++) {
            createDOMRow(viewEntries[i], ROW_NORMAL, true);
         }
      }
   }

   // instead of processData(), just do what's needed
   if (parent && viewConfig.useOuterScroll === true)
      parent.ViewHandler.resizeIframe(true, viewConfig);

   refreshBackgroundRows();
}

function closeOpenDropfilters(excludeDropFilter) {  // har denna någon praktisk användning?  -hmm, är väl när event tagits emot från container

   if (excludeDropFilter) {
      var bootstrapFilter = $(excludeDropFilter.getCtrl()).nextAll('.bootstrap-select');
      if (bootstrapFilter.length > 0) {
         $(bootstrapFilter).addClass('excluded');    // add a tag for the bootstrap select to exclude
         $('div.bootstrap-select:not(.excluded)').removeClass('open');
         $('div.bootstrap-select.excluded').removeClass('excluded');
      }
   }
   else
      $('div.bootstrap-select').removeClass('open');
}

function clickedOnPage() {
   //console.log("clickedOnPage");
   if (typeof parent.clickedOnViewHandler !== 'undefined')
      parent.clickedOnViewHandler();

   // remove selected row when clicking outside the table - funkar icke, tar även bort nyselekterad rad
   //$('#data-content ul.normal').removeClass('selected');
}


function openUNID(sUNID, optView, sQS, inTab) {
   openCustomWindow('', '', sUNID, optView, sQS, inTab);
}

function openCustomWindow(sUrl, sType, sUNID, optView, sQS, inTab) {
   if ($.trim(sUNID) != '') {
      //Use more dynamic way to open links
      var view = $.trim(optView);
      view = view === '' ? '0' : view;
      var url = viewConfig.getSourceDbUrl(0);					// db: /kund/psk/xagents.nsf/view.xsp/entries?uri=/kund/statoil/stbygg.nsf
      // extract only the actual path to the view		// TODO: this is psk-specific code. move it out.
      //console.log('db: ' + url);
      //var view = viewConfig.dataStores[storeIndex].url.split(',')[0];
      //return view.substring(0, view.lastIndexOf('?uri='));
      //console.log('pos: ' + url.lastIndexOf('?uri='));
      url = url.substring(url.lastIndexOf('?uri=') + 5);
      //console.log('db: ' + url);

      //sUrl = viewConfig.getSourceDbUrl(0) + '/' + view + '/' + sUNID + '?OpenDocument';
      sUrl = url + '/' + view + '/' + sUNID + '?OpenDocument';
      if ($.trim(sQS) != '') {
         //Add querystring if available
         sUrl += sQS;
      }
   }
   //sUrl += '&exitfunction=refreshEntry';
   //  ska inte behövas. kan i close() anropa window.opener.refreshEntry(unid)
   //  - fknen får finnas både i interface/viewHandler.js samt i viewHandler.js så att initialt read-mode samt efter ändringar är hanterat

   var sTitle = '';
   var sFeatures = '';
   if (inTab !== true) {		// in window
       sFeatures = 'channelmode=no, directories=yes, fullscreen=no, location=no, menubar=yes, resizable=yes, scrollbars=yes, status=no, titlebar=yes, toolbar=no';
   }


   /*switch (sType){
	case 'HistorikArbetsorder':
		sFeatures+=', top=25, left=300, width=1180, height=900';
		break;
	default:
		sFeatures+=', top=25, left=200, width=750, height=850';
	}*/
   var w = window.open(sUrl, sTitle, sFeatures, false);
   //w.sourceFrameId = viewConfig.frameId;	// TODO: not functional yet. must be used in the target form. ev skicka vanlig parameter istället ovan.
   //alert("source: " + w.sourceFrameId);
   w.focus();
}


//object: the element or window object
//type: resize, scroll (event type)
//callback: the function reference
//http://stackoverflow.com/questions/641857/javascript-window-resize-event
var addEvent = function (object, type, callback) {
   if (object == null || typeof (object) == 'undefined') return;
   if (object.addEventListener) {
      object.addEventListener(type, callback, false);
   } else if (object.attachEvent) {
      object.attachEvent("on" + type, callback);
   } else {
      object["on" + type] = callback;
   }
};



// called from Form ViewHandler.onLoad() 	- flytta dit den istället?
function initViewConfiguration(paramContainerId, paramConfigName) {
   viewConfig = new viewConfiguration();
   // save the iframe.id

   viewConfig.containerId = paramContainerId;
   viewConfig.configName = paramConfigName;
   //console.log('initViewConfiguration containerId: ' + viewConfig.containerId + '  configName: ' + viewConfig.configName);

   var pause = parent.frameWasCreated(viewConfig);

   if (viewConfig.useOuterScroll !== true) {    // inner scroll
      //console.log("USE inner scroll...");
      $('#filter-area').addClass('innerScroll');
      $('#overlay').addClass('innerScroll');
      $('#data-area').addClass('innerScroll');
      //$('body').css('overflow-y', 'auto');	  // override the hiding of the inner scroll
      //$('body').css('overflow-x', 'hidden');	  // showing vertical scroll makes the other scroll appear too. hide it.
      $('#data-area').css('overflow-y', 'hidden');    // override the hiding of the inner scroll
      $('#data-area').css('overflow-x', 'auto');
   }
   return pause;
}



function printFilters() {
   //console.log(sql);

   //var jsonString = JSON.stringify(filterObject);
   //console.log('jsonString: ' + jsonString);

   var allFilters = alasql('SELECT FROM ' + TABLE_FILTERS);
   console.log('qty: ' + allFilters.length);
   console.dir(alasql('SELECT FROM ' + TABLE_FILTERS));

   for (var i = 0, l = allFilters.length; i < l; i++) {
      //console.log(allFilters[i]);
   }
}


function beforeFilterUpdate(dropdown) {	// override-fcn called from dropFilter.js
   return true;
}

function hasGlobalSearch() {
   return globalSearch !== '';
}

function getExcelColumnsParam() {
   var param = '';	// must start empty, so it can be used in the loop to skip the first comma-sign
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      var columnInfo = columnInfos[i];
      if (columnInfo.getType() == COLUMN.LABEL || columnInfo.getType() == COLUMN.TEXT_SEARCH || columnInfo.getType() == COLUMN.DROPDOWN || columnInfo.getType() == COLUMN.DROPDOWN_MULTIPLE) {
         if (param !== '')
            param += ',';
         param += columnInfo.getItemName();
      }
   }
   if (param === '')
      return '';	// if no columns are listed, show all columns
   else
      return '&columns=' + param;
}


function retrieveFilterData(cfg) {
   //console.log('retrieveFilterData   emptyIfDefault: ' + cfg.emptyIfDefault);

   if (cfg.emptyIfDefault === true) {	// if no active filter or sort, return an empty array		
      var hasFilter = false;
      for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
         var dropFilter = getDropFilterFromIndex(i);
         if (dropFilter.hasSelection()) {
            hasFilter = true;
            //console.log(i + ' hasFilter: ' + dropFilter.getColumnInfo().getTitle() + '   qty: ' + dropFilter.getQtySelected());
            break;
         }
         //if (dropFilter.isMultiple())
         //    console.log('MULTIPLE ' + i + ': ' + dropFilter.getColumnInfo().getTitle() + '  ALLSEL: ' + dropFilter.isAllOptionsSelected());
      }
      var hasSort = false;
      if (!(getDefaultSortColumn() === sortColumnIndex && sortAscending === true)) {
         hasSort = true;
      }

      //console.log('    hasFilter: ' + hasFilter + '    hasSort: ' + hasSort + '    hasGlobalSearch: ' + hasGlobalSearch());
      if (!(hasFilter || hasSort || hasGlobalSearch())) {
         return [];	// no filter used. return empty array
      }
   }
   var sql;
   var renameFields = typeof (cfg.returnfields) !== 'undefined';

   if (renameFields) {		// google-maps use this
      sql = 'SELECT [@id]';
      for (var i = 0, l = cfg.fields.length; i < l; i++) {
         var columnInfo = getColumnInfoFromTitle(cfg.fields[i]);
         sql += ', [' + columnInfo.getItemName() + ']';
      }
      sql += ' FROM ' + viewConfig.dataStores[0].alias;
   }
   else {
      sql = 'SELECT [@id] FROM ' + viewConfig.dataStores[0].alias;
   }

   //console.log('retrieveFilterData: ' + viewConfig.dataStores[0].alias);

   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   sql += viewConfig.orderBy;   // should always be filled in
   var queryResult = query(sql);
   //console.log('Excel sql: ' + sql + '   #: ' + queryResult.length);
   var visibleIds = [];
   for (var i = 0; i < queryResult.length; i++) {
      var obj = new Object();

      if (renameFields) {		// google-maps use this
         var id = queryResult[i]['@id'];
         obj.unid = extractUnidFromId(id);
         //console.log('unid: ' + obj.unid);
         for (var j = 0, m = cfg.fields.length; j < m; j++) {
            var columnInfo = getColumnInfoFromTitle(cfg.fields[j]);
            var value = queryResult[i][columnInfo.getItemName()];
            if (renameFields)
               obj[cfg.returnfields[j]] = value;
            else
               obj[cfg.fields[j]] = value;
         }
      }
      else {
         obj.toString = function () { return this.id; };	// for easy join later
         obj.id = queryResult[i]['@id'];
      }
      visibleIds.push(obj);
   }
   //console.log('array#: ' + visibleIds.length);
   //console.timeEnd('retrieveFilterData');
   return visibleIds;
}

// extracts a number, otherwise returns 0
function extractNumber(value) {
   if (value !== undefined) {
      value = parseFloat(value);
      if (!isNaN(value))
         return value;
   }
   return 0;
}

// to make alternative sorting easy, a new sort-column is created when altSort=true.
function createSortFields() {
   //console.log("createSortFields " + viewConfig.dataStores[0].alias);
   //console.time("createSortFields");
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      var columnInfo = columnInfos[i];
      if (columnInfo.isAltSort()) {
         var columName = columnInfo.getItemName();
         // extract the sort-value from the cell and give it to it's own field
         var mySql = 'UPDATE ' + viewConfig.dataStores[0].alias + ' SET [Sort_' + columName + '] = EXTRACT_SORTVALUE([' + columName + '])';
         alasql(mySql);
      }
   }
   //console.timeEnd("createSortFields");
}
// create a new  filter-field when config has altSort=true
function createFilterFields() {
   //console.log("createFilterFields " + viewConfig.dataStores[0].alias);
   //console.time("createFilterFields");
   for (var i = 0, l = columnInfos.length; i < l; i++) {
      var columnInfo = columnInfos[i];
      if (columnInfo.isAltFilter()) {
         var columName = columnInfo.getItemName();
         // extract the filter-value from the cell and give it to it's own field
         var mySql = 'UPDATE ' + viewConfig.dataStores[0].alias + ' SET [Filter_' + columName + '] = EXTRACT_FILTERVALUE([' + columName + '])';
         //console.info('createFilterFields: ', mySql);
         alasql(mySql);
      }
   }
   //console.timeEnd("createFilterFields");
}

function fillInTotalsRowCells() {
   if (!viewConfig.showTotals)
      return false;
   //console.log('fillInTotalsRowCells___' + $('#totalsrow').length);

   for (var i = 0, l = columnInfos.length; i < l; i++) {
      var tmpColumnInfo = columnInfos[i];
      if (tmpColumnInfo.hasTotals()) {
         var amount = summarizeColumn(tmpColumnInfo.getItemName());
         //console.log(i + ' ' + tmpColumnInfo.getItemName() + ': ' + amount);
         $('#totalsrow li[itemname="' + tmpColumnInfo.getItemName() + '"]').text(amount);
      }
   }
}

function printQty(extra) {
   var rows = $('#data-content ul.normal');
   var qty1 = $(rows).length;
   console.log("QTY ROWS: " + qty1 + "   " + extra);
}

// used when adding extra options to the dropfilter
function optionGroup(groupName) {
   this.groupName = groupName;	// the visible name of the option
   this.members = [];				// list of values. if one of them matches an existing option, found is set to true
   this.found = false;				// whether this options should be created
   this.rules = '';					// rules for comparing. default it ''. this loops through members and compares exactly
   this.reset = function () {
      this.found = false;
   }
}

function createGroup(groupName, members, rules) {
   var group = new optionGroup(groupName);
   group.members = members;
   group.rules = $.trim(rules);
   return group;
}

function getGroupFromCollection(collection, groupName) {
   for (var i = 0, l = collection.length; i < l; i++) {
      if (collection[i].groupName === groupName) {
         //console.log('  found groupName: ' + groupName);
         //console.dir(collection[i]);
         return collection[i];
      }
   }
   return null;
}

function getMatchedMembers(dropFilter, group) {
   //console.log('rules: ' + group.rules);
   var resultArray = [];
   if (group.rules === OPTION_RULE_STARTS_WITH) {

      var ctrl = dropFilter.getCtrl();

      for (var j = 0, m = group.members.length; j < m; j++) {	    // loop group members (only 1 in this case)
         var member = group.members[j];

         for (var i = 0, l = ctrl.length; i < l; i++) {					// loop options
            var optionValue = ctrl.options[i].value;

            if (optionValue.indexOf(member) === 0) {
               resultArray.push(optionValue);
               continue;
            }
         }
      }
   }
   else {  	// default rules
      resultArray = group.members;
   }
   return resultArray;
}


// select all the options that match the members of the group
function selectMembersFromGroup(dropFilter, group) {
   //console.log('selectMembersFromGroup: ' + dropFilter.getLabel() + '   group#: ' + group.members.length);

   var resultArray = getMatchedMembers(dropFilter, group);
   //console.log('QTY matched members: ' + resultArray.length);
   //viewConfig.replaceFilter(dropFilter.getColumnInfo().getItemName(), group.members.length === 1 ? group[0] : group);
   viewConfig.replaceFilter(dropFilter.getColumnInfo().getItemName(), resultArray);
   //ViewHandler.printFilters();
   //ViewHandler.refreshDrop();  // OBS: kan inte skicka in dropFilter to exclude here. we need to refresh it.
   refreshDropdowns();
}

// sets the sortColumnIndex. sortOrder (ascending/descending) is not specifically set.
// the default sortorder is retrieved from the columnInfo. When the column is clicked again it's toggled.
function setSortColumn(columnIndex, reseting) {   // reseting is optional. reset to true to use the default sort for the column (needed when reseting column that's already the sortcolumn)
   //console.log('reseting: ' + reseting + '___' + !(reseting));
   if ($.trim(columnIndex) === '')
      return;     // error

   if (sortColumnIndex === columnIndex && !reseting) {
      //console.log('same column. not reseting');
      // same column, so just switch the sort order
      sortAscending = !sortAscending;
   }
   else {
      //console.log('diff or reseting');
      // new column. check sortOrder
      var columnInfo = getColumnInfoFromIndex(columnIndex);
      if (columnInfo.isSortDescending()) {
         //console.log(columnIndex + ' has descending sort');
      }
      sortAscending = !columnInfo.isSortDescending();
      sortColumnIndex = columnIndex;
   }

   viewConfig.orderBy = '';
   var sortColumnInfo = getColumnInfoFromIndex(sortColumnIndex);
   var orderBy = $.trim(sortColumnInfo.getSortFieldName());
   if (orderBy !== '') {
      if (sortColumnInfo.isNumSort()) {
         viewConfig.orderBy = " ORDER BY CASE WHEN [" + orderBy + "] = '' THEN '999999' ELSE cast(EXTRACT_NUMERIC([" + orderBy + "]) as integer) END " + (sortAscending ? '' : ' DESC'); // 25.863ms
         //console.log('NUMCOL ' + sortColumnInfo.getTitle() + '___' + sortColumnInfo.getItemName() + '  orderBy: ' + viewConfig.orderBy);
      }
      else
         viewConfig.orderBy = " ORDER BY CASE WHEN [" + orderBy + "] = '' THEN '999999' ELSE [" + orderBy + "] END " + (sortAscending ? '' : ' DESC');
   }

   for (var i = 0, l = getColumnInfoQty() ; i < l; i++) {
      var columnInfo = getColumnInfoFromIndex(i);
      $(columnInfo.getSortArrow()).removeClass(ICON_ARROW_UP);
      $(columnInfo.getSortArrow()).removeClass(ICON_ARROW_DOWN);
      $(columnInfo.getSortArrow()).removeClass('opaque');
      //$(columnInfo.getSortArrow()).removeClass(ICON_ARROW_UP + ' ' + ICON_ARROW_UP + ' opaque');	    // FUNKAR?

      if (sortColumnIndex === i) {
         $(columnInfo.getSortArrow()).addClass(sortAscending ? ICON_ARROW_UP : ICON_ARROW_DOWN);
      }
      else {	// grey arrows
         $(columnInfo.getSortArrow()).addClass(columnInfo.isSortDescending() ? ICON_ARROW_DOWN : ICON_ARROW_UP);
         $(columnInfo.getSortArrow()).addClass('opaque');
      }
   }
}

// convenience fcn to be called from sort buttons
function sortColumn(columnIndex) {
   setSortColumn(columnIndex, false);
   generateDOM(true, false);
}

function resetFilter() {
   setSortColumn(getDefaultSortColumn(), true);
   viewConfig.clearFilters();   // clear active filters
   refreshDropdowns();
}

function getDropFilterFromItemName(itemName) {
   for (var i = 0, l = dropfilters.length; i < l; i++) {
      if (dropfilters[i].getColumnInfo().getItemName() == itemName) {
         //console.log('FOUND______________' + itemName);
         return dropfilters[i];
      }
   }
   return null;
}

function summarizeColumn(itemName) {
   //console.log('summarizeColumn ' + viewConfig.dataStores[0].alias);
   //console.time('summarizeColumn(' + itemName + ')');
   //var sql = 'SELECT CASE WHEN ISNUMERIC([' + itemName + ']) = 1 THEN CAST([' + itemName + '] AS INT) ELSE 0 END FROM data';
   var sql = 'SELECT SUM(CAST([' + itemName + '] AS NUMBER)) AS [' + itemName + '] FROM ' + viewConfig.dataStores[0].alias;

   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   //console.log('  ' + sql);

   var resultArray = alasql(sql);
   //console.timeEnd('summarizeColumn(' + itemName + ')');
   //console.dir(resultArray);
   //console.dir(resultArray[0][itemName]);
   if (resultArray.length > 0)
      return resultArray[0][itemName];

   return 0;
}



function generateDOM(forceRefresh, scrolling) {
   if (typeof viewConfig === 'undefined') {     // happens first call
      return;
   }

   if (viewConfig.createFullDOM === true && scrolling === true) {
      //console.log('exiting qty DOM rows: ' + $('ul.normal').length);
      return;
   }
   var scrollY = $(window).scrollTop();
   //console.log('generateDOM..' + scrollY + '__' + scrolling);

   if (forceRefresh || (!(scrollY >= windowMinY && scrollY <= windowMaxY))) {
      // viewPortHeight determines how many rows will be rendered. buffer areas are also rendered before and after.
      var viewPortHeight = $(parent).height();  // the real inner viewport of the browser (excludes console window, toolbar etc)
      viewPortHeight = Math.max(viewPortHeight, 216);	// set minimum height
      //console.log('YPos ' + scrollY + ' is OUTSIDE the window ' + windowMinY + '...' + windowMaxY);
      // calculate the new window borders. when scrollY is moved outside of this new rows are generated
      windowMinY = scrollY - WINDOW_HEIGHT;
      windowMaxY = scrollY + WINDOW_HEIGHT;
      var renderLowerY = Math.max(scrollY - BUFFER_HEIGHT, 0);    // use 0 as floor
      var renderHigherY = scrollY + viewPortHeight + BUFFER_HEIGHT;

      //console.log('windowMinY ' + windowMinY + '  windowMaxY ' + windowMaxY);             // ie: -480 480
      //console.log('renderLowerY ' + renderLowerY + '  renderHigherY ' + renderHigherY);   // ie:    0 960
      //console.log('viewPortHeight ' + viewPortHeight);
      // todo: cleara domen
      // loopa records (använd .where)
      // räkna ackumulerade height tills att det är innanför
      // sätt div-filler höjden
      // skapa DOM-raderna
      // checka för totals

      // clear DOM rows -----------------------------------------------------------------------------
      var containerNode = document.getElementById('data-content');
      var qtyRemoved = 0;
      while (containerNode.hasChildNodes()) {
         qtyRemoved++;
         containerNode.removeChild(containerNode.lastChild);     // 426.571ms        461.012ms       440.470ms
      }  // http://jquery.10927.n7.nabble.com/empty-is-very-slow-td117079.html
      // OBS: tar inte bort events automatiskt. behövs ev hanteras (om inte jquery 'on' methoden sköter det automatiskt)
      //console.log('clear DOM --- containerNode removed#: ' + qtyRemoved);

      //console.time('bra');
      // create DOM rows -----------------------------------------------------------------------------
      var sql = 'FROM ' + viewConfig.dataStores[0].alias;
      if (viewConfig.where !== '')
         sql += ' WHERE ' + viewConfig.where;
      sql += viewConfig.orderBy;   // should always be filled in
      var resultArray = alasql('SELECT ' + sql);// + ' LIMIT 100');// OFFSET ' + offset);
      //console.log('generateDOM sql: ' + sql, resultArray);
      var hasTotalsRow = false;
      var qtyLooped = 0;
      var qtyCreated = 0;
      var codeDOM = "";
      var totalYPos = 0;
      var initialHeight;
      var firstRenderRowFound = false;
      for (var i = 0, l = resultArray.length; i < l; i++) {
         if (viewConfig.createFullDOM === true || (totalYPos >= renderLowerY && totalYPos <= renderHigherY)) {
            if (firstRenderRowFound === false) {
               initialHeight = totalYPos;
               firstRenderRowFound = true;
               codeDOM = createHeightFillerDOMRow(initialHeight);
            }
            qtyCreated++;
            var DOM = createDOMRow(resultArray[i], ROW_NORMAL, false);
            codeDOM += DOM;
            if (viewConfig.showTotals && (i === l - 1)) {
               //console.log('last row (' + i + ') is showing..');
               var summaryEntry = { '@id': 'totalsrow' };	// only one totalsrow, so id can be set like this
               codeDOM += createDOMRow(summaryEntry, ROW_TOTALS, false);
               hasTotalsRow = true;
            }
         }
         totalYPos += STANDARD_ROW_HEIGHT;      // todo: läs från column height-value istället
         qtyLooped++;
      }
      //console.log(codeDOM);
      $('#data-content').append(codeDOM);

      var MIN_HEIGHT = 330;
      var resultQty = alasql('SELECT COUNT(*) ' + sql);
      var infilterQty = resultQty[0]['COUNT(*)'];

      // make normal rows selectable (skipping ul.totals)
      $('#data-content ul.normal').click(function () {
         $(this).toggleClass('selected').siblings().removeClass('selected');
         if ($(this).hasClass('selected')) {
            idSelectedRow = $(this).attr('id')
            //console.log('HAS selected..' + idSelectedRow);
         }
         else {
            idSelectedRow = '';
         }
      });
      /*$('#data-content ul.totals').click(function () {    // not needed. har inte klassen ul.normal
         $(this).siblings().removeClass('selected');
      });*/
      $(rowSelector()).css('width', ulWidth);	// to give background lines full length

      // add 'lastrow' class to the last visible row (whether it's a normal row or totals row)
      $('#data-content ul.lastrow').removeClass('lastrow');
      var visibleRows = $('#data-content ul.normal, #data-content ul.totals');
      if (visibleRows.length > 0)
         $(visibleRows[visibleRows.length - 1]).addClass('lastrow');

      if (/*scrolling === true &&*/ typeof idSelectedRow !== 'undefined') {
         var rowsN = $('ul.normal');
         //console.log('ul.normal#: ' + rowsN.length);
         for (var j = 0, m = rowsN.length; j < m; j++) {
            //console.log(j + ': ' + $(rowsN[j]).attr('unid'));
            if ($(rowsN[j]).attr('id') === idSelectedRow) {
               //console.log('found at pos ' + j);
               $(rowsN[j]).addClass('selected');
            }
         }
      }
      //console.log('ul.normal#: ' + $('ul.normal').length);
      refreshBackgroundRows();	// added - needs to be called if not standard row backgrounds

      if (hasTotalsRow) {
         fillInTotalsRowCells();
      }
      parent.ViewHandler.resizeIframe(false, viewConfig);      // TODO: antagligen onödig. görs inuti resetFilter()
      hideSpinner();
   }
   else {
      //console.log('YPos ' + scrollY + ' is inside the window ' + windowMinY + '...' + windowMaxY);
   }
   //console.log('qty DOM rows: ' + $('ul.normal').length);
}

function createActiveFilterDOM(activeFilters) {		// perhaps add a parameter to determine of bootstrap or standard html should be used.
   var filterDOM =
     '<button type="button" class="close resetbutton" data-dismiss="alert" aria-label="Close">' +
     '  <span aria-hidden="true">x</span>' +
     '</button>';

   for (var i = 0, l = activeFilters.length; i < l; i++) {
      var activeFilter = activeFilters[i];
      //console.dir(activeFilter);
      if (i > 0)
         filterDOM += '<br \>';
      filterDOM += '<strong>' + activeFilter.label + ': </strong>';
      for (var j = 0, m = activeFilter.displayValues.length; j < m; j++) {
         if (j > 0)
            filterDOM += ', ';
         filterDOM += $.trim(activeFilter.displayValues[j]);	// replace null with ''
      }
   }
   filterDOM = $('<div class="alert alert-warning alert-dismissible fade in" role="alert">' + filterDOM + '</div>');
   //$(filterDOM).find('button.resetbutton')[0].addEventListener('click', function () { resetFilter(false, false); }, false);
   var $button = $(filterDOM).find('button.resetbutton')[0];
   addEvent($button, 'click', function (event) {
      //console.log('$button click ');
      resetFilter(false, false);
   });

   return filterDOM;
}

function query(sql) {
   return alasql(sql);
}

function queryParam1(sql, param1) {
   // the param needs to be stringified when called from another frame
   return alasql(sql, [JSON.parse(param1)]);
}


// convenience function
function getSQLSelect() {
   var sql = 'SELECT FIRST([@id]) AS [@id]';
   for (var i = 0, l = getColumnInfoQty() ; i < l; i++) {    // 
      var columnInfo = getColumnInfoFromIndex(i);
      sql += ', FIRST([' + columnInfo.getItemName() + ']) AS [' + columnInfo.getItemName() + ']';
   }
   return sql;
}

function refreshViewHandler(unid) {
   // send the call forward to the official entry-point
   refreshWindow(unid);
}

function hasGlobalData(dataStoreIndex) {		// containerId is optional
   //console.info('hasGlobalData ' + dataStoreIndex + ': ' + (dataStoreIndex < globalData.length));
   return dataStoreIndex < globalData.length;
}

function appendGlobalData(dataStoreIndex, data) {
   //data = JSON.parse(JSON.stringify(data));
   globalData[dataStoreIndex].push(data);
}

function createGlobalData(dataStoreIndex, data) {
   if (hasGlobalData(dataStoreIndex)) {
      console.log('<error>createGlobalData() - data already exist for dataStoreIndex: ' + dataStoreIndex);
      return;
   }
   if (!(dataStoreIndex === globalData.length)) {
      console.log('<error>createGlobalData() - dataStoreIndex: ' + dataStoreIndex + ' and globalData.length: ' + globalData.length + ' must be same.');
      return;
   }
   data = JSON.parse(JSON.stringify(data));
   globalData.push(data);
   //console.info('data created (dataStoreIndex: ' + dataStoreIndex + ')');
}



