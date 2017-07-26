//The deepEqual() assertion can be used just like equal() and is a better choice in most cases. Instead of the simple comparison operator (==), 
// it uses the more accurate comparison operator (===). That way,  undefined doesn't equal null, 0, or the empty string (""). It also compares 
// the content of objects so that {key: value} is equal to {key: value}, even when comparing two objects with distinct identities.

// ---------------------------------------------------------------------------------------------------------
var cfgFilledIn = [];

module('columnInfoVH.js', {
   setup: function () {
      cfgFilledIn = new columnConfig({    // reset it here since it's manipulated during tests
         itemName: 'goodItemName',
         title: 'goodTitle',
         width: 99,
         type: COLUMN.LABEL,
         lngkey: 'lngkey',
         numSort: true,
         totals: true,
         sort: true,
         sortOrder: 'descending',
         altSort: true,
         altFilter: true,
         search: false,
         link: true,
         tag: 'tag',
         flag1: true,
         flag2: false
      });
   }
});

var cfgFilledInAlt = new columnConfig({
   itemName: 'goodItemName2',
   title: 'goodTitle2',
   width: 992,
   type: COLUMN.TEXT_SEARCH,
   lngkey: 'lngkey2',
   numSort: false,
   totals: false,
   sort: false,
   sortOrder: 'ascending',
   altSort: false,
   altFilter: false,
   search: true,
   link: false,
   tag: 'tag2',
   flag1: false,
   flag2: true
});

test("columnConfig default", 16, function () {
   var cfg = new columnConfig();
   deepEqual(cfg.itemName, '');
   deepEqual(cfg.title, '');
   deepEqual(cfg.width, -1);
   deepEqual(cfg.type, COLUMN.NONE);
   deepEqual(cfg.lngkey, '');
   deepEqual(cfg.numSort, false);
   deepEqual(cfg.totals, false);
   deepEqual(cfg.sort, false);
   deepEqual(cfg.sortDescending, false);
   deepEqual(cfg.altSort, false);
   deepEqual(cfg.altFilter, false);     // test default value
   deepEqual(cfg.search, false);
   deepEqual(cfg.link, false);
   deepEqual(cfg.tag, '');
   deepEqual(cfg.flag1, false);
   deepEqual(cfg.flag2, false);
});

test("columnConfig filled-in", 16, function () {
   var cfg = cfgFilledIn;
   deepEqual(cfg.itemName, 'goodItemName');
   deepEqual(cfg.title, 'goodTitle');
   deepEqual(cfg.width, 99);
   deepEqual(cfg.type, COLUMN.LABEL);
   deepEqual(cfg.lngkey, 'lngkey');
   deepEqual(cfg.numSort, true);
   deepEqual(cfg.totals, true);
   deepEqual(cfg.sort, true);
   deepEqual(cfg.sortDescending, true);
   deepEqual(cfg.altSort, true);
   deepEqual(cfg.altFilter, true);
   deepEqual(cfg.search, false);
   deepEqual(cfg.link, true);
   deepEqual(cfg.tag, 'tag');
   deepEqual(cfg.flag1, true);
   deepEqual(cfg.flag2, false);
});

test("columnConfig override", 16, function () {
   //console.log('before1: ' + cfgFilledIn.width);
   var cfg = cfgFilledIn;
   cfg.overrideWith(cfgFilledInAlt);

   deepEqual(cfg.itemName, 'goodItemName');  // unchanged. not allowed to be overridden
   deepEqual(cfg.title, 'goodTitle');       // unchanged. not allowed to be overridden
   deepEqual(cfg.width, 992);
   deepEqual(cfg.type, COLUMN.TEXT_SEARCH);
   deepEqual(cfg.lngkey, 'lngkey2');
   deepEqual(cfg.numSort, false);
   deepEqual(cfg.totals, false);
   deepEqual(cfg.sort, false);
   deepEqual(cfg.sortDescending, false);
   deepEqual(cfg.altSort, false);
   deepEqual(cfg.altFilter, false);
   deepEqual(cfg.search, true);
   deepEqual(cfg.link, false);
   deepEqual(cfg.tag, 'tag2');
   deepEqual(cfg.flag1, false);
   deepEqual(cfg.flag2, true);
   
   //console.log('after1: ' + cfgFilledIn.width);
});


var cfgFilledInBool = new columnConfig({
   itemName: 'itemName',
   title: 'title',
   type: -77,
   width: 'abc',
   numSort: 'abc',
   totals: 'abc',
   sort: 'abc',
   sortOrder: 'abc',
   altSort: 'abc',
   altFilter: 'abc',
   search: 'abc',
   link: 'abc',
   flag1: 'abc',
   flag2: 'abc'
});

test("columnConfig boolean fields", 12, function () {
   var cfg = cfgFilledInBool;
   deepEqual(cfg.width, -1);
   deepEqual(cfg.type, COLUMN.NONE);
   deepEqual(cfg.numSort, false);
   deepEqual(cfg.totals, false);
   deepEqual(cfg.sort, false);
   deepEqual(cfg.sortDescending, false);
   deepEqual(cfg.altSort, false);
   deepEqual(cfg.altFilter, false);     // test default value
   deepEqual(cfg.search, false);
   deepEqual(cfg.link, false);
   deepEqual(cfg.flag1, false);
   deepEqual(cfg.flag2, false);
});

