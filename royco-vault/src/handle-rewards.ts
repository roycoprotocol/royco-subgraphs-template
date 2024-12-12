import { BigInt } from "@graphprotocol/graph-ts";
import {
  RawAccountBalance,
  RawActivity,
  RawMarket,
  RewardsSet,
  RewardsTokenAdded,
} from "../generated/schema";
import {
  RewardsSet as RewardsSetEvent,
  RewardsTokenAdded as RewardsTokenAddedEvent,
  WrappedVault,
} from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import {
  ADD_REWARD,
  CHAIN_ID,
  VAULT_MARKET_TYPE,
  SET_REWARD,
} from "./constants";

export function handleRewardsTokenAdded(event: RewardsTokenAddedEvent): void {
  let entity = new RewardsTokenAdded(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.reward = event.params.reward.toHexString();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // Get Raw Market entity
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    // Update incentivesOfferedIds
    let incentivesOfferedIds = rawMarket.incentivesOfferedIds;
    incentivesOfferedIds.push(
      CHAIN_ID.toString().concat("-").concat(event.params.reward.toHexString())
    );
    rawMarket.incentivesOfferedIds = incentivesOfferedIds;

    // Update incentivesOfferedAmount
    let incentivesOfferedAmount = rawMarket.incentivesOfferedAmount;
    incentivesOfferedAmount.push(BigInt.zero());
    rawMarket.incentivesOfferedAmount = incentivesOfferedAmount;

    // Update startTimestamps
    let startTimestamps = rawMarket.startTimestamps;
    startTimestamps.push(BigInt.zero());
    rawMarket.startTimestamps = startTimestamps;

    // Update endTimestamps
    let endTimestamps = rawMarket.endTimestamps;
    endTimestamps.push(BigInt.zero());
    rawMarket.endTimestamps = endTimestamps;

    // Update incentivesRates
    let incentivesRates = rawMarket.incentivesRates;
    incentivesRates.push(BigInt.zero());
    rawMarket.incentivesRates = incentivesRates;

    rawMarket.save();
  }
  // ============== xxxxx ==============

  if (rawMarket != null) {
    // ============== ..... ==============
    // New Raw Activity entity
    let rawActivity = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivity.chainId = CHAIN_ID;
    rawActivity.marketType = VAULT_MARKET_TYPE;
    rawActivity.activityType = ADD_REWARD;
    rawActivity.marketId = event.address.toHexString();
    rawActivity.accountAddress = rawMarket.owner;
    rawActivity.tokensGivenIds = [
      CHAIN_ID.toString().concat("-").concat(event.params.reward.toHexString()),
    ];
    rawActivity.tokensGivenAmount = [];
    rawActivity.tokensReceivedIds = [];
    rawActivity.tokensReceivedAmount = [];
    rawActivity.transactionHash = event.transaction.hash.toHexString();
    rawActivity.blockNumber = event.block.number;
    rawActivity.blockTimestamp = event.block.timestamp;
    rawActivity.logIndex = event.logIndex;

    rawActivity.save();
    // ============== xxxxx ==============
  }
}

