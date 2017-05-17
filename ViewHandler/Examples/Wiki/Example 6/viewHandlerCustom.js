'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example6.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'Duration', type: COLUMN.DROPDOWN }  // EV numSort: true för att dema sortering även i dropdownen
      ]);
   }
}
