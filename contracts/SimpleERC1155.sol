// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract SimpleERC1155 is ERC1155, ReentrancyGuard {
    using SafeMath for uint256;

    constructor() ERC1155("") {
    }

    function mintOne(uint256 _id) external nonReentrant {
        _mint(msg.sender, _id, 1, "0x");
    }

    function mintMany(uint256[] memory _ids, uint256[] memory _amounts) external nonReentrant {
        require(_amounts.length > 0, "You must mint something silly!");
        require(_ids.length == _amounts.length, "Unequal Length of arrays");
        
        _mintBatch(msg.sender, _ids, _amounts, "0x");
    }

    function uri(uint256 _tokenId) public pure override returns (string memory) {
        return string.concat(Strings.toString(_tokenId),"# Arte!");
    }
}