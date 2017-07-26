'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE },
           { title: 'formating', type: COLUMN.DROPDOWN }
      ]);

      viewConfig.addFilter('country', ['Canada', 'France']);
      viewConfig.addFilter('formating', 'red');
   }
}
