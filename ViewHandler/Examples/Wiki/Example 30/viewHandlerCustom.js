'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example30-1.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addColumns([
         { title: 'formating', type: COLUMN.DROPDOWN }
      ]);
   }
   else if (configName === 'Example30-2.config') {
      viewConfig.addDataStore('country-data.json');
      viewConfig.addColumns([
         { title: 'country', type: COLUMN.DROPDOWN }
      ]);
   }
}
