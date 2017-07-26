'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'name', type: COLUMN.LABEL },
           { title: 'country', type: COLUMN.HIDDEN }
      ]);
   }
}
