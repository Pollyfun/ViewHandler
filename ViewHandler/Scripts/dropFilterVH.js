// dependencies: columnInfoVH.js
var ATTRIBUTE_EXCLUDED = 'excluded';	// options with this attribute are ignored by the dropfilter functions (get/set etc)
var PREFIX_FILTER = 'filter_';

var TEXT_STATUS_DROPDOWN_OPTION_UNSELECT = '(Unselect)';	// for single-select
var TEXT_ALL = 'All';
var TEXT_NONE = 'None';

var ATTRIBUTE_SEPARATOR = '_____';	// when a html attribute have several values
var dropfilters = [];
var rowSelector = '';

// a class that contains a dropdown control and associated values
// input parameters
// ctrlId 		= id of an existing DOM control
// dataKey 	   = used to connect the with the data in the ul-rows. 
//               lowercase is used and spaces are removed.
// label 		= first entry in the dropdown
// columnInfo	= the columnInfo connected to this dropFilter (optional)
// tag         = extra info (optional)
function dropFilter(ctrlId, dataKey, label, columnInfo, tag) {

   var _ctrlId = ctrlId;				//ie: filter_siteinfo, filter_status
   var _ctrl = document.getElementById(ctrlId);
   var _dataKey = replaceAll(dataKey.toLowerCase(), ' ', '');  // ie: siteinfo,  status
   var _label = label;					                           // ie: Anlr nr,   Status
   var _columnInfo = columnInfo;
   var _level = 0;
   var _oldSelection = [];
   var _hasSavedSelection = false;	// _oldSelection isn't enough. for multiple, [] is also a valid filter
   var _members = [];
   var _tag = $.trim(tag); // optional extra info
   var _numSort = false;
   var _sortDescending = false;

   this.getColumnInfo = function() {
      return _columnInfo;
   }
   this.getCtrl = function() {
      return _ctrl;
   }
   this.getCtrlId = function() {
      return _ctrlId;
   }
   this.getDataKey = function() {
      return _dataKey;
   }
   this.getLabel = function() {
      return _label;
   }
   this.getLevel = function() {
      return _level;	// slaves have level = 0
      // master1Filter have level = 1
      // master2Filter have level = 2
   }

   this.isNumSort = function() {
      return _numSort;
   }
   this.setNumSort = function (value) {
      if (typeof value !== 'boolean')
         return;
      _numSort = value;
   }
   this.isSortDescending = function () {
      return _sortDescending;
   }
   this.setSortDescending = function (value) {
      if (typeof value !== 'boolean')
         return;
      _sortDescending = value;
   }
   this.getTag = function() {
      return _tag;
   }

   this.addMember = function(filterValue, filterText) {	// filterText is optional (can be blank)
      // note that it might be easiest to leave out the filterText parameter if not necessarily needed.
      // when adding several members with the same filterValue, only the filterText of the first one is used. The subsequent ones are ignored.
      // ie: 
      //  filterValue:"2016" filterText: "2016-06-07"    2016-06-07 will be the visible text for the 2016 filterValue
      //  filterValue:"2016" filterText: "2016-06-14"    2016-06-14 ignored
      //  filterValue:"2016" filterText: "2016-06-27"    2016-06-27 ignored
      //console.log('filterText: ' + filterText + '  filterValue: ' + filterValue);

      for (var index in _members) {
         if (filterValue === _members[index].value)
         {
            //if (this.getLabel() === 'Lev datum') {
               //console.log('filterValue ALREADY added: ' + filterValue + '  (filterText: ' + filterText + ')');
            //}
            //console.log('filterValue ALREADY added: ' + filterValue);
            return;
         }
      }
      filterText = $.trim(filterText);
      filterText = filterText === '' ? filterValue : filterText;
      //if (this.getLabel() === 'Månad') {
      //   console.log('adding member____' + filterValue + '____' + filterText);
      //}
      _members.push({ value: filterValue, text: filterText });
   }

   this.getMemberFromFilterValue = function (filterValue) {
      if (filterValue === null)
         return null;
      //console.log('find filterValue: ' + filterValue);
      for (var index in _members) {
         //console.info('  ', _members[index].value);
         if (filterValue === _members[index].value) {
            return _members[index];
         }
      }
      return null;
   }

   this.getMembers = function() {
      return _members;
   }
   this.sortMembers = function () {
      //console.info('  numsort: ' + this.isNumSort() + '  desc: ' + _sortDescending);
      if (this.isNumSort()) {
         if (_sortDescending)
            _members.sort(sortNumberD);
         else
            _members.sort(sortNumberA);
      }
      else {
         if (_sortDescending)
            _members.sort(charOrdD);
         else
            _members.sort(charOrdA);
      }
   }
   
   this.clearMembers = function() {
      _members = [];	// since it's not a true array neither '=0' or '.pop()' works
   }
   this.getQtyMembers = function() {
      // has to loop it since it's not a true array
      var qty = 0;
      for (var entry in _members) {
         qty++;
      }		
      return qty;
   };

   // dependent on DOM control
   this.setLevel = function (level) {
      if (_ctrl === null)
         return;
      if (!(isInt(level) && level >= 0))    // only allow integers 0+
         return;

      // change the background colour
      $(this.getCtrl()).removeClass('master1 master2 master3 master4 master5');				// for the bootstrap select
      $(this.getCtrl()).parent().removeClass('master1 master2 master3 master4 master5');  // for the non-bootstrap select
      $(this.getCtrl().parentNode).find('div.bootstrap-select').removeClass('master1 master2 master3 master4 master5');

      var className = '';
      if (level > 5)
         level = 5;      // if > 5, use the same css-class as 5
      if (level >= 1) {
         className = 'master' + level;
         $(this.getCtrl()).addClass(className);
         $(this.getCtrl()).parent().addClass(className);	// for the non-bootstrap select
      }
      return _level = level;
   }
   // dependent on DOM control
   this.isMultiple = function () {	// return true if the control is <select multiple>       
      if (_ctrl === null)
         return false;
      // for some browsers, 'attr' is undefined; for others, 'attr' is false. Check for both.
      var attr = $(_ctrl).attr('multiple');
      return (typeof attr !== typeof undefined && attr !== false);
      //return _ctrl.getAttribute('multiple') != null;	// does NOT work in IE8/IE9
   };
   // dependent on DOM control
   this.isAllOptionsSelected = function () {
      if (_ctrl === null)
         return false;

      for (var i=0, l=_ctrl.options.length; i<l; i++) {
         if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))
            continue;
         if (!_ctrl.options[i].selected)
            return false;
      }
      return true;
   };
   // dependent on DOM control
   this.getAllSelectedOptionValues = function () {
      if (_ctrl === null)
         return [];
      // we cannot use $(_ctrl).val() because it trims empty values...
      var a = [];
      var options = _ctrl.options;
      for (var i=0, l=options.length; i<l; i++) {
         if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))
            continue;
         if (options[i].selected) 
            a.push(options[i].value);			
      }
      return a;
   };
   this.getOldSelection = function() {
      return _oldSelection;
   };	
   this.inOldSelection = function(value) {
      return $.inArray(value,this.getOldSelection())>=0;
   };	
   this.inSelection = function(value) {
      //return $.inArray(value, this.getSelection()) >= 0;
      return $.inArray(value, this.getAllSelectedOptionValues()) >= 0;
   };
   // dependent on DOM control
   this.getQtySelected = function () {
      if (_ctrl === null)
         return 0;

      var qty = 0;
      // single - the first entry is selected and hidden when nothing is actively selected ('[Avmarkera]')
      var startIndex = this.isMultiple() ? 0 : 1;
      for (var i=startIndex, l=_ctrl.options.length; i<l; i++) {	
         if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))  // not 100% needed since they're never selected
            continue;
         if (_ctrl.options[i].selected) 
            qty++;
      }
      return qty;
   };
   // dependent on DOM control
   this.hasSelection = function() {
      if (this.isMultiple())
         // multiple: everything's has to be selected, otherwise it's a selection
         return !this.isAllOptionsSelected();
      else // single select
         return this.getQtySelected() > 0;
   };
   // dependent on DOM control
   this.getFirstValue = function () {		// for single selects
      if (_ctrl === null)
         return '';

      for (var i=0, l=_ctrl.options.length; i<l; i++) {
         if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))  // not 100% needed since they're never selected
            continue;
         if (_ctrl.options[i].selected)
            return _ctrl.options[i].value;
      }
      return '';
   };
	
   //this.printOldSelection = function() {
   //	var output = "~";
   //	for (var i=0, l=_oldSelection.length; i<l; i++) {
   //		output += _oldSelection[i] + "_";
   //	} 
   //	return output;
   //};
}

