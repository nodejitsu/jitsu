var fs = require('fs');
var MB = 1024 * 1024;
function LogFile(filePath, maxSize) {
  var self = this;
  this.size = 2;
  this.maxSize = maxSize || MB;
  this.filePath = filePath;
  try {
    fs.statSync(this.filePath)
    this.content = JSON.parse(fs.readFileSync(filePath));
    this.content = this.content.map(function (item) {
      var str = JSON.stringify(item, null, ' ');
      self.size += str.length + 1;
      return str;
    })
  }
  catch(e) {
    this.content = [];
  }
  this.prune();
}
exports.LogFile = LogFile;
LogFile.prototype.prune = function prune() {
  while(this.size > this.maxSize) {
    var obj = this.content.shift();
    this.size -= obj.length + 1;
  }
}
LogFile.prototype.log = function log(object) {
  var str = JSON.stringify(object, null, ' ');
  this.size += str.length + 1;
  this.content.push(str);
  this.prune();
  str = this.toString();
  fs.writeFile(this.filePath, str);
}
LogFile.prototype.toString = function toString() {
  return '[\n'+this.content.join(',\n')+'\n]\n';
}
