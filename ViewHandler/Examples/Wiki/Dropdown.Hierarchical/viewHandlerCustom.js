﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE },
           { title: 'formating', type: COLUMN.DROPDOWN },
           { title: 'startdate', type: COLUMN.DROPDOWN }
      ]);
   }
}
