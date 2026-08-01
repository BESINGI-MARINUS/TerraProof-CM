import { network } from "hardhat";

// const { viem } = await network.create({
//   network: "hardhatOp",
//   chainType: "op",
// });

const { viem } = await network.create();

// Your deployed LandTransfer address from Ignition output
const contract = await viem.getContractAt(
  "LandTransfer",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
);

const SURVEYOR_ADDRESS = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const APPROVER_ADDRESS = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
const REGISTRAR_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // can be same as deployer

const SURVEYOR_ROLE = await contract.read.SURVEYOR_ROLE();
const APPROVER_ROLE = await contract.read.APPROVER_ROLE();
const REGISTRAR_ROLE = await contract.read.REGISTRAR_ROLE();

await contract.write.grantRole([SURVEYOR_ROLE, SURVEYOR_ADDRESS]);
await contract.write.grantRole([APPROVER_ROLE, APPROVER_ADDRESS]);
await contract.write.grantRole([REGISTRAR_ROLE, REGISTRAR_ADDRESS]);

console.log("✓ SURVEYOR_ROLE granted to", SURVEYOR_ADDRESS);
console.log("✓ APPROVER_ROLE granted to", APPROVER_ADDRESS);
console.log("✓ REGISTRAR_ROLE granted to", REGISTRAR_ADDRESS);
