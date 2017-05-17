'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example4.config') {
      viewConfig.addDataStore('/Examples/Wiki/Example 4/standard-data.json');

      viewConfig.addColumns([
           // some long text
           // some short number
           { title: 'percentComplete', width: 500 },
           { title: 'effortDriven', width: 30 }
      ]);
   }
}