test("columnInfo default", 18, function () {
   var columnInfo1 = new columnInfo(new columnConfig());

   deepEqual(columnInfo1.getTitle(), '');
   deepEqual(columnInfo1.getDataKey(), '');
   deepEqual(columnInfo1.getLabel(), '');        // from lngkey
   deepEqual(columnInfo1.getWidth(), -1);
   deepEqual(columnInfo1.getType(), COLUMN.NONE);
   deepEqual(columnInfo1.isNumSort(), false);
   deepEqual(columnInfo1.hasTotals(), false);
   deepEqual(columnInfo1.isSort(), false);
   deepEqual(columnInfo1.isSortDescending(), false);
   deepEqual(columnInfo1.isAltSort(), false);
   deepEqual(columnInfo1.isAltFilter(), false);     // test default value
   deepEqual(columnInfo1.hasSearch(), false);
   deepEqual(columnInfo1.isLink(), false);
   deepEqual(columnInfo1.getTag(), '');
   deepEqual(columnInfo1.hasFlag1(), false);
   deepEqual(columnInfo1.hasFlag2(), false);
   deepEqual(columnInfo1.getSortFieldName(), '');
   deepEqual(columnInfo1.getFilterFieldName(), '');
});


test("columnInfo filled-in", 18, function () {
   var columnInfo1 = new columnInfo(cfgFilledIn);

   deepEqual(columnInfo1.getTitle(), 'goodTitle');
   deepEqual(columnInfo1.getDataKey(), 'goodtitle');
   deepEqual(columnInfo1.getLabel(), 'goodTitle');        // from lngkey
   deepEqual(columnInfo1.getWidth(), 99);
   deepEqual(columnInfo1.getType(), COLUMN.LABEL);
   deepEqual(columnInfo1.isNumSort(), true);
   deepEqual(columnInfo1.hasTotals(), true);
   deepEqual(columnInfo1.isSort(), true);
   deepEqual(columnInfo1.isSortDescending(), true);
   deepEqual(columnInfo1.isAltSort(), true);
   deepEqual(columnInfo1.isAltFilter(), true);     // test default value
   deepEqual(columnInfo1.hasSearch(), false);
   deepEqual(columnInfo1.isLink(), true);
   deepEqual(columnInfo1.getTag(), 'tag');
   deepEqual(columnInfo1.hasFlag1(), true);
   deepEqual(columnInfo1.hasFlag2(), false);
   deepEqual(columnInfo1.getSortFieldName(), 'Sort_goodTitle');
   deepEqual(columnInfo1.getFilterFieldName(), 'Filter_goodTitle');
});

module("dropFilterVH.js");


test('dropFilter', 21, function () {
   var df = new dropFilter('idDropdown', 'iddropdown', 'Guldvalv', '', 'tag4');

   deepEqual(df.getColumnInfo(), '')
   deepEqual(df.getCtrl(), null)
   deepEqual(df.getCtrlId(), 'idDropdown')
   deepEqual(df.getDataKey(), 'iddropdown')
   deepEqual(df.getLabel(), 'Guldvalv')

   deepEqual(df.getLevel(), 0)
   deepEqual(df.isNumSort(), false)
   deepEqual(df.isSortDescending(), false)
   deepEqual(df.getTag(), 'tag4');
   deepEqual(df.getMemberFromFilterValue('filterValue'), null)

   deepEqual(df.getMembers(), [])
   deepEqual(df.getQtyMembers(), 0)
   deepEqual(df.isMultiple(), false)     // return true if the control is <select multiple>
   deepEqual(df.isAllOptionsSelected(), false)
   deepEqual(df.getAllSelectedOptionValues(), [])

   deepEqual(df.getOldSelection(), [])
   deepEqual(df.inOldSelection(), false)
   deepEqual(df.inSelection(), false)
   deepEqual(df.getQtySelected(), 0)
   deepEqual(df.hasSelection(), false)
   deepEqual(df.getFirstValue(), '')
   
});


test('dropFilter 2', 11, function () {
   var df = new dropFilter('idDropdown', 'iddropdown', 'Guldvalv', '', 'tag4');

   df.addMember('v1', 't1');
   deepEqual(df.getMembers(), [{ "value": "v1", "text": "t1" }]);
   df.addMember('v2', 't2');
   df.addMember('v3', 't3');
   deepEqual(df.getQtyMembers(), 3);
   deepEqual(df.getQtySelected(), 0);  // always 0 no _ctrl
   deepEqual(df.getMemberFromFilterValue('test'), null);
   deepEqual(df.getMemberFromFilterValue('v2'), { "value": "v2", "text": "t2" });
   df.clearMembers();
   deepEqual(df.getQtyMembers(), 0);
   deepEqual(df.isMultiple(), false);  // always false if no _ctrl
   deepEqual(df.isAllOptionsSelected(), false);  // always false if no _ctrl
   deepEqual(df.inSelection('v1'), false);
   deepEqual(df.hasSelection(), false);  // always false if no _ctrl
   deepEqual(df.getFirstValue(), '');   // always '' if no _ctrl
});

