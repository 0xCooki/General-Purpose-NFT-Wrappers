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

    function mintMany(uint256 _id, uint256 _amount) external nonReentrant {
        require(_amount > 0, "You must mint something silly!");

        uint256[] memory ids;
        uint256[] memory amounts;

        ids[0] = _id;
        amounts[0] = _amount;

        _mintBatch(msg.sender, ids, amounts, "0x");
    }

    function uri(uint256 _tokenId) public pure override returns (string memory) {
        return string.concat(Strings.toString(_tokenId),"# Arte!");
    }
}