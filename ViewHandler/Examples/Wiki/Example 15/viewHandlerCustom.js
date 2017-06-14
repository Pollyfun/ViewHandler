'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example15.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'startdate', type: COLUMN.DROPDOWN, altSort: true, altFilter: true, numSort: true, sort: true }
      ]);
   }
}
