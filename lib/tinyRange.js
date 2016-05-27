/*
  This is picked from tiny range npm module ..
  The reason this is copied here is that we wanted to make changes to this before using
*/

module.exports = Range();

function Range(){
  if (!(this instanceof Range)) {   return new Range();   }

  // maximize int.
  var max = Math.pow(2, 32) - 1;
  // default options.
  this.options = {
    min: -max,
    max: max,
    res: {
      range  : /^[\s\d\-~,]+$/,
      blank  : /\s+/g,
      number : /^\-?\d+$/,
      min2num: /^~\-?\d+$/,
      num2max: /^\-?\d+~$/,
      num2num: /^\-?\d+~\-?\d+$/
    }
  };

  Object.freeze(this.options);
}

Range.prototype.parse = function(str){
  var opts = this.options;

  // make sure is a range string.
  if (!opts.res.range.test(str)) {
    throw new Error('Can not parse an invalid string.');
  }

  var rg = [];
  // remove blanks and split by `,`
  str.replace(opts.res.blank, '').split(',').forEach(function(s){
    if(s.length === 0){
      return;
    }

    var ret = null;
    // Parse string by a matched parser.
    ['number', 'min2num', 'num2max', 'num2num'].some(function(n, i){
      var matched = opts.res[n].test(s);
      matched && (ret = Range.parser[n](s, opts));
      return matched;
    });

    ret && rg.push(ret);
  });

  // nothing be found.
  if(rg.length == 0){
    return rg;
  }

  // merge overlapped ranges
  return this._merge(rg.sort(function(r1, r2){
    return r1[0] - r2[0];
  }));
};

Range.prototype._merge = function(rg){
  var n = 0, len = rg.length;
  for (var i = 1; i < len; ++i) {
    // continue loop if the next minimum is greater than the previous maximum.
    if (rg[i][0] > rg[n][1] + 1) {
      n = i;
      continue;
    }
    // merge ranges.
    if (rg[n][1] < rg[i][1]) {
      rg[n][1] = rg[i][1];
    }
    rg[i] = null;
  }

  var ret = [];

  // wrap output array.
  rg.forEach(function(r){
    r && ret.push(r[0] == r[1] ? r[0] : r);
  });

  return ret;
};

Range.parser = {
  number : function(s){   var d = parseFloat(s);  return [d, d];  },

  min2num: function(s, opts){   return [opts.min, parseFloat(s.substr(1))]; },

  num2max: function(s, opts){   return [parseFloat(s.slice(0, -1)), opts.max]; },

  num2num: function(s, opts){
    var r = s.split('~').map(function(d){   return parseFloat(d);   });

    // number at position 1 must greater than position 0.
    if (r[0] > r[1]) {  return r.reverse();   }
    return r;
  }
};