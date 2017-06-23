'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example1.config') {
      viewConfig.addDataStore('standard-data.json');
   }
}
