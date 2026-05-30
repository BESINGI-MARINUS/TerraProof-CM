import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const output = execSync(
  "npx hardhat ignition deploy ignition/modules/TerraProof.ts --network localhost",
  { encoding: "utf8" },
);

console.log(output);

// Extract the deployed address from Ignition output
const match = output.match(/LandTransfer\s+-\s+(0x[0-9a-fA-F]{40})/);
if (!match) {
  console.error("Could not find deployed address in output");
  process.exit(1);
}

const address = match[1];

// Update client/.env
const envPath = "client/.env";
let env = readFileSync(envPath, "utf8");
env = env.replace(
  /VITE_CONTRACT_ADDRESS=.*/,
  `VITE_CONTRACT_ADDRESS=${address}`,
);
writeFileSync(envPath, env);

console.log(`\n✓ client/.env updated with address: ${address}`);
console.log("  Restart Vite (npm run dev) for the change to take effect.\n");
