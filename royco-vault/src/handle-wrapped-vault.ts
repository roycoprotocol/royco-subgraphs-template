import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit,
  RawActivity,
  RawMarket,
  Withdraw,
  FrontendFeeUpdated,
  RawAccountBalance,
  Transfer,
} from "../generated/schema";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  FrontendFeeUpdated as FrontendFeeUpdatedEvent,
  Transfer as TransferEvent,
} from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import {
  CHAIN_ID,
  DEPOSIT,
  VAULT_MARKET_TYPE,
  FRONTEND_FEE_UPDATED,
  NULL_ADDRESS,
} from "./constants";
import { WrappedVault } from "../generated/templates/WrappedVaultTemplate/WrappedVault";

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
    // Create contract binding
    let contract = WrappedVault.bind(event.address);

    // Call totalAssets() and assign to quantityOffered
    let totalAssetsResult = contract.try_totalAssets();
    if (!totalAssetsResult.reverted) {
      rawMarket.quantityOffered = totalAssetsResult.value;
    }

    rawMarket.quantityOfferedFilled = rawMarket.quantityOfferedFilled.plus(
      event.params.shares
    );

    // ============== ..... ==============
    // Update incentives rates
    let incentivesRates = rawMarket.incentivesRates;
    for (let i = 0; i < rawMarket.incentivesOfferedIds.length; i++) {
      let incentiveOfferedAddress = Address.fromString(
        rawMarket.incentivesOfferedIds[i].split("-")[1]
      );

      let incentiveRateResult = contract.try_currentRewardsPerToken(
        incentiveOfferedAddress
      );
      if (!incentiveRateResult.reverted) {
        incentivesRates[i] = incentiveRateResult.value;
      }
    }
    rawMarket.incentivesRates = incentivesRates;
    // ============== xxxxx ==============

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
    let rawAccountBalanceAP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.owner.toHexString())
    );

    if (rawAccountBalanceAP == null) {
      rawAccountBalanceAP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(event.params.owner.toHexString())
      );

      rawAccountBalanceAP.chainId = CHAIN_ID;
      rawAccountBalanceAP.marketType = VAULT_MARKET_TYPE;
      rawAccountBalanceAP.marketId = event.address.toHexString();
      rawAccountBalanceAP.accountAddress = event.params.owner.toHexString();
      rawAccountBalanceAP.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalanceAP.quantityGivenAmount = BigInt.zero();
      rawAccountBalanceAP.quantityReceivedAmount = BigInt.zero();
      rawAccountBalanceAP.incentivesGivenIds = [];
      rawAccountBalanceAP.incentivesGivenAmount = [];
    }

    let rawAccountBalanceIP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(rawMarket.owner)
    );

    if (rawAccountBalanceIP == null) {
      rawAccountBalanceIP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(rawMarket.owner)
      );

      rawAccountBalanceIP.chainId = CHAIN_ID;
      rawAccountBalanceIP.marketType = VAULT_MARKET_TYPE;
      rawAccountBalanceIP.marketId = event.address.toHexString();
      rawAccountBalanceIP.accountAddress = rawMarket.owner;
      rawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
      rawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
      rawAccountBalanceIP.incentivesGivenIds = [];
      rawAccountBalanceIP.incentivesGivenAmount = [];
    }

    if (event.params.owner.equals(Address.fromString(NULL_ADDRESS))) {
      // AP and IP are the same

      // Create contract binding
      let contract = WrappedVault.bind(event.address);

      /**
       * @note Temporarily changed to calculate from events
       */
      // let assetsGiven = contract.try_maxRedeem(event.params.owner);
      // if (!assetsGiven.reverted) {
      //   rawAccountBalanceAP.quantityGivenAmount = assetsGiven.value;
      // }

      // Call totalAssets() and assign to quantityOffered
      let totalAssetsResult = contract.try_totalAssets();
      if (!totalAssetsResult.reverted) {
        rawAccountBalanceAP.quantityReceivedAmount = totalAssetsResult.value;
      }

      rawAccountBalanceAP.save();
    } else {
      // AP and IP are different

      // Create contract binding
      let contract = WrappedVault.bind(event.address);

      /**
       * @note Temporarily changed to calculate from events
       */
      // let assetsGiven = contract.try_maxRedeem(event.params.owner);
      // if (!assetsGiven.reverted) {
      //   rawAccountBalanceAP.quantityGivenAmount = assetsGiven.value;
      // }

      rawAccountBalanceAP.save();

      // Call totalAssets() and assign to quantityOffered
      let totalAssetsResult = contract.try_totalAssets();
      if (!totalAssetsResult.reverted) {
        rawAccountBalanceIP.quantityReceivedAmount = totalAssetsResult.value;
      }

      rawAccountBalanceIP.save();
    }
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
    // Create contract binding
    let contract = WrappedVault.bind(event.address);

    // Call totalAssets() and assign to quantityOffered
    let totalAssetsResult = contract.try_totalAssets();
    if (!totalAssetsResult.reverted) {
      rawMarket.quantityOffered = totalAssetsResult.value;
    }

    rawMarket.quantityOfferedFilled = rawMarket.quantityOfferedFilled.minus(
      event.params.shares
    );

    // ============== ..... ==============
    // Update incentives rates
    let incentivesRates = rawMarket.incentivesRates;
    for (let i = 0; i < rawMarket.incentivesOfferedIds.length; i++) {
      let incentiveOfferedAddress = Address.fromString(
        rawMarket.incentivesOfferedIds[i].split("-")[1]
      );

      let incentiveRateResult = contract.try_currentRewardsPerToken(
        incentiveOfferedAddress
      );
      if (!incentiveRateResult.reverted) {
        incentivesRates[i] = incentiveRateResult.value;
      }
    }
    rawMarket.incentivesRates = incentivesRates;
    // ============== xxxxx ==============

    rawMarket.save();
  }

  if (rawMarket != null) {
    let rawAccountBalanceAP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.owner.toHexString())
    );

    if (rawAccountBalanceAP == null) {
      rawAccountBalanceAP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(event.params.owner.toHexString())
      );

      rawAccountBalanceAP.chainId = CHAIN_ID;
      rawAccountBalanceAP.marketType = VAULT_MARKET_TYPE;
      rawAccountBalanceAP.marketId = event.address.toHexString();
      rawAccountBalanceAP.accountAddress = event.params.owner.toHexString();
      rawAccountBalanceAP.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalanceAP.quantityGivenAmount = BigInt.zero();
      rawAccountBalanceAP.quantityReceivedAmount = BigInt.zero();
      rawAccountBalanceAP.incentivesGivenIds = [];
      rawAccountBalanceAP.incentivesGivenAmount = [];
    }

    let rawAccountBalanceIP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(rawMarket.owner)
    );

    if (rawAccountBalanceIP == null) {
      rawAccountBalanceIP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(rawMarket.owner)
      );

      rawAccountBalanceIP.chainId = CHAIN_ID;
      rawAccountBalanceIP.marketType = VAULT_MARKET_TYPE;
      rawAccountBalanceIP.marketId = event.address.toHexString();
      rawAccountBalanceIP.accountAddress = rawMarket.owner;
      rawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
      rawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
      rawAccountBalanceIP.incentivesGivenIds = [];
      rawAccountBalanceIP.incentivesGivenAmount = [];
    }

    if (event.params.owner.equals(Address.fromString(NULL_ADDRESS))) {
      // AP and IP are the same

      // Create contract binding
      let contract = WrappedVault.bind(event.address);

      /**
       * @note Temporarily changed to calculate from events
       */
      // let assetsGiven = contract.try_maxRedeem(event.params.owner);
      // if (!assetsGiven.reverted) {
      //   rawAccountBalanceAP.quantityGivenAmount = assetsGiven.value;
      // }

      // Call totalAssets() and assign to quantityOffered
      let totalAssetsResult = contract.try_totalAssets();
      if (!totalAssetsResult.reverted) {
        rawAccountBalanceAP.quantityReceivedAmount = totalAssetsResult.value;
      }

      rawAccountBalanceAP.save();
    } else {
      // AP and IP are different

      // Create contract binding
      let contract = WrappedVault.bind(event.address);

      /**
       * @note Temporarily changed to calculate from events
       */
      // let assetsGiven = contract.try_maxRedeem(event.params.owner);
      // if (!assetsGiven.reverted) {
      //   rawAccountBalanceAP.quantityGivenAmount = assetsGiven.value;
      // }

      rawAccountBalanceAP.save();

      // Call totalAssets() and assign to quantityOffered
      let totalAssetsResult = contract.try_totalAssets();
      if (!totalAssetsResult.reverted) {
        rawAccountBalanceIP.quantityReceivedAmount = totalAssetsResult.value;
      }

      rawAccountBalanceIP.save();
    }
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

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.from = event.params.from.toHexString();
  entity.to = event.params.to.toHexString();
  entity.tokens = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    let fromAccountBalance = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.from.toHexString())
    );

    if (fromAccountBalance == null) {
      fromAccountBalance = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(event.params.from.toHexString())
      );

      fromAccountBalance.chainId = CHAIN_ID;
      fromAccountBalance.marketType = VAULT_MARKET_TYPE;
      fromAccountBalance.marketId = event.address.toHexString();
      fromAccountBalance.accountAddress = event.params.from.toHexString();
      fromAccountBalance.inputTokenId = rawMarket.inputTokenId;
      fromAccountBalance.quantityGivenAmount = BigInt.zero();
      fromAccountBalance.quantityReceivedAmount = BigInt.zero();
      fromAccountBalance.incentivesGivenIds = [];
      fromAccountBalance.incentivesGivenAmount = [];
    }

    let toAccountBalance = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(event.address.toHexString())
        .concat("_")
        .concat(event.params.to.toHexString())
    );

    if (toAccountBalance == null) {
      toAccountBalance = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(VAULT_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.address.toHexString())
          .concat("_")
          .concat(event.params.to.toHexString())
      );

      toAccountBalance.chainId = CHAIN_ID;
      toAccountBalance.marketType = VAULT_MARKET_TYPE;
      toAccountBalance.marketId = event.address.toHexString();
      toAccountBalance.accountAddress = event.params.to.toHexString();
      toAccountBalance.inputTokenId = rawMarket.inputTokenId;
      toAccountBalance.quantityGivenAmount = BigInt.zero();
      toAccountBalance.quantityReceivedAmount = BigInt.zero();
      toAccountBalance.incentivesGivenIds = [];
      toAccountBalance.incentivesGivenAmount = [];
    }

    if (event.params.from.toHexString() != event.params.to.toHexString()) {
      fromAccountBalance.quantityGivenAmount =
        fromAccountBalance.quantityGivenAmount.minus(event.params.amount);
      toAccountBalance.quantityGivenAmount =
        toAccountBalance.quantityGivenAmount.plus(event.params.amount);

      fromAccountBalance.save();
      toAccountBalance.save();
    }

    // /**
    //  * @note Temporarily changed to calculate from events
    //  */
    // let contract = WrappedVault.bind(event.address);

    // if (event.params.from.equals(Address.fromString(NULL_ADDRESS))) {
    //   // From is the zero address, so it's a deposit

    //   /**
    //    * @note Temporarily changed to calculate from events
    //    */
    //   // let currentToShares = contract.try_maxRedeem(event.params.to);
    //   // if (!currentToShares.reverted) {
    //   //   toAccountBalance.quantityGivenAmount = currentToShares.value;
    //   // }

    //   toAccountBalance.quantityGivenAmount =
    //     toAccountBalance.quantityGivenAmount.plus(event.params.amount);

    //   toAccountBalance.save();
    // } else if (event.params.to.equals(Address.fromString(NULL_ADDRESS))) {
    //   // To is the zero address, so it's a withdraw

    //   /**
    //    * @note Temporarily changed to calculate from events
    //    */
    //   // let currentFromShares = contract.try_maxRedeem(event.params.from);
    //   // if (!currentFromShares.reverted) {
    //   //   fromAccountBalance.quantityGivenAmount = currentFromShares.value;
    //   // }

    //   fromAccountBalance.quantityGivenAmount =
    //     fromAccountBalance.quantityGivenAmount.minus(event.params.amount);

    //   fromAccountBalance.save();
    // } else {
    //   // Transfer between accounts

    //   /**
    //    * @note Temporarily changed to calculate from events
    //    */
    //   // let currentFromShares = contract.try_maxRedeem(event.params.from);
    //   // let currentToShares = contract.try_maxRedeem(event.params.to);

    //   // if (!currentFromShares.reverted) {
    //   //   fromAccountBalance.quantityGivenAmount = currentFromShares.value;
    //   // }

    //   // if (!currentToShares.reverted) {
    //   //   toAccountBalance.quantityGivenAmount = currentToShares.value;
    //   // }

    //   fromAccountBalance.quantityGivenAmount =
    //     fromAccountBalance.quantityGivenAmount.minus(event.params.amount);
    //   toAccountBalance.quantityGivenAmount =
    //     toAccountBalance.quantityGivenAmount.plus(event.params.amount);

    //   fromAccountBalance.save();
    //   toAccountBalance.save();
    // }
  }
}
