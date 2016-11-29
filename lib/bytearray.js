/*
 * BE byteArray implementation
 * by Svetlana Linuxenko <linuxenko@yahoo.com>
 */

/* eslint no-undef: 0 */
var byteArray = Uint8Array;

var cmp = function(a, b) {
  if (!b) b = a; a = this;
  return a.filter(function(c,i) { return c === b[i]; }).length === a.length;
};

var toInt = function(a) {
  if (!a) a = this.slice(this.off, 4);
  return (a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3];
  //return a[0] | (a[1] << 8) | (a[2] << 16) | (a[3] << 24);
};

var toBytes = function(int) {
  return new byteArray([
    (int >> 24) & 0xff,
    (int >> 16) & 0xff,
    (int >> 8) & 0xff,
    int & 0xff
  ]);
};

var nextInt = function() {
  return this.toInt(this.slice(this.off, (this.off += 4)));
};

var nextIntBytes = function() {
  return this.nextBytes(4);
};

var nextBytes = function(size) {
  return this.slice(this.off, (this.off += size));
};

var nextByte = function() {
  return this.nextBytes(1)[0];
};

var insertInt = function(int) {
  this.insertBytes(this.toBytes(int));
};

var insertBytes = function(bytes, length) {
  length = length || 4;
  this.set(bytes, this.off, length);
  this.off += length;
};

var insertByte = function(byte) {
  this.set([byte], this.off, (this.off += 1));
};

var toStr = function() {
  var out, i, len, c;
  var char2, char3;
  var array = this;

  out = '';
  len = array.length;
  i = 0;

  while(i < len) {
    c = array[i++];
    switch(c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
          ((char2 & 0x3F) << 6) |
          ((char3 & 0x3F) << 0));
        break;
    }
  }

  return out;
};

byteArray.prototype.cmp = cmp;
byteArray.prototype.toInt = toInt;
byteArray.prototype.nextInt = nextInt;
byteArray.prototype.nextIntBytes = nextIntBytes;
byteArray.prototype.toBytes = toBytes;
byteArray.prototype.insertInt = insertInt;
byteArray.prototype.insertBytes = insertBytes;
byteArray.prototype.nextBytes = nextBytes;
byteArray.prototype.nextByte = nextByte;
byteArray.prototype.insertByte = insertByte;
byteArray.prototype.toStr = toStr;

Object.defineProperty(byteArray.prototype , 'off', {
  enumerable: false,
  configurable: false,
  writable: true,
  value : 0
});

module.exports = byteArray;
