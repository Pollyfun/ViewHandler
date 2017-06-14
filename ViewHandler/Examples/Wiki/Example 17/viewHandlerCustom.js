'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example17.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE },
           { title: 'formating', type: COLUMN.DROPDOWN },
           { title: 'duration', numSort: true },
           { title: 'startdate', altSort: true }
      ]);
   }
}
