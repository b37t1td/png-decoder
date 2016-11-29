var crc = require('../lib/crc32');
var expect = require('chai').expect;

var PREDEF_STRINGS = [
//  { str : 'hello world', crc : 0x0d4a1185},
//  { str : 'test my crc', crc : 0x5f8269a4},
//  { str : 'short', crc : 0x8f2890a2}
];

describe('Test crc32 module', function() {
  it('should be exists', function() {
    expect(crc).to.be.exist;
    expect(crc).to.be.a('function');
  });

  it('should test predefined strings', function() {
    for (var i = 0; i < PREDEF_STRINGS.length; i++) {
      var ps = PREDEF_STRINGS[i];
      expect(crc(Buffer.from(ps.str))).to.be.equal(ps.crc);
    }
  });
});
