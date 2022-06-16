const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcBatchProvider(
  "https://eth-mainnet.alchemyapi.io/v2/AydLTx3Bmuuy2fjHM-cpbW0y3dU9eXMb"
);
const walletPrivateKey =
  "0x56c10a8e87b54ea6646895d4ae7b322dbb6ea714b4ca9fa9ca92480074f8e8bb";
const wallet = new ethers.Wallet(walletPrivateKey);
const signer = wallet.connect(provider);

let erc20ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const getNFTList = async (userAddress) => {
  let modifiedQAddress =
    "0x000000000000000000000000" + userAddress.substring(2, 63);
  let tempData = await provider.getLogs({
    fromBlock: 0,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      modifiedQAddress,
    ],
  });

  let nftAddresses = [];
  let tempNFTAddresses = [];
  let nftContracts = [];
  let nftData = [];

  for (let i = 0; i < tempData.length; i++) {
    let curData = tempData[i];
    if (
      curData.topics.length === 4 &&
      tempNFTAddresses.indexOf(curData.address) == -1
    ) {
      try {
        let contract;
        if (
          nftAddresses.indexOf(curData.address) === -1 &&
          tempNFTAddresses.indexOf(curData.address) === -1
        ) {
          contract = new ethers.Contract(curData.address, erc20ABI, signer);
          let tempUserBalance = await contract.balanceOf(userAddress);
          let userBalance = Number.parseInt(tempUserBalance._hex);
          if (userBalance !== 0) {
            nftContracts.push(contract);
            nftAddresses.push(curData.address);
            console.log(nftAddresses, userBalance);
            nftData.push({
              address: curData.address,
              balance: userBalance,
              nftList: [],
              nftURI: [],
            });
          } else {
            tempNFTAddresses.push(userAddress);
            continue;
          }
        }
        let tempBalance =
          nftData[nftAddresses.indexOf(curData.address)].balance;
        if (tempBalance !== 0) {
          if (contract === undefined) {
            contract = nftContracts[nftAddresses.indexOf(curData.address)];
          }
          console.log(curData.topics[3]);
          console.log(Number.parseInt(curData.topics[3]));
          console.log(i, tempBalance);
          if (
            (await contract.ownerOf(Number.parseInt(curData.topics[3]))) ===
            userAddress
          ) {
            let nftAddressesIndex = nftAddresses.indexOf(curData.address);
            let nftID = Number.parseInt(curData.topics[3]);
            nftData[nftAddressesIndex].nftList.push(nftID);
            nftData[nftAddressesIndex].nftURI.push(
              await contract.tokenURI(nftID)
            );
            console.log("Owned");
            //console.log(curData);
          }
        }
      } catch (error) {
        //console.log(curData);
        console.log(i);
        console.log(error);
        continue;
      }
    }
  }
  console.log(nftAddresses, nftData);
};

getNFTList("0x07FeECeb2b53Dd4FDB7572e8C8D321e9443762d2");
