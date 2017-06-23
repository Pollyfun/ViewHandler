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

   var durationColumnTitle = ViewHandler.getColumnInfoFromTitle('duration').getTitle();
   var sql = 'SELECT SUM(CAST([' + durationColumnTitle + '] AS NUMBER)) AS [' + durationColumnTitle + '] FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var queryResult = ViewHandler.query(sql);
   var summaryDuration = queryResult[0][durationColumnTitle];
   $('#summaryDuration').text(summaryDuration);
}
