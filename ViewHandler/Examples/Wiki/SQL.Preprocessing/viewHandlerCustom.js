'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.preprocessData = function () {
         // group by name
         var columnInfoGroupBy = ViewHandler.getColumnInfoFromTitle('name');
         var sql = ViewHandler.getSQLSelect();
         sql += ' FROM ' + viewConfig.dataStores[0].alias + ' GROUP BY [' + columnInfoGroupBy.getTitle() + ']';
         return sql;
      }
   }
}

