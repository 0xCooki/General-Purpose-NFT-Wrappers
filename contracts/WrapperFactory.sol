// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

import "hardhat/console.sol";

//we want this to be a factory that produces wrapper NFT contracts using create2
//Charge a small fee (0.001 eth) to wrap

//Should be built to specifically route around Opensea's contract
//the way to do that is to make it so that the wrapped contract is the operator for minting/burning nfts
//this way there will be a new operator for each collection, and if the collection is wrapable then there's 
//an infinite number of potential contracts

//so the wrapper contract is the factor for creating them, anyone can create the wrapper for anyone else

//Each contract needs to be created to a collection, so that they can be identified
//Wrapped NFTs should also be wrappable, so that there infinitely extendable - wrwrwrBoredApe#1990 etc.
contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    constructor() {
        
    }

    //so I'm going to need an array of bytes - the unique bytecodes of the contracts (is this gas crazy?)
    //Maybe I don't need to store them, but at least re-construct them
    //an array of salts? - Ditto
    //An array of address, certainly

    address[] public addresses;
    bytes[] public bytecodes;
    uint256[] public salts;

    function getAddress(uint256 index) external view returns (address) {
        return addresses[index];
    }

    function createClonedContract(uint256 _salt) public returns (address) {
    
        //salts.push(_salt);
        //bytecodes.push(_initCode);
        //addresses.push(contractAddress);

        // Return the address of the newly created contract
        return address(new ERC721Wrapper{salt: bytes32(_salt)}());
    }





    function getERC721WrapperBytecode() public pure returns (bytes memory) {
        bytes memory bytecode = type(ERC721Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode());
    }

    function getERC1155WrapperBytecode() public pure returns (bytes memory) {
        bytes memory bytecode = type(ERC1155Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode());
    }

    function getERC721WrapperAddress(uint _salt) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC721WrapperBytecode()))
        );

        return address(uint160(uint(hash)));
    }

    function getERC1155WrapperAddress(uint _salt) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC1155WrapperBytecode()))
        );

        return address(uint160(uint(hash)));
    }
}