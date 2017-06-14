﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example18.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE },
           { title: 'formating', type: COLUMN.DROPDOWN },
           { title: 'duration', numSort: true },
           { title: 'startdate', altSort: true }
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