export function handleRewardsSet(event: RewardsSetEvent): void {
  let entity = new RewardsSet(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.reward = event.address.toHexString();
  entity.start = event.params.start;
  entity.end = event.params.end;
  entity.rate = event.params.rate;
  entity.totalRewards = event.params.totalRewards;
  entity.protocolFee = event.params.protocolFee;
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
      rawAccountBalance.quantityGivenAmount = BigInt.zero();
      rawAccountBalance.quantityReceivedAmount = BigInt.zero();
      rawAccountBalance.incentivesGivenIds = [];
      rawAccountBalance.incentivesGivenAmount = [];
    }

    let tokenId = CHAIN_ID.toString()
      .concat("-")
      .concat(event.params.reward.toHexString());

    let index = rawMarket.incentivesOfferedIds.indexOf(tokenId);

    if (index != -1 && rawAccountBalance != null) {
      let volumeTokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.reward.toHexString());

      let newVolumeTokenIds = rawMarket.volumeTokenIds;
      let newVolumeAmounts = rawMarket.volumeAmounts;

      // ============== ..... ==============
      // Account balance incentives
      let newIncentivesGivenIds = rawAccountBalance.incentivesGivenIds;
      let newIncentivesGivenAmount = rawAccountBalance.incentivesGivenAmount;

      if (newIncentivesGivenIds.indexOf(tokenId) == -1) {
        // New incentive
        newIncentivesGivenIds.push(tokenId);
        newIncentivesGivenAmount.push(BigInt.zero());
      }

      let rawAccountBalanceIncentiveIndex =
        newIncentivesGivenIds.indexOf(tokenId);
      // ============== xxxxx ==============

      if (newVolumeTokenIds.indexOf(volumeTokenId) == -1) {
        // New volume token
        newVolumeTokenIds.push(volumeTokenId);
        newVolumeAmounts.push(BigInt.zero());
      }

      let volumeAmountIndex = newVolumeTokenIds.indexOf(volumeTokenId);

      // // Calculate rewards amount
      // let rewardsAmount = BigInt.zero();

      // if (event.params.rate == BigInt.zero()) {
      //   rewardsAmount = rawMarket.incentivesOfferedAmount[index];
      //   newIncentivesGivenAmount[rawAccountBalanceIncentiveIndex] =
      //     newIncentivesGivenAmount[rawAccountBalanceIncentiveIndex].minus(
      //       rewardsAmount
      //     );
      // } else {
      //   // These rewards will be added
      //   rewardsAmount = event.params.totalRewards;
      //   newIncentivesGivenAmount[rawAccountBalanceIncentiveIndex] =
      //     newIncentivesGivenAmount[rawAccountBalanceIncentiveIndex].plus(
      //       rewardsAmount
      //     );
      // }

      // Update volumeAmounts
      if (event.params.rate == BigInt.zero()) {
        // Rewards are removed
        newVolumeAmounts[volumeAmountIndex] = newVolumeAmounts[
          volumeAmountIndex
        ].minus(rawMarket.incentivesOfferedAmount[index]);
      } else {
        // Rewards are added
        newVolumeAmounts[volumeAmountIndex] = newVolumeAmounts[
          volumeAmountIndex
        ].plus(event.params.totalRewards);
      }

      // Update volumeAmounts
      rawMarket.volumeTokenIds = newVolumeTokenIds;
      rawMarket.volumeAmounts = newVolumeAmounts;

      // Update incentivesOfferedAmount
      let newIncentivesOfferedAmount = rawMarket.incentivesOfferedAmount;
      newIncentivesOfferedAmount[index] = event.params.totalRewards;
      rawMarket.incentivesOfferedAmount = newIncentivesOfferedAmount;

      /**
       * @note New reward data setting
       */
      // let contract = WrappedVault.bind(event.address);

      // // Call the mapping using try/catch
      // let rewardIntervalResult = contract.try_rewardToInterval(
      //   event.params.reward
      // );
      // if (!rewardIntervalResult.reverted) {
      //   rawMarket.startTimestamps[index] = rewardIntervalResult.value.value0;
      //   rawMarket.endTimestamps[index] = rewardIntervalResult.value.value1;
      //   rawMarket.incentivesRates[index] = rewardIntervalResult.value.value2;
      // }

      /**
       * @note Temporarily changed rewards to get data from functions
       */
      // Update startTimestamps
      let newStartTimestamps = rawMarket.startTimestamps;
      newStartTimestamps[index] = event.params.start;
      rawMarket.startTimestamps = newStartTimestamps;

      // Update endTimestamps
      let newEndTimestamps = rawMarket.endTimestamps;
      newEndTimestamps[index] = event.params.end;
      rawMarket.endTimestamps = newEndTimestamps;

      // Update incentivesRates
      let newIncentivesRates = rawMarket.incentivesRates;
      newIncentivesRates[index] = event.params.rate;
      rawMarket.incentivesRates = newIncentivesRates;

      // Update Raw Account Balance entity
      rawAccountBalance.incentivesGivenIds = newIncentivesGivenIds;
      rawAccountBalance.incentivesGivenAmount = newIncentivesGivenAmount;

      // Save Raw Account Balance entity
      rawAccountBalance.save();
    }

    // Save Raw Market entity
    rawMarket.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // New Raw Activity entity
  if (rawMarket != null) {
    let rawActivity = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivity.chainId = CHAIN_ID;
    rawActivity.marketType = VAULT_MARKET_TYPE;
    rawActivity.activityType = SET_REWARD;
    rawActivity.marketId = event.address.toHexString();
    rawActivity.accountAddress = rawMarket.owner;
    rawActivity.tokensGivenIds = [
      CHAIN_ID.toString().concat("-").concat(event.params.reward.toHexString()),
    ];
    rawActivity.tokensGivenAmount = [event.params.totalRewards];
    rawActivity.tokensReceivedIds = [];
    rawActivity.tokensReceivedAmount = [];
    rawActivity.transactionHash = event.transaction.hash.toHexString();
    rawActivity.blockNumber = event.block.number;
    rawActivity.blockTimestamp = event.block.timestamp;
    rawActivity.logIndex = event.logIndex;

    rawActivity.save();
  }
  // ============== xxxxx ==============
}
