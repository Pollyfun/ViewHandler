'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');  // gets the default table name 'data'
      viewConfig.addDataStore('country-data.json', null, 'country'); // 'country' is table name

      viewConfig.preprocessData = function () {
         var sql = 'SELECT data.*, country.* FROM data JOIN country on data.country = country.countryid';
         return sql;
      }
   }
}

