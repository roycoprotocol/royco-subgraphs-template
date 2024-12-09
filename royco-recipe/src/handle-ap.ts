import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  APOfferCancelled as APOfferCancelledEvent,
  APOfferCreated as APOfferCreatedEvent,
  APOfferFilled as APOfferFilledEvent,
} from "../generated/RecipeMarketHub/RecipeMarketHub";
import {
  APOfferCancelled,
  APOfferCreated,
  APOfferFilled,
  RawAccountBalance,
  RawActivity,
  RawMarket,
  RawOffer,
  RawPosition,
} from "../generated/schema";
import {
  CHAIN_ID,
  AP_OFFER_CANCELLED,
  AP_OFFER_CREATED,
  AP_OFFER_FILLED,
  AP_OFFER_SIDE,
  IP_OFFER_SIDE,
  RECIPE_MARKET_TYPE,
  UPFRONT_REWARD_STYLE,
} from "./constants";
import { WeirollWalletTemplate } from "../generated/templates";

export function handleAPOfferCreated(event: APOfferCreatedEvent): void {
  let entity = new APOfferCreated(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.offerId = event.params.offerID;
  entity.marketHash = event.params.marketHash.toHexString();
  entity.ap = event.params.ap.toHexString();
  entity.fundingVault = event.params.fundingVault.toHexString();
  entity.quantity = event.params.quantity;
  entity.incentiveAddresses = event.params.incentiveAddresses.map<string>(
    (token: Address) => token.toHexString()
  );
  entity.incentiveAmounts = event.params.incentiveAmounts;
  entity.expiry = event.params.expiry;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // Update RawMarket
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(RECIPE_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.params.marketHash.toHexString())
  );

  if (rawMarket != null) {
    // Update quantityAsked
    rawMarket.quantityAsked = rawMarket.quantityAsked.plus(
      event.params.quantity
    );

    // Update incentivesAsked
    let incentivesAskedIds = rawMarket.incentivesAskedIds;

    for (let i = 0; i < event.params.incentiveAddresses.length; i++) {
      let tokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.incentiveAddresses[i].toHexString());

      let index = incentivesAskedIds.indexOf(tokenId);

      if (index == -1) {
        let updatedIncentivesAskedIds = rawMarket.incentivesAskedIds;
        let updatedIncentivesAskedAmount = rawMarket.incentivesAskedAmount;

        updatedIncentivesAskedIds.push(tokenId);
        updatedIncentivesAskedAmount.push(event.params.incentiveAmounts[i]);

        rawMarket.incentivesAskedIds = updatedIncentivesAskedIds;
        rawMarket.incentivesAskedAmount = updatedIncentivesAskedAmount;
      } else {
        let updatedIncentivesAskedAmount = rawMarket.incentivesAskedAmount;

        updatedIncentivesAskedAmount[index] = updatedIncentivesAskedAmount[
          index
        ].plus(event.params.incentiveAmounts[i]);

        rawMarket.incentivesAskedAmount = updatedIncentivesAskedAmount;
      }
    }

    rawMarket.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // New RawOffer
  if (rawMarket != null) {
    let rawOffer = new RawOffer(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(AP_OFFER_SIDE.toString())
        .concat("_")
        .concat(event.params.offerID.toString())
    );

    rawOffer.chainId = CHAIN_ID;
    rawOffer.marketType = RECIPE_MARKET_TYPE;
    rawOffer.offerSide = AP_OFFER_SIDE;
    rawOffer.offerId = event.params.offerID.toString();
    rawOffer.marketId = event.params.marketHash.toHexString();
    rawOffer.creator = event.params.ap.toHexString();
    rawOffer.fundingVault = event.params.fundingVault.toHexString();
    rawOffer.inputTokenId = rawMarket.inputTokenId;
    rawOffer.quantity = event.params.quantity;
    rawOffer.quantityRemaining = event.params.quantity;
    rawOffer.expiry = event.params.expiry;
    rawOffer.tokenIds = event.params.incentiveAddresses.map<string>(
      (token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
    );
    rawOffer.tokenAmounts = event.params.incentiveAmounts;
    rawOffer.protocolFeeAmounts = event.params.incentiveAmounts.map<BigInt>(
      (amount: BigInt) => BigInt.zero()
    );
    rawOffer.frontendFeeAmounts = event.params.incentiveAmounts.map<BigInt>(
      (amount: BigInt) => BigInt.zero()
    );
    rawOffer.isCancelled = false;
    rawOffer.blockNumber = event.block.number;
    rawOffer.blockTimestamp = event.block.timestamp;
    rawOffer.transactionHash = event.transaction.hash.toHexString();
    rawOffer.logIndex = event.logIndex;

    rawOffer.save();
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
    rawActivity.marketType = RECIPE_MARKET_TYPE;
    rawActivity.marketId = event.params.marketHash.toHexString();
    rawActivity.accountAddress = event.params.ap.toHexString();
    rawActivity.activityType = AP_OFFER_CREATED;
    rawActivity.tokensGivenIds = [rawMarket.inputTokenId];
    rawActivity.tokensGivenAmount = [event.params.quantity];
    rawActivity.tokensReceivedIds = event.params.incentiveAddresses.map<string>(
      (token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
    );
    rawActivity.tokensReceivedAmount = event.params.incentiveAmounts;
    rawActivity.blockNumber = event.block.number;
    rawActivity.blockTimestamp = event.block.timestamp;
    rawActivity.transactionHash = event.transaction.hash.toHexString();
    rawActivity.logIndex = event.logIndex;

    rawActivity.save();
  }
  // ============== xxxxx ==============
}

export function handleAPOfferFilled(event: APOfferFilledEvent): void {
  // Extract the address of the Weiroll Wallet from the event
  let weirollWalletAddress = event.params.weirollWallet;

  // Dynamically create a new data source for the Weiroll Wallet contract
  WeirollWalletTemplate.create(weirollWalletAddress);

  let entity = new APOfferFilled(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.offerId = event.params.offerID;
  entity.ip = event.params.ip.toHexString();
  entity.fillAmount = event.params.fillAmount;
  entity.weirollWallet = event.params.weirollWallet.toHexString();
  entity.incentiveAmounts = event.params.incentiveAmounts;
  entity.protocolFeeAmounts = event.params.protocolFeeAmounts;
  entity.frontendFeeAmounts = event.params.frontendFeeAmounts;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  let rawOffer = RawOffer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(RECIPE_MARKET_TYPE.toString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
      .concat("_")
      .concat(event.params.offerID.toString())
  );

  // ============== ..... ==============
  // Raw Offer entity updates
  if (rawOffer != null) {
    // Update quantityRemaining
    rawOffer.quantityRemaining = rawOffer.quantityRemaining.minus(
      event.params.fillAmount
    );

    rawOffer.save();
  }
  // ============== xxxxx ==============

  if (rawOffer != null) {
    // Get Raw Market entity
    let rawMarket = RawMarket.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawOffer.marketId)
    );

    if (rawMarket != null) {
      // ============== ..... ==============
      // Raw Market entity updates
      rawMarket.quantityAsked = rawMarket.quantityAsked.minus(
        event.params.fillAmount
      );

      // Update quantityAskedFilled
      rawMarket.quantityAskedFilled = rawMarket.quantityAskedFilled.plus(
        event.params.fillAmount
      );

      // Update incentivesAsked
      let incentivesAskedIds = rawMarket.incentivesAskedIds;

      let updatedIncentivesAskedAmount = rawMarket.incentivesAskedAmount;

      for (let i = 0; i < event.params.incentiveAmounts.length; i++) {
        let tokenId = rawOffer.tokenIds[i];

        let index = incentivesAskedIds.indexOf(tokenId);

        if (index != -1) {
          updatedIncentivesAskedAmount[index] = updatedIncentivesAskedAmount[
            index
          ].minus(event.params.incentiveAmounts[i]);
        }
      }

      rawMarket.incentivesAskedAmount = updatedIncentivesAskedAmount;

      // Update volume token ids and amounts for quantity
      let index = rawMarket.volumeTokenIds.indexOf(rawMarket.inputTokenId);

      if (index == -1) {
        let updatedVolumeTokenIds = rawMarket.volumeTokenIds;
        let updatedVolumeAmounts = rawMarket.volumeAmounts;

        updatedVolumeTokenIds.push(rawMarket.inputTokenId);
        updatedVolumeAmounts.push(event.params.fillAmount);

        rawMarket.volumeTokenIds = updatedVolumeTokenIds;
        rawMarket.volumeAmounts = updatedVolumeAmounts;
      } else {
        let updatedVolumeAmounts = rawMarket.volumeAmounts;

        updatedVolumeAmounts[index] = updatedVolumeAmounts[index].plus(
          event.params.fillAmount
        );

        rawMarket.volumeAmounts = updatedVolumeAmounts;
      }

      rawMarket.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // New Raw Position entity for AP
      let rawPositionAP = new RawPosition(
        CHAIN_ID.toString()
          .concat("_")
          .concat(event.params.weirollWallet.toHexString())
          .concat("_")
          .concat(AP_OFFER_SIDE.toString())
      );

      rawPositionAP.chainId = CHAIN_ID;
      rawPositionAP.weirollWallet = event.params.weirollWallet.toHexString();
      rawPositionAP.offerSide = AP_OFFER_SIDE;
      rawPositionAP.marketId = rawMarket.marketId;
      rawPositionAP.rewardStyle = rawMarket.rewardStyle;
      rawPositionAP.rawOfferSide = rawOffer.offerSide;
      rawPositionAP.rawOfferId = rawOffer.offerId;
      rawPositionAP.accountAddress = rawOffer.creator;
      rawPositionAP.ap = rawOffer.creator;
      rawPositionAP.ip = event.params.ip.toHexString();
      rawPositionAP.inputTokenId = rawMarket.inputTokenId;
      rawPositionAP.quantity = event.params.fillAmount;

      rawPositionAP.tokenIds = rawOffer.tokenIds;
      rawPositionAP.tokenAmounts = event.params.incentiveAmounts;
      rawPositionAP.protocolFeeAmounts =
        event.params.protocolFeeAmounts.map<BigInt>((amount: BigInt) =>
          BigInt.zero()
        );
      rawPositionAP.frontendFeeAmounts =
        event.params.protocolFeeAmounts.map<BigInt>((amount: BigInt) =>
          BigInt.zero()
        );

      if (rawMarket.rewardStyle == UPFRONT_REWARD_STYLE) {
        rawPositionAP.isClaimed = event.params.incentiveAmounts.map<boolean>(
          (amount: BigInt) => true
        );
      } else {
        rawPositionAP.isClaimed = event.params.incentiveAmounts.map<boolean>(
          (amount: BigInt) => false
        );
      }

      rawPositionAP.isForfeited = false;
      rawPositionAP.isWithdrawn = false;

      rawPositionAP.unlockTimestamp = event.block.timestamp.plus(
        rawMarket.lockupTime
      );

      rawPositionAP.blockNumber = event.block.number;
      rawPositionAP.blockTimestamp = event.block.timestamp;
      rawPositionAP.transactionHash = event.transaction.hash.toHexString();
      rawPositionAP.logIndex = event.logIndex;

      rawPositionAP.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // New Raw Position entity for IP
      let rawPositionIP = new RawPosition(
        CHAIN_ID.toString()
          .concat("_")
          .concat(event.params.weirollWallet.toHexString())
          .concat("_")
          .concat(IP_OFFER_SIDE.toString())
      );

      rawPositionIP.chainId = CHAIN_ID;
      rawPositionIP.weirollWallet = event.params.weirollWallet.toHexString();
      rawPositionIP.offerSide = IP_OFFER_SIDE;
      rawPositionIP.marketId = rawMarket.marketId;
      rawPositionIP.rewardStyle = rawMarket.rewardStyle;
      rawPositionIP.rawOfferSide = rawOffer.offerSide;
      rawPositionIP.rawOfferId = rawOffer.offerId;
      rawPositionIP.accountAddress = event.params.ip.toHexString();
      rawPositionIP.ap = rawOffer.creator;
      rawPositionIP.ip = event.params.ip.toHexString();
      rawPositionIP.inputTokenId = rawMarket.inputTokenId;
      rawPositionIP.quantity = event.params.fillAmount;

      rawPositionIP.tokenIds = rawOffer.tokenIds;
      rawPositionIP.tokenAmounts = event.params.incentiveAmounts;
      rawPositionIP.protocolFeeAmounts = event.params.protocolFeeAmounts;
      rawPositionIP.frontendFeeAmounts = event.params.frontendFeeAmounts;

      if (rawMarket.rewardStyle == UPFRONT_REWARD_STYLE) {
        rawPositionIP.isClaimed = event.params.incentiveAmounts.map<boolean>(
          (amount: BigInt) => true
        );
      } else {
        rawPositionIP.isClaimed = event.params.incentiveAmounts.map<boolean>(
          (amount: BigInt) => false
        );
      }

      rawPositionIP.isForfeited = false;
      rawPositionIP.isWithdrawn = false;

      rawPositionIP.unlockTimestamp = event.block.timestamp.plus(
        rawMarket.lockupTime
      );

      rawPositionIP.blockNumber = event.block.number;
      rawPositionIP.blockTimestamp = event.block.timestamp;
      rawPositionIP.transactionHash = event.transaction.hash.toHexString();
      rawPositionIP.logIndex = event.logIndex;

      rawPositionIP.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // Update Raw Account Balance entity for AP
      // Get Raw Account Balance entity for AP
      let rawAccountBalanceAP = RawAccountBalance.load(
        CHAIN_ID.toString()
          .concat("_")
          .concat(RECIPE_MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(rawOffer.creator)
      );

      // Get Raw Account Balance entity for IP
      let rawAccountBalanceIP = RawAccountBalance.load(
        CHAIN_ID.toString()
          .concat("_")
          .concat(RECIPE_MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(event.params.ip.toHexString())
      );

      // Create Raw Account Balance entities if they don't exist
      if (rawAccountBalanceAP == null) {
        rawAccountBalanceAP = new RawAccountBalance(
          CHAIN_ID.toString()
            .concat("_")
            .concat(RECIPE_MARKET_TYPE.toString())
            .concat("_")
            .concat(rawMarket.marketId)
            .concat("_")
            .concat(rawOffer.creator)
        );

        rawAccountBalanceAP.chainId = CHAIN_ID;
        rawAccountBalanceAP.marketType = RECIPE_MARKET_TYPE;
        rawAccountBalanceAP.marketId = rawMarket.marketId;
        rawAccountBalanceAP.accountAddress = rawOffer.creator;
        rawAccountBalanceAP.inputTokenId = rawMarket.inputTokenId;
        rawAccountBalanceAP.quantityReceivedAmount = BigInt.zero();
        rawAccountBalanceAP.quantityGivenAmount = BigInt.zero();
        rawAccountBalanceAP.incentivesReceivedIds = [];
        rawAccountBalanceAP.incentivesReceivedAmount = [];
        rawAccountBalanceAP.incentivesGivenIds = [];
        rawAccountBalanceAP.incentivesGivenAmount = [];
        rawAccountBalanceAP.protocolFeeAmounts = [];
        rawAccountBalanceAP.frontendFeeAmounts = [];
      }

      // Create Raw Account Balance entity for IP if it doesn't exist
      if (rawAccountBalanceIP == null) {
        rawAccountBalanceIP = new RawAccountBalance(
          CHAIN_ID.toString()
            .concat("_")
            .concat(RECIPE_MARKET_TYPE.toString())
            .concat("_")
            .concat(rawMarket.marketId)
            .concat("_")
            .concat(event.params.ip.toHexString())
        );

        rawAccountBalanceIP.chainId = CHAIN_ID;
        rawAccountBalanceIP.marketType = RECIPE_MARKET_TYPE;
        rawAccountBalanceIP.marketId = rawMarket.marketId;
        rawAccountBalanceIP.accountAddress = event.params.ip.toHexString();
        rawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
        rawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
        rawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
        rawAccountBalanceIP.incentivesReceivedIds = [];
        rawAccountBalanceIP.incentivesReceivedAmount = [];
        rawAccountBalanceIP.incentivesGivenIds = [];
        rawAccountBalanceIP.incentivesGivenAmount = [];
        rawAccountBalanceIP.protocolFeeAmounts = [];
        rawAccountBalanceIP.frontendFeeAmounts = [];
      }

      if (rawOffer.creator == event.params.ip.toHexString()) {
        // Both AP and IP are the same
        // AP gives and AP receives
        rawAccountBalanceAP.quantityGivenAmount =
          rawAccountBalanceAP.quantityGivenAmount.plus(event.params.fillAmount);
        rawAccountBalanceAP.quantityReceivedAmount =
          rawAccountBalanceAP.quantityReceivedAmount.plus(
            event.params.fillAmount
          );

        // Update incentives received values for AP
        let incentivesReceivedIds = rawAccountBalanceAP.incentivesReceivedIds;
        let incentivesReceivedAmount =
          rawAccountBalanceAP.incentivesReceivedAmount;

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = incentivesReceivedIds.indexOf(tokenId);

          if (index == -1) {
            incentivesReceivedIds.push(tokenId);
            incentivesReceivedAmount.push(event.params.incentiveAmounts[i]);
          } else {
            incentivesReceivedAmount[index] = incentivesReceivedAmount[
              index
            ].plus(event.params.incentiveAmounts[i]);
          }
        }

        rawAccountBalanceAP.incentivesReceivedIds = incentivesReceivedIds;
        rawAccountBalanceAP.incentivesReceivedAmount = incentivesReceivedAmount;

        // Update incentives given values for AP
        let incentivesGivenIds = rawAccountBalanceAP.incentivesGivenIds;
        let incentivesGivenAmount = rawAccountBalanceAP.incentivesGivenAmount;
        let protocolFeeAmounts = rawAccountBalanceAP.protocolFeeAmounts;
        let frontendFeeAmounts = rawAccountBalanceAP.frontendFeeAmounts;

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = incentivesGivenIds.indexOf(tokenId);

          if (index == -1) {
            incentivesGivenIds.push(tokenId);
            incentivesGivenAmount.push(event.params.incentiveAmounts[i]);
            protocolFeeAmounts.push(event.params.protocolFeeAmounts[i]);
            frontendFeeAmounts.push(event.params.frontendFeeAmounts[i]);
          } else {
            incentivesGivenAmount[index] = incentivesGivenAmount[index].plus(
              event.params.incentiveAmounts[i]
            );
            protocolFeeAmounts[index] = protocolFeeAmounts[index].plus(
              event.params.protocolFeeAmounts[i]
            );
            frontendFeeAmounts[index] = frontendFeeAmounts[index].plus(
              event.params.frontendFeeAmounts[i]
            );
          }
        }

        rawAccountBalanceAP.incentivesGivenIds = incentivesGivenIds;
        rawAccountBalanceAP.incentivesGivenAmount = incentivesGivenAmount;
        rawAccountBalanceAP.protocolFeeAmounts = protocolFeeAmounts;
        rawAccountBalanceAP.frontendFeeAmounts = frontendFeeAmounts;

        // Save Raw Account Balance entities
        rawAccountBalanceAP.save();
      } else {
        // AP and IP are different
        // AP gives and IP receives
        rawAccountBalanceAP.quantityGivenAmount =
          rawAccountBalanceAP.quantityGivenAmount.plus(event.params.fillAmount);
        rawAccountBalanceIP.quantityReceivedAmount =
          rawAccountBalanceIP.quantityReceivedAmount.plus(
            event.params.fillAmount
          );

        // Update incentives received values for IP
        let incentivesReceivedIds = rawAccountBalanceIP.incentivesReceivedIds;
        let incentivesReceivedAmount =
          rawAccountBalanceIP.incentivesReceivedAmount;

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = incentivesReceivedIds.indexOf(tokenId);

          if (index == -1) {
            incentivesReceivedIds.push(tokenId);
            incentivesReceivedAmount.push(event.params.incentiveAmounts[i]);
          } else {
            incentivesReceivedAmount[index] = incentivesReceivedAmount[
              index
            ].plus(event.params.incentiveAmounts[i]);
          }
        }

        rawAccountBalanceIP.incentivesReceivedIds = incentivesReceivedIds;
        rawAccountBalanceIP.incentivesReceivedAmount = incentivesReceivedAmount;

        // Update incentives given values for IP
        let incentivesGivenIds = rawAccountBalanceIP.incentivesGivenIds;
        let incentivesGivenAmount = rawAccountBalanceIP.incentivesGivenAmount;
        let protocolFeeAmounts = rawAccountBalanceIP.protocolFeeAmounts;
        let frontendFeeAmounts = rawAccountBalanceIP.frontendFeeAmounts;

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = incentivesGivenIds.indexOf(tokenId);

          if (index == -1) {
            incentivesGivenIds.push(tokenId);
            incentivesGivenAmount.push(event.params.incentiveAmounts[i]);
            protocolFeeAmounts.push(event.params.protocolFeeAmounts[i]);
            frontendFeeAmounts.push(event.params.frontendFeeAmounts[i]);
          } else {
            incentivesGivenAmount[index] = incentivesGivenAmount[index].plus(
              event.params.incentiveAmounts[i]
            );
            protocolFeeAmounts[index] = protocolFeeAmounts[index].plus(
              event.params.protocolFeeAmounts[i]
            );
            frontendFeeAmounts[index] = frontendFeeAmounts[index].plus(
              event.params.frontendFeeAmounts[i]
            );
          }
        }

        rawAccountBalanceIP.incentivesGivenIds = incentivesGivenIds;
        rawAccountBalanceIP.incentivesGivenAmount = incentivesGivenAmount;
        rawAccountBalanceIP.protocolFeeAmounts = protocolFeeAmounts;
        rawAccountBalanceIP.frontendFeeAmounts = frontendFeeAmounts;

        // Save Raw Account Balance entities
        rawAccountBalanceAP.save();
        rawAccountBalanceIP.save();
      }

      // ============== ..... ==============
      // New Raw Activity entity for AP
      if (rawOffer != null && rawMarket != null) {
        let rawActivityAP = new RawActivity(
          CHAIN_ID.toString()
            .concat("_")
            .concat(event.transaction.hash.toHexString())
            .concat("_")
            .concat(event.logIndex.toString())
            .concat("_")
            .concat(AP_OFFER_SIDE.toString())
        );

        rawActivityAP.chainId = CHAIN_ID;
        rawActivityAP.marketType = RECIPE_MARKET_TYPE;
        rawActivityAP.marketId = rawMarket.marketId;
        rawActivityAP.accountAddress = rawOffer.creator;
        rawActivityAP.activityType = AP_OFFER_FILLED;
        rawActivityAP.tokensGivenIds = [rawMarket.inputTokenId];
        rawActivityAP.tokensGivenAmount = [event.params.fillAmount];
        rawActivityAP.tokensReceivedIds = rawOffer.tokenIds;
        rawActivityAP.tokensReceivedAmount = event.params.incentiveAmounts;
        rawActivityAP.blockNumber = event.block.number;
        rawActivityAP.blockTimestamp = event.block.timestamp;
        rawActivityAP.transactionHash = event.transaction.hash.toHexString();
        rawActivityAP.logIndex = event.logIndex;

        rawActivityAP.save();
      }
      // ============== xxxxx ==============

      // ============== ..... ==============
      // New Raw Activity entity for IP
      let rawActivityIP = new RawActivity(
        CHAIN_ID.toString()
          .concat("_")
          .concat(event.transaction.hash.toHexString())
          .concat("_")
          .concat(event.logIndex.toString())
          .concat("_")
          .concat(IP_OFFER_SIDE.toString())
      );

      rawActivityIP.chainId = CHAIN_ID;
      rawActivityIP.marketType = RECIPE_MARKET_TYPE;
      rawActivityIP.marketId = rawMarket.marketId;
      rawActivityIP.accountAddress = event.params.ip.toHexString();
      rawActivityIP.activityType = AP_OFFER_FILLED;
      rawActivityIP.tokensGivenIds = rawOffer.tokenIds;

      let tokensGivenAmount: BigInt[] = [];

      for (let i = 0; i < rawOffer.tokenIds.length; i++) {
        tokensGivenAmount.push(
          event.params.incentiveAmounts[i]
            .plus(event.params.protocolFeeAmounts[i])
            .plus(event.params.frontendFeeAmounts[i])
        );
      }

      rawActivityIP.tokensGivenAmount = tokensGivenAmount;
      rawActivityIP.tokensReceivedIds = [rawMarket.inputTokenId];
      rawActivityIP.tokensReceivedAmount = [event.params.fillAmount];
      rawActivityIP.blockNumber = event.block.number;
      rawActivityIP.blockTimestamp = event.block.timestamp;
      rawActivityIP.transactionHash = event.transaction.hash.toHexString();
      rawActivityIP.logIndex = event.logIndex;

      rawActivityIP.save();
      // ============== xxxxx ==============
    }
  }
}

