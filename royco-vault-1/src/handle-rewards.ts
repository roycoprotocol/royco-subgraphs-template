import { BigInt } from "@graphprotocol/graph-ts";
import {
  RawActivity,
  RawMarket,
  RewardsSet,
  RewardsTokenAdded,
} from "../generated/schema";
import {
  RewardsSet as RewardsSetEvent,
  RewardsTokenAdded as RewardsTokenAddedEvent,
} from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import { ADD_REWARD, CHAIN_ID, MARKET_TYPE, SET_REWARD } from "./constants";

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
      .concat(MARKET_TYPE.toString())
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
    rawActivity.marketType = MARKET_TYPE;
    rawActivity.activityType = ADD_REWARD;
    rawActivity.marketId = event.address.toHexString();
    rawActivity.accountAddress = event.transaction.from.toHexString();
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
      .concat(MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    let tokenId = CHAIN_ID.toString()
      .concat("-")
      .concat(event.params.reward.toHexString());

    let index = rawMarket.incentivesOfferedIds.indexOf(tokenId);

    if (index != -1) {
      let previousStartTimestamp = rawMarket.startTimestamps[index];
      let previousEndTimestamp = rawMarket.endTimestamps[index];

      let volumeTokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.reward.toHexString());

      // Update volumeTokenIds and volumeAmounts
      let volumeTokenIndex = rawMarket.volumeTokenIds.indexOf(volumeTokenId);

      if (volumeTokenIndex == -1) {
        // New volume token
        let volumeTokenIds = rawMarket.volumeTokenIds;
        let volumeAmounts = rawMarket.volumeAmounts;

        volumeTokenIds.push(
          CHAIN_ID.toString()
            .concat("-")
            .concat(event.params.reward.toHexString())
        );

        volumeAmounts.push(event.params.totalRewards);

        rawMarket.volumeTokenIds = volumeTokenIds;
        rawMarket.volumeAmounts = volumeAmounts;
      } else {
        // Existing volume token
        let currentVolumeAmount = rawMarket.volumeAmounts[index];

        if (
          previousStartTimestamp == BigInt.zero() &&
          previousEndTimestamp == BigInt.zero()
        ) {
          // New rewards are added
          currentVolumeAmount = currentVolumeAmount.plus(
            event.params.totalRewards
          );
        } else if (
          previousStartTimestamp < event.params.start &&
          previousEndTimestamp < event.params.end &&
          previousEndTimestamp < event.params.start
        ) {
          // New Rewards are added
          currentVolumeAmount = currentVolumeAmount.plus(
            event.params.totalRewards
          );
        } else {
          // Rewards are updated
          let previousIncentiveAmount =
            rawMarket.incentivesOfferedAmount[index];
          let updatedIncentiveAmount = event.params.totalRewards;

          let difference = updatedIncentiveAmount.minus(
            previousIncentiveAmount
          );

          currentVolumeAmount = currentVolumeAmount.plus(difference);
        }

        rawMarket.volumeAmounts[index] = currentVolumeAmount;
      }

      let newIncentivesOfferedAmount = rawMarket.incentivesOfferedAmount;
      newIncentivesOfferedAmount[index] = event.params.totalRewards;
      rawMarket.incentivesOfferedAmount = newIncentivesOfferedAmount;

      let newIncentivesRates = rawMarket.incentivesRates;
      newIncentivesRates[index] = event.params.rate;
      rawMarket.incentivesRates = newIncentivesRates;

      let newStartTimestamps = rawMarket.startTimestamps;
      newStartTimestamps[index] = event.params.start;
      rawMarket.startTimestamps = newStartTimestamps;

      let newEndTimestamps = rawMarket.endTimestamps;
      newEndTimestamps[index] = event.params.end;
      rawMarket.endTimestamps = newEndTimestamps;
    }

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
    rawActivity.marketType = MARKET_TYPE;
    rawActivity.activityType = SET_REWARD;
    rawActivity.marketId = event.address.toHexString();
    rawActivity.accountAddress = event.transaction.from.toHexString();
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
