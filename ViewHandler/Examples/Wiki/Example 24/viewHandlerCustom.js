'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example24.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'startdate', type: COLUMN.DROPDOWN, altFilter: true, numSort: true },
           { title: 'formating', type: COLUMN.DROPDOWN_MULTIPLE, width: 150 },
           { title: 'duration', type: COLUMN.LABEL, totals: true }
      ]);

      viewConfig.refreshSummary = refreshSummary;
   }
}


function refreshSummary() {
   var viewConfig = ViewHandler.getViewConfig();
   var qtyRows = viewConfig.qtyVisible;
   $('#summaryRows').text(qtyRows);

   var durationItemName = ViewHandler.getColumnInfoFromTitle('duration').getItemName();
   var sql = 'SELECT SUM(CAST([' + durationItemName + '] AS NUMBER)) AS [' + durationItemName + '] FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var queryResult = ViewHandler.query(sql);
   var summaryDuration = queryResult[0][durationItemName];
   $('#summaryDuration').text(summaryDuration);
}
