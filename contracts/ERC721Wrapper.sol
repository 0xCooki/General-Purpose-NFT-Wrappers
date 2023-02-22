// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title  ERC721 Wrapper
/// @author Cooki.eth
/// @notice This contract is a generalised ERC721 wrapper that has been generated using the Wrapper Factory.
///         Users can send the NFT that this wrapper wraps to the contract using either the wrap function,
///         or via a safeTransfer. Equally, unwrapping is facilitated by using the unwrap function or 
///         safeTransfering the wrapped NFT back to this contract. This wrapper maintains consistency of token
///         ids between the base and wrapped NFT. Meaning that the token id of a wrapped NFT always corresponds
///         to the token id of the NFT that it is wrapping. Finally, any ETH sent to this contract is automatically
///         relayed to the Wrapper Factory, and retrievable only by the Wrapper Factory owner.
contract ERC721Wrapper is ERC721, IERC721Receiver, ReentrancyGuard {
    using SafeMath for uint256;

    //////////////
    //Immutables//
    //////////////

    /// @notice The address of the base NFT that this wrapper wraps.
    IERC721Metadata public immutable baseContract;
    
    /// @notice The wrapper factory address.
    address public immutable wrapperFactory;

    //////////
    //Events//
    //////////

    /// @notice An event detailing the token id and address wrapping an NFT using this contract.
    event Wrapped(uint256 indexed _tokenId, address indexed _wrapper);

    /// @notice An event detailing the token id and address unwrapping an NFT using this contract.
    event Unwrapped(uint256 indexed _tokenId, address indexed _unwrapper);

    ///////////////
    //Constructor//
    ///////////////

    constructor(IERC721Metadata _contract, address _factory)
        ERC721(
            string.concat("Wrapped ", _contract.name()),
            string.concat("wr", _contract.symbol())
        ) {
        baseContract = _contract;
        wrapperFactory = _factory;
    }

    /////////////////////
    //Primary Functions//
    /////////////////////

    /// @notice This function allows users to wrap an NFT using this contract.
    /// @param _tokenId The token id of the NFT to be wrapped.
    function wrap(uint256 _tokenId) external {
        require(
            baseContract.getApproved(_tokenId) == address(this) || 
            baseContract.isApprovedForAll(_msgSender(), address(this)),
            "ERC721Wrapper: Wrapper has not been approved to transfer the NFT."
        );

        baseContract.safeTransferFrom(_msgSender(), address(this), _tokenId);
    }

    /// @notice This function allows users to unwrap an NFT using this contract.
    /// @param _tokenId The token id of the NFT to be unwrapped.
    function unwrap(uint256 _tokenId) external {
        require(_active(_tokenId), "ERC721Wrapper: The NFT has not been wrapped yet.");
        
        safeTransferFrom(_msgSender(), address(this), _tokenId);
    }

    ///////////////////////
    //Secondary Functions//
    ///////////////////////

    function _wrap(address _reciever, uint256 _tokenId) internal nonReentrant {
        require(!_active(_tokenId), "ERC721Wrapper: The NFT has already been wrapped.");

        if (_ownerOf(_tokenId) == address(0)) {
            _safeMint(_reciever, _tokenId);
        } else {
            this.safeTransferFrom(address(this), _reciever, _tokenId);
        }

        emit Wrapped(_tokenId, _reciever);
    }

    function _unwrap(address _reciever, uint256 _tokenId) internal nonReentrant {
        baseContract.safeTransferFrom(address(this), _reciever, _tokenId);
        
        emit Unwrapped(_tokenId, _reciever);
    }

    function _active(uint256 tokenId) internal view virtual returns (bool) {
        if ((_ownerOf(tokenId) == address(0)) || (_ownerOf(tokenId) == address(this))) {
            return false;
        } else {
            return true;
        }
    }

    /////////////////////
    //Recieve Functions//
    /////////////////////

    receive() external payable {
        (bool success, ) = (wrapperFactory).call{value: address(this).balance }("");
        require(success, "ERC721Wrapper: Transfer to factory failed.");
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        IERC721Metadata receivedCollection = IERC721Metadata(msg.sender);

        require(
            receivedCollection.ownerOf(tokenId) == address(this),
            "ERC721Wrapper: transfer to Wrapper failed."
        );

        require(
            receivedCollection == baseContract ||
            receivedCollection == IERC721Metadata(address(this)),
            "ERC721Wrapper: may only transfer wrapped or base NFT."
        );

        if (receivedCollection == baseContract) {
            _wrap(from, tokenId);
        } else {
            _unwrap(from, tokenId);
        }

        return this.onERC721Received.selector;
    }

    ////////////////////
    //ERC721 Overrides//
    ////////////////////

    /// @notice This function allows the base NFT metadata to be retrievable by the wrapper NFT contract.
    /// @param _tokenId The token id of the wrapped NFT.
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return baseContract.tokenURI(_tokenId);
    }
}