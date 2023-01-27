import dotenv from 'dotenv'
import {ethers} from 'hardhat'
import {
  CollectionHelpersFactory,
  UniqueRefungibleFactory,
  UniqueRefungibleTokenFactory,
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

  // create a new collection
  let newCollection = await (
    await collectionHelpers.createRFTCollection(
      'My new RFT collection',
      'This RFT collection is for testing purposes',
      'RFC',
      {
        value: await collectionHelpers.collectionCreationFee(),
      }
    )
  ).wait()

  const collectionAddressRFT = newCollection.events?.[0].args?.collectionId as string
  const collectionIdRFT = Address.collection.addressToId(collectionAddressRFT)

  console.log(`RFT collection created! Address: ${collectionAddressRFT} , id: ${collectionIdRFT}`)

  const collectionRFT = await UniqueRefungibleFactory(collectionIdRFT, wallet, ethers)

  const txMintRFTToken = await (await collectionRFT.mint(wallet.address)).wait()

  const tokenIdRFT = Number(Ethereum.parseEthersTxReceipt(txMintRFTToken).events.Transfer.tokenId)

  console.log(`RFT token minted. Id: ${tokenIdRFT}`)

  const rftFactory = await UniqueRefungibleTokenFactory(
    {
      collectionId: collectionIdRFT,
      tokenId: tokenIdRFT,
    },
    wallet,
    ethers
  )

  const txRepart = await (await rftFactory.repartition(10n)).wait()

  console.log(`${Ethereum.parseEthersTxReceipt(txRepart).events.Transfer.value} new pieces were created. 
  One piece remained on the original place.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
