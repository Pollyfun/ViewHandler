'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN }
      ]);
   }
}
