'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example25.config') {
      viewConfig.addDataStore('standard-data.json');
      viewConfig.addCss('Examples/Wiki/Example 25/Example.css');

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
            //console.log("overrideActiveFilterValue  ..value: " + value + "  dropFilter: " + dropFilter);
            if (value === null)
               return value;
            var columnInfo = dropFilter.getColumnInfo();
            return getMonthFromNumber(value);
         }
      };

      viewConfig.convertDisplayValue = function (columnInfo, cfgValues) {
         /*if (columnInfo.getTitle() === 'startdate') {
            return cfgValues.display.toUpperCase();
         }
         else*/
         if (columnInfo.getTitle() === 'country') {
            var linkValue = cfgValues.display.replace(' ', '_');
            return '<a href="https://en.wikipedia.org/wiki/' + linkValue + '" target="blank">' + cfgValues.display + '</a>';
         }
      };
   }
   $(window).on('filterwasupdated', function (e) {
      var activeFilters = e.filterdata;
      //console.info(activeFilters);
      var filterDOM = ViewHandler.createActiveFilterDOM(activeFilters);
      $('#activefilters').children().remove();
      if (activeFilters.length > 0) {
         //console.log(filterDOM);
         $('#activefilters').append(filterDOM);
      }
   });
}

function refreshSummary() {
   var viewConfig = ViewHandler.getViewConfig();
   var qtyRows = viewConfig.qtyVisible;
   $('#summaryRows').text(qtyRows);

   var durationItemName = ViewHandler.getColumnInfoFromTitle('duration').getItemName();
   var sql = 'SELECT SUM(CAST([' + durationItemName + '] AS NUMBER)) AS [' + durationItemName + '] FROM ' + viewConfig.dataStores[0].alias;
   if (viewConfig.where !== '')
      sql += ' WHERE ' + viewConfig.where;
   var queryResult = ViewHandler.query(sql);
   var summaryDuration = queryResult[0][durationItemName];
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



function createData() {

   var colors = ['red', 'green', 'purple', 'orange', 'red', 'white', 'black', 'blue', 'yellow', 'pink', 'grey'];
   //var months = ['January||||01||01||January', 'February||||02||02||February', 'March||||03||03||March', 'April||||04||04||April', 'May||||05||05||May', 'June||||06||06||June', 'July||||07||07||July', 'August||||08||08||August', 'September||||09||09||September', 'October||||10||10||October', 'November||||11||11||November', 'December||||12||12||December'];
   var months = ['01||January', '02||February', '03||March', '04||April', '05||May', '06||June', '07||July', '08||August', '09||September', '10||October', '11||November', '12||December'];

   var countries = [
    'Dominican Republic',
    'Saint Lucia',
    'Albania',
    'Ghana',
    'Indonesia',
    'Malawi',
    'Cook Islands',
    'Mauritius',
    'Sierra Leone',
    'Bermuda',
    'Sweden',
    'Montenegro',
    'Niue',
    'Zimbabwe',
    'Mauritania',
    'Curaçao',
    'Tanzania',
    'Martinique',
    'Botswana',
    'Guinea-Bissau',
    'Gambia',
    'Western Sahara',
    'Moldova',
    'Iran',
    'Saint Barthélemy',
    'Macedonia',
    'Namibia',
    'Kiribati',
    'Sweden',
    'Afghanistan',
    'Macao',
    'El Salvador',
    'Maldives',
    'El Salvador',
    'Bolivia',
    'Tuvalu',
    'El Salvador',
    'Malaysia',
    'Uganda',
    'Faroe Islands',
    'Panama',
    'Viet Nam',
    'Mauritania',
    'Sint Maarten',
    'Burundi',
    'Ireland',
    'Liechtenstein',
    'Egypt',
    'Kyrgyzstan',
    'United States'];

   var names = [
      'Melinda',
'Lee',
'Unity',
'Victoria',
'Lamar',
'Ariel',
'Evelyn',
'Leah',
'Cody',
'Jolene',
'Geoffrey',
'Yen',
'Samuel',
'Rylee',
'Bree',
'Branden',
'Roanna',
'Orson',
'Randall',
'Clark',
'Tashya',
'Elmo',
'Raphael',
'Lester',
'Ashton',
'Justin',
'Abra',
'Castor',
'Lunea',
'Kylynn',
'Sloane',
'Vernon',
'Bernard',
'Maia',
'Diana',
'Madonna'
   ];


   var companies = [
      'Aliquam Adipiscing Lacus Industries',
      'Facilisis Incorporated',
      'Sagittis Duis LLC',
      'Faucibus Orci Luctus Industries',
      'Est Institute',
      'Iaculis Incorporated',
      'Iaculis Lacus Ltd',
      'Nullam Incorporated',
      'Elementum Sem LLP',
      'Congue A Incorporated',
      'Tortor Nunc Commodo LLP',
      'In Consulting',
      'Risus A Foundation',
      'Vehicula Et LLC',
      'Purus Accumsan Industries',
      'At Foundation',
      'Felis Adipiscing Consulting',
      'Ac Associates',
      'Cras Convallis Convallis LLP',
   ];

   var email = [
      'sit.amet.consectetuer@atpretium.ca',
      'Nulla.dignissim@Maurismolestie.co.uk',
      'sed@ametanteVivamus.com',
      'elementum@acmieleifend.com',
      'nulla.at@adipiscinglobortis.com',
      'sit.amet@scelerisquedui.edu',
      'fames.ac@placerataugueSed.co.uk',
      'blandit.enim.consequat@Nullamvelit.edu',
      'eu@lacusQuisque.com',
      'elit.pharetra.ut@laciniaat.net',
      'erat.vitae.risus@temporest.ca',
      'lacus.varius@fermentumrisus.net',
      'congue.In.scelerisque@sem.ca',
      'odio@urnaetarcu.net',
      'In.scelerisque.scelerisque@tincidunt.ca',
      'Duis.risus.odio@anteipsumprimis.org',
      'convallis.convallis.dolor@Nuncsollicitudin.com',
      'malesuada.ut@Crassed.net',
      'sem@turpisAliquamadipiscing.edu',
      'ipsum.leo.elementum@auguescelerisque.org'
   ];
   //console.info(countries.length);

   var json = [];
   for (var i = 0; i < 500; i++) {
      var name = names[Math.floor(Math.random() * names.length)];
      var country = countries[Math.floor(Math.random() * countries.length)];
      var duration = Math.floor(Math.random() * 210);
      var color = colors[Math.floor(Math.random() * colors.length)];
      var monthIndex = Math.floor(Math.random() * months.length)
      var filterPart = months[monthIndex];
      var day = Math.floor(Math.random() * 28) + 1;
      var year = Math.floor(Math.random() * 3) + 2014;
      var date = year + '-' + zeroPadding((monthIndex + 1)) + '-' + zeroPadding(day);
      var startdate = date + '||||' + date + '||' + filterPart;
      var company = companies[Math.floor(Math.random() * companies.length)];
      var email1 = email[Math.floor(Math.random() * email.length)];

      //console.log(name + '__' + country + '__' + duration + '__' + color + '__' + month);
      var row = { "name": name, "country": country, "duration": duration, "color": color, "startdate": startdate, "company": company, "email": email1, "classes": color }
      json.push(row);
   }

   console.info(JSON.stringify(json));
}

function zeroPadding(value) {
   value = '0' + value;
   return value.substr(value.length - 2, 2);
}



   
