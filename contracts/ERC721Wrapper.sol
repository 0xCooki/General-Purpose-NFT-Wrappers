// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "hardhat/console.sol";

contract ERC721Wrapper is ERC721, IERC721Receiver, ReentrancyGuard {
    using SafeMath for uint256;

    IERC721Metadata public immutable baseContract;
    
    address public immutable wrapperFactory;

    constructor(IERC721Metadata _contract, address _factory)
        ERC721(
            string.concat("Wrapped ", _contract.name()),
            string.concat("wr", _contract.symbol())
        ) {
        baseContract = _contract;
        wrapperFactory = _factory;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return baseContract.tokenURI(_tokenId);
    }

    function wrap(uint256 _tokenId) external {
        require(
            baseContract.getApproved(_tokenId) == address(this) || 
            baseContract.isApprovedForAll(_msgSender(), address(this)),
            "ERC721Wrapper: Wrapper has not been approved to transfer the NFT."
        );

        baseContract.safeTransferFrom(
                    _msgSender(),
                    address(this),
                    _tokenId
                );
    }

    //Might have to override the exists function? seems strange to say the NFT exists if it's been unwrapped
    //But is just sitting in the Wrapper contract

    function unWrap(uint256 _tokenId) external {
        require(_exists(_tokenId), "ERC721Wrapper: The NFT has not been wrapped yet.");

        safeTransferFrom(_msgSender(), address(this), _tokenId);
    }

    receive() external payable {
        uint256 balance = address(this).balance;

        if (balance > 0) {
            (bool success, ) = (wrapperFactory).call{value: balance}("");
            require(success, "ERC721Wrapper: Transfer to factory failed.");
        }
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

    function _wrap(address _reciever, uint256 _tokenId) internal nonReentrant {
        if (!_exists(_tokenId)) {
            _safeMint(_reciever, _tokenId);
        } else {
            safeTransferFrom(address(this), _reciever, _tokenId);
        }

        //emit event
    }

    function _unwrap(address _reciever, uint256 _tokenId) internal nonReentrant {
        baseContract.safeTransferFrom(address(this), _reciever, _tokenId);
        
        //emit event
    }
}