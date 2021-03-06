﻿'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
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

   var durationColumnTitle = ViewHandler.getColumnInfoFromTitle('duration').getTitle();
   var sql = 'SELECT SUM(CAST([' + durationColumnTitle + '] AS NUMBER)) AS [' + durationColumnTitle + '] FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var queryResult = ViewHandler.query(sql);
   var summaryDuration = queryResult[0][durationColumnTitle];
   $('#summaryDuration').text(summaryDuration);
}

