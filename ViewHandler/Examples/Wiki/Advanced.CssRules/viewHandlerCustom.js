'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addCss('Examples/Wiki/Advanced.CssRules/Example.css');

      viewConfig.addColumns([
           { title: 'formating', type: COLUMN.CLASSES }
      ]);
   }
}
