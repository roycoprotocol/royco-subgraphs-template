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
  AuthorizedPointIssuer,
} from "../generated/schema";
import { CHAIN_ID } from "./constants";

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
   * Update RawPoint
   */
  let rawPoint = RawPoint.load(
    CHAIN_ID.toString().concat("_").concat(event.address.toHexString())
  );

  if (rawPoint != null) {
    rawPoint.owner = event.params.newOwner.toHexString();
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

  rawAward.from = event.params.awardedBy.toHexString();
  rawAward.to = event.params.to.toHexString();
  rawAward.amount = event.params.amount;

  rawAward.blockNumber = event.block.number;
  rawAward.blockTimestamp = event.block.timestamp;
  rawAward.transactionHash = event.transaction.hash.toHexString();
  rawAward.logIndex = event.logIndex;

  rawAward.save();

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
  }

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
   * Update AuthorizedPointIssuer
   */
  let authorizedPointIssuer = new AuthorizedPointIssuer(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.address.toHexString())
      .concat("_")
      .concat(event.params.vault.toHexString())
  );

  authorizedPointIssuer.chainId = CHAIN_ID;
  authorizedPointIssuer.contractAddress = event.address.toHexString();
  authorizedPointIssuer.accountAddress = event.params.vault.toHexString();

  authorizedPointIssuer.save();
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
   * Update AuthorizedPointIssuer
   */
  let authorizedPointIssuer = AuthorizedPointIssuer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.address.toHexString())
      .concat("_")
      .concat(event.params.ip.toHexString())
  );

  if (authorizedPointIssuer == null) {
    authorizedPointIssuer = new AuthorizedPointIssuer(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.ip.toHexString())
    );
  }

  authorizedPointIssuer.status = true;
  authorizedPointIssuer.save();
}
