'use strict';

function configureView(viewConfig) {
   if (viewConfig.configName === 'Example.config') {
      var data = [
	    {
	       "name": "Charity",
	       "country": "United States",
	       "duration": 143,
	       "formating": "red",
	       "startdate": "July"
	    },
	    {
	       "name": "Quincy",
	       "country": "United States",
	       "duration": 176,
	       "formating": "yellow",
	       "startdate": "April"
	    },
      {
         "name": "Ishmael",
         "country": "United States",
         "duration": 123,
         "formating": "green",
         "startdate": "January"
      },
	   {
	      "name": "Alma",
	      "country": "Canada",
	      "duration": 67,
	      "formating": "red",
	      "startdate": "September"
	   },
	   {
	      "name": "Arsenio",
	      "country": "United States",
	      "duration": 86,
	      "formating": "yellow",
	      "startdate": "October"
	   }];

      viewConfig.addData(data);
   }
}
