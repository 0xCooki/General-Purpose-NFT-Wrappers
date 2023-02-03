// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

import "hardhat/console.sol";

//we want this to be a factory that produces wrapper NFT contracts using create2
//Charge a small fee (0.001 eth) to wrap

//Should be built to specifically route around Opensea's contract
//the way to do that is to make it so that the wrapped contract instance is the operator (address moving the NFTs)
//for minting/burning nfts

//this way there will be a new operator for each collection, and if the collection is wrapable then there's 
//an infinite number of potential contracts

//so the wrapper factory contract is the factor for creating those wrapped NFTs
//anyone can create the wrapper for anyone else

//Each contract needs to be created to a collection, so that they can be identified
//Wrapped NFTs should also be wrappable, so that there infinitely extendable - wrwrwrBoredApe#1990 etc.

//OpenSea also filters by codeHash, so in order to avoid the wrapper code being blocked it needs to be a
//different code hash each time - I *think* a constructor salt variable will do this.

//Maybe add a global pause for all wrapped collections so as to prevent exploits? - later
contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public nonce;

    //struct 

    constructor() {
    }
    
    //Charging a fee actually helps to reduce spam
    //it could also scale with the number of duplicates or iterations that exist
    //Make it exponential with the paradigm shit
    function CreateERC721Wrapper(IERC721Metadata _contract) external payable nonReentrant {
        address newContract = address(new ERC721Wrapper{salt: bytes32(nonce)}(_contract, address(this)));

        nonce++;
    }





    //if the contracts have constructor variables put them in the abi.encode()

    function getERC721WrapperBytecode(IERC721Metadata _contract) internal view returns (bytes memory) {
        bytes memory bytecode = type(ERC721Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode(_contract, address(this)));
    }

    /*
    function getERC1155WrapperBytecode() internal pure returns (bytes memory) {
        bytes memory bytecode = type(ERC1155Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode());
    }
    */

    function getERC721WrapperAddress(IERC721Metadata _contract, uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC721WrapperBytecode(_contract)))
        );

        return address(uint160(uint(hash)));
    }

    /*
    function getERC1155WrapperAddress(uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC1155WrapperBytecode()))
        );

        return address(uint160(uint(hash)));
    }
    */
}