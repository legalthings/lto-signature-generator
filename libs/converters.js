var CryptoJS = require('crypto-js');
var BigNumber = require('./bignumber');


/** START OF THE LICENSED CODE */

/******************************************************************************
 * Copyright © 2013-2016 The Nxt Core Developers.                             *
 *                                                                            *
 * See the AUTHORS.txt, DEVELOPER-AGREEMENT.txt and LICENSE.txt files at      *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Nxt software, including this file, may be copied, modified, propagated,    *
 * or distributed except according to the terms contained in the LICENSE.txt  *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

var converters = function () {
    var charToNibble = {};
    var nibbleToChar = [];
    var i;
    for (i = 0; i <= 9; ++i) {
        var character = i.toString();
        charToNibble[character] = i;
        nibbleToChar.push(character);
    }

    for (i = 10; i <= 15; ++i) {
        var lowerChar = String.fromCharCode('a'.charCodeAt(0) + i - 10);
        var upperChar = String.fromCharCode('A'.charCodeAt(0) + i - 10);

        charToNibble[lowerChar] = i;
        charToNibble[upperChar] = i;
        nibbleToChar.push(lowerChar);
    }

    return {
        byteArrayToHexString: function (bytes) {
            var str = '';
            for (var i = 0; i < bytes.length; ++i) {
                if (bytes[i] < 0) {
                    bytes[i] += 256;
                }
                str += nibbleToChar[bytes[i] >> 4] + nibbleToChar[bytes[i] & 0x0F];
            }

            return str;
        },
        stringToByteArray: function (str) {
            var utf8 = [];
            for (var i = 0; i < str.length; i++) {
                var charCode = str.charCodeAt(i);
                if (charCode < 0x80) utf8.push(charCode);
                else if (charCode < 0x800) {
                    utf8.push(0xc0 | (charCode >> 6),
                        0x80 | (charCode & 0x3f));
                } else if (charCode < 0xd800 || charCode >= 0xe000) {
                    utf8.push(0xe0 | (charCode >> 12),
                        0x80 | ((charCode >> 6) & 0x3f),
                        0x80 | (charCode & 0x3f));
                }
                // surrogate pair
                else {
                    i++;
                    // UTF-16 encodes 0x10000-0x10FFFF by
                    // subtracting 0x10000 and splitting the
                    // 20 bits of 0x0-0xFFFFF into two halves
                    charCode = 0x10000 + (((charCode & 0x3ff) << 10)
                        | (str.charCodeAt(i) & 0x3ff));
                    utf8.push(0xf0 | (charCode >> 18),
                        0x80 | ((charCode >> 12) & 0x3f),
                        0x80 | ((charCode >> 6) & 0x3f),
                        0x80 | (charCode & 0x3f));
                }
            }
            return utf8;
        },
        hexStringToByteArray: function (str) {
            var bytes = [];
            var i = 0;
            if (0 !== str.length % 2) {
                bytes.push(charToNibble[str.charAt(0)]);
                ++i;
            }

            for (; i < str.length - 1; i += 2)
                bytes.push((charToNibble[str.charAt(i)] << 4) + charToNibble[str.charAt(i + 1)]);

            return bytes;
        },
        stringToHexString: function (str) {
            return this.byteArrayToHexString(this.stringToByteArray(str));
        },
        hexStringToString: function (hex) {
            return this.byteArrayToString(this.hexStringToByteArray(hex));
        },
        checkBytesToIntInput: function (bytes, numBytes, opt_startIndex) {
            var startIndex = opt_startIndex || 0;
            if (startIndex < 0) {
                throw new Error('Start index should not be negative');
            }

            if (bytes.length < startIndex + numBytes) {
                throw new Error('Need at least ' + (numBytes) + ' bytes to convert to an integer');
            }
            return startIndex;
        },
        byteArrayToSignedShort: function (bytes, opt_startIndex) {
            var index = this.checkBytesToIntInput(bytes, 2, opt_startIndex);
            var value = bytes[index];
            value += bytes[index + 1] << 8;
            return value;
        },
        byteArrayToSignedInt32: function (bytes, opt_startIndex) {
            var index = this.checkBytesToIntInput(bytes, 4, opt_startIndex);
            var value = bytes[index];
            value += bytes[index + 1] << 8;
            value += bytes[index + 2] << 16;
            value += bytes[index + 3] << 24;
            return value;
        },
        byteArrayToBigInteger: function (bytes) {
            var baseNumber = new BigNumber('256', 10);
            var value = new BigNumber('0', 10);
            var temp1;

            for (var i = bytes.length - 1; i >= 0; i--) {
                var byte = bytes[i];
                temp1 = new BigNumber(byte)
                    .times(baseNumber.pow(bytes.length - 1 - i));
                value = value.plus(temp1);
            }

            return value;
        },
        byteArrayToSignBigInteger: function (bytes) {
            var isMinus = bytes[0] >= 128 && bytes.length === 8;

            var value = new BigNumber('0', 10);

            var temp1;

            for (var i = bytes.length - 1; i >= 0; i--) {
                var byte = bytes[i];
                if (isMinus) {
                    byte = (~byte) & 255;
                }
                temp1 = new BigNumber(byte)
                    .times(new BigNumber('256', 10).pow(bytes.length - 1 - i));
                value = value.plus(temp1);
            }

            if (isMinus) {
                value = value.plus(1);
                value = new BigNumber(0).minus(value);
            }
            return value;
        },
        // create a wordArray that is Big-Endian
        byteArrayToWordArray: function (byteArray) {
            var i = 0,
                offset = 0,
                word = 0,
                len = byteArray.length;
            var words = new Uint32Array(((len / 4) | 0) + (len % 4 == 0 ? 0 : 1));

            while (i < (len - (len % 4))) {
                words[offset++] = (byteArray[i++] << 24) | (byteArray[i++] << 16) | (byteArray[i++] << 8) | (byteArray[i++]);
            }
            if (len % 4 != 0) {
                word = byteArray[i++] << 24;
                if (len % 4 > 1) {
                    word = word | byteArray[i++] << 16;
                }
                if (len % 4 > 2) {
                    word = word | byteArray[i++] << 8;
                }
                words[offset] = word;
            }
            var wordArray = new Object();
            wordArray.sigBytes = len;
            wordArray.words = words;

            return wordArray;
        },
        // assumes wordArray is Big-Endian
        wordArrayToByteArray: function (wordArray) {
            return converters.wordArrayToByteArrayImpl(wordArray, true);
        },
        wordArrayToByteArrayImpl: function (wordArray, isFirstByteHasSign) {
            var len = wordArray.words.length;
            if (len == 0) {
                return new Array(0);
            }
            var byteArray = new Array(wordArray.sigBytes);
            var offset = 0,
                word, i;
            for (i = 0; i < len - 1; i++) {
                word = wordArray.words[i];
                byteArray[offset++] = isFirstByteHasSign ? word >> 24 : (word >> 24) & 0xff;
                byteArray[offset++] = (word >> 16) & 0xff;
                byteArray[offset++] = (word >> 8) & 0xff;
                byteArray[offset++] = word & 0xff;
            }
            word = wordArray.words[len - 1];
            byteArray[offset++] = isFirstByteHasSign ? word >> 24 : (word >> 24) & 0xff;
            if (wordArray.sigBytes % 4 == 0) {
                byteArray[offset++] = (word >> 16) & 0xff;
                byteArray[offset++] = (word >> 8) & 0xff;
                byteArray[offset++] = word & 0xff;
            }
            if (wordArray.sigBytes % 4 > 1) {
                byteArray[offset++] = (word >> 16) & 0xff;
            }
            if (wordArray.sigBytes % 4 > 2) {
                byteArray[offset++] = (word >> 8) & 0xff;
            }
            return byteArray;
        },
        byteArrayToString: function (bytes, opt_startIndex, length) {
            if (length == 0) {
                return '';
            }

            if (opt_startIndex && length) {
                var index = this.checkBytesToIntInput(bytes, parseInt(length, 10), parseInt(opt_startIndex, 10));

                bytes = bytes.slice(opt_startIndex, opt_startIndex + length);
            }

            var extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
            var count = bytes.length;
            var str = '';

            for (var index = 0; index < count;) {
                var ch = bytes[index++];
                if (ch & 0x80) {
                    var extra = extraByteMap[(ch >> 3) & 0x07];
                    if (!(ch & 0x40) || !extra || ((index + extra) > count))
                        return null;

                    ch = ch & (0x3F >> extra);
                    for (; extra > 0; extra -= 1) {
                        var chx = bytes[index++];
                        if ((chx & 0xC0) != 0x80)
                            return null;

                        ch = (ch << 6) | (chx & 0x3F);
                    }
                }

                str += String.fromCharCode(ch);
            }

            return str;
        },
        byteArrayToShortArray: function (byteArray) {
            var shortArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            var i;
            for (i = 0; i < 16; i++) {
                shortArray[i] = byteArray[i * 2] | byteArray[i * 2 + 1] << 8;
            }
            return shortArray;
        },
        shortArrayToByteArray: function (shortArray) {
            var byteArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            var i;
            for (i = 0; i < 16; i++) {
                byteArray[2 * i] = shortArray[i] & 0xff;
                byteArray[2 * i + 1] = shortArray[i] >> 8;
            }

            return byteArray;
        },
        shortArrayToHexString: function (ary) {
            var res = '';
            for (var i = 0; i < ary.length; i++) {
                res += nibbleToChar[(ary[i] >> 4) & 0x0f] + nibbleToChar[ary[i] & 0x0f] + nibbleToChar[(ary[i] >> 12) & 0x0f] + nibbleToChar[(ary[i] >> 8) & 0x0f];
            }
            return res;
        },
        /**
         * Produces an array of the specified number of bytes to represent the integer
         * value. Default output encodes ints in little endian format. Handles signed
         * as well as unsigned integers. Due to limitations in JavaScript's number
         * format, x cannot be a true 64 bit integer (8 bytes).
         */
        intToBytes_: function (x, numBytes, unsignedMax, opt_bigEndian) {
            var signedMax = Math.floor(unsignedMax / 2);
            var negativeMax = (signedMax + 1) * -1;
            if (x != Math.floor(x) || x < negativeMax || x > unsignedMax) {
                throw new Error(
                    x + ' is not a ' + (numBytes * 8) + ' bit integer');
            }
            var bytes = [];
            var current;
            // Number type 0 is in the positive int range, 1 is larger than signed int,
            // and 2 is negative int.
            var numberType = x >= 0 && x <= signedMax ? 0 :
                x > signedMax && x <= unsignedMax ? 1 : 2;
            if (numberType == 2) {
                x = (x * -1) - 1;
            }
            for (var i = 0; i < numBytes; i++) {
                if (numberType == 2) {
                    current = 255 - (x % 256);
                } else {
                    current = x % 256;
                }

                if (opt_bigEndian) {
                    bytes.unshift(current);
                } else {
                    bytes.push(current);
                }

                if (numberType == 1) {
                    x = Math.floor(x / 256);
                } else {
                    x = x >> 8;
                }
            }
            return bytes;

        },
        int32ToBytes: function (x, opt_bigEndian) {
            return converters.intToBytes_(x, 4, 4294967295, opt_bigEndian);
        },
        int16ToBytes: function (x, opt_bigEndian) {
            return converters.intToBytes_(x, 2, 65535, opt_bigEndian);
        },
        /**
         * Based on https://groups.google.com/d/msg/crypto-js/TOb92tcJlU0/Eq7VZ5tpi-QJ
         * Converts a word array to a Uint8Array.
         * @param {WordArray} wordArray The word array.
         * @return {Uint8Array} The Uint8Array.
         */
        wordArrayToByteArrayEx: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var u8 = new Uint8Array(sigBytes);
            for (var i = 0; i < sigBytes; i++) {
                var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                u8[i] = byte;
            }

            return u8;
        },
        /**
         * Converts a Uint8Array to a word array.
         * @param {string} u8Str The Uint8Array.
         * @return {WordArray} The word array.
         */
        byteArrayToWordArrayEx: function (u8arr) {
            // Shortcut
            var len = u8arr.length;

            // Convert
            var words = [];
            for (var i = 0; i < len; i++) {
                words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
            }

            return CryptoJS.lib.WordArray.create(words, len);
        }
    };
}();

/** END OF THE LICENSED CODE */

exports['default'] = converters;
