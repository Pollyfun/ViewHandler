'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example3.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addColumns([
         { title: 'title', sortOrder: 'descending' }
      ]);
   }
}
