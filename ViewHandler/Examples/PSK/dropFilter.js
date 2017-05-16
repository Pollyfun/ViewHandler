var ATTRIBUTE_EXCLUDED = 'excluded';	// options with this attribute are ignored by the dropfilter functions (get/set etc)
var PREFIX_FILTER = 'filter_';
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
	var _dataKey = replaceAll(dataKey.toLowerCase(), ' ', '');
												//ie: siteinfo, 		  status
	var _label = label;					//ie: Anlr nr,	 		  Status
	var _columnInfo = columnInfo;
	var _level = 0;
	var _oldSelection = [];
	var _hasSavedSelection = false;	// _oldSelection isn't enough. for multiple, [] is also a valid filter
	var _members = [];
	var _tagMembers = [];	// optional. sometimes an extra value is needed for icons or other things
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
		return _level;	// slaves 		  have level = 0
							// master1Filter have level = 1
							// master2Filter have level = 2
	}
	this.setLevel = function(level) {
		// change the background
		if (level === 1) {
			$(this.getCtrl()).addClass('masterOne');
			$(this.getCtrl()).parent().addClass('masterTwo');	// for the non-bootstrap select
		}
		else if (level ===2) {
			$(this.getCtrl()).addClass('masterTwo');
			$(this.getCtrl()).parent().addClass('masterTwo');	// for the non-bootstrap select
		}
		else {
			$(this.getCtrl()).removeClass('masterOne masterTwo');				// for the bootstrap select
			$(this.getCtrl()).parent().removeClass('masterOne masterTwo');	// for the non-bootstrap select
			$(this.getCtrl().parentNode).find('div.bootstrap-select').removeClass('masterOne masterTwo');
		}
		return _level = level;
	}
	
	this.isNumSort = function() {
		return _numSort;
	}
	this.setNumSort = function(numSort) {
		return _numSort = numSort;
	}
	this.getSortDescending = function() {
		return _sortDescending;
	}
	this.setSortDescending = function(sortDescending) {
		return _sortDescending = sortDescending;
	}
	this.getTag = function() {
		return _tag;
	}
	this.addMember = function(value, tag) {	// tag is optional (can be blank)
		_members[value] = tag;
	}
	this.getMembers = function() {
		return _members;
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
	this.isMultiple = function() {	// return true if the control is <select multiple>
		// for some browsers, 'attr' is undefined; for others, 'attr' is false. Check for both.
		var attr = $(_ctrl).attr('multiple');
		return (typeof attr !== typeof undefined && attr !== false);
		//return _ctrl.getAttribute('multiple') != null;	// does NOT work in IE8/IE9
	};
	
	this.isAllOptionsSelected = function() {
		// we start with index 1 since the first is the special Label or All/None option
		for (var i=1, l=_ctrl.options.length; i<l; i++) {
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))
				continue;
			if (!_ctrl.options[i].selected)
				return false;
		}
		return true;
	};
	this.getAllSelectedOptionValues = function() { 
		// we cannot use $(_ctrl).val() because it trims empty values...
		var a = [];
		var options = _ctrl.options;
		for (var i=1, l=options.length; i<l; i++) {
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))
				continue;
			if (options[i].selected) 
				a.push(options[i].value);			
		}
		return a;
	};
	this.setAllOptionsSelected = function(selected) {
		var options = _ctrl.options;
		for (var i=1, l=options.length; i<l; i++) {// skipping the first one 
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))
				continue;
			options[i].selected = selected;
		}
	};
	this.getOldSelection = function() {
		return _oldSelection;
	};	
	this.getSelection = function() {
		// we cannot use $(select).val() because it trims empty values...
		return this.getAllSelectedOptionValues();
	};
	this.inOldSelection = function(value) {
		return $.inArray(value,this.getOldSelection())>=0;
	};	
	this.inSelection = function(value) {
		return $.inArray(value,this.getSelection())>=0;
	};
	this.saveSelection = function() {
		// we cannot use $(select).val() because it trims empty values...
		_oldSelection = this.getAllSelectedOptionValues();
		_hasSavedSelection = true;		// used when multiple
	};
	
	this.clearOldSelection = function() {
		_oldSelection = [];
		_hasSavedSelection = false;
	};
	this.hasOldSelection = function() {
		if (this.isMultiple())
			return _hasSavedSelection;
		else // single select
			return _oldSelection.length > 0;
	};
	this.getQtySelected = function() {      // TODO: ev samma kod som i dropFilterVH.js
		var qty = 0;
		//for (var i=(this.isMultiple()? 1 : 0), l=_ctrl.options.length; i<l; i++) {	// multiple skip the first entry
		// multiple - skip the first entry
		// single - the first entry is selected and hidden when nothing is actively selected ('[Avmarkera]')
		for (var i=1, l=_ctrl.options.length; i<l; i++) {	
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))  // not 100% needed since they're never selected
				continue;
			if (_ctrl.options[i].selected) 
				qty++;
		}
		return qty;
	};
	this.hasSelection = function() {
		if (this.isMultiple())
			// multiple: everything's has to be selected, otherwise it's a selection
			return !this.isAllOptionsSelected();
		else // single select
			return this.getQtySelected() > 0;
	};
	this.getFirstValue = function() {		// for single selects
		for (var i=0, l=_ctrl.options.length; i<l; i++) {
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))  // not 100% needed since they're never selected
				continue;
			if (_ctrl.options[i].selected)
				return _ctrl.options[i].value;
		}
		return '';
	};
	this.getFirstText = function() {		// for single selects
		for (var i=0, l=_ctrl.options.length; i<l; i++) {
			if ($(_ctrl.options[i]).is('[' + ATTRIBUTE_EXCLUDED + ']'))  // not 100% needed since they're never selected
				continue;
			if (_ctrl.options[i].selected)
				return _ctrl.options[i].text;
		}
		return '';
	};	

	this.printOldSelection = function() {
		var output = "~";
		for (var i=0, l=_oldSelection.length; i<l; i++) {
			output += _oldSelection[i] + "_";
		} 
		return output;
	};
	
	// used when creating DOM options.
	// by default multiple select options are selected
	// and single select options not selected
	this.isDomValueSelected = function(value) {
		var selected = false;
		if (this.isMultiple()) {
			if (!(this.hasOldSelection() && !this.inOldSelection(value)))
				selected = true;
		}
		else {	// single select
			selected = this.inOldSelection(value);
		}
		return selected;
	}
}

