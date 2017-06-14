﻿'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example21.config') {
      viewConfig.addDataStore('standard-data.json');

      //viewConfig.addColumns([
      //     //{ title: 'country', type: COLUMN.DROPDOWN_MULTIPLE }
      //]);

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'startdate') {
            return cfgValues.display.toUpperCase();
         }
         else if (columnInfo.getTitle() === 'country') {
            var linkValue = cfgValues.display.replace(' ', '_');
            return '<a href="https://en.wikipedia.org/wiki/' + linkValue + '" target="blank">' + cfgValues.display + '</a>';
         }
      };
   }
}

