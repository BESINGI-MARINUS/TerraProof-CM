// Run this ONCE after deploying to Sepolia to assign roles to separate wallets

import { network } from "hardhat";

const { viem } = await network.connect();

// Your deployed LandTransfer address from Ignition output
const contract = await viem.getContractAt(
  "LandTransfer",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
);

// Replace these with real separate MetaMask wallet addresses
const SURVEYOR_ADDRESS = "0xSurveyorWalletAddressHere";
const APPROVER_ADDRESS = "0xApproverWalletAddressHere";
const REGISTRAR_ADDRESS = "0xRegistrarWalletAddressHere"; // can be same as deployer

const SURVEYOR_ROLE = await contract.read.SURVEYOR_ROLE();
const APPROVER_ROLE = await contract.read.APPROVER_ROLE();
const REGISTRAR_ROLE = await contract.read.REGISTRAR_ROLE();

await contract.write.grantRole([SURVEYOR_ROLE, SURVEYOR_ADDRESS]);
await contract.write.grantRole([APPROVER_ROLE, APPROVER_ADDRESS]);
await contract.write.grantRole([REGISTRAR_ROLE, REGISTRAR_ADDRESS]);

console.log("Roles assigned successfully");
