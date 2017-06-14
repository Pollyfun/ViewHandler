'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example13.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addCss('Examples/Wiki/Example 13/Example.css');

      viewConfig.addColumns([
           { title: 'formating', type: COLUMN.CLASSES }
      ]);
   }
}
