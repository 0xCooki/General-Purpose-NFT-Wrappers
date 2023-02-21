const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("NFT Wrapper Testing", function () {

    //////////////////////
    //Deploy Environment//
    //////////////////////

    async function deployEnvironment() {
        //Signers
        const [owner, addy0, addy1] = await ethers.getSigners();

        //Deploy Simple ERC721
        const simpleERC721 = await ethers.getContractFactory("SimpleERC721");
        const deployedSimpleERC721 = await simpleERC721.deploy();

        //Deploy Simple ERC1155
        const simpleERC1155 = await ethers.getContractFactory("SimpleERC1155");
        const deployedSimpleERC1155 = await simpleERC1155.deploy();

        //ERC721 Wrapper Contract
        const erc721Wrapper = await ethers.getContractFactory("ERC721Wrapper");

        //ERC1155 Wrapper Contract
        const erc1155Wrapper = await ethers.getContractFactory("ERC1155Wrapper");

        //Deploy Factory
        const factory = await ethers.getContractFactory("WrapperFactory");
        const deployedFactory = await factory.deploy(owner.address);

        return { 
            owner,
            addy0,
            addy1,
            deployedFactory,
            deployedSimpleERC721,
            deployedSimpleERC1155,
            erc721Wrapper,
            erc1155Wrapper
        };
    }

    ///////////////////
    //Wrapper Factory//
    ///////////////////

    describe("Testing the Wrapper Factory", () => {
        it("Successfully create an ERC721 Wrapper from the factory", async function () {
            const { owner, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});

            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);

            const newWrapperContract = erc721Wrapper.attach(newdeployedaddress);

            const name = await newWrapperContract.name();
            const symbol = await newWrapperContract.symbol();

            expect(name).to.equal("Wrapped Simple ERC721");
            expect(symbol).to.equal("wrSMPL");
        });
        it("Successfully create an ERC721 Wrapper of an already establed ERC721 Wrapper from the factory", async function () {
            const { owner, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Wrap One
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = erc721Wrapper.attach(newdeployedaddress);

            //Wrap Two
            await deployedFactory.CreateERC721Wrapper(newWrapperContract.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress0 = await deployedFactory.getERC721WrapperAddress(newWrapperContract.address, 0);
            const newWrapperContract0 = erc721Wrapper.attach(newdeployedaddress0);

            const name = await newWrapperContract0.name();
            const symbol = await newWrapperContract0.symbol();

            expect(name).to.equal("Wrapped Wrapped Simple ERC721");
            expect(symbol).to.equal("wrwrSMPL");
        });
        it("Successfully create an ERC1155 Wrapper from the factory", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = erc1155Wrapper.attach(newdeployedaddress);

            const name = await newWrapperContract.name();
            const symbol = await newWrapperContract.symbol();

            //console.log(deployedSimpleERC1155.address);

            expect(name).to.equal("Wrapped ERC1155: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");
            expect(symbol).to.equal("wrERC1155: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");
        });
        it("Successfully create an ERC721 Wrapper of an already establed ERC1155 Wrapper from the factory", async function () {
            const { owner, erc721Wrapper, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Wrap One
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = erc1155Wrapper.attach(newdeployedaddress);

            //Wrap Two
            await deployedFactory.CreateERC721Wrapper(newWrapperContract.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress0 = await deployedFactory.getERC721WrapperAddress(newWrapperContract.address, 0);
            const newWrapperContract0 = erc721Wrapper.attach(newdeployedaddress0);

            const name = await newWrapperContract0.name();
            const symbol = await newWrapperContract0.symbol();

            //console.log(deployedSimpleERC1155.address);

            expect(name).to.equal("Wrapped Wrapped ERC1155: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");
            expect(symbol).to.equal("wrwrERC1155: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");
        });
        it("Successfully withdrawn relayed ETH sent to factory", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Send ETH to Wrapper
            await owner.sendTransaction({to: newWrapperContract.address, value: ethers.utils.parseEther("1")});

            const factoryBalance = await ethers.provider.getBalance(deployedFactory.address);
            expect(factoryBalance).to.equal(BigInt(1.01e18));

            const ownerBalanceBeforeWithdraw = await ethers.provider.getBalance(owner.address);

            //Withdraw ETH
            const withdrawTXN = await deployedFactory.withdraw();

            //Gas
            const receipt = await withdrawTXN.wait();
            const cumulativeGasUsed = receipt.cumulativeGasUsed;
            const effectiveGasPrice = receipt.effectiveGasPrice;
            const ETHpaid = BigInt(cumulativeGasUsed) * BigInt(effectiveGasPrice);

            const ownerBalanceAfterWithdraw = await ethers.provider.getBalance(owner.address);

            expect(BigInt(ownerBalanceAfterWithdraw) + BigInt(ETHpaid) - BigInt(ownerBalanceBeforeWithdraw)).to.equal(BigInt(1.01e18));
        });
        it("Non-owner unsuccessfully withdrawn relayed ETH sent to factory", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Send ETH to Wrapper
            await owner.sendTransaction({to: newWrapperContract.address, value: ethers.utils.parseEther("1")});

            const factoryBalance = await ethers.provider.getBalance(deployedFactory.address);
            expect(factoryBalance).to.equal(BigInt(1.01e18));

            //Withdraw ETH
            await expect(deployedFactory.connect(addy0).withdraw()).to.rejectedWith("Ownable: caller is not the owner");
        });
        it("Unsuccessfully withdraw from factory if no funds present", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Send ETH to Wrapper
            await owner.sendTransaction({to: newWrapperContract.address, value: ethers.utils.parseEther("1")});

            const factoryBalance = await ethers.provider.getBalance(deployedFactory.address);
            expect(factoryBalance).to.equal(BigInt(1.01e18));

            await deployedFactory.withdraw();

            //Withdraw ETH
            await expect(deployedFactory.withdraw()).to.rejectedWith("Wrapper Factory: Nothing to withdraw");
        });
        it("Price scales successfully with successive wrapper creators", async function () {
            const { owner, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            
            await expect(deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")})).to.rejectedWith("Wrapper Factory: Insufficient fee paid");

            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.02")});

            await expect(deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.02")})).to.rejectedWith("Wrapper Factory: Insufficient fee paid");
        });
        it("Unsuccessful retrieve of contract addresses if out of bounds", async function () {
            const { owner, erc721Wrapper, erc1155Wrapper, deployedFactory, deployedSimpleERC721, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            
            await expect(deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 1)).to.rejectedWith("Wrapper Factory: Wrapper version doesn't exist");

            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});

            await expect(deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 1)).to.rejectedWith("Wrapper Factory: Wrapper version doesn't exist");
        });
        it("Successfully emission of all events", async function () {
            const { owner, addy0, erc721Wrapper, erc1155Wrapper, deployedFactory, deployedSimpleERC721, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            const newERC721WrapperAddress = "0x75537828f2ce51be7289709686A69CbFDbB714F1";
            await expect(deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")})).to.emit(deployedFactory, "ERC721WrapperCreated").withArgs(deployedSimpleERC721.address, newERC721WrapperAddress, owner.address);
            expect(await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0)).to.equal(newERC721WrapperAddress);

            const newERC1155WrapperAddress = "0xE451980132E65465d0a498c53f0b5227326Dd73F";
            await expect(deployedFactory.connect(addy0).CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")})).to.emit(deployedFactory, "ERC1155WrapperCreated").withArgs(deployedSimpleERC1155.address, newERC1155WrapperAddress, addy0.address);
            expect(await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0)).to.equal(newERC1155WrapperAddress);
        });
    });

    //////////////////
    //ERC721 Wrapper//
    //////////////////

    describe("Testing the ERC721 Wrapper", () => {
        it("Immutables are set correctly", async function () {
            const { owner, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            const baseContract = await newWrapperContract.baseContract();

            const factoryContract = await newWrapperContract.wrapperFactory();

            expect(baseContract).to.equal(deployedSimpleERC721.address);

            expect(factoryContract).to.equal(deployedFactory.address);
        });
        it("UnSuccessfully Wrap an ERC721 because approval has not been granted", async function () {
            const { owner, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.mintOne();

            await expect(newWrapperContract.wrap(0)).to.rejectedWith("ERC721Wrapper: Wrapper has not been approved to transfer the NFT.");
        });
        it("Successfully Wrap an ERC721 using the wrap function", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.mintOne();

            //Grant Approval
            await deployedSimpleERC721.setApprovalForAll(newWrapperContract.address, true);
            
            //Wrap
            await newWrapperContract.wrap(0);

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(newWrapperContract.address);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(owner.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Art!");
        });
        it("Successfully Wrap an ERC721 using the safeTransfer functionality", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintOne();

            //Safe Transfer
            await deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(newWrapperContract.address);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Art!");
        });
        it("Successfully Unwrap an ERC721 using the Unwrap function", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.mintOne();

            //Grant Approval
            await deployedSimpleERC721.setApprovalForAll(newWrapperContract.address, true);
            
            //Wrap
            await newWrapperContract.wrap(0);

            //Unwrap
            await newWrapperContract.unwrap(0);

            //Owner of SMPL 0 should be the owner
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(owner.address);

            //Owner of wrSMPL 0 should be the wrapper contract
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);
        });
        it("Successfully Unwrap an ERC721 using the safeTransfer functionality", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintOne();

            //Safe Transfer base token to wrapper
            await deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Then safeTransfer it back
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Owner of SMPL 0 should be addy0
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(addy0.address);

            //Owner of wrSMPL 0 should be wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);
        });
        it("Unsuccessfully attempt to send a third ERC721 to the wrapper contract", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Create a new ERC721
            const secondSimpleERC721 = await ethers.getContractFactory("SimpleERC721");
            const deployedSecondSimpleERC721 = await secondSimpleERC721.deploy();

            //Mint one
            await deployedSecondSimpleERC721.connect(addy0).mintOne();

            //attempt to send the other kind of ERC721
            await expect(deployedSecondSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0)).to.rejectedWith("ERC721Wrapper: may only transfer wrapped or base NFT.");
        });
        it("Successfully relayed ETH sent to it to the Factory", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Send ETH to Wrapper
            await owner.sendTransaction({to: newWrapperContract.address, value: ethers.utils.parseEther("1")});

            const factoryBalance = await ethers.provider.getBalance(deployedFactory.address);

            expect(factoryBalance).to.equal(BigInt(1.01e18));
        });
        it("Successfully Re-wrap an ERC721 using the Unwrap function", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.mintOne();

            //Grant Approval
            await deployedSimpleERC721.approve(newWrapperContract.address, 0);
            
            //Wrap
            await newWrapperContract.wrap(0);

            //Unwrap
            await newWrapperContract.unwrap(0);

            //Grant approval again given that this form of approval resets after transfer
            await deployedSimpleERC721.approve(newWrapperContract.address, 0);

            //Wrap again
            await newWrapperContract.wrap(0);

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(newWrapperContract.address);

            //Owner of wrSMPL 0 should be the owner
            expect(await newWrapperContract.ownerOf(0)).to.equal(owner.address);
        });
        it("Successfully Re-wrap an ERC721 using the safeTransfer functionality", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintOne();

            //Safe Transfer base token to wrapper
            await deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Then safeTransfer it back
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Safe Transfer base token to wrapper again
            await deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(newWrapperContract.address);

            //Owner of wrSMPL 0 should be wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);
        });
        it("Successful emissions of all events", async function () {
            const { owner, addy0, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintOne();

            //wrapped event
            await expect(deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0)).to.emit(newWrapperContract, "Wrapped").withArgs(0, addy0.address);

            //unwrapped
            await expect(newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0)).to.emit(newWrapperContract, "Unwrapped").withArgs(0, addy0.address);
        });
        it("Successfully Wrap an ERC721, send it to another address, and unwrap to new owner", async function () {
            const { owner, addy0, addy1, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintOne();

            //Grant Approval
            await deployedSimpleERC721.connect(addy0).approve(newWrapperContract.address, 0);
                        
            //Wrap
            await newWrapperContract.connect(addy0).wrap(0);

            //Send wrapper to new address
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, addy1.address, 0);

            //Unwrap
            await newWrapperContract.connect(addy1).unwrap(0);

            //Owner of SMPL 0 should be addy1
            expect(await deployedSimpleERC721.ownerOf(0)).to.equal(addy1.address);

            //Owner of wrSMPL 0 should be the wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Art!");
        });
        it("Successfully iteration of wrapper token Ids", async function () {
            const { owner, addy0, addy1, erc721Wrapper, deployedFactory, deployedSimpleERC721 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC721Wrapper(deployedSimpleERC721.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC721WrapperAddress(deployedSimpleERC721.address, 0);
            const newWrapperContract = await erc721Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC721.connect(addy0).mintMany(10);

            //Grant Approval
            await deployedSimpleERC721.connect(addy0).approve(newWrapperContract.address, 9);
                        
            //Wrap
            await newWrapperContract.connect(addy0).wrap(9);

            //Send wrapper to new address
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, addy1.address, 9);

            //Unwrap
            await newWrapperContract.connect(addy1).unwrap(9);

            //Owner of SMPL 0 should be addy1
            expect(await deployedSimpleERC721.ownerOf(9)).to.equal(addy1.address);

            //Owner of wrSMPL 0 should be the wrapper
            expect(await newWrapperContract.ownerOf(9)).to.equal(newWrapperContract.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(9)).to.equal("9# Art!");
        });
    });

    ///////////////////
    //ERC1155 Wrapper//
    ///////////////////

    describe("Testing the ERC1155 Wrapper", () => {
        it("Immutables are set correctly", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            const baseContract = await newWrapperContract.baseContract();

            const factoryContract = await newWrapperContract.wrapperFactory();

            expect(baseContract).to.equal(deployedSimpleERC1155.address);

            expect(factoryContract).to.equal(deployedFactory.address);
        });
        it("UnSuccessfully Wrap an ERC1155 because approval has not been granted", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.mintOne(0);

            await expect(newWrapperContract.wrap(0)).to.rejectedWith("ERC1155Wrapper: Wrapper has not been approved to transfer the NFT.");
        });
        it("Successfully Wrap an ERC1155 using the wrap function", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.mintOne(0);

            //Grant approval
            await deployedSimpleERC1155.setApprovalForAll(newWrapperContract.address, true);

            //wrap
            await newWrapperContract.wrap(0);

            //Wrapper should own a SMPL 0
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 0)).to.equal(1);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(owner.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Arte!");
        });
        it("Successfully Wrap an ERC1155 using the safeTransfer functionality", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintOne(0);

            //wrap
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 0, 1, "0x");

            //Wrapper should own a SMPL 0
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 0)).to.equal(1);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Arte!");
        });
        it("Successfully Wrap multiple ERC1155s using the safeTransfer functionality", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintMany([1], [10]);

            //wrap
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 1, 10, "0x");

            //Wrapper should own 10 SMPL 0
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 1)).to.equal(10);

            //Owner of wrSMPL 0 through 9 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);
            expect(await newWrapperContract.ownerOf(9)).to.equal(addy0.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(9)).to.equal("1# Arte!");
        });
        it("Successfully Wrap multiple ERC1155s using the batch safeTransfer functionality", async function () {
            const { addy0, addy1, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a many of the same kind
            await deployedSimpleERC1155.connect(addy0).mintMany([0], [10]);

            //wrap via batch transfer
            await deployedSimpleERC1155.connect(addy0)["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](addy0.address, newWrapperContract.address, [0], [10], "0x");

            //Wrapper should own 10 SMPL 0
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 0)).to.equal(10);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);

            //Owner of wrSMPL 1 should be the "owner"
            expect(await newWrapperContract.ownerOf(1)).to.equal(addy0.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(7)).to.equal("0# Arte!");

            //Mint a many of different ids the same kind
            await deployedSimpleERC1155.connect(addy1).mintMany([1,2,3], [10,20,50]);

            //wrap via batch transfer
            await deployedSimpleERC1155.connect(addy1)["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](addy1.address, newWrapperContract.address, [1,2,3], [10,10,10], "0x");

            //Wrapper should own 10 SMPL 3
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 3)).to.equal(10);

            //Owner of wrSMPL 0 should be the "owner"
            expect(await newWrapperContract.ownerOf(11)).to.equal(addy1.address);

            //Owner of wrSMPL 1 should be the "owner"
            expect(await newWrapperContract.ownerOf(39)).to.equal(addy1.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(27)).to.equal("2# Arte!");
        });
        it("Successfully Unwrap an ERC1155 using the wrap function", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.mintOne(0);

            //Grant approval
            await deployedSimpleERC1155.setApprovalForAll(newWrapperContract.address, true);

            //wrap
            await newWrapperContract.wrap(0);

            //unwrap
            await newWrapperContract.unwrap(0);

            //Owner should own base nft
            expect(await deployedSimpleERC1155.balanceOf(owner.address, 0)).to.equal(1);

            //Owner of wrSMPL 0 should be the wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Arte!");
        });
        it("Successfully Unwrap an ERC1155 using the safeTransfer functionality", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintOne(0);

            //wrap
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 0, 1, "0x");

            //unwrap
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Addy0 should own a SMPL 0
            expect(await deployedSimpleERC1155.balanceOf(addy0.address, 0)).to.equal(1);

            //Owner of wrSMPL 0 should be the wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);

            //Wrapper displays the underlying art correctly
            expect(await newWrapperContract.tokenURI(0)).to.equal("0# Arte!");
        });
        it("Unsuccessfully attempt to send a third ERC1155 to the wrapper contract", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Create new ERC1155
            const secondSimpleERC1155 = await ethers.getContractFactory("SimpleERC1155");
            const deployedSecondSimpleERC1155 = await secondSimpleERC1155.deploy();

            //Mint a base NFT
            await deployedSecondSimpleERC1155.connect(addy0).mintOne(0);

            //attempt and fail to wrap
            await expect(deployedSecondSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 0, 1, "0x")).to.rejectedWith("ERC1155Wrapper: may only transfer base NFT.");
        });
        it("Unsuccessfully attempt to send an alternative erc721 to the wrapper contract", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC721, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a 721
            await deployedSimpleERC721.connect(addy0).mintOne();

            //attempt and fail to wrap
            await expect(deployedSimpleERC721.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0)).to.rejectedWith("ERC1155Wrapper: may only transfer wrapped NFT.");
        });
        it("Successfully relayed ETH sent to it to the Factory", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Send ETH to Wrapper
            await addy0.sendTransaction({to: newWrapperContract.address, value: ethers.utils.parseEther("1")});

            const factoryBalance = await ethers.provider.getBalance(deployedFactory.address);

            expect(factoryBalance).to.equal(BigInt(1.01e18));
        });
        it("Successfully Re-wrap an ERC1155 using the Unwrap function", async function () {
            const { owner, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.mintOne(0);

            //Grant Approval
            await deployedSimpleERC1155.setApprovalForAll(newWrapperContract.address, true);
            
            //Wrap
            await newWrapperContract.wrap(0);

            //Unwrap
            await newWrapperContract.unwrap(0);

            //Wrap again
            await newWrapperContract.wrap(0);

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 0)).to.equal(1);

            //Owner of wrSMPL 0 should be the owner
            expect(await newWrapperContract.ownerOf(0)).to.equal(owner.address);
        });
        it("Successfully Re-wrap an ERC1155 using the safeTransfer functionality", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintOne(1);

            //Safe Transfer base token to wrapper
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 1, 1, "0x");

            //Then safeTransfer it back
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);

            //Safe Transfer base token to wrapper again
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 1, 1, "0x");

            //Owner of SMPL 0 should be the wrapper
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 1)).to.equal(1);

            //Owner of wrSMPL 0 should be the owner
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy0.address);
        });
        it("Successfully Re-use of formerly unwrapped NFT", async function () {
            const { addy0, addy1, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a lot of base NFTs for addy 0
            await deployedSimpleERC1155.connect(addy0).mintMany([1], [10]);

            //Safe Transfer base token to wrapper
            await deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 1, 10, "0x");

            //Then safeTransfer three back
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0);
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 8);
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 9);

            //Owner of wrSMPL 0, 8, and 9 should be the wrapper contract
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);
            expect(await newWrapperContract.ownerOf(8)).to.equal(newWrapperContract.address);
            expect(await newWrapperContract.ownerOf(9)).to.equal(newWrapperContract.address);

            //Mint two base NFT for addy 1
            await deployedSimpleERC1155.connect(addy1).mintMany([1], [2]);

            //Safe Transfer base token to wrapper again
            await deployedSimpleERC1155.connect(addy1)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy1.address, newWrapperContract.address, 1, 1, "0x");

            //Wrapper should own 8 1155 (id = 1) tokens
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 1)).to.equal(8);

            //And addy1 should own the 0th wrapper nft
            expect(await newWrapperContract.ownerOf(0)).to.equal(addy1.address);

            //Grant Approval
            await deployedSimpleERC1155.connect(addy1).setApprovalForAll(newWrapperContract.address, true);

            //Wrap again
            await newWrapperContract.connect(addy1).wrap(1);

            //Wrapper should own 9 1155 (id = 1) tokens
            expect(await deployedSimpleERC1155.balanceOf(newWrapperContract.address, 1)).to.equal(9);

            //And addy1 should own the 9th wrapper nft
            expect(await newWrapperContract.ownerOf(9)).to.equal(addy1.address);
        });
        it("Successfull emission of all events", async function () {
            const { addy0, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintOne(1);

            //Wrapped event
            await expect(deployedSimpleERC1155.connect(addy0)["safeTransferFrom(address,address,uint256,uint256,bytes)"](addy0.address, newWrapperContract.address, 1, 1, "0x")).to.emit(newWrapperContract, "Wrapped").withArgs(1, addy0.address);

            //Unwrapped event
            await expect(newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, newWrapperContract.address, 0)).to.emit(newWrapperContract, "Unwrapped").withArgs(1, addy0.address);
        });
        it("Successfully Wrap an ERC1155, send it to another address, and unwrap to new owner", async function () {
            const { owner, addy0, addy1, erc1155Wrapper, deployedFactory, deployedSimpleERC1155 } = await loadFixture(deployEnvironment);

            //Create Wrapper
            await deployedFactory.CreateERC1155Wrapper(deployedSimpleERC1155.address, {value: ethers.utils.parseEther("0.01")});
            const newdeployedaddress = await deployedFactory.getERC1155WrapperAddress(deployedSimpleERC1155.address, 0);
            const newWrapperContract = await erc1155Wrapper.attach(newdeployedaddress);

            //Mint a base NFT
            await deployedSimpleERC1155.connect(addy0).mintOne(12);

            //Grant Approval
            await deployedSimpleERC1155.connect(addy0).setApprovalForAll(newWrapperContract.address, true);
            
            //Wrap
            await newWrapperContract.connect(addy0).wrap(12);

            //Transfer
            await newWrapperContract.connect(addy0)["safeTransferFrom(address,address,uint256)"](addy0.address, addy1.address, 0);

            //Unwrap
            await newWrapperContract.connect(addy1).unwrap(0);

            //Owner of SMPL 0 should be addy1
            expect(await deployedSimpleERC1155.balanceOf(addy1.address, 12)).to.equal(1);

            //Owner of wrSMPL 0 should be the wrapper
            expect(await newWrapperContract.ownerOf(0)).to.equal(newWrapperContract.address);
        });
    });
});