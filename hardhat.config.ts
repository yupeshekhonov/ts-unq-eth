import dotenv from 'dotenv'
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
dotenv.config()
const { RPC_OPAL, RPC_UNQ, PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
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
    }
  }
};

export default config;
