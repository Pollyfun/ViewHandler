// column types
function COLUMN() {}       // create a namespace for the constants
COLUMN.NONE = 0;
COLUMN.LABEL = 1;
COLUMN.HIDDEN = 2;         // column will be hidden
COLUMN.TEXT_SEARCH = 3;
COLUMN.DROPDOWN = 4;
COLUMN.DROPDOWN_MULTIPLE = 5; 
COLUMN.CLASSES = 6;        // classes contained herein is added to each row

var PREFIX_SORT_ARROW = 'sortArrow';

// ------------------------------------------------------------------------------------------------------------------------
// Example usage:
//		viewConfig.addColumnConfig(new columnConfig({ title: 'SortIndex',  width: 96, numSort: true, sort:true }));
//		viewConfig.addColumnConfig(new columnConfig({ title: 'Access',     type: COLUMN.DROPDOWN }));
//		viewConfig.addColumnConfig(new columnConfig({ title: 'Database',   type: COLUMN.DROPDOWN_MULTIPLE, link: true }));
// ------------------------------------------------------------------------------------------------------------------------
function columnConfig(arguments) {

	this.itemName = '';
	this.title = '';
	this.lngkey = '';
	this.width = '';
	this.type = '';
	this.numSort = false;
	this.summary = false;
	this.sort = false;
	this.sortDescending = false;
	this.altSort = false;
	this.altFilter = false;
	this.link = false;
	this.skipBootstrap = false;
	this.tag = '';
	this.flag1 = false;
	this.flag2 = false;

	this.initialize = function(arguments) {
		if (typeof (arguments) === 'object') {
			if (arguments.hasOwnProperty('itemName'))
				this.itemName = arguments.itemName;
			if (arguments.hasOwnProperty('title'))
				this.title = arguments.title;
			if (arguments.hasOwnProperty('lngkey'))
				this.lngkey = arguments.lngkey;
			if (arguments.hasOwnProperty('width'))
				this.width = arguments.width;
			if (arguments.hasOwnProperty('type'))
				this.type = arguments.type;
			if (arguments.hasOwnProperty('numSort'))
				this.numSort = arguments.numSort;
			if (arguments.hasOwnProperty('summary'))
				this.summary = arguments.summary;
			if (arguments.hasOwnProperty('sort'))
				this.sort = arguments.sort;
			if (arguments.hasOwnProperty('sortOrder')) {
				if (arguments.sortOrder === 'descending')
					this.sortDescending = true;
			}
			if (arguments.hasOwnProperty('altSort'))
			    this.altSort = arguments.altSort;
			if (arguments.hasOwnProperty('altFilter'))
			    this.altFilter = arguments.altFilter;
			if (arguments.hasOwnProperty('link'))
				this.link = arguments.link;
			if (arguments.hasOwnProperty('skipBootstrap'))
				this.skipBootstrap = arguments.skipBootstrap;
			if (arguments.hasOwnProperty('tag'))
				this.tag = arguments.tag;
			if (arguments.hasOwnProperty('flag1'))
				this.flag1 = arguments.flag1;
			if (arguments.hasOwnProperty('flag2'))
				this.flag2 = arguments.flag2;
		}
	}
	this.initialize(arguments);
	
	// override members except title (which is the key)
	this.overrideWith = function(cfg) {
		//if (cfg.itemName !== '')			// probably not allow this. should always be from the backend
		//	this.itemName = cfg.itemName;
		this.lngkey = cfg.lngkey;
		if (cfg.width !== '')
			this.width = cfg.width;
		if (cfg.type !== '')
			this.type = cfg.type;
		this.numSort = cfg.numSort;
		this.summary = cfg.summary;
		this.sort = cfg.sort;
		this.sortDescending = cfg.sortDescending;
		this.altSort = cfg.altSort;
		this.altFilter = cfg.altFilter;
		this.link = cfg.link;
		this.skipBootstrap = cfg.skipBootstrap;
		if (cfg.tag !== '')
			this.tag = cfg.tag;
		this.flag1 = cfg.flag1;
		this.flag2 = cfg.flag2;
	}
}


