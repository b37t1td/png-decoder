var byteArray = require('../lib/bytearray');
var Decoder = require('../lib/decoder');

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var filename = path.resolve(__dirname, './misc/test.png');
var data;

describe('Test PNG decoder', function() {
  before(function() {
    data = fs.readFileSync(filename);
  });

  it('should create decoder object', function() {
    expect(Decoder).to.be.exist;

    expect(function() {
      new Decoder().parse([0,0,0,0]);
      new Decoder().parse(new byteArray([0,0,0,0]));
    }).to.throw();

    expect(function() {
      new Decoder().parse(Buffer.from(data));
    }).not.to.throw();
  });

  it('should parse correct pixels', function() {
    var pixels = new Decoder().parse(Buffer.from(data));
    expect(pixels).to.be.exists;
    expect(pixels.length).to.be.equal(4 * 4);
    expect(pixels.slice(0,pixels.length)).to.be.deep.equal(
      /* eslint no-undef: 0 */
      new Uint8Array([ 0, 0, 0, 255, 255, 255, 255, 0, 255, 255, 255, 0, 0, 0, 0, 255]));
  });
});
