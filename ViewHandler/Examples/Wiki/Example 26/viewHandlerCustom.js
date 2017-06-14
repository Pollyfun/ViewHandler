'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example26.config') {
      viewConfig.addDataStore('/demos/xpages.nsf/xsp Core Controls view');

      viewConfig.addColumns([
           { title: ' ', type: COLUMN.HIDDEN },
           { title: 'Date', type: COLUMN.LABEL, width: 100, sort: true, sortOrder: 'descending' },
           { title: 'Author', type: COLUMN.DROPDOWN, width: 130 },
           { title: 'Subject', type: COLUMN.LABEL, width: 420 },
           { title: 'category', type: COLUMN.DROPDOWN, width: 140 },
           { title: 'test control', type: COLUMN.LABEL, width: 240 }
      ]);
      // format the date item. ie: "20100527T120429,61-05" --> "2010-05-27"
      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'Date') {
            var dateTime = cfgValues.display;
            return dateTime.substr(0, 4) + '-' + dateTime.substr(4, 2) + '-' + dateTime.substr(6, 2);
         }
         else if (columnInfo.getTitle() === 'test control') {
            return cfgValues.display.substr(0, 40);
         }
      }
   }
}
