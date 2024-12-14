import {
  OwnershipTransferred as OwnershipTransferredEvent,
  Award as AwardEvent,
  AllowedVaultAdded as AllowedVaultAddedEvent,
  AllowedIPAdded as AllowedIPAddedEvent,
} from "../generated/templates/PointsProgramTemplate/Points";
import {
  OwnershipTransferred,
  RawPoint,
  RawAward,
  RawPointBalance,
  Award,
  AllowedVaultAdded,
  AllowedIPAdded,
  RawAuthorizedPointIssuer,
} from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { Points as PointsProgram } from "../generated/templates/PointsProgramTemplate/Points";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.previousOwner = event.params.previousOwner.toHexString();
  entity.newOwner = event.params.newOwner.toHexString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  /**
   * Get details of the new Points program
   */
  let contract = PointsProgram.bind(event.address);

  let nameResult = contract.try_name();
  let symbolResult = contract.try_symbol();
  let decimalsResult = contract.try_decimals();

  let rawPoint = RawPoint.load(
    CHAIN_ID.toString().concat("-").concat(event.address.toHexString())
  );

  if (
    !nameResult.reverted &&
    !symbolResult.reverted &&
    !decimalsResult.reverted
  ) {
    if (rawPoint == null) {
      rawPoint = new RawPoint(
        CHAIN_ID.toString().concat("-").concat(event.address.toHexString())
      );
    }

    rawPoint.chainId = CHAIN_ID;
    rawPoint.contractAddress = event.address.toHexString();
    rawPoint.owner = event.params.newOwner.toHexString();
    rawPoint.name = nameResult.value;
    rawPoint.symbol = symbolResult.value;
    rawPoint.decimals = decimalsResult.value;
    rawPoint.totalSupply = BigInt.zero();

    rawPoint.blockNumber = event.block.number;
    rawPoint.blockTimestamp = event.block.timestamp;
    rawPoint.transactionHash = event.transaction.hash.toHexString();
    rawPoint.logIndex = event.logIndex;

    rawPoint.save();
  }
}

export function handleAward(event: AwardEvent): void {
  let entity = new Award(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.to = event.params.to.toHexString();
  entity.amount = event.params.amount;
  entity.awardedBy = event.params.awardedBy.toHexString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  /**
   * Update RawAward
   */
  let rawAward = new RawAward(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  rawAward.chainId = CHAIN_ID;
  rawAward.contractAddress = event.address.toHexString();

  rawAward.from = event.params.awardedBy.toHexString();
  rawAward.to = event.params.to.toHexString();
  rawAward.amount = event.params.amount;

  rawAward.blockNumber = event.block.number;
  rawAward.blockTimestamp = event.block.timestamp;
  rawAward.transactionHash = event.transaction.hash.toHexString();
  rawAward.logIndex = event.logIndex;

  rawAward.save();

  /**
   * Update RawPoint
   */
  let rawPoint = RawPoint.load(
    CHAIN_ID.toString().concat("-").concat(event.address.toHexString())
  );

  if (rawPoint != null) {
    rawPoint.totalSupply = rawPoint.totalSupply.plus(event.params.amount);
    rawPoint.save();
  }

  /**
   * Update RawPointBalance
   */
  let rawPointBalance = RawPointBalance.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.address.toHexString())
      .concat("_")
      .concat(event.params.to.toHexString())
  );

  if (rawPointBalance == null) {
    rawPointBalance = new RawPointBalance(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.to.toHexString())
    );

    rawPointBalance.chainId = CHAIN_ID;
    rawPointBalance.amount = BigInt.zero();
  }

  rawPointBalance.contractAddress = event.address.toHexString();
  rawPointBalance.accountAddress = event.params.to.toHexString();
  rawPointBalance.amount = rawPointBalance.amount.plus(event.params.amount);

  rawPointBalance.save();
}

export function handleAllowedVaultAdded(event: AllowedVaultAddedEvent): void {
  let entity = new AllowedVaultAdded(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.vault = event.params.vault.toHexString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  /**
   * Update RawAuthorizedPointIssuer
   */
  let rawAuthorizedPointIssuer = RawAuthorizedPointIssuer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.address.toHexString())
      .concat("_")
      .concat(event.params.vault.toHexString())
  );

  if (rawAuthorizedPointIssuer == null) {
    rawAuthorizedPointIssuer = new RawAuthorizedPointIssuer(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.vault.toHexString())
    );
  }

  rawAuthorizedPointIssuer.chainId = CHAIN_ID;
  rawAuthorizedPointIssuer.contractAddress = event.address.toHexString();
  rawAuthorizedPointIssuer.accountAddress = event.params.vault.toHexString();

  rawAuthorizedPointIssuer.save();
}

export function handleAllowedIPAdded(event: AllowedIPAddedEvent): void {
  let entity = new AllowedIPAdded(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.ip = event.params.ip.toHexString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  /**
   * Update RawAuthorizedPointIssuer
   */
  let rawAuthorizedPointIssuer = RawAuthorizedPointIssuer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.address.toHexString())
      .concat("_")
      .concat(event.params.ip.toHexString())
  );

  if (rawAuthorizedPointIssuer == null) {
    rawAuthorizedPointIssuer = new RawAuthorizedPointIssuer(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.ip.toHexString())
    );
  }

  rawAuthorizedPointIssuer.chainId = CHAIN_ID;
  rawAuthorizedPointIssuer.contractAddress = event.address.toHexString();
  rawAuthorizedPointIssuer.accountAddress = event.params.ip.toHexString();

  rawAuthorizedPointIssuer.save();
}