// ---------------------- dropfilter functions ------------------------------------------
function getDropFilterQty() {
   return dropfilters.length;
}
// return the first object which has this level
function getDropFilterFromLevel(level) {
   for (var i=0, l=dropfilters.length; i<l; i++) {
      if (dropfilters[i].getLevel() == level)
         return dropfilters[i];
   }
   return null;
}
function getDropFilterFromIndex(index) {
   if (index < dropfilters.length)
      return dropfilters[index];

   return null;
}
function getDropFilterFromCtrl(ctrl) {
   for (var i=0, l=dropfilters.length; i<l; i++) {
      if (dropfilters[i].getCtrl() == ctrl)
         return dropfilters[i];
   }
   return null;
}

function fillInDropDowns(excludeDropFilter) {     // TEMP name
   //console.log('fillInDropDowns_________________________________________________________________________________');

   var marksDropfiltersUnprocessed = function () {
      dropfilters.forEach(function (item, index) {
         item.processed = false;

         if (item === excludeDropFilter && excludeDropFilter.isMultiple()) {
            //console.log('NOT ' + item.getLabel() + ' skipping..');
            //return;   // also excludeDropFilter needs to be reset. 
         }
         //console.log(item + '___' + index);
         item.setLevel(0);
      });
   }

   var fillInDropdownMembers = function (dropFilter, resultArray, fieldName) {      // resultArray contains each unique combination of content in the field 
      //if (dropFilter.getLabel() === 'Betalform') console.log('___processDropdown ' + dropFilter.getLabel() + ' ' + resultArray.length);
      //if (dropFilter.getLabel() === 'Betalform') console.dir(resultArray);
      //console.info('resultArray: ', resultArray);
      // fill in dropFilter members
      var qtyFound = 0;

      if (dropFilter.getColumnInfo().isAltFilter()) {    // the Filter_ field is an array with arrays. The outer array is once per entry. The inner array is 0:value 1:display.
         
         for (var j = 0, m = resultArray.length; j < m; j++) {
            qtyFound++;
            var arrFilter = resultArray[j][fieldName];
            //console.info('arrFilter (' + dropFilter.getLabel() + ') #:' + arrFilter.length, arrFilter);
            for (var k = 0, n = arrFilter.length; k < n; k++) {
               var entry = arrFilter[k];
               var filterValue = entry[0];
               var filterText = entry[1];

               dropFilter.addMember(filterValue, filterText);        // add every entry to dropfilter
            }
         }
      }
      else {      // the visible value is used
         for (var j = 0, m = resultArray.length; j < m; j++) {
            qtyFound++;
            var filterValue = resultArray[j][fieldName];
            var filterText = filterValue;
            dropFilter.addMember(filterValue, filterText);           // add every entry to dropfilter
         }
      }
      //console.log(sql + '   QTY: ' + qtyFound);
      totalQtyOptions += qtyFound;
   }

   var createUnselectOption = function (dropFilter) {
      // do NOT check for excludeDropFilter. when selecting in a single select, the dropdown is closed. 'Avmarkera' must be available after that (added here)
      //if (dropFilter === excludeDropFilter) {
      //    // CANNOT skip excludeDropFilter. when selecting in a single select, the dropdown is closed. 'Avmarkera' must be available after that (added here)
      //    //console.log('NOT3 ' + excludeDropFilter.getLabel() + ' skipping..');
      //    //return;
      //}
      //console.log('createUnselectOption ' + dropFilter.getLabel());

      // fill in the title and special options
      if (!dropFilter.isMultiple()) {						// single select
         //console.log('CREATING (Avmarkera)............' + dropFilter.getLabel() + ' level: ' + dropFilter.getLevel());
         // option needs a value other than empty string since that is a valid entry
         if (dropFilter.getLevel() === 0)  // make (Avmarkera) option hidden when it's not a master filter
            $(dropFilter.getCtrl()).append('<option value="deselectall" class="hidden">' + TEXT_STATUS_DROPDOWN_OPTION_UNSELECT + '</option>');
         else
            $(dropFilter.getCtrl()).append('<option value="deselectall">' + TEXT_STATUS_DROPDOWN_OPTION_UNSELECT + '</option>');    
      }
      else {
         //console.log('createUnselectOption - MULTIPLE ' + dropFilter.getLabel());
         //$(dropFilter.getCtrl()).append('<option value="">' + dropFilter.getLabel() + '</option>');
      }
   }


   var sortDropfilterMembers = function(dropFilter) {
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('NOT4 ' + excludeDropFilter.getLabel() + ' skipping..');
         return;
      }
      dropFilter.sortMembers();
      var arrMembers = dropFilter.getMembers();
      //console.log('arrmembers__________________' + arrMembers.length);

      // move empty (string) member last
      var emptyStringIndex = arrMembers.indexOf('');
      if (emptyStringIndex > -1) {
         var emptyEntry = arrMembers.splice(emptyStringIndex, 1);      // removes it from the actual array
         dropFilter.addMember(emptyEntry, '');
         //console.log("HAS EMPTY ENTRY: " + dropFilter.getLabel() + '   #: ' + arrMembers.length + '____' + dropFilter.getQtyMembers());
      }
      //else
      //    console.log("no EMPTY ENTRY: " + dropFilter.getLabel() + '   #: ' + arrMembers.length + '____' + dropFilter.getQtyMembers());
   }

   var createFilterOptions = function(dropFilter, arrFilterValues) {
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('NOT5 ' + excludeDropFilter.getLabel() + ' skipping..');
         return;
      }
      
      var arrMembers = dropFilter.getMembers();
      // loop through members and create the options
      for (var entry in arrMembers) {  // each entry in the dropdown list
         
         var filterValue = arrMembers[entry].value;      // ie: "2016"
         var filterText = arrMembers[entry].text;     // ie: "2016-06-07"
         //console.info(filterValue + '__' + filterText, arrMembers[entry]);
         filterText = $.trim(filterText);
         if (filterValue == '')    // === doesn't work here..  for some reason not an empty string, so replace it. otherwise indexOf fails for empty options.
            filterValue = '';
         if (filterText === '')
            filterText = filterValue;
         var selected = arrFilterValues.indexOf(filterValue) > -1;
         // OBS: arrFilterValues.length är 0 när alla options har avselekterats
         if (dropFilter.isMultiple() && dropFilter.getLevel() === 0) {
            //console.log('setting SELECTED for ' + dropFilter.getLabel());
            selected = true;        // options inside a multiple select is selected per default
         }

         var filterRow = convertFilterOptionText(dropFilter, filterValue, filterText, selected);
         $(dropFilter.getCtrl()).append($('' + filterRow));
         //console.log(" dropFilter appending: " + filterRow);

         //if (dropFilter.getLabel() === 'Lev datum') {
         //   console.log('filterValue: ' + filterValue + '   filterText: ' + filterText);
         //   console.log(filterRow);
         //   console.info(arrMembers[entry]);
         //}
      }
   }

   marksDropfiltersUnprocessed();
   var totalQtyOptions = 0;

   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {
         //console.log('NOT2 ' + excludeDropFilter.getLabel() + ' skipping..');
         continue;      // note that this means that 'excluded' options will remain for the selected filter, and new 'excluded' options should not be added for it in handleFilterOptions()
      }
      dropFilter.clearMembers();
      //console.log(i + '  ' + dropFilter.getLabel() + '  clearmembers!');
      // clear the dropdown list
      dropFilter.getCtrl().options.length = 0;
   }

   var activeFiltersList = []; // needed for the DOM active filters panel
   var masterIndex = 1;
   viewConfig.where = '';     // if no filters are active, this string stays empty
   var whereIsUsed = false;    // to set 'AND'

   for (var i = 0, l = viewConfig.filterHierarchy.length; i < l; i++) {        // only active filters are members here
      var fieldName = viewConfig.filterHierarchy[i];
      //console.log('___viewConfig.filterHierarchy___' + i + ': ' + fieldName);

      var dropFilter = getDropFilterFromTitle(fieldName);
      if (!dropFilter) {
         console.log('<warning> No dropFilter exists with title: ' + fieldName);
         continue;
      }
      dropFilter.processed = true;
      // note that the dropdown with the highest precedent (0 in the hierarchyFilter-list) is not filtered

      var fieldNameFilter = dropFilter.getColumnInfo().getFilterFieldName();

      var sql = 'SELECT DISTINCT [' + fieldNameFilter + '] FROM ' + viewConfig.dataStores[0].alias;
      if (whereIsUsed)
         sql += ' WHERE ' + viewConfig.where;
      //console.log('  DROPDOWN FILTER: ' + sql);

      var resultArray = alasql(sql);
      fillInDropdownMembers(dropFilter, resultArray, fieldNameFilter);            // BEHÃ–VER Level......

      // IMPORTANT: the WHERE code requires that the dropFilter members have already been filled in (in fillInDropdownMembers)
      // at this point the sql has been processed
      // now add WHERE clause to the sql to be used in the following sql questions
      var arrFilterValues = viewConfig.getActiveFilterArray(fieldName);
      if (!arrFilterValues.length > 0) {
         console.log('<warning> No arrFilterValues returned for title: ' + fieldName);
         continue;
      }

      var highest = 0;
      {
         var tmpSQL ='SELECT [' + dropFilter.getColumnInfo().getFilterFieldName() + '] FROM ' + viewConfig.dataStores[0].alias;
         if (whereIsUsed)
            tmpSQL += ' WHERE ' + viewConfig.where;
         var r1 = alasql(tmpSQL);
         //console.log('sql: ' + tmpSQL);  //  SELECT [Filter_$30] FROM data
         //console.info(r1);
         //console.info('#: ' + r1.length);
         for (var j = 0, m = r1.length; j < m; j++) {
            //console.info(j, r1[j][dropFilter.getColumnInfo().getFilterFieldName()].length);
            var length = r1[j][dropFilter.getColumnInfo().getFilterFieldName()].length;
            if (length > highest)
               highest = length;
         }
         //console.info('highest: ' + highest);
      }

      // make sure that the value from the active filter is actually in the newly created list of values for the dropdown (might not be after a higher dropdown has changed)
      arrFilterValues = validateActiveFilterValues(arrFilterValues, dropFilter);
      //console.info('resultArray: ', resultArray);
      //console.info('arrFilterValues: ', arrFilterValues);
        
      if (arrFilterValues.length > 0) { // there might not be any valid active filter values left after validation
         if (whereIsUsed)
            viewConfig.where += ' AND '
         whereIsUsed = true;

         var colValues = [];		// always an array
         var colDisplayValues = [];

         viewConfig.where += '(';
         for (var j = 0, m = arrFilterValues.length; j < m; j++) {
            if (j > 0)
               viewConfig.where += ' OR '

            if (dropFilter.getColumnInfo().isAltFilter()) {
               // when Filter_ column is used, match substrings instead of the full value
               //viewConfig.where += '[' + dropFilter.getColumnInfo().getFilterFieldName() + '] LIKE "%<' + arrFilterValues[j] + '>%"';
               // the performance hit for LIKE is massive.   (Område takes 6 seconds when filtering on Lev datum). Has to solve substring matching in another way.
               // Todo: handle many-to-many
               // loopa igenom så många [] som den djupaste cellen är
               // 
               if (highest > 0)
                  viewConfig.where += '('

               for (var k = 0, n = highest; k < n; k++) {
                  if (k > 0)
                     viewConfig.where += ' OR '
                  viewConfig.where += '[' + dropFilter.getColumnInfo().getFilterFieldName() + ']->[' + k + ']->[0] = "' + arrFilterValues[j] + '"';

               }
               if (highest > 0)
                  viewConfig.where += ')'
            }
            else { // exact match on full filter value
               viewConfig.where += '[' + dropFilter.getColumnInfo().getFilterFieldName() + '] = "' + arrFilterValues[j] + '"';
            }
            //console.info(viewConfig.where);
            colValues.push(arrFilterValues[j]);
            colDisplayValues.push(overrideActiveFilterValue(dropFilter, arrFilterValues[j]));
            //console.info(j, arrFilterValues[j]);
         }
         viewConfig.where += ')';
         //console.log('fillInDropDowns - viewConfig.where: ' + viewConfig.where);

         if (colValues.length > 0) {
            //console.info(dropFilter.getLabel(), colValues, colDisplayValues);
            activeFiltersList.push(new filterEntry(dropFilter.getCtrlId(), dropFilter.getLabel(), masterIndex, colValues, colDisplayValues, true));
         }
         // update css:
         dropFilter.setLevel(masterIndex);
         masterIndex++; // only increase for a filter that's actually active
      }

      sortDropfilterMembers(dropFilter);
      // adding (Avmarkera) option. this requires that setLevel() has been called.
      createUnselectOption(dropFilter);     // before the other options
      createFilterOptions(dropFilter, arrFilterValues);
   }

   //console.log('WHERE: ' + viewConfig.where);
   //console.log('CHECKING||  ' + fieldName + '__' + columnInfo.getFilterFieldName());         // $58

   // at this point all dropdowns with active filters have been filled in
   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      if (dropFilter.processed === true) {
         //console.log('  ' + i + ' processed');
         continue;
      }
      else {
         //console.log('  ' + i + ' NOT processed');
         var fieldName = dropFilter.getColumnInfo().getFilterFieldName();

         var sql = 'SELECT DISTINCT [' + fieldName + '] FROM ' + viewConfig.dataStores[0].alias;   // WHERE Ort="Helsingborg"';
         if (whereIsUsed)
            sql += ' WHERE ' + viewConfig.where;
         //sql += ' ORDER BY [' + fieldName + '] '         // antagligen irrelevant. multi_value attribut läggs till senare
         //console.log('  DROPDOWN FILTER: ' + sql);

         var resultArray = alasql(sql);
         fillInDropdownMembers(dropFilter, resultArray, fieldName);

         sortDropfilterMembers(dropFilter);
         createUnselectOption(dropFilter);      // before the other options
         createFilterOptions(dropFilter, []);

         dropFilter.processed = true;
      }
   }
   //console.log('viewConfig.where: ' + viewConfig.where);
   var sql = 'SELECT COUNT(*) FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var resultQty = alasql(sql);
   viewConfig.qtyVisible = resultQty[0]['COUNT(*)'];
   //console.log('Filter SQL: ' + sql);

   // sort the active filter list hierarchically
   //activeFiltersList.sort(sortActiveFilters);

   var event = $.Event('filterwasupdated');
   event.containerId = viewConfig.containerId;
   event.filterdata = activeFiltersList;
   parent.$('body').trigger(event);

   while (activeFiltersList.length > 0)
      activeFiltersList.pop();
   delete activeFiltersList;
}

