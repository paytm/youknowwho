/*
  This is picked from Lodash : https://github.com/lodash/lodash/blob/master/lodash.js

  Lodash _.get and _.set is nearly 50-70 times slower than native object accessing and saving.
  Here we can cache the path which is accessed again and again giving around 10 times boost to _.get and _.set

  We have raised a ticket to Lodash : https://github.com/lodash/lodash/issues/2666
  They have given a way to import their inner functions. So by overriding minimal functionality we can castpath beforehand
  and _.get and _.set can expect casted paths

*/

"use strict";


var
    CASTPATH    = require('lodash/_castPath'),
    TOKEY       = require('lodash/_toKey');


/* overriden baseGet function of Lodash */
function _cpBaseGet(object, castedPath) {
    /* here we have removed casted path line from Lodash
              path = isKey(path, object) ? [path] : castPath(path);
    */
    var index = 0,
        length = castedPath.length;

    while (object != null && index < length) {
        object = object[TOKEY(castedPath[index++])];
    }
    return (index && index == length) ? object : undefined;
} 

/* overriden get function of Lodash */
function cpGet(object, castedPath, defaultValue) {
    var result = object == null ? undefined : _cpBaseGet(object, castedPath);
    return result === undefined ? defaultValue : result;
}


module.exports = {
    castPath    :  CASTPATH,
    cpGet       : cpGet,   
}

   

      