import { test, before } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

let viem: any, registry: any, registrar: any, stranger: any;

before(async () => {
  ({ viem } = await network.connect());
  registry = await viem.deployContract("LandRegistry");
  [registrar, stranger] = await viem.getWalletClients();
});

test("registers a land parcel", async () => {
  await registry.write.registerLand([
    "CMR-SW-BUEA-001",
    registrar.account.address,
    "QmTestCID",
    "South West",
  ]);
  const title = await registry.read.verifyTitle(["CMR-SW-BUEA-001"]);
  assert.equal(title.status, 0); // Pending
  assert.equal(
    title.owner.toLowerCase(),
    registrar.account.address.toLowerCase(),
  );
});

test("blocks duplicate registration", async () => {
  await assert.rejects(
    registry.write.registerLand([
      "CMR-SW-BUEA-001",
      registrar.account.address,
      "QmX",
      "SW",
    ]),
    /Parcel already registered/,
  );
});

test("blocks non-registrar wallet", async () => {
  await assert.rejects(
    registry.write.registerLand(
      ["CMR-LT-YDE-001", stranger.account.address, "QmY", "Littoral"],
      { account: stranger.account },
    ),
  );
});
