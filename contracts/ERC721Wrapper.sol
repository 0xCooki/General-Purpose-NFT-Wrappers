// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

//we want this to be a cloneable contract that gets deployed by create2
contract ERC721Wrapper is ERC721, ReentrancyGuard {

    constructor() ERC721("test", "TST") {

    }
}