import { test, before } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

let viem: any,
  landTransfer: any,
  registrar: any,
  approver: any,
  owner: any,
  newOwner: any,
  stranger: any,
  DEFAULT_ADMIN_ROLE: any,
  REGISTRAR_ROLE: any,
  APPROVER_ROLE: any,
  SURVEYOR_ROLE: any;

before(async () => {
  ({ viem } = await network.connect());
  landTransfer = await viem.deployContract("LandTransfer");
  [registrar, approver, owner, newOwner, stranger] =
    await viem.getWalletClients();

  // Get role hashes from contract
  DEFAULT_ADMIN_ROLE = await landTransfer.read.DEFAULT_ADMIN_ROLE();
  REGISTRAR_ROLE = await landTransfer.read.REGISTRAR_ROLE();
  APPROVER_ROLE = await landTransfer.read.APPROVER_ROLE();
  SURVEYOR_ROLE = await landTransfer.read.SURVEYOR_ROLE();

  // Grant roles
  await landTransfer.write.grantRole([
    DEFAULT_ADMIN_ROLE,
    registrar.account.address,
  ]);
  await landTransfer.write.grantRole([
    REGISTRAR_ROLE,
    registrar.account.address,
  ]);
  await landTransfer.write.grantRole([APPROVER_ROLE, approver.account.address]);
  await landTransfer.write.grantRole([SURVEYOR_ROLE, stranger.account.address]);

  // Register and approve a land parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-001", owner.account.address, "QmTestCID", "South West"],
    { account: registrar.account },
  );

  // Get approval from approver
  await landTransfer.write.approveLand(["CMR-SW-BUEA-001"], {
    account: approver.account,
  });

  // Get approval from surveyor
  await landTransfer.write.approveLand(["CMR-SW-BUEA-001"], {
    account: stranger.account,
  });

  // Verify title is now approved
  const title = await landTransfer.read.verifyTitle(["CMR-SW-BUEA-001"]);
  assert.equal(title.status, 1); // Approved
});

test("allows owner to request a transfer", async () => {
  await landTransfer.write.requestTransfer(
    ["CMR-SW-BUEA-001", newOwner.account.address],
    { account: owner.account },
  );

  const pendingTransfer = await landTransfer.read.pendingTransfers([
    "CMR-SW-BUEA-001",
  ]);
  assert.equal(
    pendingTransfer.toLowerCase(),
    newOwner.account.address.toLowerCase(),
  );
});

test("blocks transfer request from non-owner", async () => {
  await assert.rejects(
    landTransfer.write.requestTransfer(
      ["CMR-SW-BUEA-001", stranger.account.address],
      { account: stranger.account },
    ),
    /You are not the owner/,
  );
});

test("blocks transfer request to invalid address", async () => {
  await assert.rejects(
    landTransfer.write.requestTransfer(
      ["CMR-SW-BUEA-001", "0x0000000000000000000000000000000000000000"],
      { account: owner.account },
    ),
    /Invalid new owner address/,
  );
});

test("blocks transfer request to same owner", async () => {
  await assert.rejects(
    landTransfer.write.requestTransfer(
      ["CMR-SW-BUEA-001", owner.account.address],
      { account: owner.account },
    ),
    /Cannot transfer to yourself/,
  );
});

test("blocks transfer request for non-existent parcel", async () => {
  await assert.rejects(
    landTransfer.write.requestTransfer(
      ["CMR-SW-FAKE-999", newOwner.account.address],
      { account: owner.account },
    ),
    /Land parcel not found/,
  );
});

test("blocks transfer request for disputed title", async () => {
  // Create a second parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-002", owner.account.address, "QmTestCID2", "South West"],
    { account: registrar.account },
  );

  // Approve the second parcel
  await landTransfer.write.approveLand(["CMR-SW-BUEA-002"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-002"], {
    account: stranger.account,
  });

  // Raise a dispute
  await landTransfer.write.raiseDispute(["CMR-SW-BUEA-002"], {
    account: registrar.account,
  });

  // Try to request transfer
  await assert.rejects(
    landTransfer.write.requestTransfer(
      ["CMR-SW-BUEA-002", newOwner.account.address],
      { account: owner.account },
    ),
    /Title is not active/,
  );
});

test("allows registrar to confirm a pending transfer", async () => {
  // Request transfer
  await landTransfer.write.requestTransfer(
    ["CMR-SW-BUEA-001", newOwner.account.address],
    { account: owner.account },
  );

  // Confirm transfer
  await landTransfer.write.confirmTransfer(["CMR-SW-BUEA-001"], {
    account: registrar.account,
  });

  const title = await landTransfer.read.verifyTitle(["CMR-SW-BUEA-001"]);
  assert.equal(
    title.owner.toLowerCase(),
    newOwner.account.address.toLowerCase(),
  );
});

