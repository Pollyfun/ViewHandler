'use strict';

//var SERVER_DOMAIN = 'http://dev.psksyd.com';        // used when it's a local container. Empty in the real container.
//var viewHandlerPath = '/psk/ViewHandlerBase.nsf';   // hardcoded in the local Container. In the real Container this is done in the HTML Head Content.
//var webdbname = '/kund/statoil/stbygg.nsf';     // hardcoded in the local Container. In the real Container this is done in the HTML Head Content.
//var ID_VIEWHANDLER = 'viewhandler';
//var DEFAULT_CONFIGNAME = 'UtrUrvalTerminaler.simple';

// the DOMContentLoaded event will fire as soon as the DOM hierarchy has been fully constructed, 
// the load event will do it when all the images and sub-frames have finished loading.
window.addEventListener("load", function () {
   refreshViewHandler1();
   refreshViewHandler2();
});


function selectView1(dropdown) {
   var configName = dropdown.value;
   if (configName === 'UtrUrvalTerminalerSTN.simple')
      $('#terminalrow1').addClass('hidden');
   else
      $('#terminalrow1').removeClass('hidden');

   //console.log('SelectView1: ' + configName);
   //fillInTitle(configName);
   $('#ptitle1').text(configName);
   setTimeout(function () { refreshViewHandler1(); }, 10);   // let the dropdown finish it's operations before replacing the iframe (since it might want to close dropdowns inside the iframe)
}

function selectView2(dropdown) {
   var configName = dropdown.value;
   if (configName === 'UtrUrvalTerminalerSTN.simple')
      $('#terminalrow2').addClass('hidden');
   else
      $('#terminalrow2').removeClass('hidden');
   //console.log('SelectView2: ' + configName);
   //fillInTitle(configName);
   $('#ptitle2').text(configName);
   setTimeout(function () { refreshViewHandler2(); }, 10);   // let the dropdown finish it's operations before replacing the iframe (since it might want to close dropdowns inside the iframe)
}


function refreshViewHandler1() {
   var configName = $("#SelectTyp1").val();
   //console.log('refreshViewHandler1....' + configName);

   // todo: behövs viewHandlerPath?
   ViewHandler.createView('viewhandler', configName, '', function (viewConfig) {
      //console.log('CONFIGURE viewhandler1 ' + viewConfig.configName);

      if (configName === 'Config_A') {
         viewConfig.addDataStore("/Examples/Data/data1.json");
      }
      else if (configName === 'Config_B') {
         viewConfig.addDataStore("/Examples/Data/data2.json");
      }
      viewConfig.addColumns({ title: "Omrade", type: COLUMN.DROPDOWN, sort: true });
   });
}

function refreshViewHandler2() {
   var configName = $("#SelectTyp2").val();
   //var configName = 'Example2';      // configName kan vara '' ifall bara 1 vy och ingen delad kod med andra vyer?
   //console.log('refreshViewHandler2....' + configName);

   ViewHandler.createView('viewhandler2', configName, '', function (viewConfig) {
      //console.log('CONFIGURE viewhandler2 ' + viewConfig.configName);
      //sharedDataStore(viewConfig);

      if (configName === 'Config_A') {
         viewConfig.addDataStore("/Examples/Data/data1.json");
      }
      else if (configName === 'Config_C') {
         viewConfig.addDataStore("/Examples/Data/data3.json");
      }
      viewConfig.addColumns({ title: "field3", type: COLUMN.DROPDOWN, sort: true });
   });
}

function sharedDataStore(viewConfig) {
   var dataUrl = "/Examples/Data/data1.json";
   viewConfig.addDataStore(dataUrl);
}


/*
  // TODO: hantera denna typen av data      konfigurera på kolumnindex istället?         viewConfig.matrixData = true;
   //       hitta fler data-exempel på data som bör kunna hanteras
   var data = [
       ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
       ['2014', 10, 11, 12, 13],
       ['2015', 20, 11, 14, 13],
       ['2016', 30, 15, 12, 13]
   ];
https://github.com/mleibman/SlickGrid/wiki/Slick.Grid#constructor

 var grid;
  var columns = [
    {id: "title", name: "Title", field: "title"},
    {id: "duration", name: "Duration", field: "duration"},
    {id: "%", name: "% Complete", field: "percentComplete"},
    {id: "start", name: "Start", field: "start"},
    {id: "finish", name: "Finish", field: "finish"},
    {id: "effort-driven", name: "Effort Driven", field: "effortDriven"}
  ];

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false
  };
  $(function () {
    var data = [];
    for (var i = 0; i < 500; i++) {
      data[i] = {
        title: "Task " + i,
        duration: "5 days",
        percentComplete: Math.round(Math.random() * 100),
        start: "01/01/2009",
        finish: "01/05/2009",
        effortDriven: (i % 5 == 0)
      };
    }

    grid = new Slick.Grid("#myGrid", data, columns, options);
*/
