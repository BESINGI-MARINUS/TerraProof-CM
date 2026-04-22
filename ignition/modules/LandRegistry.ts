import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LandRegistryModule = buildModule("LandRegistry", (m) => {
  const landRegistry = m.contract("LandRegistry");

  return { landRegistry };
});

export default LandRegistryModule;
