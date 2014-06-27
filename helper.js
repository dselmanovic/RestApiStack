var CryptoJS = require('node-cryptojs-aes').CryptoJS;

var helper={
    connString:"postgres://postgres:password@server/database",
    cryptoKey:"123456789012345678901234567890",
    encrypt:function(input, key){
        var retVal=CryptoJS.AES.encrypt(input, key).toString();
        return retVal;
    },
    decrypt:function(input, key){
        var decrypted = CryptoJS.AES.decrypt(input, key);
        var retVal=CryptoJS.enc.Utf8.stringify(decrypted);
        return retVal;
    }
}

module.exports=helper;
