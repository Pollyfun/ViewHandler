'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example7.config') {
      viewConfig.addDataStore('/Examples/Wiki/Example 7/standard-data.json');

      viewConfig.addColumns([
           { title: 'Duration', type: COLUMN.DROPDOWN_MULTIPLE }
      ]);
   }
}
