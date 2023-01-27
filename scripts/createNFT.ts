import dotenv from 'dotenv'
import {ethers} from 'hardhat'
import {CollectionHelpersFactory, UniqueNFTFactory} from '@unique-nft/solidity-interfaces'
import {Ethereum} from '@unique-nft/utils/extension'
import {Address, StringUtils} from '@unique-nft/utils'

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

  if (!privateKey) 
    throw new Error('Missing private key')
  const wallet = new ethers.Wallet(privateKey, provider)

  const collectionHelpers = await CollectionHelpersFactory(wallet, ethers)

  // create a new collection
  let newCollection = await (
    await collectionHelpers.createNFTCollection(
      'My NFT collection',
      'This collection is for testing purposes',
      'TC',
      {
        value: await collectionHelpers.collectionCreationFee(),
      }
    )
  ).wait()

  const collectionAddress = newCollection.events?.[0].args?.collectionId as string
  const collectionId = Address.collection.addressToId(collectionAddress)
  console.log(`Collection created!`)
  console.log(`Address: ${collectionAddress} , id: ${collectionId}`)
 
  // Make ERC721Metadata
  const txMake = await (
    await collectionHelpers.makeCollectionERC721MetadataCompatible(
      collectionAddress,
      'https://ipfs.unique.network/ipfs/'
    )
  ).wait()

  console.log('The ERC721Metadata flag was set to true.')

  const collection = await UniqueNFTFactory(collectionId, wallet, ethers)
  
  // Enable collection sponsoring. For this, we will need second account 
  const privateKeySecondary = process.env.PRIVATE_KEY_SECONDARY
  if (!privateKeySecondary) 
    throw new Error('Missing private key')
  const walletConfirm = new ethers.Wallet(privateKeySecondary, provider)
  const collectionConfirm = await UniqueNFTFactory(collectionId, walletConfirm, ethers)
  // --------
  const txSponsor = await (await collection.setCollectionSponsorCross(
    {
      eth: '0x83E02d8ab05913bA7b5A76fA828A95E5118255E8',
      // 5FA2ZHVRh9am6g8z4TyEdqkSjePZ5WJb5YewFEW21E4REZqd - mirror from Secondary Metamask
      sub: 0n,
    },
  )).wait()

  const txConfirm = await (await collectionConfirm.confirmCollectionSponsorship({
    gasLimit: 10_000_000,
  })).wait()
  // console.log(txConfirm)
  
  const currentSponsor = await collectionConfirm.collectionSponsor()
  console.log(`Sponsor was set. The current sponsor is 0x83E02d8ab05913bA7b5A76fA828A95E5118255E8`)

  // Mint 
  const txMintToken = await (await collection.mint(wallet.address)).wait()

  const tokenId = txMintToken.events?.[0].args?.tokenId.toString()
  const tokenUri = await collection.tokenURI(tokenId)
  console.log(`Successfully minted token #${tokenId}, it's URI is: ${tokenUri}`)
  
  // Mint cross
  const crossMintResult = await ( await collection.mintCross(
    {
      eth: wallet.address,
      sub: 0n,
    },
    [
      {
        key: 'URISuffix',
        value: StringUtils.Utf8.stringToNumberArray(tokenIpfsCids['1']),
      },
    ]
  )).wait()

  const parsedTxReceipt = Ethereum.parseEthersTxReceipt(crossMintResult)
  console.log(`Successfully minted token with cross address. Id: ${parsedTxReceipt.events.Transfer.tokenId.toString()}`)

  // Mint with URI
  const txMintTokenWithURI = await (await  collection.mintWithTokenURI(wallet.address, 'https://ipfs.unique.network/ipfs/' + tokenIpfsCids['1'])).wait()
  const tokenIdWithURI = txMintTokenWithURI.events?.[1].args?.tokenId.toNumber()
  const tokenUriWithURI = await collection.tokenURI(tokenIdWithURI)
  console.log(`Successfully minted token #${tokenIdWithURI}, it's URI is: ${tokenUriWithURI}`)

  // Mint with suffix 
  const txMintTokenWithSuffix = await (await collection.mint(wallet.address)).wait()

  const tokenIdWithSuffix = txMintTokenWithSuffix.events?.[0].args?.tokenId.toString()
  const tokenUriWithSuffix = await collection.tokenURI(tokenIdWithSuffix)
  console.log(`Successfully minted token to set the suffix: #${tokenIdWithSuffix}, it's URI is: ${tokenUriWithSuffix}`)

  const txSetSuffix = await (await collection.setProperties(
    tokenIdWithSuffix,
    [ 
      {
        key: 'URISuffix',
        value: StringUtils.Utf8.stringToNumberArray(tokenIpfsCids['2']),
      },
    ]
  )).wait()

  console.log(`URI suffix was set for token # ${tokenIdWithSuffix}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
