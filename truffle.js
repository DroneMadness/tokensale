
var HDWalletProvider = require("truffle-hdwallet-provider");
var wallet = JSON.parse(require('fs').readFileSync('./wallet.json'));
const defaultGas = 4e6;
const defaultGasPrice = 12e9;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      gas: defaultGas,
      gasPrice: defaultGasPrice,
      network_id: "*"
    },
    ropsten:{
      provider: function() {
        return new HDWalletProvider(wallet.mnemonic, "https://ropsten.infura.io/" + wallet.infuraKey, wallet.addressIndex)
      },
      network_id: 3,
      gas: defaultGas,
      gasPrice: defaultGasPrice
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(wallet.mnemonic, "https://rinkeby.infura.io/" + wallet.infuraKey, wallet.addressIndex)
      },
      network_id: 4,
      gas: defaultGas,
      gasPrice: defaultGasPrice
    },
    main: {
      provider: function() {
        return new HDWalletProvider(wallet.mnemonic, "https://mainnet.infura.io/" + wallet.infuraKey, wallet.addressIndex)
      },
      network_id: 1,
      gas: defaultGas,
      gasPrice: defaultGasPrice
    }   
  },  
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};