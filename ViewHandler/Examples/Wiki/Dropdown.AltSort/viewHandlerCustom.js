'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'startdate', type: COLUMN.DROPDOWN, altSort: true, altFilter: true, numSort: true, sort: true }
      ]);
   }
}
