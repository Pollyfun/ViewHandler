'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

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