test('dropFilter sorting', 14 , function () {
   var df = new dropFilter('idDropdown', 'iddropdown', 'Guldvalv', '', 'tag4');

   df.addMember('a03', '3');
   df.addMember('a05', '5');
   df.addMember('a10', '10');

   deepEqual(df.getMembers(), [{ "value": "a03", "text": "3" }, { "value": "a05", "text": "5" }, { "value": "a10", "text": "10" }]);

   df.sortMembers();    // alpha asc
   //deepEqual(df.getMembers(), [{ "value": "a10", "text": "10" }, { "value": "a03", "text": "3" }, { "value": "a05", "text": "5" }]);
   deepEqual(df.getMembers(), [{ "value": "a03", "text": "3" }, { "value": "a05", "text": "5" }, { "value": "a10", "text": "10" }]);

   df.setSortDescending('abc');
   deepEqual(df.isSortDescending(), false);
   df.setSortDescending('true');
   deepEqual(df.isSortDescending(), false);
   df.setSortDescending(true);
   deepEqual(df.isSortDescending(), true);

   df.sortMembers();    // alpha desc
   deepEqual(df.getMembers(), [{ "value": "a10", "text": "10" }, { "value": "a05", "text": "5" }, { "value": "a03", "text": "3" }]);

   df.setNumSort('def');
   deepEqual(df.isNumSort(), false);
   df.setNumSort('true');
   deepEqual(df.isNumSort(), false);
   df.setNumSort(true);
   deepEqual(df.isNumSort(), true);

   df.clearMembers();
   df.addMember('03', '3');
   df.addMember('05', '5');
   df.addMember('10', '10');
   df.sortMembers();  // num desc
   deepEqual(df.getMembers(), [{ "value": "10", "text": "10" }, { "value": "05", "text": "5" }, { "value": "03", "text": "3" }]);

   df.setSortDescending(false);
   df.sortMembers(); // num asc
   deepEqual(df.getMembers(), [{ "value": "03", "text": "3" }, { "value": "05", "text": "5" }, { "value": "10", "text": "10" }]);

   df.setLevel('abc');
   deepEqual(df.getLevel(), 0);

   df.setLevel(4);
   deepEqual(df.getLevel(), 0);  // since no _ctrl inside

   df.setLevel(-2);
   deepEqual(df.getLevel(), 0);
});


test("test", function () {
   expect(1);
   var elem = document.createElement("div");
   elem.style.position = "absolute";
   equals(elem.style.position, "absolute");
});

test('dropFilter with config', 1, function () {
   // following requres a config:
   var df = new dropFilter('idDropdown', 'iddropdown', 'Guldvalv', cfgFilledInAlt, 'tag4');
   deepEqual(df.getColumnInfo(), cfgFilledInAlt);

   //var elem = document.createElement("div");
   
});

//setLevel
//setNumSort
//setSortDescending
//addMember(filterValue, filterText) // filterText is optional (can be blank)
//sortMembers
//clearMembers
//http://stackoverflow.com/questions/7620971/how-to-test-against-a-dom-object-in-qunit


// ---------------------------------------------------------------------------------------------------------
module("supportFunctions.js");

test("trimAll", 4, function () {
   deepEqual(trimAll(''), '');
   deepEqual(trimAll(undefined), '');
   deepEqual(trimAll(null), '');
   deepEqual(trimAll(' bra '), 'bra');
});

test("replaceAll", 2, function () {
   deepEqual(replaceAll('bra strängar här!', 'a', 'A'), 'brA strängAr här!');
   deepEqual(replaceAll('bra strängar här! ', 'ä', 'Ä'), 'bra strÄngar hÄr!');   // @todo: inte trimma
});

test("sanitizeValue", 2, function () {
   deepEqual(sanitizeValue('bra/stad'), 'brastad');
   deepEqual(sanitizeValue('bra//stad'), 'brastad');
});

test("sanitizeSortFilterValue", 2, function () {
   deepEqual(sanitizeSortFilterValue('"bra"/stad'), 'bra/stad');
   deepEqual(sanitizeSortFilterValue('"bra"stad'), 'brastad');
});

test("isInt", 5, function () {
   deepEqual(isInt(-1), true);
   deepEqual(isInt(333), true);
   deepEqual(isInt(undefined), false);
   deepEqual(isInt(null), false);
   deepEqual(isInt('1'), false);
});

test("isObject", 7, function () {
   deepEqual(isObject(-1), false);
   deepEqual(isObject(333), false);
   deepEqual(isObject(undefined), false);
   deepEqual(isObject(null), false);
   deepEqual(isObject('1'), false);
   deepEqual(isObject([]), true);
   deepEqual(isObject({}), true);
});



