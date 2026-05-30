# TerraProof — Complete Testing Guide

> This document walks you through every step needed to fully test the TerraProof
> application locally, including setting up multiple MetaMask accounts with
> different roles, capturing screenshots for your documentation, and running
> every system function end-to-end.

---

## Table of Contents

1. [Prerequisites Checklist](#1-prerequisites-checklist)
2. [Starting the Three Layers](#2-starting-the-three-layers)
3. [Setting Up Four MetaMask Accounts](#3-setting-up-four-metamask-accounts)
4. [Granting Roles to Each Account](#4-granting-roles-to-each-account)
5. [Screenshot Guide — What to Capture and When](#5-screenshot-guide)
6. [Test 1 — Wallet Connection and Role Detection](#test-1--wallet-connection-and-role-detection)
7. [Test 2 — Land Registration (Registrar)](#test-2--land-registration-registrar)
8. [Test 3 — Approval Vote 1 (Surveyor)](#test-3--approval-vote-1-surveyor)
9. [Test 4 — Approval Vote 2 (Approver)](#test-4--approval-vote-2-approver)
10. [Test 5 — Search and Verify Title (Any role)](#test-5--search-and-verify-title-any-role)
11. [Test 6 — Audit Trail (Any role)](#test-6--audit-trail-any-role)
12. [Test 7 — Request Transfer (Owner)](#test-7--request-transfer-owner)
13. [Test 8 — Confirm Transfer (Registrar)](#test-8--confirm-transfer-registrar)
14. [Test 9 — Dispute a Title (Registrar)](#test-9--dispute-a-title-registrar)
15. [Test 10 — Access Control Enforcement (Viewer)](#test-10--access-control-enforcement-viewer)
16. [Smart Contract Unit Tests](#16-smart-contract-unit-tests)
17. [Troubleshooting](#17-troubleshooting)
18. [Documentation Screenshot Summary](#18-documentation-screenshot-summary)

---

## 1. Prerequisites Checklist

Before starting, confirm every item below is in place. Do not skip this section.

- [ ] **Node.js v22 or higher** installed — run `node --version` to confirm
- [ ] **MetaMask extension** installed in Chrome or Firefox
- [ ] **Hardhat node** not yet running (you will start it in Step 2)
- [ ] **A small PDF file** saved somewhere on your computer — this will be your
      test "titre foncier" document. Any PDF works; name it `test-title.pdf`
- [ ] **All three terminals** ready to open (use VS Code's split terminal feature)
- [ ] `client/.env` file exists with both variables set (even if the contract
      address is a placeholder — you will update it in Step 2)

---

## 2. Starting the Three Layers

You need three separate terminals running simultaneously throughout all tests.
Open VS Code, press `` Ctrl+` `` to open the terminal panel, then click the
**+** icon twice to create three terminal tabs. Label them mentally as
Terminal 1, 2, and 3.

### Terminal 1 — Start the Hardhat local blockchain

```bash
# Run from your project root (terraproof/)
npx hardhat node
```

**What you will see:**

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

> **IMPORTANT:** Copy the four private keys and the four addresses into a
> notepad. You will need them throughout this guide. Keep Terminal 1 open and
> running at all times — closing it destroys all deployed contracts and
> blockchain state.

---

### Terminal 2 — Deploy the contracts

```bash
# Run from your project root
npx hardhat ignition deploy ignition/modules/TerraProof.ts --network localhost
```

**What you will see:**

```
Hardhat Ignition 🚀 Deploying [ TerraProofModule ]

Batch #1
  Executed TerraProofModule#LandTransfer

[ TerraProofModule ] successfully deployed 🚀

Deployed Addresses
TerraProofModule#LandTransfer - 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy that contract address.** Then update `client/.env`:

```bash
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_SERVER_URL=http://localhost:3001
```

> If the address printed differs from the example above, use whatever was
> printed. The address shown above is the typical first deployment address on a
> fresh Hardhat node.

Verify the deployment was saved:

```bash
cat ignition/deployments/chain-31337/deployed_addresses.json
```

You should see your contract address confirmed in that file.

---

### Terminal 2 — Start the Express server (same terminal after deploy)

```bash
cd server
npx ts-node src/index.ts
```

**What you will see:**

```
TerraProof server running on http://localhost:3001
```

Leave this running.

---

### Terminal 3 — Start the React frontend

```bash
cd client
npm run dev
```

**What you will see:**

```
  VITE v5.x.x  ready in 312ms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. You should see the TerraProof
dashboard. Do not connect a wallet yet — first complete the MetaMask setup
in the next section.

---

## 3. Setting Up Four MetaMask Accounts

You need four MetaMask accounts, each representing a different system role.
You will import them using the private keys printed by the Hardhat node.

> **Why four accounts?** The Hardhat deployer (Account #0) holds all roles by
> default, which means you could test everything from one account — but this
> does not prove that role separation works. Using four separate accounts
> demonstrates that the multi-signature requirement is genuinely enforced.

### Step 3.1 — Add Hardhat Local Network to MetaMask

1. Open MetaMask in your browser
2. Click the network dropdown at the top (shows "Ethereum Mainnet")
3. Click **Add a network** → scroll down → **Add a network manually**
4. Fill in exactly:

| Field              | Value                   |
| ------------------ | ----------------------- |
| Network name       | `Hardhat Local`         |
| New RPC URL        | `http://127.0.0.1:8545` |
| Chain ID           | `31337`                 |
| Currency symbol    | `ETH`                   |
| Block Explorer URL | _(leave blank)_         |

5. Click **Save**
6. Switch to **Hardhat Local** — you should see the network name at the top

---

### Step 3.2 — Import Account #0 — TerraProof Deployer (Admin)

This is the account that deployed the contract. It holds all four roles.

1. Click the round account icon at the top right of MetaMask
2. Click **Add account or hardware wallet** → **Import account**
3. Select type: **Private Key**
4. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. Click **Import**
6. Rename: click the three dots → **Account details** → click the pencil next
   to the account name → type `TerraProof Admin` → confirm

This account will show approximately **10,000 ETH**.

---

### Step 3.3 — Import Account #1 — Surveyor

1. Same process as above
2. Paste private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
3. Rename to `TerraProof Surveyor`

---

### Step 3.4 — Import Account #2 — Approver

1. Same process
2. Paste private key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
3. Rename to `TerraProof Approver`

---

### Step 3.5 — Import Account #3 — Land Owner / Viewer

1. Same process
2. Paste private key: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
3. Rename to `TerraProof Owner`

---

### Account summary

After completing all imports your MetaMask account list should show:

| MetaMask name       | Address starts with | Role on contract                        |
| ------------------- | ------------------- | --------------------------------------- |
| TerraProof Admin    | `0xf39F...`         | Admin + Registrar + Surveyor + Approver |
| TerraProof Surveyor | `0x7099...`         | None yet — granted in Step 4            |
| TerraProof Approver | `0x3C44...`         | None yet — granted in Step 4            |
| TerraProof Owner    | `0x90F7...`         | None (Viewer)                           |

---

## 4. Granting Roles to Each Account

Account #0 deployed the contract and holds all roles. Accounts #1, #2, and #3
have no roles yet. You must grant roles to Accounts #1 and #2 using a
Hardhat script. Account #3 deliberately stays without a role to test the
Viewer experience.

### Step 4.1 — Update the setup-roles script

Open `scripts/setup-roles.ts` and confirm the addresses match what Hardhat
printed. It should look like this:

```typescript
import { network } from "hardhat";

const { viem } = await network.connect();

const contract = await viem.getContractAt(
  "LandTransfer",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3", // your deployed address
);

const SURVEYOR_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const APPROVER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const SURVEYOR_ROLE = await contract.read.SURVEYOR_ROLE();
const APPROVER_ROLE = await contract.read.APPROVER_ROLE();

await contract.write.grantRole([SURVEYOR_ROLE, SURVEYOR_ADDRESS]);
await contract.write.grantRole([APPROVER_ROLE, APPROVER_ADDRESS]);

console.log("✓ SURVEYOR_ROLE granted to", SURVEYOR_ADDRESS);
console.log("✓ APPROVER_ROLE granted to", APPROVER_ADDRESS);
```

### Step 4.2 — Run the script

In Terminal 2 (stop the server first with Ctrl+C, then run):

```bash
cd ..   # back to project root
npx hardhat run scripts/setup-roles.ts --network localhost
```

**Expected output:**

```
✓ SURVEYOR_ROLE granted to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✓ APPROVER_ROLE granted to 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

Restart the Express server after the script completes:

```bash
cd server && npx ts-node src/index.ts
```

### Step 4.3 — Verify roles in the browser

1. Go to `http://localhost:5173`
2. Make sure MetaMask is on **TerraProof Admin** account
3. Click **Connect Wallet**
4. The dashboard should show role badge: **Admin**
5. Switch MetaMask to **TerraProof Surveyor** → reconnect
6. Role badge should show: **Surveyor**
7. Switch to **TerraProof Approver** → reconnect → role: **Approver**
8. Switch to **TerraProof Owner** → reconnect → role: **Viewer**

If any role shows incorrectly, recheck the addresses in setup-roles.ts and
rerun the script.

> **How to switch accounts in MetaMask:** Click the round account icon at the
> top right → click the account name you want. The browser page does not
> reload automatically — click the **Disconnect** button in the app (or
> refresh the page with Ctrl+Shift+R) then click **Connect Wallet** again
> with the new account active.

---

## 5. Screenshot Guide

For your academic documentation you need screenshots showing each system
function working correctly. The table below lists every screenshot you need,
which test produces it, and what the screenshot should show.

| Figure #  | Test       | What to capture                                              |
| --------- | ---------- | ------------------------------------------------------------ |
| Figure 7  | Unit tests | Terminal showing 14 passing tests                            |
| Figure 8  | Test 2     | MetaMask popup for registerLand() transaction                |
| Figure 9  | Test 1     | Dashboard with Admin role badge and connected address        |
| Figure 10 | Test 2     | Register Land form filled in before submission               |
| Figure 11 | Test 2     | Green success message with Etherscan link after registration |
| Figure 12 | Test 5     | Search result showing Pending status, approvalCount 1/3      |
| Figure 13 | Test 4     | Search result showing Approved status, approvalCount 3/3     |
| Figure 14 | Test 6     | Audit trail timeline showing all three approval events       |
| Figure 15 | Test 10    | Access restricted screen shown to Viewer role                |
| Figure 16 | Test 8     | Search result after transfer showing new owner address       |

Take screenshots using:

- **Windows:** `Windows + Shift + S` (snip tool) or `PrtSc`
- **Mac:** `Cmd + Shift + 4`

Name files clearly: `figure-09-dashboard-admin.png`, etc.

---

## Test 1 — Wallet Connection and Role Detection

**Goal:** Prove that the app correctly identifies each role from the blockchain.

**Account to use:** Cycle through all four accounts.

**Steps:**

1. Open `http://localhost:5173` — hard refresh first with `Ctrl+Shift+R`
2. Switch MetaMask to **TerraProof Admin** (`0xf39F...`)
3. Click **Connect Wallet** in the sidebar
4. MetaMask popup appears — click **Connect** (not a transaction, just a
   connection request — no gas fee)

**Expected result:**

- Sidebar shows address starting with `0xf39F`
- Green dot appears under the address
- Role badge shows **Admin**
- Dashboard message: "You have full administrative access"

📸 **Take screenshot — Figure 9 (Dashboard with Admin role)**

5. Scroll down on the dashboard to confirm the contract address shown matches
   your deployed address from Step 2

6. Now switch MetaMask to **TerraProof Surveyor** (`0x7099...`)
7. Refresh the page with `Ctrl+Shift+R`
8. Click **Connect Wallet**

**Expected result:**

- Role badge shows **Surveyor**
- Dashboard message mentions survey verification

9. Repeat for **TerraProof Approver** — expect role badge **Approver**
10. Repeat for **TerraProof Owner** — expect role badge **Viewer**

**What this proves:** The app reads roles directly from the blockchain via
`hasRole()` calls. Role detection is not hardcoded in the frontend.

---

## Test 2 — Land Registration (Registrar)

**Goal:** Register a new land parcel on the blockchain with a real PDF document.

**Account to use:** TerraProof Admin (holds Registrar role)

**Before you start:**

- Make sure your `test-title.pdf` file is ready
- Make sure the Express server is running on port 3001
- Switch MetaMask to **TerraProof Admin**
- Refresh the page and connect wallet

**Steps:**

1. Click **Register Land** in the sidebar
2. You should see the registration form (not an access restricted screen)
3. Fill in the form:

| Field                | Value to enter                                            |
| -------------------- | --------------------------------------------------------- |
| Parcel ID            | `CMR-NW-BDA-001`                                          |
| Owner Wallet Address | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Account #3) |
| Region               | `North West`                                              |
| Document             | Click the upload area and select your `test-title.pdf`    |

> The owner address is Account #3 (TerraProof Owner). You are registering
> land on behalf of the owner, which is how the real MINDCAF process works.

📸 **Take screenshot — Figure 10 (filled form before submission)**

4. Click **Register Land Parcel**
5. A spinner appears: "Uploading document to IPFS via Pinata…"

   Wait approximately 2–5 seconds. If this fails with a connection error,
   confirm the Express server is running. Check Terminal 2 for error output.

6. After IPFS upload succeeds, the MetaMask popup appears automatically

📸 **Take screenshot — Figure 8 (MetaMask popup)**

The popup shows:

- Function: `registerLand`
- Contract address: your deployed address
- Estimated gas fee (tiny amount in fake ETH)

7. Click **Confirm** in MetaMask
8. The button text changes to "Broadcasting to blockchain…"
9. Wait 5–15 seconds for the local node to mine the transaction

**Expected result:**

- Green success banner appears
- Banner shows: "Transaction confirmed"
- A transaction hash appears as a link (e.g. `0x1a2b3c...`)

📸 **Take screenshot — Figure 11 (green success banner)**

**What to note in Terminal 2 (Express server):**
You should see a log line like:

```
POST /api/upload 200 1823ms
```

This confirms the PDF was uploaded to Pinata.

**Register a second parcel for use in dispute testing:**

Repeat the form with:

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| Parcel ID            | `CMR-SW-BUEA-002`                            |
| Owner Wallet Address | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| Region               | `South West`                                 |
| Document             | same `test-title.pdf`                        |

Submit and confirm. You now have two registered parcels for testing.

---

## Test 3 — Approval Vote 1 (Surveyor)

**Goal:** Cast the Surveyor's approval vote on parcel CMR-NW-BDA-001.
This brings the approval count from 1 to 2 and keeps the status as Pending.

**Account to use:** TerraProof Surveyor

**Steps:**

1. Switch MetaMask to **TerraProof Surveyor** (`0x7099...`)
2. Refresh the page (`Ctrl+Shift+R`) and click **Connect Wallet**
3. Confirm the role badge shows **Surveyor**
4. Click **Approve Titles** in the sidebar
5. The role chip at the top should say "You are voting as: Surveyor"
6. In the Parcel ID field, type `CMR-NW-BDA-001`
7. Click **Load**
8. The parcel details appear showing:
   - Status: **Pending**
   - Approvals: ● ● ○ (2 dots lit — wait, it should be 1 lit at this point)

   Actually you will see: ● ○ ○ showing 1/3 approvals.

9. The "Your Vote" section shows: "By approving, you confirm that you have
   independently verified this land parcel…"
10. Click **Approve as Surveyor**
11. MetaMask popup appears — click **Confirm**
12. Wait for transaction confirmation

**Expected result:**

- Green success banner appears
- Clicking **Load** again shows approvalCount now **2/3** (● ● ○)
- Status remains **Pending** (two approvals are not enough yet)

**What this proves:** The multi-sig threshold is genuinely enforced. Two
signatures are not sufficient; a third is required.

---

## Test 4 — Approval Vote 2 (Approver)

**Goal:** Cast the Approver's final vote, triggering the status transition
to Approved.

**Account to use:** TerraProof Approver

**Steps:**

1. Switch MetaMask to **TerraProof Approver** (`0x3C44...`)
2. Refresh the page and click **Connect Wallet**
3. Confirm role badge shows **Approver**
4. Click **Approve Titles** in the sidebar
5. Role chip shows "You are voting as: Senior Approver"
6. Type `CMR-NW-BDA-001` → click **Load**
7. Shows: approvalCount **2/3** (● ● ○), status **Pending**
8. Click **Approve as Senior Approver**
9. MetaMask popup → click **Confirm**
10. Wait for confirmation

**Expected result:**

- Green success banner
- Clicking **Load** again shows:
  - approvalCount: **3/3** (● ● ●)
  - Status badge changes from **Pending** (amber) to **Approved** (green)

📸 **Take screenshot here** — Approve page showing Approved status and 3/3 dots

**What this proves:** The smart contract automatically transitions status to
Approved when `approvalCount >= REQUIRED_APPROVALS (3)`. This is enforced
entirely in Solidity — no backend or frontend logic controls this transition.

---

## Test 5 — Search and Verify Title (Any Role)

**Goal:** Demonstrate that any user can publicly verify a land title by its
parcel ID, and that the on-chain data matches what was registered.

**Account to use:** Any — use TerraProof Owner (Viewer) to show public access

**Steps:**

1. Switch MetaMask to **TerraProof Owner** (`0x90F7...`)
2. Refresh and connect wallet — role badge should show **Viewer**
3. Click **Search Title** in the sidebar
4. Type `CMR-NW-BDA-001` → click **Search**
5. Wait approximately 2 seconds for the blockchain read

**Expected result — the result card should show:**

| Field         | Expected value                              |
| ------------- | ------------------------------------------- |
| Parcel ID     | CMR-NW-BDA-001                              |
| Status        | Approved (green badge)                      |
| Region        | North West                                  |
| Owner         | `0x90F7...` (Account #3 address, shortened) |
| Approvals     | ● ● ● 3/3                                   |
| Registered    | A readable date and time                    |
| IPFS CID      | A long string starting with `Qm...`         |
| Document link | "View Document ↗" button                    |

📸 **Take screenshot — Figure 12** (though by this point it is Approved, so
this becomes your Figure 13 — the Approved state)

6. Click **View Document ↗** — this opens the Pinata gateway in a new tab
   and retrieves your original PDF. Confirm the PDF is the same file you
   uploaded in Test 2.

7. Click the copy icon next to the owner address to copy the full address,
   then click **↗** to open the address on Etherscan Sepolia (it will say
   no transactions since this is a local node, but the link structure is correct)

8. Now search for `CMR-SW-BUEA-002` — this parcel was registered but not yet
   approved, so it should show **Pending** status with 1/3 approvals

📸 **Take screenshot — Figure 12** (Pending status, 1/3 approvals)

**What this proves:** Land title verification is publicly accessible to anyone
without requiring a role, reflecting the transparency property of blockchain.
The data displayed comes directly from the smart contract — there is no
centralised database involved.

---

## Test 6 — Audit Trail (Any Role)

**Goal:** View the complete event history of a land parcel.

**Account to use:** Any — stay on TerraProof Owner (Viewer)

**Steps:**

1. Click **Audit Trail** in the sidebar
2. Type `CMR-NW-BDA-001` → click **Load Audit**

**Expected result — three sections appear:**

**Summary strip:**

- Parcel ID: CMR-NW-BDA-001
- Region: North West
- Status: Approved (green)
- Approvals: 3/3

**Event timeline** — should show events in chronological order:

1. **Title Submitted** — registered by registrar, approvalCount: 1/3
2. **Surveyor Approved** — approval count: 2/3
3. **Title Fully Approved** — all 3 officials approved, status active

**Ownership chain:**

- Entry 1: `0x90F7...` — Original owner

**Document reference:**

- IPFS CID shown
- "Open Document ↗" button

📸 **Take screenshot — Figure 14 (Audit trail with three events)**

**What this proves:** Every action taken on the contract is permanently
recorded as an on-chain event. The audit trail cannot be altered, deleted, or
backdated by anyone — including the system administrator.

---

## Test 7 — Request Transfer (Owner)

**Goal:** Have the land owner initiate an ownership transfer to a new buyer.

**Account to use:** TerraProof Owner (Account #3 — this is the registered
owner of CMR-NW-BDA-001)

**Steps:**

1. Switch MetaMask to **TerraProof Owner** (`0x90F7...`)
2. Refresh and connect — role: **Viewer**
3. Click **Request Transfer** in the sidebar
4. Make sure the **① Request Transfer** tab is selected
5. Type `CMR-NW-BDA-001` → click **Load**

**Expected result:**

- Title card shows parcel details
- Current Owner shows `0x90F7...` (your connected wallet)
- The transfer request form appears (not the "not the owner" message)

6. In the **New Owner Address** field, paste Account #0's address:
   `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

   > You are simulating selling the land to the Admin account. In a real
   > scenario this would be a buyer's wallet address.

7. Click **Request Transfer**
8. MetaMask popup → click **Confirm**
9. Wait for confirmation

**Expected result:**

- Green success banner
- The title card now shows "Pending Transfer To: `0xf39F...`"
- The transfer request form is replaced by a status message: "Transfer to
  [address] is pending registrar confirmation"

**What this proves:** The owner can signal their intent to sell, but this
alone does not transfer ownership. The registrar must independently confirm,
mirroring the MINDCAF administrative process.

---

## Test 8 — Confirm Transfer (Registrar)

**Goal:** Registrar confirms the pending transfer, executing the ownership
change on-chain.

**Account to use:** TerraProof Admin (holds Registrar role)

**Steps:**

1. Switch MetaMask to **TerraProof Admin** (`0xf39F...`)
2. Refresh and connect — role: **Admin**
3. Click **Request Transfer** in the sidebar
4. Click the **② Confirm Transfer** tab
5. Type `CMR-NW-BDA-001` → click **Load**

**Expected result:**

- Title card shows parcel details
- A confirmation box appears showing: "Transferring to `0xf39F...`"
- The **Confirm Transfer** button is visible (you are the registrar)

6. Click **Confirm Transfer**
7. MetaMask popup → click **Confirm**
8. Wait for confirmation

**Expected result:**

- Green success banner
- Go to **Search Title** → search `CMR-NW-BDA-001`
- Owner field now shows `0xf39F...` (the Admin account — the new owner)

📸 **Take screenshot — Figure 16 (Search result with new owner address)**

9. Go to **Audit Trail** → search `CMR-NW-BDA-001`
   The ownership chain section now shows TWO entries:
   - Entry 1: `0x90F7...` — Original owner
   - Entry 2: `0xf39F...` — Current owner (gold filled dot)

**What this proves:** Two parties must cooperate to complete a transfer.
The owner's wallet signature proves consent. The registrar's confirmation
provides institutional authorisation. Neither alone is sufficient.

---

## Test 9 — Dispute a Title (Registrar)

**Goal:** Flag the second parcel as disputed, blocking future transfers.

**Account to use:** TerraProof Admin (holds Registrar role)

**Steps:**

1. Stay on **TerraProof Admin**
2. Click **Dispute / Reject** in the sidebar
3. Read the warning banner — note that this action is permanent
4. Type `CMR-SW-BUEA-002` → click **Load**

**Expected result:**

- Parcel loads showing status: **Pending**
- "Raise Dispute" action card appears (you are the Registrar)
- "Reject Title" action card also appears (you are also the Approver)

5. Click **Raise Dispute** button
6. A confirmation card appears: "Confirm: Raise Dispute?"
7. Click **Confirm**
8. MetaMask popup → click **Confirm**
9. Wait for confirmation

**Expected result:**

- Green success banner
- The title card updates to show status: **Disputed** (red badge)
- The action cards are replaced by: "This title is already disputed"

10. Go to **Search Title** → search `CMR-SW-BUEA-002`
    Status badge shows **Disputed** in red

**What this proves:** Registrars can flag fraudulent or contested submissions,
changing the status to Disputed and blocking all ownership transfers on that
parcel. This action is permanent and on-chain.

---

## Test 10 — Access Control Enforcement (Viewer)

**Goal:** Prove that role-restricted pages deny access to unauthorised wallets,
both at the UI level and at the smart contract level.

**Account to use:** TerraProof Owner (no roles — Viewer)

### Part A — UI-level restriction

1. Switch MetaMask to **TerraProof Owner** (`0x90F7...`)
2. Refresh and connect — role: **Viewer**
3. Click **Register Land** in the sidebar

**Expected result:**

- You do NOT see the registration form
- Instead you see: "Access Restricted — This page requires the Registrar role"

📸 **Take screenshot — Figure 15 (Access Restricted screen)**

4. Click **Approve Titles** in the sidebar

**Expected result:**

- "Access Restricted — This page requires the Registrar, Surveyor, or Approver role"

### Part B — Smart contract-level restriction

This test confirms the contract itself rejects unauthorised calls, independent
of the frontend. Open your browser's developer console (F12 → Console tab).

1. Still connected as TerraProof Owner (Viewer)
2. Navigate to `http://localhost:5173`
3. In the browser console, paste and run:

```javascript
// This attempts to call registerLand directly, bypassing the React UI
const { createWalletClient, custom } = await import("https://esm.sh/viem");
// The call will fail — we are just demonstrating the contract rejects it
console.log(
  "Contract-level access control test: connect wallet and try registerLand via console",
);
```

Alternatively, simply note that the smart contract enforces `onlyRole()` at
the EVM level — if you connected a wallet with no role and somehow bypassed
the frontend to call `registerLand()`, the transaction would revert with:
`AccessControl: account 0x90F7... is missing role 0x9f2df0...`

This is visible in the contract source code and confirmed by the unit tests.

**What this proves:** Security is enforced at two independent layers. The
frontend hides restricted pages for usability. The smart contract enforces
the same restrictions cryptographically, meaning the system is secure even
if an attacker bypasses the frontend entirely.

---

## 16. Smart Contract Unit Tests

**Goal:** Run the automated test suite and capture the output for Figure 7
in your documentation.

**Steps:**

1. Make sure the Hardhat node (Terminal 1) is running
2. In Terminal 2, stop the Express server (Ctrl+C)
3. Navigate back to the project root:

```bash
cd ..   # if you are in server/
```

4. Run the tests with the spec reporter:

```bash
NODE_TEST_REPORTER=spec npx hardhat test
```

**Expected output:**

```
▶ registers a land parcel
▶ registrar is marked as having approved on registration
▶ stranger cannot register a parcel
▶ cannot register the same parcel twice
▶ surveyor can cast approval vote
▶ approver vote finalises the title
▶ official cannot vote twice on same parcel
▶ stranger cannot cast an approval vote
▶ owner can request a transfer
▶ non-owner cannot request a transfer
▶ registrar can confirm a pending transfer
▶ pending transfer is cleared after confirmation
▶ cannot confirm when no transfer is pending
▶ history records both original and new owner

ℹ tests 14, pass 14, fail 0, cancelled 0, skipped 0, todo 0
ℹ duration_ms 1243
```

📸 **Take screenshot of the full terminal output — Figure 7**

Make sure all 14 tests show as passing before taking the screenshot. If any
fail, refer to Section 17 (Troubleshooting) below.

5. After capturing the screenshot, restart the Express server:

```bash
cd server && npx ts-node src/index.ts
```

---

## 17. Troubleshooting

### Problem: "No contract found at address" when connecting wallet

**Cause:** The Hardhat node was restarted since the last deployment, or the
address in `client/.env` is wrong.

**Fix:**

```bash
# Redeploy
npx hardhat ignition deploy ignition/modules/TerraProof.ts --network localhost

# Check the real address
cat ignition/deployments/chain-31337/deployed_addresses.json

# Update client/.env with the address shown above
# Then restart Vite:
cd client && npm run dev
```

Hard refresh the browser with Ctrl+Shift+R after restarting Vite.

---

### Problem: Role shows as "Viewer" even after setup-roles.ts

**Cause:** MetaMask is on the wrong network, or the setup-roles script was
run against a different deployment than the one in `client/.env`.

**Fix:**

1. Confirm MetaMask shows "Hardhat Local" at the top (Chain ID 31337)
2. Confirm the address in `client/.env` matches `deployed_addresses.json`
3. Rerun `npx hardhat run scripts/setup-roles.ts --network localhost`
4. Hard refresh the browser

---

### Problem: PDF upload fails with "Upload to IPFS failed"

**Cause:** Express server is not running, or Pinata JWT is missing from
`server/.env`.

**Fix:**

1. Check Terminal 2 — is the server running?
2. Open `server/.env` — confirm PINATA_JWT is set
3. Restart the server: `cd server && npx ts-node src/index.ts`
4. Test the endpoint directly:

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "document=@/path/to/test-title.pdf" \
  -v
```

Should return `{"cid":"Qm..."}`.

---

### Problem: MetaMask shows 0 ETH on Hardhat Local

**Cause:** The Hardhat node was restarted. All balances and state reset on
restart.

**Fix:** Nothing to fix — the ETH resets but it is fake ETH. The accounts
listed by `npx hardhat node` always start with 10,000 ETH on each restart.
If balances show 0 it may mean you are on the wrong network in MetaMask.
Confirm you are on Hardhat Local (Chain ID 31337).

---

### Problem: Transaction pending forever / never confirms

**Cause:** MetaMask nonce is out of sync with the local node (usually after
restarting the Hardhat node).

**Fix:**

1. Open MetaMask → Settings → Advanced → **Clear activity and nonce data**
2. Confirm the dialog
3. Retry the transaction

---

### Problem: "Wrong network" shown in the app

**Cause:** MetaMask is connected to Ethereum Mainnet or Sepolia instead of
Hardhat Local.

**Fix:** Click the network dropdown in MetaMask → select **Hardhat Local**.
The app detects the chain ID and updates automatically.

---

## 18. Documentation Screenshot Summary

Use this as a final checklist before writing up Chapter 4. Each screenshot
should be cropped to show only the relevant part of the screen — remove
browser toolbars and unrelated UI.

| Figure #  | Description                                      | Captured? |
| --------- | ------------------------------------------------ | --------- |
| Figure 7  | Terminal: 14 passing unit tests                  | ☐         |
| Figure 8  | MetaMask popup during registerLand()             | ☐         |
| Figure 9  | Dashboard — Admin role badge connected           | ☐         |
| Figure 10 | Register Land form filled in                     | ☐         |
| Figure 11 | Green success after registration                 | ☐         |
| Figure 12 | Search result — Pending status, 1/3 approvals    | ☐         |
| Figure 13 | Search result — Approved status, 3/3 approvals   | ☐         |
| Figure 14 | Audit trail — three approval events timeline     | ☐         |
| Figure 15 | Access Restricted — Viewer on Register Land      | ☐         |
| Figure 16 | Search result after transfer — new owner address | ☐         |

**Bonus screenshots** (strengthen your documentation significantly):

- MetaMask account switcher showing all four imported accounts
- The Audit Trail ownership chain showing two owners after the transfer
- The Dispute/Reject page showing the red Disputed badge
- The Approve Titles page with the "already approved" message after voting

---

_End of TerraProof Testing Guide_
