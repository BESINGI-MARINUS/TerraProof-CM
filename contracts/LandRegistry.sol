// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is AccessControl {
    // ─── Roles ───────────────────────────────────────────────
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant SURVEYOR_ROLE = keccak256("SURVEYOR_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    uint8 public constant REQUIRED_APPROVALS = 3;

    // ─── Data structures ─────────────────────────────────────
    enum TitleStatus {
        Pending,
        Approved,
        Disputed,
        Rejected
    }

    struct LandTitle {
        string parcelId;
        address owner;
        string ipfsCID; // IPFS hash of scanned titre foncier
        string region; // e.g. "South West", "Littoral"
        uint256 registeredAt; // block.timestamp of registration
        uint256 updatedAt; // block.timestamp of last state change
        TitleStatus status;
        uint8 approvalCount;
    }

    mapping(string => LandTitle) public titles; // parcelId → title
    mapping(string => address[]) public ownerHistory; // parcelId → ordered list of past owners
    mapping(string => mapping(address => bool)) public hasApproved; // parcelId → official address → has voted?
    mapping(string => address) public pendingTransfers; // parcelId → proposed new owner (set by current owner)

    // ─── Events ──────────────────────────────────────────────
    event TitleSubmitted(string parcelId, address owner, address registrar);
    event TitleApproved(
        string parcelId,
        address approvedBy,
        uint8 totalApprovals
    );
    event TitleFullyVerified(string parcelId, uint256 timestamp);
    event TransferRequested(string parcelId, address from, address to);
    event OwnershipTransferred(
        string parcelId,
        address from,
        address to,
        uint256 timestamp
    );
    event TitleDisputed(string parcelId, address raisedBy);
    event TitleRejected(string parcelId, address rejectedBy);

    // ─── Constructor ─────────────────────────────────────────
    constructor() {
        // Deployer gets all roles so they can set up the system
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(SURVEYOR_ROLE, msg.sender);
        _grantRole(APPROVER_ROLE, msg.sender);
    }

    // ─── Step 1: Registrar submits a parcel ──────────────────
    function registerLand(
        string memory parcelId,
        address owner,
        string memory ipfsCID,
        string memory region
    ) external onlyRole(REGISTRAR_ROLE) {
        require(!_exists(parcelId), "Parcel already registered");
        require(owner != address(0), "Invalid owner address");

        titles[parcelId] = LandTitle({
            parcelId: parcelId,
            owner: owner,
            ipfsCID: ipfsCID,
            region: region,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            status: TitleStatus.Pending,
            approvalCount: 1 // registrar's submission = approval #1
        });

        // Mark registrar as having already approved
        hasApproved[parcelId][msg.sender] = true;
        ownerHistory[parcelId].push(owner);

        emit TitleSubmitted(parcelId, owner, msg.sender);
        emit TitleApproved(parcelId, msg.sender, 1);
    }

    // ─── Step 2: Surveyor or Approver casts their vote ───────
    function approveLand(string memory parcelId) external {
        require(
            hasRole(SURVEYOR_ROLE, msg.sender) ||
                hasRole(APPROVER_ROLE, msg.sender) ||
                hasRole(REGISTRAR_ROLE, msg.sender),
            "Caller is not an authorised official"
        );

        LandTitle storage t = titles[parcelId];
        require(_exists(parcelId), "Parcel not found");
        require(
            t.status == TitleStatus.Pending,
            "Parcel is not pending approval"
        );
        require(
            !hasApproved[parcelId][msg.sender],
            "You have already approved this parcel"
        );

        hasApproved[parcelId][msg.sender] = true;
        t.approvalCount += 1;
        t.updatedAt = block.timestamp;

        emit TitleApproved(parcelId, msg.sender, t.approvalCount);

        if (t.approvalCount >= REQUIRED_APPROVALS) {
            t.status = TitleStatus.Approved;
            emit TitleFullyVerified(parcelId, block.timestamp);
        }
    }

    // ─── Read functions ───────────────────────────────────────
    function verifyTitle(
        string memory parcelId
    ) external view returns (LandTitle memory) {
        return titles[parcelId];
    }

    function getHistory(
        string memory parcelId
    ) external view returns (address[] memory) {
        return ownerHistory[parcelId];
    }

    function getApprovalStatus(
        string memory parcelId,
        address official
    ) external view returns (bool) {
        return hasApproved[parcelId][official];
    }

    // ─── Internal helpers ─────────────────────────────────────
    function _exists(string memory parcelId) internal view returns (bool) {
        return bytes(titles[parcelId].parcelId).length > 0;
    }
}
