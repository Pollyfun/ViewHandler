'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example3.config') {
      viewConfig.addDataStore('/Examples/Wiki/Example 3/standard-data.json');
      viewConfig.addColumns([
         { title: 'title', sortOrder: 'descending' }
      ]);
   }
}
