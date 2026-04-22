import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LandTransferModule = buildModule("LandTransfer", (m) => {
  // LandTransfer extends LandRegistry, so deploying it gives us both contracts' functionality
  const landTransfer = m.contract("LandTransfer");

  return { landTransfer };
});

export default LandTransferModule;
