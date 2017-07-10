'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'country') {
            return cfgValues.alt;
         }
      }

   }
}

