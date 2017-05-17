'use strict';

function configureView(viewConfig) {
   //console.log('CONFIGURE viewhandler ' + viewConfig.configName);
   var configName = viewConfig.configName;
   //viewConfig.setDbPath(webdbname); // needed for excel print        ie: /kund/statoil/stbygg.nsf

   if (configName === 'Example1.config') {
      //var dataUrl = webdbname + '/' + configName;
      //viewConfig.addDataStore(dataUrl);
      viewConfig.addDataStore('/Examples/Wiki/Example 1/standard-data.json');



      //viewConfig.createFullDOM = true;	// TODO: ta bort n\u00E4r den k\u00E4nner av h\u00F6jden och renderar tillr\u00E4ckligt m\u00E5nga automatiskt

      viewConfig.addColumns([
           //{ title: 'Anl nr', sort: true, link: true },
           //{ title: 'duration', type: COLUMN.DROPDOWN, search: true }
      ]);
   }
}
