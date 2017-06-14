﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example11.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'duration', totals: true },
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE }
      ]);
   }
}
