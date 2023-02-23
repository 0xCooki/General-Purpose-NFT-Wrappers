# General-Purpose NFT Wrappers
A factory that creates general-purpose NFT wrappers for both ERC721 and ERC1155 collections.

### Functionality and Design
The Wrapper Factory allows anyone to create NFT wrappers (which are themselves ERC721 smart contracts) for any ERC721 or ERC1155 NFT collections. Note that the wrapper contract for an ERC1155 is an ERC721, as it is assumed that only NFTs will be wrapped using this infrastructure. A pricing model that employs the Fibonacci sequence has been implemented to discourage the creation of multiple wrappers for the same collection. Recursively, however, wrappers can also be wrapped. Users only need to pay to create a wrapper; using an already established wrapper is free except for gas.

### Use Cases
- Circumventing marketplace blacklists
- Circumventing on-chain royalty mechanisms
- Avoiding bugs in deployed NFT collections without having to re-deploy

### Deployments
Wrapper Factory:
- Sepolia: [0x010091d70a8dc81b9c22e468fb59eec44d03cc0c](https://sepolia.etherscan.io/address/0x010091d70a8dc81b9c22e468fb59eec44d03cc0c#code)
- Arbitrum Nova: [0x95Ef09231289384329D66C03EEC63E8e42727bAE](https://nova.arbiscan.io/address/0x95Ef09231289384329D66C03EEC63E8e42727bAE#code)

### Installation
- Clone the repo
- Follow all instructions on this [page](https://hardhat.org/tutorial/creating-a-new-hardhat-project) beginning from run `npm init`/`yarn init`
- Install OpenZeppelin via command from root of repo `npm i @openzeppelin/contracts`
- Ensure that your compiler has enabled using the optimiser on `hardhat.config.js`. More information found [here](https://hardhat.org/hardhat-runner/docs/guides/compile-contracts)
- For live deployment follow all instructions on this [page](https://hardhat.org/tutorial/deploying-to-a-live-network). More information regarding deployment and verification found [here](https://hardhat.org/hardhat-runner/docs/guides/deploying) and [here](https://hardhat.org/hardhat-runner/docs/guides/verifying)

### Testing
Local testing via command `npx hardhat test`