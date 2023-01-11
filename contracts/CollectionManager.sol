// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import {CollectionHelpers, CollectionHelpersEvents} from  "@unique-nft/solidity-interfaces/contracts/CollectionHelpers.sol";
import {UniqueNFT, CrossAddress} from "@unique-nft/solidity-interfaces/contracts/UniqueNFT.sol";

contract CollectionManager is CollectionHelpersEvents {
    CollectionHelpers helpers = CollectionHelpers(0x6C4E9fE1AE37a41E93CEE429e8E1881aBdcbb54F);

    function createCollection(
        address owner,
        address managerContract,
        string calldata name,
        string calldata description,
        string calldata symbol,
        string calldata baseURI
    ) public payable virtual returns (address){
        address collectionAddress = helpers.createNFTCollection{value: helpers.collectionCreationFee()}(name, description, symbol);

        helpers.makeCollectionERC721MetadataCompatible(collectionAddress, baseURI);

        UniqueNFT collection = UniqueNFT(collectionAddress);

        collection.addCollectionAdminCross(CrossAddress(managerContract, 0));
        collection.changeCollectionOwnerCross(CrossAddress(owner, 0));

        return collectionAddress;
    }
}