'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addCss('Examples/Wiki/Demo/Example.css');

      viewConfig.addColumns([
           { title: 'name', lngkey: 'name' },
           { title: 'country', type: COLUMN.DROPDOWN_MULTIPLE, lngkey: 'country', width: 150 },
           { title: 'color', type: COLUMN.DROPDOWN, lngkey: 'color' },
           { title: 'duration', numSort: true, totals: true, lngkey: 'duration' },
           { title: 'startdate', type: COLUMN.DROPDOWN_MULTIPLE, altSort: true, altFilter: true, lngkey: 'startdate', width: 150 },
           { title: 'company', type: COLUMN.DROPDOWN, lngkey: 'company', width: 200 },
           { title: 'email', lngkey: 'email', width: 230 },
           { title: 'classes', type: COLUMN.CLASSES },
      ]);

      viewConfig.refreshSummary = refreshSummary;

      viewConfig.overrideActiveFilterValue = function (dropFilter, value) {
         if (dropFilter.getColumnInfo().getTitle() === 'startdate') {
            if (value === null)
               return value;
            var columnInfo = dropFilter.getColumnInfo();
            return getMonthFromNumber(value);
         }
      };

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         if (columnInfo.getTitle() === 'country') {
            var linkValue = cfgValues.display.replace(' ', '_');
            return '<a href="https://en.wikipedia.org/wiki/' + linkValue + '" target="blank">' + cfgValues.display + '</a>';
         }
      };
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

function refreshSummary() {
   var viewConfig = ViewHandler.getViewConfig();
   var qtyRows = viewConfig.qtyVisible;
   $('#summaryRows').text(qtyRows);

   var durationColumnTitle = ViewHandler.getColumnInfoFromTitle('duration').getTitle();
   var sql = 'SELECT SUM(CAST([' + durationColumnTitle + '] AS NUMBER)) AS [' + durationColumnTitle + '] FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var queryResult = ViewHandler.query(sql);
   var summaryDuration = queryResult[0][durationColumnTitle];
   $('#summaryDuration').text(summaryDuration);
}

function getMonthFromNumber(monthNumber) {
   switch (monthNumber) {
      case '01':
         return 'January';
      case '02':
         return 'February';
      case '03':
         return 'March';
      case '04':
         return 'April';
      case '05':
         return 'May';
      case '06':
         return 'June';
      case '07':
         return 'July';
      case '08':
         return 'August';
      case '09':
         return 'September';
      case '10':
         return 'October';
      case '11':
         return 'November';
      case '12':
         return 'December';
      default:
         return '';
   }
}

function translateWord(lngkey) {
   switch (lngkey) {
      case 'name':
         return 'Name';
      case 'country':
         return 'Country';
      case 'duration':
         return 'Duration';
      case 'color':
         return 'Color';
      case 'startdate':
         return 'Start date';
      case 'all':
         return 'All';
      case 'none':
         return 'None';
      case 'unselect':
         return 'Unselect';
      case 'company':
         return 'Company';
      case 'email':
         return 'Email';
      default:
         return '((' + lngkey + '))';
   }
}

   
