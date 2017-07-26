var TABLE_DEFAULT = 'data';    // default table name

// configuration object with default values.
// this can be updated from the place of usage.
function viewConfiguration() {
   // public API
   this.configName = '';            // @public readonly
   this.where = '';                 // @public readonly  contains the SQL where-clause (if any)
   this.orderBy = '';               // @public readonly  contains the SQL order by-clause (if any)
   this.createFullDOM = false;      // @public
   this.skipSortArrows = false;     // @public
   this.useOuterScroll = false;     // @public           @todo - possibly implement this

   // internal API (used internally and by interface files)
   this.initializing = true;        // @public
   this.showTotals = false;         // @internal
   this.cssFiles = [];              // @internal
   this.dataStores = [];            // @internal
   this.restrictToCategory = null;  // @internal   empty strings are a valid value, so null is used for default
   this.baseColumnConfigs = [];     // @internal
   this.columnConfigs = [];         // @internal
   this.filterHierarchy = [];       // @internal

   // private
   this.lookupBaseColumns = [];     // for performance. send itemName, get title
   this.dbPath = '';                // base path of the main datastore. used when excel-printing

   // shell functions that can be overridden
   this.convertDisplayValue = function () { }
   this.convertFilterOptionText = function () { }
   this.handleFilterOptions = function () { }
   this.overrideActiveFilterValue = function () { }
   this.refreshSummary = function () { }
   this.refreshBackgroundRows = function () { }
   this.refreshProgress = function () { }
   // misc callbacks
   this.preprocessData = null;
   this.translateWord = null;

   /* @public api */
   this.addColumns = function (columns) {
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
   /* @internal api */
   this.addBaseColumnConfig = function (cfg) {           
      this.baseColumnConfigs.push(cfg);
      this.lookupBaseColumns[cfg.itemName] = cfg.title;
   }
   /* @private */
   this.addColumnConfig = function (cfg) {
      this.columnConfigs.push(cfg);
      //console.log("added a cfg. current qty: " + this.columnConfigs.length);
   }
   /* @internal api */
   this.getColumnConfig = function (title) {
      title = title.toLowerCase();
      for (var i = 0, l = this.columnConfigs.length; i < l; i++) {
         if (this.columnConfigs[i].title.toLowerCase() === title)
            return this.columnConfigs[i];
      }
      return null;
   }
   /* @internal api */
   this.getBaseColumnTitleFromItemName = function (itemName) {    
      return this.lookupBaseColumns[itemName];
   }

   /* @public api */
   this.addFilter = function (fieldName, filterValue) {		// filterValue can be a value or an array of values
      if (fieldName === '') {
         console.log('<warning>filter must have a valid id. skipping');
         return;
      }
      var hierarchyIndex = 0;
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

   /* @internal api */
   this.replaceFilter = function (fieldName, filterValue) {		// filterValue can be a value or an array of values
      if (fieldName === '') {
         console.log('<warning>filter must have a valid name. skipping');
         return;
      }
      // do not call removeFilter() since that will remove from the filterHierarchy and it will be added last instead of keeping its current position
      var sql = 'DELETE FROM filters WHERE FieldName = "' + fieldName + '"';
      alasql(sql);
      this.addFilter(fieldName, filterValue);

      // replace can be called without addFilter first being replaced, so add it if missing
      var index = this.filterHierarchy.indexOf(fieldName);
      if (index === -1) {
         this.filterHierarchy.push(fieldName);
      }
   }

   /* @internal api */
   this.removeFilter = function (fieldName) {
      var sql = 'DELETE FROM filters WHERE FieldName = "' + fieldName + '"';
      alasql(sql);
      var index = this.filterHierarchy.indexOf(fieldName);
      if (index > -1) {             //  browser support for indexOf is limited; it is not supported in Internet Explorer 7 and 8.
         this.filterHierarchy.splice(index, 1);      // removes it from the actual array
      }
   }
   /* @internal api */
   this.clearFilters = function () {
      var sql = 'DELETE FROM filters';
      alasql(sql);
      this.filterHierarchy.length = 0;
   }

   // returns an array with separate values (no arrays in the array)
   /* @internal api */
   this.getActiveFilterArray = function (fieldName) {
      var sql = 'SELECT FROM filters WHERE FieldName = "' + fieldName + '"';
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
   /* @public api */
   this.addDataStore = function (url, category, alias) {       // category and alias are optional
      alias = $.trim(alias);
      if (alias === '')
         alias = TABLE_DEFAULT;     // set default table name when none is provided

      if (typeof category !== 'undefined' && category !== null) {
         this.dataStores.push({ url: url, alias: alias, category: category });
      }
      else {
         this.dataStores.push({ url: url, alias: alias });
      }
   }

   /* @public api */
   // used when adding raw data instead of providing a datasource
   this.addData = function (data, alias) {
      alias = $.trim(alias);
      if (alias === '')
         alias = TABLE_DEFAULT;     // set default table name when none is provided

      this.dataStores.push({ data: data, alias: alias });
   }

   /* @public api */
   this.addCss = function (css) {
      this.cssFiles.push(css);
   }
   /* @internal api */
   this.getSourceDbUrl = function (storeIndex) {
      var view = viewConfig.dataStores[storeIndex].url.split(',')[0];
      return view.substring(0, view.lastIndexOf('/'));
   }
   /* @internal api */
   this.getSourceView = function (storeIndex) {
      var view = viewConfig.dataStores[storeIndex].url.split(',')[0];
      return view.substring(view.lastIndexOf('/') + 1);
   }

   /* @public api */
   this.setDbPath = function (dbPath) {
      this.dbPath = dbPath;
   }
   /* @public api */
   this.getDbPath = function () {
      return this.dbPath;
   }
}