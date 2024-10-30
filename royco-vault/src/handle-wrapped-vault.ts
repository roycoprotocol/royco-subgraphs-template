import { BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit,
  RawActivity,
  RawMarket,
  Withdraw,
  FrontendFeeUpdated,
  RawAccountBalance,
} from "../generated/schema";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  FrontendFeeUpdated as FrontendFeeUpdatedEvent,
} from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import {
  CHAIN_ID,
  DEPOSIT,
  VAULT_MARKET_TYPE,
  FRONTEND_FEE_UPDATED,
} from "./constants";

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.caller = event.params.caller.toHexString();
  entity.owner = event.params.owner.toHexString();
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // Get Raw Market entity
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  // ============== ..... ==============
  // Update Raw Market entity
  if (rawMarket != null) {
    rawMarket.quantityOffered = rawMarket.quantityOffered.plus(
      event.params.assets
    );
    rawMarket.quantityOfferedFilled = rawMarket.quantityOfferedFilled.plus(
      event.params.shares
    );

    // Update volume token ids and amounts
    let volumeTokenIds = rawMarket.volumeTokenIds;
    let volumeAmounts = rawMarket.volumeAmounts;

    let index = volumeTokenIds.indexOf(rawMarket.inputTokenId);

    if (index != -1) {
      volumeAmounts[index] = volumeAmounts[index].plus(event.params.assets);
    } else {
      volumeTokenIds.push(rawMarket.inputTokenId);
      volumeAmounts.push(event.params.assets);
    }

    rawMarket.volumeTokenIds = volumeTokenIds;
    rawMarket.volumeAmounts = volumeAmounts;

    rawMarket.save();
  }
  // ============== xxxxx ==============

  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Account Balance entity
    let rawAccountBalance = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(rawMarket.owner)
    );

    if (rawAccountBalance == null) {
      rawAccountBalance = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(rawMarket.owner)
      );

      rawAccountBalance.chainId = CHAIN_ID;
      rawAccountBalance.marketType = VAULT_MARKET_TYPE;
      rawAccountBalance.marketId = event.address.toHexString();
      rawAccountBalance.accountAddress = rawMarket.owner;
      rawAccountBalance.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalance.quantityReceivedAmount = BigInt.zero();
      rawAccountBalance.incentivesGivenIds = [];
      rawAccountBalance.incentivesGivenAmount = [];
    }

    // Update quantityReceivedAmount
    rawAccountBalance.quantityReceivedAmount =
      rawAccountBalance.quantityReceivedAmount.plus(event.params.assets);

    rawAccountBalance.save();
    // ============== xxxxx ==============
  }

  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Activity entity for AP
    let rawActivityAP = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivityAP.chainId = CHAIN_ID;
    rawActivityAP.marketType = VAULT_MARKET_TYPE;
    rawActivityAP.marketId = event.address.toHexString();
    rawActivityAP.accountAddress = event.params.owner.toHexString();
    rawActivityAP.activityType = DEPOSIT;
    rawActivityAP.tokensGivenIds = [rawMarket.inputTokenId];
    rawActivityAP.tokensGivenAmount = [event.params.assets];
    rawActivityAP.tokensReceivedIds = [];
    rawActivityAP.tokensReceivedAmount = [];
    rawActivityAP.blockNumber = event.block.number;
    rawActivityAP.blockTimestamp = event.block.timestamp;
    rawActivityAP.transactionHash = event.transaction.hash.toHexString();
    rawActivityAP.logIndex = event.logIndex;

    rawActivityAP.save();
    // ============== xxxxx ==============
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.caller = event.params.caller.toHexString();
  entity.receiver = event.params.receiver.toHexString();
  entity.owner = event.params.owner.toHexString();
  entity.assets = event.params.assets;
  entity.shares = event.params.shares;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // Get Raw Market entity
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Account Balance entity
    let rawAccountBalance = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(rawMarket.owner)
    );

    if (rawAccountBalance == null) {
      rawAccountBalance = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(rawMarket.owner)
      );

      rawAccountBalance.chainId = CHAIN_ID;
      rawAccountBalance.marketType = VAULT_MARKET_TYPE;
      rawAccountBalance.marketId = event.address.toHexString();
      rawAccountBalance.accountAddress = rawMarket.owner;
      rawAccountBalance.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalance.quantityReceivedAmount = BigInt.zero();
      rawAccountBalance.incentivesGivenIds = [];
      rawAccountBalance.incentivesGivenAmount = [];
    }

    // Update quantityReceivedAmount
    rawAccountBalance.quantityReceivedAmount =
      rawAccountBalance.quantityReceivedAmount.minus(event.params.assets);

    rawAccountBalance.save();
    // ============== xxxxx ==============
  }

  // ============== ..... ==============
  // Update Raw Market entity
  if (rawMarket != null) {
    rawMarket.quantityOffered = rawMarket.quantityOffered.minus(
      event.params.assets
    );
    rawMarket.quantityOfferedFilled = rawMarket.quantityOfferedFilled.minus(
      event.params.shares
    );

    rawMarket.save();
  }
  // ============== xxxxx ==============

  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Activity entity for AP
    let rawActivityAP = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivityAP.chainId = CHAIN_ID;
    rawActivityAP.marketType = VAULT_MARKET_TYPE;
    rawActivityAP.marketId = event.address.toHexString();
    rawActivityAP.accountAddress = event.params.owner.toHexString();
    rawActivityAP.activityType = DEPOSIT;
    rawActivityAP.tokensGivenIds = [];
    rawActivityAP.tokensGivenAmount = [];
    rawActivityAP.tokensReceivedIds = [rawMarket.inputTokenId];
    rawActivityAP.tokensReceivedAmount = [event.params.assets];
    rawActivityAP.blockNumber = event.block.number;
    rawActivityAP.blockTimestamp = event.block.timestamp;
    rawActivityAP.transactionHash = event.transaction.hash.toHexString();
    rawActivityAP.logIndex = event.logIndex;

    rawActivityAP.save();
    // ============== xxxxx ==============
  }
}

export function handleFrontendFeeUpdated(event: FrontendFeeUpdatedEvent): void {
  let entity = new FrontendFeeUpdated(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.frontendFee = event.params.frontendFee;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // Update Raw Market entity
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    rawMarket.frontendFee = event.params.frontendFee;
    rawMarket.save();
  }
  // ============== xxxxx ==============

  // New Raw Activity entity for IP
  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Activity entity for IP
    let rawActivityIP = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivityIP.chainId = CHAIN_ID;
    rawActivityIP.marketType = VAULT_MARKET_TYPE;
    rawActivityIP.marketId = event.address.toHexString();
    rawActivityIP.accountAddress = event.address.toHexString();
    rawActivityIP.activityType = FRONTEND_FEE_UPDATED;
    rawActivityIP.tokensGivenIds = [];
    rawActivityIP.tokensGivenAmount = [];
    rawActivityIP.tokensReceivedIds = [];
    rawActivityIP.tokensReceivedAmount = [];
    rawActivityIP.blockNumber = event.block.number;
    rawActivityIP.blockTimestamp = event.block.timestamp;
    rawActivityIP.transactionHash = event.transaction.hash.toHexString();
    rawActivityIP.logIndex = event.logIndex;

    rawActivityIP.save();
    // ============== xxxxx ==============
  }
}