function validateActiveFilterValues(arrFilterValues, dropFilter) { //, resultArray) {
   var returnList = [];

   for (var i = 0, l = arrFilterValues.length; i < l; i++) {
      var filterValue = arrFilterValues[i];
      //console.log('validate: ' + filterValue +  '    QTY members: ' + dropFilter.getQtyMembers() + '__' + dropFilter.getMembers().length);

      var isValueFound = false;
      var members = dropFilter.getMembers();
      for (var index in members) {
         //console.log(' compare ' + filterValue + ' with ' + member);
         if (filterValue === members[index].value || filterValue === null)     // must allow null option (used when no options are selected for multiple dropfilter)
            isValueFound = true;
      }
      if (isValueFound) {
         returnList.push(filterValue);
      }
      else {
         //console.log('Filter value NOT allowed: ' + filterValue);
      }
   }
   //return arrFilterValues;
   return returnList;
}


function sortNumberA(a, b) {
   // if some parseInt returns NaN it doesn't matter much. the other members will continue sorting
   //console.log(parseInt(a.value, 10) + " > " + parseInt(b.value, 10) + ": " + (parseInt(a.value, 10) > parseInt(b.value, 10)));
   return parseInt(a.value, 10) - parseInt(b.value, 10);	// OBS: funkar ej med >, den kör bara 1 iteration..
}

