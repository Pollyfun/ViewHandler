'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example5.config') {
      viewConfig.addDataStore('/Examples/Wiki/Example 5/standard-data.json');

      viewConfig.addColumns([
           { title: 'title', type: COLUMN.LABEL },    // COLUMN.LABEL is the default
           { title: 'Duration', type: COLUMN.HIDDEN },
           { title: 'Duration-numSort', type: COLUMN.HIDDEN },
           { title: 'percentComplete', type: COLUMN.HIDDEN }
      ]);
   }
}
