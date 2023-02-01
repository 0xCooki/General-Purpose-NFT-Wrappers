// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleERC721 is ERC721, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public nonce;

    constructor() ERC721("Simple ERC721", "SMPL") {
    }

    function mintOne() external nonReentrant {
        _safeMint(msg.sender, nonce);

        nonce++;
    }

    function mintMany(uint256 _amount) external nonReentrant {
        require(_amount > 0, "You must mint something silly!");

        for (uint256 i = 0; i < _amount; i++) {
            _safeMint(msg.sender, nonce);

            nonce++;
        }
    }
}