'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example6.config') {
      viewConfig.addDataStore('/Examples/Wiki/Example 6/standard-data.json');

      viewConfig.addColumns([
           { title: 'Duration', type: COLUMN.DROPDOWN }  // EV numSort: true för att dema sortering även i dropdownen
      ]);
   }
}
