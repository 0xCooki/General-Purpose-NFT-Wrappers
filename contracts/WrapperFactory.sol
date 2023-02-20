// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    //baseNFT => set of wrapper addresses
    mapping(address => address[]) public wrapperContracts;

    //////////
    //Events//
    //////////

    event ERC721WrapperCreated(address indexed _baseNFT, address indexed _wrapperNFT, address indexed _creator);

    event ERC1155WrapperCreated(address indexed _baseNFT, address indexed _wrapperNFT, address indexed _creator);

    ///////////////
    //Constructor//
    ///////////////

    constructor(address _owner) {
        _transferOwnership(_owner);
    }

    /////////////////////
    //Primary Functions//
    /////////////////////
    
    function CreateERC721Wrapper(IERC721Metadata _contract) external payable nonReentrant {
        require(msg.value >= _getWrapPrice(address(_contract)), "Wrapper Factory: Insufficient fee paid"); 

        address newContract = address(new ERC721Wrapper(_contract, address(this)));

        wrapperContracts[address(_contract)].push(newContract);

        emit ERC721WrapperCreated(address(_contract), newContract, msg.sender);
    }

    function CreateERC1155Wrapper(IERC1155MetadataURI _contract) external payable nonReentrant {
        require(msg.value >= _getWrapPrice(address(_contract)), "Wrapper Factory: Insufficient fee paid");

        address newContract = address(new ERC1155Wrapper(_contract, address(this)));
        
        wrapperContracts[address(_contract)].push(newContract);

        emit ERC1155WrapperCreated(address(_contract), newContract, msg.sender);
    }

    ////////////////////
    //Getter Functions//
    ////////////////////

    function getERC721WrapperAddress(IERC721Metadata _contract, uint256 _version) external view returns (address) {
        require(_version < wrapperContracts[address(_contract)].length, "Wrapper Factory: Wrapper version doesn't exist");

        return wrapperContracts[address(_contract)][_version];
    }

    function getERC1155WrapperAddress(IERC1155MetadataURI _contract, uint256 _version) external view returns (address) {
        require(_version < wrapperContracts[address(_contract)].length, "Wrapper Factory: Wrapper version doesn't exist");

        return wrapperContracts[address(_contract)][_version];
    }

    ///////////////////////
    //Secondary Functions//
    ///////////////////////

    function _getWrapPrice(address _contract) internal view returns (uint256) {
        uint256 price = _fib(wrapperContracts[_contract].length + 2) * 1e16 wei;
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

    ////////////////////////
    //Receive and Withdraw//
    ////////////////////////

    receive() external payable {}

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "Wrapper Factory: Nothing to withdraw.");

        (bool success, ) = (owner()).call{value: address(this).balance }("");
        require(success, "Wrapper Factory: Transfer to the owner failed.");
    }
}