test("blocks confirmTransfer from non-registrar", async () => {
  // Create a third parcel and request transfer
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-003", owner.account.address, "QmTestCID3", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-003"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-003"], {
    account: stranger.account,
  });

  await landTransfer.write.requestTransfer(
    ["CMR-SW-BUEA-003", newOwner.account.address],
    { account: owner.account },
  );

  // Try to confirm as non-registrar
  await assert.rejects(
    landTransfer.write.confirmTransfer(["CMR-SW-BUEA-003"], {
      account: stranger.account,
    }),
  );
});

test("blocks confirmTransfer when no pending transfer exists", async () => {
  // Create a parcel without requesting transfer
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-004", owner.account.address, "QmTestCID4", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-004"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-004"], {
    account: stranger.account,
  });

  await assert.rejects(
    landTransfer.write.confirmTransfer(["CMR-SW-BUEA-004"], {
      account: registrar.account,
    }),
    /No pending transfer for this parcel/,
  );
});

test("updates owner history after transfer", async () => {
  // Create a new parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-005", owner.account.address, "QmTestCID5", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-005"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-005"], {
    account: stranger.account,
  });

  // Request and confirm transfer
  await landTransfer.write.requestTransfer(
    ["CMR-SW-BUEA-005", newOwner.account.address],
    { account: owner.account },
  );

  await landTransfer.write.confirmTransfer(["CMR-SW-BUEA-005"], {
    account: registrar.account,
  });

  const history = await landTransfer.read.getHistory(["CMR-SW-BUEA-005"]);
  assert.ok(history.length >= 2);
  assert.equal(
    history[history.length - 1].toLowerCase(),
    newOwner.account.address.toLowerCase(),
  );
});

test("allows registrar to raise a dispute", async () => {
  // Create a new parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-006", owner.account.address, "QmTestCID6", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-006"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-006"], {
    account: stranger.account,
  });

  // Raise dispute
  await landTransfer.write.raiseDispute(["CMR-SW-BUEA-006"], {
    account: registrar.account,
  });

  const title = await landTransfer.read.verifyTitle(["CMR-SW-BUEA-006"]);
  assert.equal(title.status, 2); // Disputed
});

test("blocks raiseDispute from non-registrar", async () => {
  // Create a new parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-007", owner.account.address, "QmTestCID7", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-007"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-007"], {
    account: stranger.account,
  });

  await assert.rejects(
    landTransfer.write.raiseDispute(["CMR-SW-BUEA-007"], {
      account: approver.account,
    }),
  );
});

test("blocks raiseDispute for non-existent parcel", async () => {
  await assert.rejects(
    landTransfer.write.raiseDispute(["CMR-SW-FAKE-888"], {
      account: registrar.account,
    }),
    /Parcel not found/,
  );
});

test("allows approver to reject a pending title", async () => {
  // Create a new pending parcel (don't approve it)
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-008", owner.account.address, "QmTestCID8", "South West"],
    { account: registrar.account },
  );

  // Reject the title
  await landTransfer.write.rejectTitle(["CMR-SW-BUEA-008"], {
    account: approver.account,
  });

  const title = await landTransfer.read.verifyTitle(["CMR-SW-BUEA-008"]);
  assert.equal(title.status, 3); // Rejected
});

test("blocks rejectTitle from non-approver", async () => {
  // Create a new pending parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-009", owner.account.address, "QmTestCID9", "South West"],
    { account: registrar.account },
  );

  await assert.rejects(
    landTransfer.write.rejectTitle(["CMR-SW-BUEA-009"], {
      account: stranger.account,
    }),
  );
});

test("blocks rejectTitle for non-pending title", async () => {
  // Create an approved parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-010", owner.account.address, "QmTestCID10", "South West"],
    { account: registrar.account },
  );

  await landTransfer.write.approveLand(["CMR-SW-BUEA-010"], {
    account: approver.account,
  });
  await landTransfer.write.approveLand(["CMR-SW-BUEA-010"], {
    account: stranger.account,
  });

  // Try to reject an approved title
  await assert.rejects(
    landTransfer.write.rejectTitle(["CMR-SW-BUEA-010"], {
      account: approver.account,
    }),
    /Can only reject a pending title/,
  );
});

test("blocks rejectTitle for non-existent parcel", async () => {
  await assert.rejects(
    landTransfer.write.rejectTitle(["CMR-SW-FAKE-777"], {
      account: approver.account,
    }),
    /Parcel not found/,
  );
});

test("prevents double approval from same official", async () => {
  // Create a new parcel
  await landTransfer.write.registerLand(
    ["CMR-SW-BUEA-011", owner.account.address, "QmTestCID11", "South West"],
    { account: registrar.account },
  );

  // Try to approve twice with the same account
  await assert.rejects(
    landTransfer.write.approveLand(["CMR-SW-BUEA-011"], {
      account: registrar.account,
    }),
    /You have already approved this parcel/,
  );
});
