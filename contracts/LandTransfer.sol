// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./LandRegistry.sol";

contract LandTransfer is LandRegistry {
    // ─── Transfer functions ───────────────────────────────────
    // ─── Step 1a: Owner requests a transfer ──────────────────
    function requestTransfer(
        string memory parcelId,
        address newOwner
    ) external {
        LandTitle storage t = titles[parcelId];
        require(_exists(parcelId), "Land parcel not found");
        require(t.owner == msg.sender, "You are not the owner");
        require(t.status == TitleStatus.Approved, "Title is not active");
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != msg.sender, "Cannot transfer to yourself");

        pendingTransfers[parcelId] = newOwner;
        emit TransferRequested(parcelId, msg.sender, newOwner);
    }

    // ─── Step 1b: Registrar confirms the transfer ────────────
    function confirmTransfer(
        string memory parcelId
    ) external onlyRole(REGISTRAR_ROLE) {
        require(_exists(parcelId), "Parcel not found");

        address newOwner = pendingTransfers[parcelId];
        require(newOwner != address(0), "No pending transfer for this parcel");

        address prev = titles[parcelId].owner;
        titles[parcelId].owner = newOwner;
        titles[parcelId].updatedAt = block.timestamp;
        ownerHistory[parcelId].push(newOwner);

        delete pendingTransfers[parcelId]; // clean up

        emit OwnershipTransferred(parcelId, prev, newOwner, block.timestamp);
    }

    // ─── Dispute & Rejection ─────────────────────────────────
    function raiseDispute(
        string memory parcelId
    ) external onlyRole(REGISTRAR_ROLE) {
        require(_exists(parcelId), "Parcel not found");
        titles[parcelId].status = TitleStatus.Disputed;
        titles[parcelId].updatedAt = block.timestamp;
        emit TitleDisputed(parcelId, msg.sender);
    }

    function rejectTitle(
        string memory parcelId
    ) external onlyRole(APPROVER_ROLE) {
        require(_exists(parcelId), "Parcel not found");
        require(
            titles[parcelId].status == TitleStatus.Pending,
            "Can only reject a pending title"
        );
        titles[parcelId].status = TitleStatus.Rejected;
        titles[parcelId].updatedAt = block.timestamp;
        emit TitleRejected(parcelId, msg.sender);
    }
}