function sortNumberD(a, b) {
   //console.log(parseInt(a) + " > " + parseInt(b) + ": " + (parseInt(a) > parseInt(b)));
   return parseInt(b.value, 10) - parseInt(a.value, 10);	// OBS: funkar ej med >, den kör bara 1 iteration..
}

// sort ascending, ignore case
function charOrdA(a, b) {
   var a1 = a.value.toLowerCase();
   var b1 = b.value.toLowerCase();
   //console.info(a, b, a1, b1);
   if (a1 > b1)
      return 1;
   if (a1 < b1)
      return -1;
   return 0;
}

// sort descending, ignore case
function charOrdD(a, b) {
   var a1 = a.value.toLowerCase();
   var b1 = b.value.toLowerCase();
   if (a1 < b1)
      return 1;
   if (a1 > b1)
      return -1;
   return 0;
}


// sets the master filters when appliceable
function filterUpdate(dropdownCtrl) {
   // change active filters
   var inputDropFilter = getDropFilterFromCtrl(dropdownCtrl);	// needed for multiple select
   //console.log('filterUpdate ' + inputDropFilter.getLabel() + '___' + inputDropFilter.getDataKey());
   //console.dir(dropdown);

   var options = $(dropdownCtrl).find('option:selected');
   var selectableOptions = $(dropdownCtrl).find('option:not([' + ATTRIBUTE_EXCLUDED + '])');
   //console.log('options: ' + options.length);
   //console.dir(options);
   var values = [];
   for (var i = 0, l = options.length; i < l; i++) {
      //console.log(i + ': ' + options[i].value);
      values.push(options[i].value);
   }
   //console.log('FILTER UPDATE values: ' + values.length + '   ' + values[0] + '  SELECTED: ' + options.length + ' / ' + selectableOptions.length);

   if (inputDropFilter.isMultiple()) {
      if (options.length === 0) { // allow no selected options
         //console.log('setting NULL filter');
         viewConfig.replaceFilter(inputDropFilter.getColumnInfo().getTitle(), null);
      }
      else if (options.length === selectableOptions.length)
         viewConfig.removeFilter(inputDropFilter.getColumnInfo().getTitle());
      else
         viewConfig.replaceFilter(inputDropFilter.getColumnInfo().getTitle(), options.length === 1 ? values[0] : values);

   }
   else {   // single select
      if (options.length === 0)
         viewConfig.removeFilter(inputDropFilter.getColumnInfo().getTitle());
      else
         viewConfig.replaceFilter(inputDropFilter.getColumnInfo().getTitle(), options.length === 1 ? values[0] : values);
   }
   refreshDropdowns(inputDropFilter);
}


function refreshSelectPickers(excludeDropFilter) {
   for (var i = 0, l = getDropFilterQty() ; i < l; i++) {
      var dropFilter = getDropFilterFromIndex(i);
      if (dropFilter === excludeDropFilter && excludeDropFilter.isMultiple()) {   // behöver refreshas så att master-klassen uppdateras
         //console.log('NOT7 ' + excludeDropFilter.getLabel() + ' skipping..');
         //continue;
      }
      $(dropFilter.getCtrl()).selectpicker('refresh');
   }
}

// entries for active filters
function filterEntry(name, label, level, values, displayValues, exactMatch) {	// values is an array
   this.attributeName = name;
   this.label = label;
   this.level = level;
   this.values = values;
   this.displayValues = displayValues;
   this.exactMatch = exactMatch;
}

//function isObject(obj) {
//   return obj === Object(obj);
//}