// ---------------------- dropfilter functions ------------------------------------------
var TEXT_STATUS_DROPDOWN_OPTION_ALL = '(Markera allt)';
var TEXT_STATUS_DROPDOWN_OPTION_NONE = '(Markera allt)';
var TEXT_STATUS_DROPDOWN_OPTION_UNSELECT = '(Avmarkera)';	// for single-select

var ATTRIBUTE_SEPARATOR = '_____';	// when a html attribute have several values
var dropfilters = [];
var rowSelector = '';

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

function isObject(obj) {
  return obj === Object(obj);
}

// only called when we have to update the available entries in the dropdowns (not when updating non-master list)
function fillInFilterContent() {

	// extract the master filters
	var master1Filter = getDropFilterFromLevel(1);
	var master2Filter = getDropFilterFromLevel(2);

	for (var i=0, l=getDropFilterQty(); i<l; i++) {
		var dropFilter = getDropFilterFromIndex(i);
		//console.log(i + ": " + dropFilter.hasOldSelection() + " " + dropFilter.getOldSelection());
		//console.log(" " + i + "a    Multiple: " + dropFilter.getLabel() + " AllOptionsSel:" + dropFilter.isAllOptionsSelected() + "  hasSelection: " + dropFilter.hasSelection() + " (ctrls: " + $(dropFilter.getCtrl()).length + ")");

		dropFilter.clearOldSelection();	// important
		// if it's a multiple select and all options are selected, do not save them.
		// when a row is updated with a value that's not previously in the filter, that value
		// must also be selected (to make the row visible), which is done by not saving here.
		var allSelected = dropFilter.isMultiple() && dropFilter.isAllOptionsSelected();
		if ((!dropFilter.isMultiple()) || !allSelected) {
			dropFilter.saveSelection();		
			//console.log(" SAVE SELECTION fillInFilterContent(" + dropFilter.getLabel() + ") SAVING selection");
		}
		//console.log("   clearMembers: " + dropFilter.getLabel() + "__isAllSelected: " + dropFilter.isAllOptionsSelected());
		dropFilter.clearMembers();
		//console.log(" (2)fillInFilterContent(" + dropFilter.getLabel() + ") clearMembers() __isAllSelected: " + dropFilter.isAllOptionsSelected());
	}
	
	//console.log('master1Filter: ' +  master1Filter);
	var filterRows = $(rowSelector());	// fcn pointer

	for (var i=0, l=filterRows.length; i<l; i++) {
		// inscope is optional. if the attribute doesn't exist, the object is visible
		var notInScope = filterRows[i].getAttribute('inscope') === '0' ? true : false;
		if (notInScope)
			continue;

		// fill in master1-list first, since it shouldn't be filtered
		if (master1Filter != null) {
			var attrName = PREFIX_FILTER + master1Filter.getDataKey();
			var attrValue = $.trim(filterRows[i].getAttribute(attrName));	// important with trim to transform null-values to empty string (can happen when save/replication conflict)
			
			// NOTE: tag and tagValue is used by Projects. both can be '' for ViewHandler
			var tag = $.trim(master1Filter.getTag());
			var tagValue = (tag == '' ? '' : $(filterRows[i]).data('json')[tag]);
			//console.log("master 1 is used. name: " + attrName + " value: " + attrValue+ " tagValue: " + tagValue);
			var arrValues = attrValue.split(ATTRIBUTE_SEPARATOR);
			for (var j=0, m=arrValues.length; j<m; j++)
				master1Filter.addMember(arrValues[j], tagValue);	// add every entry to master1Filter

			//console.log("master1Filter.hasSelection(): " + master1Filter.hasSelection());
			if (master1Filter.hasSelection()) {		// TESTA om denna ers\u00E4tter ovanst\u00E5ende

				// a value is selected in the master1 control, so only continue
				// if this row matches it
				// JL: when we have several values in the attribute. one of them must match the filter selection
				var found = false;
				for (var k=0, n=arrValues.length; k<n; k++) {
					//console.log("   checking value: " + arrValues[k]); 
					if (master1Filter.inSelection(arrValues[k])) {
						//console.log("master1Filter has value: " + arrValues[k]);
						found = true;
						break;
					}
				}
				if (!found)
					continue;	// row is not visible and the attributes will not be used to fill in dropdown values
			}
			//arrValues.length = 0;		must catch all if used

			if (master2Filter != null) {
				//var attrName = master2Filter.getDataKey();
				var attrName = PREFIX_FILTER + master2Filter.getDataKey();
				var attrValue = $.trim(filterRows[i].getAttribute(attrName));
				var tag = $.trim(master2Filter.getTag());				
				var tagValue = (tag == '' ? '' : $(filterRows[i]).data('json')[tag]);

				var arrValues = attrValue.split(ATTRIBUTE_SEPARATOR);
				for (var j=0, m=arrValues.length; j<m; j++)
					master2Filter.addMember(arrValues[j], tagValue);

				if (master2Filter.hasSelection()) {		// TESTA om denna ers\u00E4tter ovanst\u00E5ende
					// a value is selected in the master2 control, so only
					// continue if this row matches it
					var found = false;
					for (var k=0, n=arrValues.length; k<n; k++) {
						if (master2Filter.inSelection(arrValues[k])) {
							//console.log("master2Filter has value: " + arrValues[k]);
							found = true;
							break;
						}
					}
					if (!found)
						continue;	// row is not visible and the attributes will not be used to fill in dropdown values
				}
				//arrValues.length = 0;		must catch all if used
			}
		}
		// if we come here, both master1 and master2 is matched if they're used
		
		// fill in slave filters
		for (var j=0, m=getDropFilterQty(); j<m; j++) {
			var dropFilter = getDropFilterFromIndex(j);
			if (dropFilter.getLevel() != 0)		// slaves have level = 0
				continue;
			
			//var attrName = dropFilter.getDataKey();
			var attrName = PREFIX_FILTER + dropFilter.getDataKey();
			var attrValue = $.trim(filterRows[i].getAttribute(attrName));
			// important: allow empty attrValue
			var tag = $.trim(dropFilter.getTag());
			var tagValue = (tag == '' ? '' : $(filterRows[i]).data('json')[tag]);

			// NOTE: this handles multiple values inside attribute (not the same as dropFilter.isMultiple()).
			// all dropfilters (single+multi) needs to match multiple value attributes.
			// each attribute can contain multiple values. these should be separated before they're added to the filter list
			var arrValues = attrValue.split(ATTRIBUTE_SEPARATOR);
			for (var k=0, n=arrValues.length; k<n; k++) {
				dropFilter.addMember(arrValues[k], tagValue);
				//console.log(dropFilter.getLabel() + "  " + k + " adding member: " + arrValues[k]);
			}
			arrValues.length = 0;
		}
    }

	// refresh options in the dropdowns
	for (var i=0, l=getDropFilterQty(); i<l; i++) {
		var dropFilter = getDropFilterFromIndex(i);
		// clear the dropdown list
		dropFilter.getCtrl().options.length = 0;

		// fill in the allowed options
		if (dropFilter.isMultiple()) {
		   $(dropFilter.getCtrl()).append('<option value="">' + dropFilter.getLabel() + '</option>');
		}
		else {   // single select
		   // show a standardized text in first entry
		   $(dropFilter.getCtrl()).append('<option value="">' + TEXT_STATUS_DROPDOWN_OPTION_UNSELECT + '</option>');
		}

		var arrMembers = sortDictionaryOnKeys(dropFilter.getMembers(), dropFilter.isNumSort(), dropFilter.getSortDescending());
		var tmp = arrMembers[''];
		if (tmp != undefined) {
			delete arrMembers[''];
			arrMembers[''] = tmp;
			//	console.log("HAS EMPTY ENTRY: " + dropFilter.getLabel());
		}

		for (var entry in arrMembers) {  // each entry in the dropdown list
			var tag = arrMembers[entry];	// tag is often empty
			var filterRow = convertFilterOption(dropFilter, entry, tag);
			$(dropFilter.getCtrl()).append($('' + filterRow));
			//console.log(" dropFilter appending: " + filterRow);
		}
	}
	// send event to all subscribers
	var event = $.Event('filtercontentwasupdated');
   $(window).trigger(event);
   /* To subscribe to this event do:
      $(window).on('filtercontentwasupdated', function (e) {
	   	...
		});
   */
}


