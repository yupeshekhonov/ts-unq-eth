import dotenv from 'dotenv'
import {ethers} from "hardhat"
import {CollectionHelpersFactory, UniqueNFTFactory} from "@unique-nft/solidity-interfaces"
import {CollectionManager__factory} from '../typechain-types'
import {Address} from "@unique-nft/utils";
import {Sdk} from "@unique-nft/sdk"
import {KeyringProvider} from '@unique-nft/accounts/keyring'
import { uniqueNftSol } from '../typechain-types/@unique-nft/solidity-interfaces/contracts';

dotenv.config()

const tokenIpfsCids = {
  1: 'QmZ8Syn28bEhZJKYeZCxUTM5Ut74ccKKDbQCqk5AuYsEnp',
  2: 'QmZVpSsjvxev3C8Dv4E44fSp8gGMP6aoLMp56HmZi5Wkxh',
  3: 'QmZMo8JDB9isA7k7tr8sFLXYwNJNa51XjJinkLWcc9vnta',
  4: 'QmV7fqfJBozrc7VtaHSd64GvwNYqoQE1QptaysenTJrbpL',
  5: 'QmSK1Zr6u2f2b8VgaFgz9CY1NR3JEyygQPQjJZaAA496Bh',
  6: 'QmafTK2uFRuLyir2zJpLSBMercq2nDfxtSiMWXL1dbqTDn',
  7: 'QmXTMYJ3rKeTCaQ79QQPe2EYcpVFbHr3maqJCPGcUobS4B',
  8: 'QmQa97BYq9se73AztVF4xG52fGSBVB1kZKtAtuhYLHE1NA',
}

async function main() {
// define a provider
  const provider = ethers.provider

  // Create a signer
  const privateKey = process.env.PRIVATE_KEY
  // @ts-ignore
  const wallet = new ethers.Wallet(privateKey, provider)
  const contractAddress = '0xFcD9dC04af91B033834B230A1D8B4CDd7fDfFbb4'

  // @ts-ignore
  const collectionHelpers = await CollectionHelpersFactory(wallet, ethers)

  // Create a contract instance
  const collectionManager = CollectionManager__factory.connect(contractAddress, wallet);
  // const contract = await ethers.getContractFactory('CollectionManager')
  // const deployer = await contract.deploy()
  // const collectionManager = await deployer.deployed()
  console.log(`Contract address found: ${collectionManager.address}`)
/*  const [owner] = await ethers.getSigners()
  console.log(owner.address)
  return*/

  // create a new collection
  let newCollection = await collectionManager.createCollection(
      '0xb4d6A98aa8CD5396069c2818Adf4ae1A0384b43a',
      '0xb4d6A98aa8CD5396069c2818Adf4ae1A0384b43a',
      'My new collection',
      'This collection is for testing purposes',
      'CL',
      'https://ipfs.unique.network/ipfs/',
      {
        value: await collectionHelpers.collectionCreationFee()
      }
  )

  const transactionReceipt = await newCollection.wait()
  const collectionAddress = transactionReceipt.events?.[0].args?.collectionId as string
  const collectionId = Address.collection.addressToId(collectionAddress)
  console.log(`Collection created!`)
  console.log(`Address: ${collectionAddress} , id: ${collectionId}`)


  const sdk = new Sdk({baseUrl:'https://rest.unique.network/opal/v1'})

  const gasPriceResult = await sdk.stateQuery.execute({endpoint: 'rpc', module:'eth', method: 'gasPrice'});
  
  const txMake = await (await collectionHelpers.makeCollectionERC721MetadataCompatible(
    collectionAddress, 
    'https://ipfs.unique.network/ipfs/', 
      {
        gasLimit: 10_000_000,
        gasPrice: gasPriceResult.json,
      }
    )).wait()

  console.log(txMake)
  return

  // mint NFTs
  const collection = await UniqueNFTFactory(collectionAddress, wallet, ethers)
   const txMintToken = await (await collection.mintWithTokenURI(wallet.address, 'https://ipfs.unique.network/ipfs/' + tokenIpfsCids['1'])).wait()
   const tokenId = txMintToken.events?.[1].args?.tokenId.toNumber()
   const tokenUri = await collection.tokenURI(tokenId)
   console.log(`Successfully minted token #${tokenId}, it's URI is: ${tokenUri}`)
  
  const tx = await (await collection.transfer('0x1B7AAcb25894D792601BBE4Ed34E07Ed14Fd31eB', tokenId)).wait()

  console.log(`Token transferred!`)

  /* for (let cid in tokenIpfsCids) {
    const txMintToken = await (await collection.mintWithTokenURI(wallet.address, cid)).wait()
    const tokenId = txMintToken.events?.[0].args?.tokenId.toNumber()
    const tokenUri = await collection.tokenURI(tokenId)
    console.log(`Successfully minted token #${tokenId}, it's URI is: ${tokenUri}`)
  } */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});