'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE },
           { title: 'formating', type: COLUMN.DROPDOWN },
           { title: 'duration', numSort: true },
           { title: 'startdate', altSort: true }
      ]);
   }

   $(window).on('filterwasupdated', function (e) {
      var activeFilters = e.filterdata;
      var filterDOM = ViewHandler.createActiveFilterDOM(activeFilters);
      $('#activefilters').children().remove();
      if (activeFilters.length > 0) {
         $('#activefilters').append(filterDOM);
      }
   });
}
