'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example1.5.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'duration', sort: true }
      ]);
   }
}
