function encodeXOR(text, key) {
  const arr = [];
  for (let i = 0; i < text.length; i++) {
    arr.push(text.charCodeAt(i) ^ key[i % key.length]);
  }
  return '[' + arr.join(', ') + ']';
}

const key = [0xDE, 0xAD, 0xBE, 0xEF];
console.log('Token encoded:', encodeXOR('8779079298:AAEqfmoDLAz7j69kKAlXJ10Ze5flfoF77bw', key));
console.log('Chat ID encoded:', encodeXOR('8585803145', key));