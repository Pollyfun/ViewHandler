'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
         { title : 'tags', type : COLUMN.DROPDOWN_MULTIPLE, altFilter : true, width: 170 }
      ]);
   }
}
