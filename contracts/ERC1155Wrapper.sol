// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";

/// @title  ERC1155 Wrapper
/// @author Cooki.eth
/// @notice This contract is a generalised ERC1155 wrapper that has been generated using the Wrapper Factory.
///         Users can send the NFT that this wrapper wraps to the contract using either the wrap function,
///         or via a safeTransfer. Equally, unwrapping is facilitated by using the unwrap function or 
///         safeTransfering the wrapped NFT back to this contract. While this wrapper wraps ERC1155 tokens it
///         is itself an ERC721 contract, which is intended to only wrap NFTs. Those looking to wrap fungible
///         tokens will unfortunately have to go elsewhere. This wrapper does not maintain consistency of token
///         ids between the base and wrapped NFT. Meaning that the token id of a wrapped NFT does not correspond
///         to the token id of the NFT that it is wrapping. Finally, any ETH sent to this contract is automatically
///         relayed to the Wrapper Factory, and retrievable only by the Wrapper Factory owner.
contract ERC1155Wrapper is ERC721, ReentrancyGuard, IERC1155Receiver, IERC721Receiver {
    using SafeMath for uint256;

    /////////////
    //Variables//
    /////////////

    /// @notice The address of the base NFT that this wrapper wraps.
    IERC1155MetadataURI public immutable baseContract;
    
    /// @notice The wrapper factory address.
    address public immutable wrapperFactory;

    /// @notice The number of wrappers created using this contract.
    uint256 public nonce;

    /// @notice A mapping from the wrapper token id of this contract to the token id of the underlying wrapped
    ///         NFT.
    mapping (uint256 => uint256) public ERC721IdToERC1155Id;
    
    /// @notice A mapping from the token id of the ERC1155 base NFT to a set of wrapper token ids held by this
    ///         contract.
    mapping (uint256 => uint256[]) public spareWrapperIdsForERC1155Id;

    //////////
    //Events//
    //////////

    /// @notice An event detailing the ERC1155 token id and address wrapping an NFT using this contract.
    event Wrapped(uint256 indexed _tokenId, address indexed _wrapper);
    
    /// @notice An event detailing the ERC1155 token id and address unwrapping an NFT using this contract.
    event Unwrapped(uint256 indexed _tokenId, address indexed _unwrapper);

    ///////////////
    //Constructor//
    ///////////////

    constructor(IERC1155MetadataURI _contract, address _factory) 
        ERC721(
            string.concat("Wrapped ERC1155: ", Strings.toHexString(address(_contract))),
            string.concat("wrERC1155: ", Strings.toHexString(address(_contract)))
        ) {
        baseContract = _contract;
        wrapperFactory = _factory;
    }

    /////////////////////
    //Primary Functions//
    /////////////////////

    /// @notice This function allows users to wrap an NFT using this contract.
    /// @param _erc1155Id The ERC1155 token id of the NFT to be wrapped.
    function wrap(uint256 _erc1155Id) external {
        require(
            baseContract.isApprovedForAll(_msgSender(), address(this)),
            "ERC1155Wrapper: Wrapper has not been approved to transfer the NFT."
        );

        baseContract.safeTransferFrom(_msgSender(), address(this), _erc1155Id, 1, "0x");
    }

    /// @notice This function allows users to unwrap an NFT using this contract.
    /// @param _erc721Id The ERC721 token id of the NFT to be unwrapped.
    function unwrap(uint256 _erc721Id) external {
        require(_active(_erc721Id), "ERC1155Wrapper: The NFT has not been wrapped yet.");
        
        safeTransferFrom(_msgSender(), address(this), _erc721Id);
    }

    ///////////////////////
    //Secondary Functions//
    ///////////////////////

    function _wrap(address _reciever, uint256 _erc1155Id) internal nonReentrant {
        if (!_haveSpareWrapper(_erc1155Id)) {
            ERC721IdToERC1155Id[nonce] = _erc1155Id;

            _safeMint(_reciever, nonce);

            nonce++;
        } else {
            this.safeTransferFrom(address(this), _reciever, spareWrapperIdsForERC1155Id[_erc1155Id][0]);

            spareWrapperIdsForERC1155Id[_erc1155Id][0] = spareWrapperIdsForERC1155Id[_erc1155Id][spareWrapperIdsForERC1155Id[_erc1155Id].length - 1];

            spareWrapperIdsForERC1155Id[_erc1155Id].pop();
        }

        emit Wrapped(_erc1155Id, _reciever);
    }

    function _unwrap(address _reciever, uint256 _erc721Id) internal nonReentrant {
        baseContract.safeTransferFrom(address(this), _reciever, ERC721IdToERC1155Id[_erc721Id], 1, "0x");

        spareWrapperIdsForERC1155Id[ERC721IdToERC1155Id[_erc721Id]].push(_erc721Id);
        
        emit Unwrapped(ERC721IdToERC1155Id[_erc721Id], _reciever);
    }

    function _haveSpareWrapper(uint256 _erc1155Id) internal view virtual returns (bool) {
        if (spareWrapperIdsForERC1155Id[_erc1155Id].length > 0) {
            return true;
        } else {
            return false;
        }
    }

    function _active(uint256 _erc721Id) internal view virtual returns (bool) {
        if ((_ownerOf(_erc721Id) == address(0)) || (_ownerOf(_erc721Id) == address(this))) {
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
        require(success, "ERC1155Wrapper: Transfer to factory failed.");
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
            "ERC1155Wrapper: transfer to Wrapper failed."
        );

        require(
            receivedCollection == IERC721Metadata(address(this)),
            "ERC1155Wrapper: may only transfer wrapped NFT."
        );

        _unwrap(from, tokenId);

        return this.onERC721Received.selector;
    }

    function onERC1155Received(
        address,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata
    ) external override returns (bytes4) {
        IERC1155MetadataURI receivedCollection = IERC1155MetadataURI(msg.sender);

        require(
            receivedCollection.balanceOf(address(this), id) >= value,
            "ERC1155Wrapper: transfer to Wrapper failed."
        );

        require(
            receivedCollection == baseContract,
            "ERC1155Wrapper: may only transfer base NFT."
        );

        for (uint256 i = 0; i < value; i++) {
            _wrap(from, id);
        }

        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) external override returns (bytes4) {
        IERC1155MetadataURI receivedCollection = IERC1155MetadataURI(msg.sender);

        require(
            receivedCollection == baseContract,
            "ERC1155Wrapper: may only transfer base NFT."
        );

        for (uint256 i = 0; i < ids.length; i++) {
            require(
                receivedCollection.balanceOf(address(this), ids[i]) >= values[i],
                "ERC1155Wrapper: transfer to Wrapper failed."
            );

            for (uint256 j = 0; j < values[i]; j++) {
                _wrap(from, ids[i]);
            }
        }

        return this.onERC1155BatchReceived.selector;
    }

    ////////////////////
    //ERC721 Overrides//
    ////////////////////

    /// @notice This function allows the base NFT metadata to be retrievable by the wrapper NFT contract.
    /// @param _erc721Id The ERC721 token id of the wrapper NFT.
    function tokenURI(uint256 _erc721Id) public view override returns (string memory) {
        return baseContract.uri(ERC721IdToERC1155Id[_erc721Id]);
    }
}