// Members:
// itemName	     = column design (Programmatic Use: Name). Used to match Design and Data.
// title         = column design Title
// dataKey       = DOM-attribute friendly key (lowercase, no spaces)
// type 	        = COLUMN.DROPDOWN etc
// width         = width of the column
// numsort       = if true does numeric sort instead of alphanumeric
// summary       = if true a summary will be shown on the last row
// sort          = if true it's the default sort column
// link          = if true the cell value should be a link to the document
// skipBootstrap = passed on to dropFilter to use standard select instead of bootstrap select
function columnInfo(cfg) {		// accepts a columnConfig() instance for input

	var _itemName 		  = cfg.itemName;
	var _title 			  = cfg.title;
	var _dataKey;
	var _type 			  = cfg.type;
	var _width 			  = cfg.width;
	var _numSort 		  = cfg.numSort;			// bool
	var _summary 		  = cfg.summary;			// bool
	var _sort			  = cfg.sort;				// bool
	var _sortDescending   = cfg.sortDescending;	    // bool
	var _altSort          = cfg.altSort;            // bool
	var _altFilter        = cfg.altFilter;          // bool
	var _link			  = cfg.link;				// bool
	var _skipBootstrap    = cfg.skipBootstrap;	    // bool
	// optional members. use as needed
	var _tag			  = cfg.tag;
	var _flag1            = cfg.flag1;
	var _flag2            = cfg.flag2;

	// datakey is useful for connecting a column with row attributes (sort_/filter_)
	// it uses a DOM-attribute friendly format (lowercase, no spaces)
	// by using the column title as a base, the name of the attribute becomes predictable (unlike the itemname which could change).
	// for example, if the column is called Produkt, the row-attributes will be called sort_produkt and filter_produkt.
	_dataKey = replaceAll(cfg.title.toLowerCase(), ' ', '');
	if (_dataKey === '')	// fallback to use itemname if there's no title
		_dataKey = replaceAll(cfg.itemName.toLowerCase(), ' ', '');

	// translate once
	var _label = '';
	if (cfg.lngkey !== '' && typeof translateWord !== 'undefined')
		_label = translateWord(cfg.lngkey);
	//console.log('_label is: ' + _label);

	this.getItemName = function() {
		return _itemName;
	}
	this.getTitle = function() {			// column view title
		return _title;
	}
	this.getDataKey = function() {
		return _dataKey;
	}
	this.getLabel = function() {
		// if the title starts with ( it should be hidden
		if (_title.substr(0,1) === '(')
			return '';
		if (_label !== '')
			return _label;	// localized text
		return _title;		// no localization, use title
	}
	this.getType = function() {
		return _type;
	}
	this.getWidth = function() {
		return _width;
	}
	this.isNumSort = function() {
		return _numSort;
	}
	this.hasSummary = function() {
		return _summary;
	}
	this.isSort = function() {
		return _sort;
	}
	this.isSortDescending = function() {
		return _sortDescending;
	}
	this.isAltSort = function () {
	    return _altSort;
	}
	this.isAltFilter = function () {
	    return _altFilter;
	}
	this.isLink = function() {
		return _link;
	}	
	this.hasSkipBootstrap = function() {
		return _skipBootstrap;
	}
	this.getTag = function() {
		return _tag;
	}
	this.hasFlag1 = function() {
		return _flag1;
	}
	this.hasFlag2 = function() {
		return _flag2;
	}
	this.getSortFieldName = function () {
	    return _altSort ? 'Sort_' + _itemName : _itemName;
	}
	this.getFilterFieldName = function () {
	    return _altFilter ? 'Filter_' + _itemName : _itemName;
	}

	// returns the connected sortArrow (if existing)
	this.getSortArrow = function() {
		return document.getElementById(PREFIX_SORT_ARROW + _dataKey);
	}	
	this.toString = function() {
		return 'itemName:' + _itemName +
			'   title:' + _title +
			'   dataKey:' + _dataKey +
			'   type:' + _type +
			'   width:' + _width +
			'   numSort:' + _numSort +
			'   summary:' + _summary +
			'   sort:' + _sort +
			'   sortDescending:' + _sortDescending +
            '   altSort:' + _altSort +
            '   altFilter:' + _altFilter +
			'   link:' + _link +
			'   skipBootstrap:' + _skipBootstrap +
			'   tag:' + _tag +
			'   flag1:' + _flag1 +
			'   flag2:' + _flag2;		
	}
}


// support functions
// these two functions used for multi-replace characters 
// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(string, find, replace) {
  string = $.trim(string);	// remove undefined
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
