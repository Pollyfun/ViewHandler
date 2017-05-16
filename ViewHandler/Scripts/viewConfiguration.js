var TABLE_DEFAULT = 'data';    // default table name

// configuration object with default values.
// this can be updated from the place of usage.
function viewConfiguration() {
   this.initializing = true;        // internal flag (needed when doing a backend search)
   this.useOuterScroll = false;     // TODO: possibly implement this
   this.showTotals = false;         // totals row
   this.skipSortArrows = false;
   this.preprocessData = null;     // use function

   this.cssFiles = [];     // this can be filled in from viewHandlerCustom.js
   this.dataStores = [];   // this can be filled in from viewHandlerCustom.js
   this.restrictToCategory = null;   // this can be filled in from viewHandlerCustom.js        empty strings are a valid value, so null is used for default

   this.baseColumnConfigs = [];
   this.columnConfigs = [];
   this.filterHierarchy = [];

   this.where = '';     // sql
   this.orderBy = '';   // sql

   // shell functions that can be overridden
   this.convertDisplayValue = function () { }
   this.convertSortValue = function () { }
   this.convertFilterValue = function () { }
   this.convertFilterOptionText = function () { }
   this.handleFilterOptions = function () { }
   this.overrideActiveFilterValue = function () { }
   this.refreshProgress = function () { }
   this.refreshSummary = function () { }
   this.refreshBackgroundRows = function () { }

   this.addColumns = function (columns) {
      //console.log("addColumns: " + columns);
      //console.log("added a cfg. current qty: " + this.columnConfigs.length);
      var isArray = (Object.prototype.toString.call(columns) === '[object Array]');
      if (isArray) {
         for (var i = 0, l = columns.length; i < l; i++) {
            this.addColumnConfig(new columnConfig(columns[i]));
         }
      }
      else {
         this.addColumnConfig(new columnConfig(columns));
      }
   }

   this.addBaseColumnConfig = function (cfg) {
      this.baseColumnConfigs.push(cfg);
      //console.log("added a cfg. current qty: " + this.columnConfigs.length);
   }

   this.addColumnConfig = function (cfg) {    // TODO: probably make private
      this.columnConfigs.push(cfg);
      //console.log("added a cfg. current qty: " + this.columnConfigs.length);
   }

   this.getColumnConfig = function (title) {
      title = title.toLowerCase();
      for (var i = 0, l = this.columnConfigs.length; i < l; i++) {
         if (this.columnConfigs[i].title.toLowerCase() === title)
            return this.columnConfigs[i];
      }
      return null;
   }

   this.cleanFilterName = function (filterName) {
      return replaceAll(filterName.toLowerCase(), ' ', '');		// replaceAll is inside columnInfo.js
   }

   this.addFilter = function (fieldName, filterValue) {		// filterValue can be a value or an array of values
      // change id to a valid datakey
      //filterId = replaceAll(filterId.toLowerCase(), ' ', '');		// replaceAll is inside columnInfo.js
      //filterId = this.cleanFilterName(filterId);
      if (fieldName === '') {
         console.log('<warning>filter must have a valid id. skipping');
         return;
      }
      var hierarchyIndex = 0;
      //var data = [{ a: 1, b: 1, c: 1 }, { a: 1, b: 2, c: 1 }, { a: 1, b: 3, c: 1 }, { a: 2, b: 1, c: 1 }];
      var filterObject = [{ FieldName: fieldName, FieldValue: filterValue }];
      hierarchyIndex++;
      alasql('SELECT * INTO filters FROM ?', [filterObject]);

      var index = this.filterHierarchy.indexOf(fieldName);
      if (index === -1) {             //  browser support for indexOf is limited; it is not supported in Internet Explorer 7 and 8.
         this.filterHierarchy.push(fieldName);
      }
      else {
         // fieldName already exists in the hierarchy list. do nothing
      }
      //printFilters();
   }

   this.replaceFilter = function (fieldName, filterValue) {		// filterValue can be a value or an array of values
      //console.log('replaceFilter_________' + fieldName);
      // change filterName to a valid datakey
      //fieldName = this.cleanFilterName(fieldName);
      if (fieldName === '') {
         console.log('<warning>filter must have a valid name. skipping');
         return;
      }
      //console.log('replaceFilter ' + fieldName + ': ' + filterValue);
      //console.dir(this.filterHierarchy);
      // do not call removeFilter() since that will remove from the filterHierarchy and it will be added last instead of keeping its current position
      var sql = 'DELETE FROM filters WHERE FieldName = "' + fieldName + '"';
      alasql(sql);
      this.addFilter(fieldName, filterValue);

      // replace can be called without addFilter first being replaced, so add it if missing
      var index = this.filterHierarchy.indexOf(fieldName);
      if (index === -1) {
         this.filterHierarchy.push(fieldName);
      }
      //console.log(' after replace: ');
      //console.dir(this.filterHierarchy);
   }

   this.removeFilter = function (fieldName) {
      //fieldName = this.cleanFilterName(fieldName);
      var sql = 'DELETE FROM filters WHERE FieldName = "' + fieldName + '"';
      alasql(sql);
      //console.log(sql);
      var index = this.filterHierarchy.indexOf(fieldName);
      //console.log('removeFilter before: ' + this.filterHierarchy.toString() + '  index found in: ' + index);
      if (index > -1) {             //  browser support for indexOf is limited; it is not supported in Internet Explorer 7 and 8.
         //this.filterHierarchy = this.filterHierarchy.splice(index, 1);           // array.splice(start, deleteCount
         this.filterHierarchy.splice(index, 1);      // removes it from the actual array
      }
      //console.log('removeFilter after: ' + this.filterHierarchy.toString());
   }

   this.clearFilters = function () {
      var sql = 'DELETE FROM filters';
      alasql(sql);
      //console.log(sql);
      this.filterHierarchy.length = 0;
   }

   // returns an array with separate values (no arrays in the array)
   this.getActiveFilterArray = function (fieldName) {
      var sql = 'SELECT FROM filters WHERE FieldName = "' + fieldName + '"';
      //console.log('  getActiveFilterValue: ' + sql);
      //console.dir(alasql(sql));
      // get active filters. note that there can be more than one active filter for a field (if addFilter() has been called more than once)
      var arrFilterValues = alasql(sql);
      var resultsArray = [];
      for (var i = 0, l = arrFilterValues.length; i < l; i++) {
         var fieldValue = arrFilterValues[i].FieldValue;         // can be either a string or an array

         var isArray = (Object.prototype.toString.call(fieldValue) === '[object Array]');
         if (isArray) {
            for (var j = 0, m = fieldValue.length; j < m; j++) {
               resultsArray.push(fieldValue[j]);
            }
         }
         else {
            resultsArray.push(fieldValue);
         }
      }
      return resultsArray;
   }

   // if alias is used but not category, category must be set to null
   this.addDataStore = function (url, category, alias) {       // category and alias are optional
      //console.log('addDataStore ' + url + '  alias: ' + alias + '  category: ' + category);
      alias = $.trim(alias);
      if (alias === '')
         alias = TABLE_DEFAULT;     // set default table name when none is provided

      if (typeof category !== 'undefined' && category !== null) {
         //console.log('--addDataStore category supplied: ' + category);
         this.dataStores.push({ url: url, alias: alias, category: category });
      }
      else {
         //console.log('--addDataStore NO category... alias: ' + alias);
         this.dataStores.push({ url: url, alias: alias });
      }
   }

   this.addCss = function (css) {
      //console.log('addCss ' + css);
      this.cssFiles.push(css);
   }
 
   this.getSourceDbUrl = function (storeIndex) {
      var view = viewConfig.dataStores[storeIndex].url.split(',')[0];
      return view.substring(0, view.lastIndexOf('/'));
   }
   this.getSourceView = function (storeIndex) {
      var view = viewConfig.dataStores[storeIndex].url.split(',')[0];
      return view.substring(view.lastIndexOf('/') + 1);
   }

   this.dbPath = '';        // base path of the main datastore. used when excel-printing
   this.setDbPath = function (dbPath) {
      this.dbPath = dbPath;
   }
   this.getDbPath = function () {
      return this.dbPath;
   }
}