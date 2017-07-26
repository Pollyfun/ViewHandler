// these two functions used for multi-replace characters 
// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string) {
   return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
   string = trimAll(string);	// remove undefined
   return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function trimAll(str) {    // NOTE: also trims..  @todo: fix
   if (typeof str === 'undefined' || str === null) {
      return '';
   }
   return str.replace(/^\s+|\s+$/gm, '');
}

// use this when some values aren't allowed. for example / inside a attribute-name
function sanitizeValue(value) {
   //return value.replace('/', '').replace('/', '');
   return replaceAll(value, '/', '');
}

function sanitizeSortFilterValue(value) {
   return replaceAll(value, '"', '');
}

function isInt(n) {
   return +n === n && !(n % 1);
}

function isObject(obj) {
   return obj === Object(obj);
}

