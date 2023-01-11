import dotenv from 'dotenv'
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
dotenv.config()
const { RPC_UNQ_RC, RPC_OPAL, RPC_UNQ, PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
      viaIR : true,
    },
  },
  // defaultNetwork: "unq",
  networks: {
    hardhat: {},
    opal: {
      url: RPC_OPAL,
      accounts: [`${PRIVATE_KEY}`]
    },
    unq: {
      url: RPC_UNQ,
      accounts: [`${PRIVATE_KEY}`]
    },
    unqrc: {
      url: RPC_UNQ_RC,
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};

export default config;
