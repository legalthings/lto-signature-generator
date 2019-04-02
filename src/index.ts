export * from './constants';
export * from './interface';
export * from './byteProcessor/ByteProcessor';
export * from './config/Config';
export * from './config/interface';
export * from './signatureFactory/interface';
export * from './signatureFactory/SignatureFactory';
export * from './Seed';
export * from './dictionary';
export * from './parse';

import base58 from './libs/base58';
import converters from '../libs/converters';
import * as blake2b from '../libs/blake2b';
import secureRandom from './libs/secure-random';
import * as base64 from 'base64-js';

import { concatUint8Arrays } from './utils/concat';
import convert from './utils/convert';
import crypto from './utils/crypto';

export const libs = {
    base64,
    base58,
    converters,
    blake2b,
    secureRandom
};

export const utils = {
    concatUint8Arrays,
    convert,
    crypto
};
