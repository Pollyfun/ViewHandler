'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example8.config') {
      viewConfig.addDataStore('standard-data.json');
      //viewConfig.addCss('/Examples/Wiki/Example 8/Example.css');
      viewConfig.addCss('Example.css');

      viewConfig.addColumns([
           { title: 'formating', type: COLUMN.CLASSES }
      ]);
   }
}
