const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

// Generate a new key pair for a user
const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey)
  };
};

// Encrypt a message
const encryptMessage = (message, recipientPublicKey, senderPrivateKey) => {
  try {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = naclUtil.decodeUTF8(message);
    const recipientPublicKeyUint8 = naclUtil.decodeBase64(recipientPublicKey);
    const senderPrivateKeyUint8 = naclUtil.decodeBase64(senderPrivateKey);
    
    const encrypted = nacl.box(
      messageUint8,
      nonce,
      recipientPublicKeyUint8,
      senderPrivateKeyUint8
    );
    
    if (!encrypted) {
      throw new Error('Encryption failed');
    }
    
    return {
      encryptedContent: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce)
    };
  } catch (error) {
    throw new Error(`Encryption error: ${error.message}`);
  }
};

// Decrypt a message
const decryptMessage = (encryptedContent, nonce, senderPublicKey, recipientPrivateKey) => {
  try {
    const encryptedUint8 = naclUtil.decodeBase64(encryptedContent);
    const nonceUint8 = naclUtil.decodeBase64(nonce);
    const senderPublicKeyUint8 = naclUtil.decodeBase64(senderPublicKey);
    const recipientPrivateKeyUint8 = naclUtil.decodeBase64(recipientPrivateKey);
    
    const decrypted = nacl.box.open(
      encryptedUint8,
      nonceUint8,
      senderPublicKeyUint8,
      recipientPrivateKeyUint8
    );
    
    if (!decrypted) {
      throw new Error('Decryption failed - invalid keys or corrupted data');
    }
    
    return naclUtil.encodeUTF8(decrypted);
  } catch (error) {
    throw new Error(`Decryption error: ${error.message}`);
  }
};

// Generate a random nonce
const generateNonce = () => {
  return naclUtil.encodeBase64(nacl.randomBytes(nacl.box.nonceLength));
};

// Hash a password using nacl (for additional security)
const hashPassword = (password, salt) => {
  const passwordUint8 = naclUtil.decodeUTF8(password);
  const saltUint8 = salt ? naclUtil.decodeBase64(salt) : nacl.randomBytes(32);
  
  // Simple hash using nacl.hash (this is SHA-512)
  const combined = new Uint8Array(passwordUint8.length + saltUint8.length);
  combined.set(passwordUint8);
  combined.set(saltUint8, passwordUint8.length);
  
  const hashed = nacl.hash(combined);
  
  return {
    hashedPassword: naclUtil.encodeBase64(hashed),
    salt: naclUtil.encodeBase64(saltUint8)
  };
};

// Verify a password
const verifyPassword = (password, hashedPassword, salt) => {
  try {
    const { hashedPassword: newHash } = hashPassword(password, salt);
    return newHash === hashedPassword;
  } catch (error) {
    return false;
  }
};

// Generate a secure random string for tokens, OTPs, etc.
const generateSecureRandom = (length = 32) => {
  const randomBytes = nacl.randomBytes(length);
  return naclUtil.encodeBase64(randomBytes);
};

// Create a digital signature
const sign = (message, privateKey) => {
  try {
    const messageUint8 = naclUtil.decodeUTF8(message);
    const privateKeyUint8 = naclUtil.decodeBase64(privateKey);
    
    const signature = nacl.sign.detached(messageUint8, privateKeyUint8);
    return naclUtil.encodeBase64(signature);
  } catch (error) {
    throw new Error(`Signing error: ${error.message}`);
  }
};

// Verify a digital signature
const verifySignature = (message, signature, publicKey) => {
  try {
    const messageUint8 = naclUtil.decodeUTF8(message);
    const signatureUint8 = naclUtil.decodeBase64(signature);
    const publicKeyUint8 = naclUtil.decodeBase64(publicKey);
    
    return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
  } catch (error) {
    return false;
  }
};

// Generate signing key pair
const generateSigningKeyPair = () => {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey)
  };
};

// Encrypt file data (for media messages)
const encryptFile = (fileBuffer, recipientPublicKey, senderPrivateKey) => {
  try {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const recipientPublicKeyUint8 = naclUtil.decodeBase64(recipientPublicKey);
    const senderPrivateKeyUint8 = naclUtil.decodeBase64(senderPrivateKey);
    
    const encrypted = nacl.box(
      fileBuffer,
      nonce,
      recipientPublicKeyUint8,
      senderPrivateKeyUint8
    );
    
    if (!encrypted) {
      throw new Error('File encryption failed');
    }
    
    return {
      encryptedContent: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce)
    };
  } catch (error) {
    throw new Error(`File encryption error: ${error.message}`);
  }
};

// Decrypt file data
const decryptFile = (encryptedContent, nonce, senderPublicKey, recipientPrivateKey) => {
  try {
    const encryptedUint8 = naclUtil.decodeBase64(encryptedContent);
    const nonceUint8 = naclUtil.decodeBase64(nonce);
    const senderPublicKeyUint8 = naclUtil.decodeBase64(senderPublicKey);
    const recipientPrivateKeyUint8 = naclUtil.decodeBase64(recipientPrivateKey);
    
    const decrypted = nacl.box.open(
      encryptedUint8,
      nonceUint8,
      senderPublicKeyUint8,
      recipientPrivateKeyUint8
    );
    
    if (!decrypted) {
      throw new Error('File decryption failed');
    }
    
    return Buffer.from(decrypted);
  } catch (error) {
    throw new Error(`File decryption error: ${error.message}`);
  }
};

module.exports = {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  generateNonce,
  hashPassword,
  verifyPassword,
  generateSecureRandom,
  sign,
  verifySignature,
  generateSigningKeyPair,
  encryptFile,
  decryptFile
};