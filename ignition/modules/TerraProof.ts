import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TerraProofModule = buildModule("TerraProof", (m) => {
  // Deploy LandTransfer (which extends LandRegistry)
  // This single deployment gives us access to all land registry and transfer functionality
  const landTransfer = m.contract("LandTransfer");

  return { landTransfer };
});

export default TerraProofModule;
