'use strict';

function configureView(viewConfig) {

   if (viewConfig.configName === 'Example1.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addColumns([
         { title: 'formating', type: COLUMN.DROPDOWN }
      ]);
   }
   else if (viewConfig.configName === 'Example2.config') {
      viewConfig.addDataStore('country-data.json');
      viewConfig.addColumns([
         { title: 'country', type: COLUMN.DROPDOWN }
      ]);
   }
}