// TODO: presently it can sort on either descending or numsort. make all combinations possible
function sortDictionaryOnKeys(dict, numSort, descending) {
   var sorted = [];
   for(var key in dict) {
   	sorted[sorted.length] = key;
   }
    
   if (numSort === true)
		sorted.sort(sortNumber);
  	else {
		//	sorted.sort();
  		if (descending === true)
	   	sorted.sort(charOrdD);
	   else
	   	sorted.sort(charOrdA);
	}

   var tempDict = {};
   for (var i=0, l=sorted.length; i<l; i++) {
   	tempDict[sorted[i]] = dict[sorted[i]];
   }
   return tempDict;
}

function sortNumber(a, b) {
	// if some parseInt returns NaN it doesn't matter match. the other members will continue sorting
	//console.log(parseInt(a) + " > " + parseInt(b) + ": " + (parseInt(a) > parseInt(b)));
   return parseInt(a, 10) - parseInt(b, 10);	// OBS: funkar ej med >, den k\u00F6r bara 1 iteration..
}

// sort ascending, ignore case
function charOrdA(a, b) {
	a = a.toLowerCase();
	b = b.toLowerCase();
	if (a > b)
		return 1;
	if (a < b)
		return -1;
	return 0;
}

// sort descending, ignore case
function charOrdD(a, b) {
	a = a.toLowerCase();
	b = b.toLowerCase();
	if (a < b)
		return 1;
	if (a > b)
		return -1;
	return 0;
}


