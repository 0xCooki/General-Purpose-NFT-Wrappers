// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Wrapper is ERC721, IERC721Receiver, ReentrancyGuard {
    using SafeMath for uint256;

    ERC721 public baseContract;

    constructor(ERC721 _contract) 
        ERC721(
            string.concat("Wrapped ", _contract.name()),
            string.concat("wr", _contract.symbol())
        ) {
        baseContract = _contract;
    }

    function Wrap(uint256 _tokenId) external nonReentrant {
        require(
            baseContract.getApproved(_tokenId) == address(this) || 
            baseContract.isApprovedForAll(_msgSender(), address(this)),
            "The Wrapper contract has not been approved to transfer the NFT"
        );

        baseContract.safeTransferFrom(
                    _msgSender(),
                    address(this),
                    _tokenId
                );

        //emit event
    }

    function UnWrap(uint256 _tokenId) external nonReentrant {

        //Burn   
    }

    //Wrap function

    //the tokenURI function to get the art

    //anything else?


    receive() external payable {}

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        address collection = msg.sender;

        //Force that the recieved collection is the base contract
        //Or the wrapped NFT to auto unwrap

        /*
        require(
            IERC721(collection).ownerOf(tokenId) == address(this),
            "TrashBin: transfer to TrashBin failed."
        );

        _sellERC721(collection, tokenId);
        */

        return this.onERC721Received.selector;
    }
}