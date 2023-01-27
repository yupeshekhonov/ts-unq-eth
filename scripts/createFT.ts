import dotenv from 'dotenv'
import {ethers} from 'hardhat'
import {
  CollectionHelpersFactory, 
  UniqueFungibleFactory
} from '@unique-nft/solidity-interfaces'
import {Ethereum} from '@unique-nft/utils/extension'
import {Address} from '@unique-nft/utils'

dotenv.config()

async function main() {
  // define a provider
  const provider = ethers.provider
  // Create a signer
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) throw new Error('Missing private key')
  const wallet = new ethers.Wallet(privateKey, provider)

  const collectionHelpers = await CollectionHelpersFactory(wallet, ethers)

// create a fungible collection
  const newFTcollection = await (await collectionHelpers.createFTCollection(
    'My new FT collection', 
    10, // decimals
    'This FT collection is for testing purposes', 
    'FC', 
    {
      gasLimit: 10_000_000,
      value: await collectionHelpers.collectionCreationFee(),
    }
  )).wait()
  const collectionAddressFT = Ethereum.parseEthersTxReceipt(newFTcollection).events.CollectionCreated.collectionId
  const collectionIdFT = Address.collection.addressToId(collectionAddressFT)

  console.log(`FT collection created! Address: ${collectionAddressFT}, id: ${collectionIdFT}`)

  // mint fungible tokens 
  const collectionFT = await UniqueFungibleFactory(collectionIdFT, wallet, ethers)

  const txMintFT = await (await collectionFT.mint(wallet.address, 50)).wait()
  console.log(Ethereum.parseEthersTxReceipt(txMintFT).events.Transfer.value.toString(),
   'fungible tokens were minted.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})