// sets the master filters when appliceable
function filterUpdate(dropdown) {
	if (typeof beforeFilterUpdate === 'function') {
		if (!beforeFilterUpdate(dropdown))		// can be defined in the using script
			return;	
	}
	// send event to all subscribers
	var event = $.Event('filterupdate_start');
   $(window).trigger(event, [dropdown]);
      
	setTimeout(function(){  filterUpdate_Inner(dropdown); }, 10);   // must give back control so (for example) a progress spinner can be started

	var filterUpdate_Inner = function(dropdown) {	// logic that's exclusive to filterUpdate()
		var inputDropFilter = getDropFilterFromCtrl(dropdown);	// needed for multiple select
		var isMultiple = inputDropFilter.isMultiple();
		var updateFilterContent = false;
		var master1Filter = getDropFilterFromLevel(1);
		var master2Filter = getDropFilterFromLevel(2);
		
		//Modified 2015-07-09 by Martin Johansson/CIKADO - projnr 192.2 - select all or none
		var allSelected = isMultiple && inputDropFilter.isAllOptionsSelected();
		if (isMultiple && dropdown.selectedIndex==0) {
			dropdown.selectedIndex=-1;
			allSelected=!allSelected;
			//console.log("++++++++++++++++setAllOptionsSelected(" + allSelected + ") - resetFilter_Generic");
			inputDropFilter.setAllOptionsSelected(allSelected);
		}
		//console.log('filterUpdate----------------------' + master1Filter);
		
		if (master1Filter && master1Filter.getCtrl() == dropdown) { //this dropdown is a master 1 filter 
			updateFilterContent = true;
			//console.log("setting updateFilterContent = true    - A  + " + master1Filter.getLabel());
			if (isMultiple && allSelected || !isMultiple && dropdown.selectedIndex<=0) { //if all options was selected in a multiple select or the first entry was selected in a non-multiple select,  we reset the filter				
				//console.log("RESET master1Filter!");
				master1Filter.setLevel(0);		// reset it
				
				//if also a master 2 filter was active, we must now make it the master 1 filter (a master 2 filter must not be active without an active master 1 filter)
				if (master2Filter) {  
					master2Filter.setLevel(0);		// reset it
					master2Filter.setLevel(1); 	//...then make it a master 1 filter
					if ($(master2Filter.getCtrl()).hasClass('selectpicker'))	// primitive dropdowns shouldn't be refreshed
						$(master2Filter.getCtrl()).selectpicker('refresh');
				}
			}
		}
		else if (master2Filter && master2Filter.getCtrl() == dropdown) {//this dropdown is a master 2 filter 
			updateFilterContent = true;
			//console.log("setting updateFilterContent = true    - B  + " + master2Filter.getLabel());
			if (isMultiple && allSelected || !isMultiple && dropdown.selectedIndex<=0) { //if all options was selected in a multiple select or the first entry was selected in a non-multiple select, we reset the filter
				master2Filter.setLevel(0);		// reset it
			}
		}
		// filter has two master levels. more can be added as needed
		else if (master1Filter == null) {
			if (inputDropFilter.hasSelection()) {	// multiple: everything's has to be selected, otherwise it's a filter
				master1Filter = inputDropFilter; 
				master1Filter.setLevel(1);
				updateFilterContent = true;
			}
		}
		else if (master2Filter == null) {
			// there's no master2 filter. let's make dropdown master2 if it has a selection
			if (inputDropFilter.hasSelection()) {	// multiple: everything's has to be selected, otherwise it's a filter
				
				master2Filter = inputDropFilter;
				master2Filter.setLevel(2);
				//console.log('---------ADDING masterTwo (b) ------ master2Filter.setLevel(2);');
				updateFilterContent = true;
			}
		}
		if (updateFilterContent) {
			fillInFilterContent();  // only called when we have to update the
											// available entries in the dropdowns
			handleSubfilterOptions();
		}
		// send event to all subscribers
		var event = $.Event('filterupdate_end');
		$(window).trigger(event, [dropdown]);
		
	   enableResetFilter(true);
	}
}

