// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {ERC721Wrapper} from "./ERC721Wrapper.sol";
import {ERC1155Wrapper} from "./ERC1155Wrapper.sol";

/// @title  Wrapper Factory
/// @author Cooki.eth
/// @notice This contract is a factory that produces wrappers for both ERC721 and ERC1155 NFTs. Both kinds of
///         wrappers conform to the ERC721 standard, as it is assumed that only NFTs will be wrapped. A pricing 
///         model that employs the Fibonacci sequence has been implemented to discourage multiple wrappers for
///         the same collection. Recursively, however, wrappers can also be wrapped. The generalised NFT wrappers
///         that this factory produces may assist users attempting to avoid smart contract bugs, black-lists,
///         and on-chain royalty mechanisms.
contract WrapperFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /// @notice A mapping from a base NFT address to the set of all wrapper addresses that exist for it.
    mapping(address => address[]) public wrapperContracts;

    //////////
    //Events//
    //////////

    /// @notice An event detailing the base NFT address, new wrapper address, and the creator address that is
    ///         used when creating a new ERC721 NFT wrapper.
    event ERC721WrapperCreated(address indexed _baseNFT, address indexed _wrapperNFT, address indexed _creator);

    /// @notice An event detailing the base NFT address, new wrapper address, and the creator address that is
    ///         used when creating a new ERC1155 NFT wrapper.
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

    /// @notice This function allows anyone to create an ERC721 wrapper of an ERC721 NFT contract.The price
    ///         to create a wrapper begins at 0.01 ETH and follows the Fibonacci sequence depending on the 
    ///         number of wrappers created per base collection. As an example, creating the first collection
    ///         costs 0.01 ETH, the second 0.02, the third 0.03, the fourth 0.05, and so on...
    /// @param _contract The address of the base (i.e. to be wrapped) ERC721 contract.
    function CreateERC721Wrapper(IERC721Metadata _contract) external payable nonReentrant {
        require(msg.value >= _getWrapPrice(address(_contract)), "Wrapper Factory: Insufficient fee paid");

        require(
            _contract.supportsInterface(type(IERC721Metadata).interfaceId), 
            "Wrapper Factory: Base contract doesn't support ERC721 interface"
        );

        address newContract = address(new ERC721Wrapper(_contract, address(this)));

        wrapperContracts[address(_contract)].push(newContract);

        emit ERC721WrapperCreated(address(_contract), newContract, msg.sender);
    }

    /// @notice This function allows anyone to create an ERC721 wrapper of an ERC1155 NFT contract.
    ///         To be clear, the wrapper contract produced will be an ERC721 even though the underlying contract
    ///         that is being wrapped conforms to the ERC1155 standard. The price to create a wrapper begins
    ///         at 0.01 ETH and follows the Fibonacci sequence depending on the number of wrappers created
    ///         per base collection. As an example, creating the first collection costs 0.01 ETH, the second
    ///         0.02, the third 0.03, the fourth 0.05, and so on...
    /// @param _contract The address of the base (i.e. to be wrapped) ERC1155 contract.
    function CreateERC1155Wrapper(IERC1155MetadataURI _contract) external payable nonReentrant {
        require(msg.value >= _getWrapPrice(address(_contract)), "Wrapper Factory: Insufficient fee paid");

        require(
            _contract.supportsInterface(type(IERC1155MetadataURI).interfaceId),
            "Wrapper Factory: Base contract doesn't support ERC1155 interface"
        );

        address newContract = address(new ERC1155Wrapper(_contract, address(this)));
        
        wrapperContracts[address(_contract)].push(newContract);

        emit ERC1155WrapperCreated(address(_contract), newContract, msg.sender);
    }

    ////////////////////
    //Getter Functions//
    ////////////////////

    /// @notice This function allows anyone to retrieve the address of an already created ERC721 wrapper contract.
    /// @param _contract The address of the base (i.e. already wrapped) ERC721 contract.
    /// @param _version  The wrapper version to be identified. Version numbers are ordered chronologically in 
    ///                  accordance with the wrapper contract creation times. Meaning the first wrapper for an NFT
    ///                  collection will be 0, the second will be 1, etc.
    function getERC721WrapperAddress(IERC721Metadata _contract, uint256 _version) external view returns (address) {
        require(
            _version < wrapperContracts[address(_contract)].length, 
            "Wrapper Factory: Wrapper version doesn't exist"
        );

        return wrapperContracts[address(_contract)][_version];
    }

    /// @notice This function allows anyone to retrieve the address of an already created ERC1155 wrapper contract.
    /// @param _contract The address of the base (i.e. already wrapped) ERC155 contract.
    /// @param _version  The wrapper version to be identified. Version numbers are ordered chronologically in 
    ///                  accordance with the wrapper contract creation times. Meaning the first wrapper for an NFT
    ///                  collection will be 0, the second will be 1, etc.
    function getERC1155WrapperAddress(IERC1155MetadataURI _contract, uint256 _version) external view returns (address) {
        require(
            _version < wrapperContracts[address(_contract)].length, 
            "Wrapper Factory: Wrapper version doesn't exist"
        );

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

    /// @notice This function allows the Owner to withdraw any funds sent to either this contract or any wrapper
    ///         contract. Any ETH sent to a wrapper contract will be re-directed to this wrapper factory.
    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "Wrapper Factory: Nothing to withdraw.");

        (bool success, ) = (owner()).call{value: address(this).balance }("");
        require(success, "Wrapper Factory: Transfer to the owner failed.");
    }
}