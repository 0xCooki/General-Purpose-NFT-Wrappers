// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";

import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

import "hardhat/console.sol";

contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public nonce;

    constructor() {
    }
    
    //Charging a fee actually helps to reduce spam
    //it could also scale with the number of duplicates or iterations that exist
    //Make it exponential with the paradigm shit
    function CreateERC721Wrapper(IERC721Metadata _contract) external payable nonReentrant {
        address newContract = address(new ERC721Wrapper{salt: bytes32(nonce)}(_contract, address(this)));

        nonce++;
    }

    function CreateERC1155Wrapper(IERC1155MetadataURI _contract) external payable nonReentrant {
        address newContract = address(new ERC1155Wrapper{salt: bytes32(nonce)}(_contract, address(this)));

        nonce++;
    }

    function getERC721WrapperAddress(IERC721Metadata _contract, uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC721WrapperBytecode(_contract)))
        );

        return address(uint160(uint(hash)));
    }

    function getERC1155WrapperAddress(IERC1155MetadataURI _contract, uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(getERC1155WrapperBytecode(_contract)))
        );

        return address(uint160(uint(hash)));
    }

    function getERC721WrapperBytecode(IERC721Metadata _contract) internal view returns (bytes memory) {
        bytes memory bytecode = type(ERC721Wrapper).creationCode;

        //if the contracts have constructor variables put them in the abi.encode()
        return abi.encodePacked(bytecode, abi.encode(_contract, address(this)));
    }

    
    function getERC1155WrapperBytecode(IERC1155MetadataURI _contract) internal view returns (bytes memory) {
        bytes memory bytecode = type(ERC1155Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode(_contract, address(this)));
    }

   receive() external payable {}
}