function handleSubfilterOptions() {
	// when we have some types of multiple-select (ie: Status) that's not a masterFilter, we want all of the options selected by default	
	var master1Filter = getDropFilterFromLevel(1);
	var master2Filter = getDropFilterFromLevel(2);
	
	//console.log("handleSubfilterOptions____________" + master1Filter + "__________" + master2Filter);
	
	for (var i=0, l=getDropFilterQty(); i<l; i++) {
		var dropFilter = getDropFilterFromIndex(i);
		
		if (dropFilter === master1Filter || dropFilter === master2Filter) {
		}
		else {			
			//console.log(i + "  dropFilter("+dropFilter.getLabel() + ").level: " + dropFilter.getLevel());
			if (dropFilter.isMultiple()) {	// select all available subfilter options
				//console.log("++++++++++++++++setAllOptionsSelected(true) ("+dropFilter.getLabel() + ")- handleSubfilterOptions");
				dropFilter.setAllOptionsSelected(true);
			}
		}
	}
}

function resetFilter_Generic() {
	
	for (var i=0, l=getDropFilterQty(); i<l; i++) {
		var dropFilter = getDropFilterFromIndex(i);
		if (dropFilter.getLevel() > 0) {
			var select = dropFilter.getCtrl();
			dropFilter.setLevel(0);
		}
		//Modified 2015-07-09 by Martin Johansson/CIKADO - projnr 192.2 - select all options for multiple select 
		if (dropFilter.isMultiple()) {
			//console.log("reset Multiple: " + dropFilter.getLabel() + " " + dropFilter.isAllOptionsSelected());
			fillInFilterContent(); //create all the options first...
			dropFilter.setAllOptionsSelected(true);	//... so we can select them here...
			//console.log("      Multiple: " + dropFilter.getLabel() + " AllOptionsSel:" + dropFilter.isAllOptionsSelected() + "  hasSelection: " + dropFilter.hasSelection() + " (ctrls: " + $(dropFilter.getCtrl()).length + ")");
			$(dropFilter.getCtrl()).selectpicker('refresh');
		}
		else {
			dropFilter.getCtrl().selectedIndex = 0;
		}
		if ($(dropFilter.getCtrl()).hasClass('selectpicker'))	// primitive dropdowns shouldn't be refreshed
			$(dropFilter.getCtrl()).selectpicker('refresh');
	}
}


