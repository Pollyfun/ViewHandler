'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example20.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
          // { title: 'startdate', altSort: true, sort: true }
         { title : 'tags', type : COLUMN.DROPDOWN_MULTIPLE, altFilter : true, width: 170 }
      ]);
   }
}
