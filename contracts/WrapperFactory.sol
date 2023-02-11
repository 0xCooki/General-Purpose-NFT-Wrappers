// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";

//import {Fibonacci} from "./FibonacciLibrary.sol";

import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

import "hardhat/console.sol";

//It's a sort of registry
//so it needs to hold the nft contract addresses wrapped, the new addresses and or the associated salt to derive it

contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public nonce;

    //baseNFT => set of wrapper addresses
    mapping(address => address[]) public wrapperContracts;

    constructor() {
    }

    /////////////////////
    //Primary Functions//
    /////////////////////
    
    //Charging a fee actually helps to reduce spam
    //it could also scale with the number of duplicates or iterations that exist
    function CreateERC721Wrapper(IERC721Metadata _contract) external payable nonReentrant {
        uint256 price = _getWrapPrice(address(_contract));
        require(msg.value >= price, "Wrapper Factory: Insufficient fee paid"); 

        address newContract = address(new ERC721Wrapper{salt: bytes32(nonce)}(_contract, address(this)));

        wrapperContracts[address(_contract)].push(newContract);

        nonce++;
    }

    function CreateERC1155Wrapper(IERC1155MetadataURI _contract) external payable nonReentrant {
        uint256 price = _getWrapPrice(address(_contract));
        require(msg.value >= price, "Wrapper Factory: Insufficient fee paid");

        address newContract = address(new ERC1155Wrapper{salt: bytes32(nonce)}(_contract, address(this)));

        wrapperContracts[address(_contract)].push(newContract);

        nonce++;
    }


    //I can probs remove the salt variable and find it
    function getERC721WrapperAddress(IERC721Metadata _contract, uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(_getERC721WrapperBytecode(_contract)))
        );

        return address(uint160(uint(hash)));
    }

    function getERC1155WrapperAddress(IERC1155MetadataURI _contract, uint _salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(_getERC1155WrapperBytecode(_contract)))
        );

        return address(uint160(uint(hash)));
    }

    ////////////////////////
    //Receive and Withdraw//
    ////////////////////////

    receive() external payable {}

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "Wrapper Factory: Nothing to withdraw");

        (bool success, ) = (owner()).call{value: address(this).balance }("");
        require(success, "Wrapper Factory: Transfer to the owner failed.");
    }

    ///////////////////////
    //Secondary Functions//
    ///////////////////////

    function _getERC721WrapperBytecode(IERC721Metadata _contract) internal view returns (bytes memory) {
        bytes memory bytecode = type(ERC721Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode(_contract, address(this)));
    }

    function _getERC1155WrapperBytecode(IERC1155MetadataURI _contract) internal view returns (bytes memory) {
        bytes memory bytecode = type(ERC1155Wrapper).creationCode;

        return abi.encodePacked(bytecode, abi.encode(_contract, address(this)));
    }

    function _getWrapPrice(address _contract) internal view returns (uint256) {
        uint256 lengthOfWrapperContractsMapping = wrapperContracts[_contract].length;

        uint256 fibBase = _fib(lengthOfWrapperContractsMapping + 1);

        uint256 price = fibBase * 1e16 wei;

        return price;
    }

    function _fib(uint256 n) internal pure returns (uint256) {
        if (n == 0) {
            return 0;
        }
        uint256 fi_1 = 1;
        uint256 fi_2 = 1;
        for (uint256 i = 2; i < n; i++) {
            uint256 fi = fi_1 + fi_2;
            fi_2 = fi_1;
            fi_1 = fi;
        }
        return fi_1;
    }
}
