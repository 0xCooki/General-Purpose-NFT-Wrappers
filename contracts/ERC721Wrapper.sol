// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721Wrapper is ERC721, IERC721Receiver, ReentrancyGuard {
    using SafeMath for uint256;

    IERC721Metadata public immutable baseContract;

    constructor(IERC721Metadata _contract)
        ERC721(
            string.concat("Wrapped ", _contract.name()),
            string.concat("wr", _contract.symbol())
        ) {
        baseContract = _contract;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return baseContract.tokenURI(_tokenId);
    }

    function wrap(uint256 _tokenId) external nonReentrant {
        require(
            baseContract.getApproved(_tokenId) == address(this) || 
            baseContract.isApprovedForAll(_msgSender(), address(this)),
            "ERC721Wrapper: Wrapper has not been approved to transfer the NFT"
        );

        baseContract.safeTransferFrom(
                    _msgSender(),
                    address(this),
                    _tokenId
                );
    }

    function unWrap(uint256 _tokenId) external nonReentrant {

        //Burn   
    }

    //Put in something to send it to the factory
    receive() external payable {}

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
            
            //unwrap
        }

        return this.onERC721Received.selector;
    }

    //Might be doubling up on reentrancy guards here
    function _wrap(address _reciever, uint256 _tokenId) internal nonReentrant {

        //need to accomodate wrap, then unwrap, then re-wrap

        _safeMint(_reciever, _tokenId);

        //emit event
    }

    function _unwrap() internal nonReentrant {
        //does the contract just hold the husks?
    }
}