'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
           { title: 'startdate', type: COLUMN.DROPDOWN_MULTIPLE, altFilter: true, width: 150 }
      ]);

      viewConfig.convertFilterOptionText = function (dropFilter, filterValue, filterText, selected) {
         var columnInfo = dropFilter.getColumnInfo();
         var overrideText = filterValue;

         //console.log("..filterValue: " + filterValue + "  filterText: " + filterText);
         if (columnInfo.getTitle() === 'startdate') {

            if (filterValue === '12' || filterValue === '01' || filterValue === '02')
               return 'Winter: ' + filterText;
            else if (filterValue === '03' || filterValue === '04' || filterValue === '05')
               return 'Spring: ' + filterText;
            else if (filterValue === '06' || filterValue === '07' || filterValue === '08')
               return 'Summer: ' + filterText;
            else if (filterValue === '09' || filterValue === '10' || filterValue === '11')
               return 'Autumn: ' + filterText;
         }
      };
   }
}