function hideDropdownRow() {
	for (var i=0, l=getDropFilterQty(); i<l; i++) {
		var dropFilter = getDropFilterFromIndex(i);
		var option = $(dropFilter.getCtrl()).children()[0];
		var showVisibleChecked = false;	// if all options are selected, show it also on the first option (only visually, the option itself will not have selected attribute)
		//console.log("dropfilter"+i+" index: " + dropFilter.getCtrl().selectedIndex);
		
		// show All/None on the first option
		if (dropFilter.isMultiple()) {
			var all = dropFilter.isAllOptionsSelected();
			$(option).text(all ? TEXT_STATUS_DROPDOWN_OPTION_NONE : TEXT_STATUS_DROPDOWN_OPTION_ALL); 
			
			if (all)
				showVisibleChecked = true;
				//option.selected = true;
		}
		else {	// single selection
			// if it's the default value selected (index 0), hide the default value from the dropdown list
			// (showing it at that time is unnecessary).
			if (dropFilter.getCtrl().selectedIndex <= 0) {			
				$(option).addClass('hidden');
			}
			else {
				$(option).removeClass('hidden');
			}
		}
		if ($(dropFilter.getCtrl()).hasClass('selectpicker'))	// primitive dropdowns shouldn't be refreshed
			$(dropFilter.getCtrl()).selectpicker('refresh');
		//console.log(i + " selindex: " + dropFilter.getCtrl().selectedIndex);	
		
		// add visual checked icon
		if (dropFilter.isMultiple() && showVisibleChecked) {	
			var bootstrapSelect = $(dropFilter.getCtrl()).next();
			//console.log(i + " bootstrapSelect: " + $(bootstrapSelect).find('li[data-original-index="0"]').length);
			$(bootstrapSelect).find('li[data-original-index="0"]').addClass('selected');
		}
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

function isMasterFilter(dropFilter) {
	return dropFilter.getLevel() > 0;
}
