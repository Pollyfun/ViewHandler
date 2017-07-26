'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'country') {
            return cfgValues.alt;
         }
      }

   }
}

