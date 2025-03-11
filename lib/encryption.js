"use strict";

// Encryption example from 
// http://gist.github.com/aabiskar/c1d80d139f83f6a43593ce503e29964c

// Normally we'd define our key in a configuration file or
// enviornment variable, so that it wouldn't be bundled with
// our code... but for covenience (and because this is just an
// example), we'll set it here.
const encryption_key = "abcd1234abcd1234abcd1234abcd1234"; // Must be 32 characters

// Likewise, the initialization vector should be randomized
// and could even be stored with the encrypted values, similar
// to a salt.
const initialization_vector = "abcd1234abcd1234"; // Must be 16 characters
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';

/** @module encipherion
 * A module of functions to encipher/decipher and digest
 */
module.exports = {
  encipher: encipher,
  decipher: decipher,
  digest: digest
}

/** @function salt
 * Creates a random value to use as a salt
 * @returns {string} a 32-bit salt
 */
function salt() {
  return crypto.randomBytes(32).toString('hex').slice(32);
}

/** @function digest
 * Creates a cryptographic hash of the provided text.
 * @param {string} plaintext - the text to create a digest from
 */
function digest(plaintext) {
  const hash = crypto.createHash('sha256');
  hash.update(plaintext);
  hash.update(secret);
  return hash.digest('hex');
}

/** @function encipher
 * Enciphers the provided text
 * @param {string} plaintext - the text to encipher
 * @returns {string} the enciphered text
 */
function encipher(plaintext) {
  const cipher = crypto.createCipheriv('aes-256-cbc',Buffer.from(encryption_key), Buffer.from(initialization_vector))
  var crypted = cipher.update(plaintext, 'utf8', 'hex')
  crypted += cipher.final('hex')
  return crypted
}

/** @function decipher
 * @param {string} crypttext - the text to decipher
 * @returns {string} the deciphered plain text
 */
function decipher(crypttext) {
  const decipher = crypto.createDecipheriv('aes-256-cbc',Buffer.from(encryption_key), Buffer.from(initialization_vector))
  let dec = decipher.update(crypttext, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}