export function handleAPOfferCancelled(event: APOfferCancelledEvent): void {
  let entity = new APOfferCancelled(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.offerId = event.params.offerID;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  let rawOffer = RawOffer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(RECIPE_MARKET_TYPE.toString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
      .concat("_")
      .concat(event.params.offerID.toString())
  );

  if (rawOffer != null) {
    // ============== ..... ==============
    // Raw Offer entity updates
    rawOffer.isCancelled = true;
    rawOffer.save();
    // ============== xxxxx ==============

    // Get Raw Market entity
    let rawMarket = RawMarket.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawOffer.marketId)
    );

    if (rawMarket != null) {
      // ============== ..... ==============
      // Update Raw Market entity

      // Update quantityAsked
      rawMarket.quantityAsked = rawMarket.quantityAsked.minus(
        rawOffer.quantityRemaining
      );

      // Update incentivesAsked
      let incentivesAskedIds = rawMarket.incentivesAskedIds;
      let updatedIncentivesAskedAmount = rawMarket.incentivesAskedAmount;

      for (let i = 0; i < rawOffer.tokenIds.length; i++) {
        let tokenId = rawOffer.tokenIds[i];

        let index = incentivesAskedIds.indexOf(tokenId);

        if (index != -1) {
          updatedIncentivesAskedAmount[index] = updatedIncentivesAskedAmount[
            index
          ].minus(rawOffer.tokenAmounts[i]);
        }
      }

      rawMarket.incentivesAskedAmount = updatedIncentivesAskedAmount;

      rawMarket.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // New Raw Activity entity for AP
      let rawActivityAP = new RawActivity(
        CHAIN_ID.toString()
          .concat("_")
          .concat(event.transaction.hash.toHexString())
          .concat("_")
          .concat(event.logIndex.toString())
      );

      rawActivityAP.chainId = CHAIN_ID;
      rawActivityAP.marketType = RECIPE_MARKET_TYPE;
      rawActivityAP.marketId = rawOffer.marketId.toString();
      rawActivityAP.accountAddress = rawOffer.creator;
      rawActivityAP.activityType = AP_OFFER_CANCELLED;
      rawActivityAP.tokensGivenIds = rawOffer.tokenIds;
      rawActivityAP.tokensGivenAmount = rawOffer.tokenAmounts;
      rawActivityAP.tokensReceivedIds = [rawOffer.inputTokenId];
      rawActivityAP.tokensReceivedAmount = [rawOffer.quantityRemaining];
      rawActivityAP.blockNumber = event.block.number;
      rawActivityAP.blockTimestamp = event.block.timestamp;
      rawActivityAP.transactionHash = event.transaction.hash.toHexString();
      rawActivityAP.logIndex = event.logIndex;

      rawActivityAP.save();
      // ============== xxxxx ==============
    }
  }
}
