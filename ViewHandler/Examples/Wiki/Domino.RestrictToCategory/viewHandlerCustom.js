'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      var category = $('#selectCategory').val();
      viewConfig.addDataStore('/demos/xpages.nsf/AuthorView', category);

      viewConfig.addColumns([
           { title: ' ', type: COLUMN.HIDDEN },
           { title: 'Date', type: COLUMN.LABEL, width: 150, sort: true, sortOrder: 'descending' }
      ]);
      // format the date item. ie: "20100527T120429,61-05" --> "2010-05-27"
      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'Date') {
            var dateTime = cfgValues.display;
            return dateTime.substr(0, 4) + '-' + dateTime.substr(4, 2) + '-' + dateTime.substr(6, 2);
         }
      }
   }
}

function selectView(dropdown) {
   // replace the viewhandler. the selected category will be used for retrieving data.
   setTimeout(function () {
      createView({ containerId: 'viewhandler', configName: 'Example.config', serverDomain: SERVER_DOMAIN });
   }, 10);   // let the dropdown finish it's operations before replacing the iframe (since it might want to close dropdowns inside the iframe)
}
