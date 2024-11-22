import { BigInt } from "@graphprotocol/graph-ts";
import {
  OwnershipTransferred,
  RawAccountBalance,
  RawMarket,
} from "../generated/schema";
import { OwnershipTransferred as OwnershipTransferredEvent } from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import { CHAIN_ID, VAULT_MARKET_TYPE } from "./constants";

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

  entity.oldOwner = event.params.oldOwner.toHexString();
  entity.newOwner = event.params.newOwner.toHexString();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // Update RawMarket owner
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    rawMarket.owner = event.params.newOwner.toHexString();
    rawMarket.save();
  }
  // ============== xxxxx ==============

  if (rawMarket != null) {
    let prevRawAccountBalanceIP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(rawMarket.owner)
    );

    if (prevRawAccountBalanceIP == null) {
      prevRawAccountBalanceIP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(rawMarket.owner)
      );

      prevRawAccountBalanceIP.chainId = CHAIN_ID;
      prevRawAccountBalanceIP.marketType = VAULT_MARKET_TYPE;
      prevRawAccountBalanceIP.marketId = event.address.toHexString();
      prevRawAccountBalanceIP.accountAddress = rawMarket.owner;
      prevRawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
      prevRawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
      prevRawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
      prevRawAccountBalanceIP.incentivesGivenIds = [];
      prevRawAccountBalanceIP.incentivesGivenAmount = [];
    }

    let newRawAccountBalanceIP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.newOwner.toHexString())
    );

    if (newRawAccountBalanceIP == null) {
      newRawAccountBalanceIP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(event.params.newOwner.toHexString())
      );

      newRawAccountBalanceIP.chainId = CHAIN_ID;
      newRawAccountBalanceIP.marketType = VAULT_MARKET_TYPE;
      newRawAccountBalanceIP.marketId = event.address.toHexString();
      newRawAccountBalanceIP.accountAddress =
        event.params.newOwner.toHexString();
      newRawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
      newRawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
      newRawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
      newRawAccountBalanceIP.incentivesGivenIds = [];
      newRawAccountBalanceIP.incentivesGivenAmount = [];
    }

    // Get the values from the previous account balance
    let prevQuantityReceivedAmount =
      prevRawAccountBalanceIP.quantityReceivedAmount;
    let prevIncentivesGivenIds = prevRawAccountBalanceIP.incentivesGivenIds;
    let prevIncentivesGivenAmount =
      prevRawAccountBalanceIP.incentivesGivenAmount;

    // Copy over the values from the previous account balance
    newRawAccountBalanceIP.quantityReceivedAmount = prevQuantityReceivedAmount;
    newRawAccountBalanceIP.incentivesGivenIds = prevIncentivesGivenIds;
    newRawAccountBalanceIP.incentivesGivenAmount = prevIncentivesGivenAmount;

    newRawAccountBalanceIP.save();

    // Reset the previous account balance
    prevRawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
    prevRawAccountBalanceIP.incentivesGivenIds = [];
    prevRawAccountBalanceIP.incentivesGivenAmount = [];

    prevRawAccountBalanceIP.save();
  }
}
