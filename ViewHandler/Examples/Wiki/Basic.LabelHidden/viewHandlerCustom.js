﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'name', type: COLUMN.LABEL },
           { title: 'country', type: COLUMN.HIDDEN }
      ]);
   }
}
