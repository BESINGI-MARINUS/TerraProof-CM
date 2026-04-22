// const hre = require("hardhat");
import * as hre from "hardhat";

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const contract = await LandRegistry.deploy();
  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);
