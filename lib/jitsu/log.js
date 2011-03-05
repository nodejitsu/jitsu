/*
 * log.js: Tools for configuring winston in jitsu.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston');

var log = exports;

//
// ### function extractFrom (obj, properties)
// #### @obj {Object} Object to extract properties from. 
// #### @properties {Array} List of properties to output.
// Creates an array representing the values for `properties` in `obj`.
//
log.extractFrom = function (obj, properties) {
  return properties.map(function (p) {
    return obj[p] || '';
  });
};

//
// ### function columnMajor (rows)
// #### @rows {ArrayxArray} Row-major Matrix to transpose
// Transposes the row-major Matrix, represented as an array of rows,
// into column major form (i.e. an array of columns).
//
log.columnMajor = function (rows) {
  var columns = [];
  
  rows.forEach(function (row) {
    for (var i = 0; i < row.length; i++) {
      if (!columns[i]) {
        columns[i] = [];
      }
      
      columns[i].push(row[i]);
    }
  });
  
  return columns;
};

//
// ### arrayLengths (arrs) 
// #### @arrs {ArrayxArray} Arrays to calculate lengths for
// Creates an array with values each representing the length
// of an array in the set provided.   
//
log.arrayLengths = function (arrs) {
  var lengths = [];
  for (var i = 0; i < arrs.length; i++) {
    lengths.push(winston.longestElement(arrs[i]));
  }
  
  return lengths;
};

//
// ### function stringifyRows (rows, colors)
// #### @rows {ArrayxArray} Matrix of properties to output in row major form
// #### @colors {Array} Set of colors to use for the headers
// Outputs the specified `rows` as fixed-width columns, adding
// colorized headers if `colors` are supplied.
//
log.stringifyRows = function (rows, colors) {
  var lengths, columns, output = [], headers;
  
  columns = log.columnMajor(rows);
  lengths = log.arrayLengths(columns);
  
  function stringifyRow (row, colorize) {
    var rowtext = '', padding, item;
    for (var i = 0; i < row.length; i++) {
      item = colorize ? row[i][colors[i]] : row[i];
      padding = row[i].length < lengths[i] ? lengths[i] - row[i].length + 2 : 2;
      rowtext += item + new Array(padding).join(' ');
    }
    
    output.push(rowtext);
  }
  
  // If we were passed colors, then assume the first row
  // is the headers for the rows
  if (colors) {
    headers = rows.splice(0, 1)[0];
    stringifyRow(headers, true);
  }
  
  rows.forEach(function (row) {
    stringifyRow(row, false);
  });
  
  return output.join('\n');
};

log.logRows = function (level, rows, colors) {
  log.stringifyRows(rows, colors).split('\n').forEach(function (str) {
    winston.log(level, str);
  });
};

//
// ### function putObjects (objs, properties, colors)
// #### @objs {Array} List of objects to create output for
// #### @properties {Array} List of properties to output
// #### @colors {Array} Set of colors to use for the headers
// Extracts the lists of `properties from the specified `objs`
// and formats them according to `log.stringifyRows`.
//
log.putObjects = function (objs, properties, colors) {
  var rows = [properties].concat(objs.map(function (obj) {
    return log.extractFrom(obj, properties);
  }));
  
  return log.stringifyRows(rows, colors);
};