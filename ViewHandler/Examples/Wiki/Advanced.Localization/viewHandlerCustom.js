'use strict';

function configureView(viewConfig) {
   var configName = viewConfig.configName;

   if (configName === 'Example.config') {
      viewConfig.addDataStore('standard-data.json');

      viewConfig.addColumns([
          { title: 'name', lngkey: 'name' },
          { title: 'country', lngkey: 'country' },
          { title: 'duration', lngkey: 'duration' },
          { title: 'formating', lngkey: 'formating' },
          { title: 'startdate', lngkey: 'startdate' }
      ]);
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
      case 'formating':
         return 'Formating';
      case 'startdate':
         return 'Start date';
      default:
         return '((' + lngkey + '))';
   }
}