var byteArray = require('./bytearray');
var crc = require('./crc32');

var zlib = require('zlib');

var SIGNATURE = require('./constants').SIGNATURE;
var IHDR = require('./constants').IHDR;
var IEND = require('./constants').IEND;
var IDAT = require('./constants').IDAT;

var inflateFunction = function(data) {
  return zlib.inflateSync(Buffer.from(data));
};


var Decoder = function() { };

Decoder.prototype.parse = function(data) {
  if (!(data instanceof byteArray)) {
    data = new byteArray(data);
  }

  if (!SIGNATURE.cmp(data.nextBytes(SIGNATURE.length))) {
    throw new Error('Not png');
  }

  while (data.off < data.length) {
    var len = data.nextInt();
    var hdr = data.nextBytes(len + 4);

    if (crc(hdr) !== data.nextInt()) {
      throw new Error('Crc error');
    }

    if (IHDR.cmp(hdr)) {
      this._IHDR = this._chunkIHDR(hdr.slice(4, len + 4));

      if (this._IHDR.palette !== 8) {
        throw new Error('Depth error');
      }

      if (this._IHDR.compression !== 0) {
        throw new Error('Compression error');
      }

      if (this._IHDR.filter !== 0) {
        throw new Error('Filter error');
      }

      if (this._IHDR.interlace !== 0) {
        throw new Error('Interlace error');
      }

      switch (this._IHDR.colorType){
        case 0: this.bpp = 1; break;
        case 2: this.bpp = 3; break;
        case 3: this.bpp = 1; break;
        case 4: this.bpp = 2; break;
        case 6: this.bpp = 4; break;
        default: throw new Error('ColorType error');
      }
      this.chunks = [];
    }

    if (IDAT.cmp(hdr)) {
      if (!this._IHDR) {
        throw new Error('IHDR error');
      }

      this._chunkIDAT(hdr.slice(4, len + 4));
    }

    if (IEND.cmp(hdr)) {
      return this._chunkIEND();
    }
  }

  throw new Error('Data error');
};

Decoder.prototype._chunkIEND = function() {
  var tmp = [];
  for (var i = 0; i < this.chunks.length; i++) {
    for (var j = 0; j < this.chunks[i].length; j++) {
      tmp.push(this.chunks[i][j]);
    }
  }
  return this.filter(inflateFunction(tmp));
};

Decoder.prototype._chunkIDAT = function(chunk) {
  this.chunks.push(chunk);
};

Decoder.prototype._chunkIHDR = function(chunk) {
  return {
    width : chunk.nextInt(),
    height : chunk.nextInt(),
    palette : chunk.nextByte(),
    colorType : chunk.nextByte(),
    compression : chunk.nextByte(),
    filter : chunk.nextByte(),
    interlace : chunk.nextByte()
  };
};

Decoder.prototype.filter = function(data) {
  var bpp = this.bpp;
  var width = this._IHDR.width, height = this._IHDR.height;
  var pixels = new byteArray((width * height) * bpp);
  var filter, line, left, leftup, up, pixel;
  var lineWidth = width * bpp, byte, off;

  for (var y = 0; y < height; y++) {

    filter = data.nextByte();
    line = data.nextBytes(lineWidth);

    for (var x = 0; x < lineWidth; x++) {

      if (filter !== 0) {
        off = (y * lineWidth) + x;
      }

      byte = line.nextByte();

      switch(filter) {
        case 0: //None
          pixel = byte;
          break;
        case 1: // Sub  Raw(x) + Raw(x - bpp)
          if (x < bpp) {
            pixel = byte;
            break;
          }
          pixel = pixels[off - bpp] + byte & 0xff;
          break;
        case 2: // Up(x) = Raw(x) + Prior(x)
          if (y === 0) {
            pixel = byte;
            break;
          }
          pixel = pixels[off - lineWidth] + byte & 0xff;
          break;
        case 3: // Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
          if (y === 0) {
            if (x < bpp) {
              pixel = byte;
            } else {
              pixel = (byte + (pixels[off - bpp] >> 1)) & 0xff;
            }
            break;
          }

          if (x < bpp) {
            pixel = (byte + (pixels[off - lineWidth] >> 1)) & 0xff;
            break;
          }

          pixel = (byte + (pixels[off - bpp] + pixels[off - lineWidth] >> 1)) & 0xff;
          break;
        case 4: // Paeth
          if (y === 0) {
            if (x < bpp) {
              pixel = byte;
            } else {
              pixel = (byte + (pixels[off - bpp])) & 0xff;
            }
            break;
          }

          if (x < bpp) {
            pixel = (byte + (pixels[off - lineWidth])) & 0xff;
            break;
          }

          up =  pixels[off - lineWidth];
          left =  pixels[off - bpp];
          leftup = pixels[(off - lineWidth) - bpp];

          var p = left + up - leftup,
            pleft = Math.abs(p - left),
            pup = Math.abs(p - up),
            pleftup = Math.abs(p - leftup);

          if (pleft <= pup && pleft <= pleftup){
            pixel = byte + left & 0xff;
            break;
          } else if (pup <= pleftup) {
            pixel = byte + up & 0xff;
            break;
          }

          pixel = byte + leftup & 0xff;
          break;
        default:
          throw new Error('Filter error: ' + filter);
      }

      pixels.insertByte(pixel);
    }
  }

  return pixels;
};

module.exports = Decoder;
