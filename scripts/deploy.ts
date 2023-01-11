const {ethers} = require('hardhat');

async function main() {
  // Grab the contract factory
  const CollectionManager = await ethers.getContractFactory("CollectionManager");

  // Start deployment, returning a promise that resolves to a contract object
  const collectionManager = await CollectionManager.deploy(); // Instance of the contract
  console.log("Contract deployed to address:", collectionManager.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });