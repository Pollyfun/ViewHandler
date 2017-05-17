﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example2.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'Duration', sort: true },
           { title: 'Duration-numSort', sort: true, numSort: true }
      ]);
   }
}
