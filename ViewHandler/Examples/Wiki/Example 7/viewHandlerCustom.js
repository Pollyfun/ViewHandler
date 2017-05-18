﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example7.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE }
      ]);
   }
}
