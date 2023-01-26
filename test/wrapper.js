const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Pixels On Chain Testing", function () {

    //////////////////////
    //Deploy Environment//
    //////////////////////

    async function deployEnvironment() {
        //Signers
        const [owner, addy0, addy1] = await ethers.getSigners();

        //Deploy Wrapper
        const erc721Wrapper = await ethers.getContractFactory("ERC721Wrapper");
        const deployedERC721Wrapper = await erc721Wrapper.deploy();

        return { 
            owner,
            addy0,
            addy1,
            deployedERC721Wrapper
        };
    }

    ////////////////////////////
    //Pixels On Chain Registry//
    ////////////////////////////

    describe("Testing  ", () => {
        it("Successfully basic stuff", async function () {

            const { owner, addy0, addy1, deployedERC721Wrapper } = await loadFixture(deployEnvironment);

            
        });
    });
});