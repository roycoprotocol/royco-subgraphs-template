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
  MARKET_TYPE,
  UPFRONT_REWARD_STYLE,
} from "./constants";

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
      .concat(MARKET_TYPE.toString())
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
        rawMarket.incentivesAskedAmount[index] =
          rawMarket.incentivesAskedAmount[index].plus(
            event.params.incentiveAmounts[i]
          );
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
        .concat(MARKET_TYPE.toString())
        .concat("_")
        .concat(AP_OFFER_SIDE.toString())
        .concat("_")
        .concat(event.params.offerID.toString())
    );

    rawOffer.chainId = CHAIN_ID;
    rawOffer.marketType = MARKET_TYPE;
    rawOffer.offerSide = AP_OFFER_SIDE;
    rawOffer.offerId = event.params.offerID.toString();
    rawOffer.marketId = event.params.marketHash.toHexString();
    rawOffer.creator = event.transaction.from.toHexString();
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
    rawActivity.marketType = MARKET_TYPE;
    rawActivity.marketId = event.params.marketHash.toHexString();
    rawActivity.accountAddress = event.transaction.from.toHexString();
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
  let entity = new APOfferFilled(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.offerId = event.params.offerID;
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
      .concat(MARKET_TYPE.toString())
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
        .concat(MARKET_TYPE.toString())
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

      for (let i = 0; i < event.params.incentiveAmounts.length; i++) {
        let tokenId = rawOffer.tokenIds[i];

        let index = incentivesAskedIds.indexOf(tokenId);

        if (index != -1) {
          rawMarket.incentivesAskedAmount[index] =
            rawMarket.incentivesAskedAmount[index].minus(
              event.params.incentiveAmounts[i]
            );
        }
      }

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
        rawMarket.volumeAmounts[index] = rawMarket.volumeAmounts[index].plus(
          event.params.fillAmount
        );
      }

      // Update volume token ids and amounts for incentives
      for (let i = 0; i < rawOffer.tokenIds.length; i++) {
        let tokenId = rawOffer.tokenIds[i];
        let index = rawMarket.volumeTokenIds.indexOf(tokenId);

        if (index == -1) {
          let updatedVolumeTokenIds = rawMarket.volumeTokenIds;
          let updatedVolumeAmounts = rawMarket.volumeAmounts;

          updatedVolumeTokenIds.push(tokenId);
          updatedVolumeAmounts.push(event.params.incentiveAmounts[i]);

          rawMarket.volumeTokenIds = updatedVolumeTokenIds;
          rawMarket.volumeAmounts = updatedVolumeAmounts;
        } else {
          rawMarket.volumeAmounts[index] = rawMarket.volumeAmounts[index].plus(
            event.params.incentiveAmounts[i]
          );
        }
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
      rawPositionAP.ip = event.transaction.from.toHexString();
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
      rawPositionIP.accountAddress = event.transaction.from.toHexString();
      rawPositionIP.ap = rawOffer.creator;
      rawPositionIP.ip = event.transaction.from.toHexString();
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
          .concat(MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(rawOffer.creator)
      );

      // Update Raw Account Balance entity for AP
      if (rawAccountBalanceAP == null) {
        rawAccountBalanceAP = new RawAccountBalance(
          CHAIN_ID.toString()
            .concat("_")
            .concat(MARKET_TYPE.toString())
            .concat("_")
            .concat(rawMarket.marketId)
            .concat("_")
            .concat(rawOffer.creator)
        );

        rawAccountBalanceAP.chainId = CHAIN_ID;
        rawAccountBalanceAP.marketType = MARKET_TYPE;
        rawAccountBalanceAP.marketId = rawMarket.marketId;
        rawAccountBalanceAP.accountAddress = rawOffer.creator;
        rawAccountBalanceAP.inputTokenId = rawMarket.inputTokenId;
        rawAccountBalanceAP.quantityReceivedAmount = BigInt.zero();
        rawAccountBalanceAP.quantityGivenAmount = event.params.fillAmount; // update

        let incentivesReceivedIds: string[] = [];
        let incentivesReceivedAmount: BigInt[] = [];

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let index = incentivesReceivedIds.indexOf(rawOffer.tokenIds[i]);

          if (index == -1) {
            incentivesReceivedIds.push(rawOffer.tokenIds[i]);
            incentivesReceivedAmount.push(event.params.incentiveAmounts[i]);
          } else {
            incentivesReceivedAmount[index] = incentivesReceivedAmount[
              index
            ].plus(event.params.incentiveAmounts[i]);
          }
        }

        rawAccountBalanceAP.incentivesReceivedIds = incentivesReceivedIds; // update
        rawAccountBalanceAP.incentivesReceivedAmount = incentivesReceivedAmount; // update

        rawAccountBalanceAP.incentivesGivenIds = [];
        rawAccountBalanceAP.incentivesGivenAmount = [];
        rawAccountBalanceAP.protocolFeeAmounts = [];
        rawAccountBalanceAP.frontendFeeAmounts = [];

        rawAccountBalanceAP.save();
      } else {
        rawAccountBalanceAP.quantityGivenAmount =
          rawAccountBalanceAP.quantityGivenAmount.plus(event.params.fillAmount); // update

        let incentivesReceivedIds = rawAccountBalanceAP.incentivesReceivedIds;

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = incentivesReceivedIds.indexOf(tokenId);

          if (index == -1) {
            let updatedIncentivesReceivedIds =
              rawAccountBalanceAP.incentivesReceivedIds;
            let updatedIncentivesReceivedAmount =
              rawAccountBalanceAP.incentivesReceivedAmount;

            updatedIncentivesReceivedIds.push(tokenId);
            updatedIncentivesReceivedAmount.push(
              event.params.incentiveAmounts[i]
            );

            rawAccountBalanceAP.incentivesReceivedIds =
              updatedIncentivesReceivedIds;
            rawAccountBalanceAP.incentivesReceivedAmount =
              updatedIncentivesReceivedAmount;
          } else {
            rawAccountBalanceAP.incentivesReceivedAmount[index] =
              rawAccountBalanceAP.incentivesReceivedAmount[index].plus(
                event.params.incentiveAmounts[i]
              );
          }
        }

        rawAccountBalanceAP.save();
      }
      // ============== xxxxx ==============

      // ============== ..... ==============
      // Get Raw Account Balance entity for IP
      let rawAccountBalanceIP = RawAccountBalance.load(
        CHAIN_ID.toString()
          .concat("_")
          .concat(MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(event.transaction.from.toHexString())
      );

      if (rawAccountBalanceIP == null) {
        rawAccountBalanceIP = new RawAccountBalance(
          CHAIN_ID.toString()
            .concat("_")
            .concat(MARKET_TYPE.toString())
            .concat("_")
            .concat(rawMarket.marketId)
            .concat("_")
            .concat(event.transaction.from.toHexString())
        );

        rawAccountBalanceIP.chainId = CHAIN_ID;
        rawAccountBalanceIP.marketType = MARKET_TYPE;
        rawAccountBalanceIP.marketId = rawMarket.marketId;
        rawAccountBalanceIP.accountAddress =
          event.transaction.from.toHexString();
        rawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
        rawAccountBalanceIP.quantityReceivedAmount = event.params.fillAmount; // update
        rawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
        rawAccountBalanceIP.incentivesReceivedIds = [];
        rawAccountBalanceIP.incentivesReceivedAmount = [];

        // Update Raw Account Balance entity for IP
        let incentivesGivenIds: string[] = [];
        let incentivesGivenAmount: BigInt[] = [];
        let protocolFeeAmounts: BigInt[] = [];
        let frontendFeeAmounts: BigInt[] = [];

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

        rawAccountBalanceIP.incentivesGivenIds = incentivesGivenIds; // update
        rawAccountBalanceIP.incentivesGivenAmount = incentivesGivenAmount; // update
        rawAccountBalanceIP.protocolFeeAmounts = protocolFeeAmounts;
        rawAccountBalanceIP.frontendFeeAmounts = frontendFeeAmounts;

        rawAccountBalanceIP.save();
      } else {
        rawAccountBalanceIP.quantityReceivedAmount =
          rawAccountBalanceIP.quantityReceivedAmount.plus(
            event.params.fillAmount
          ); // update

        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = rawAccountBalanceIP.incentivesGivenIds.indexOf(tokenId);

          if (index == -1) {
            let updatedIncentivesGivenIds =
              rawAccountBalanceIP.incentivesGivenIds;
            let updatedIncentivesGivenAmount =
              rawAccountBalanceIP.incentivesGivenAmount;
            let updatedProtocolFeeAmounts =
              rawAccountBalanceIP.protocolFeeAmounts;
            let updatedFrontendFeeAmounts =
              rawAccountBalanceIP.frontendFeeAmounts;

            updatedIncentivesGivenIds.push(tokenId);
            updatedIncentivesGivenAmount.push(event.params.incentiveAmounts[i]);
            updatedProtocolFeeAmounts.push(event.params.protocolFeeAmounts[i]);
            updatedFrontendFeeAmounts.push(event.params.frontendFeeAmounts[i]);

            rawAccountBalanceIP.incentivesGivenIds = updatedIncentivesGivenIds;
            rawAccountBalanceIP.incentivesGivenAmount =
              updatedIncentivesGivenAmount;
            rawAccountBalanceIP.protocolFeeAmounts = updatedProtocolFeeAmounts;
            rawAccountBalanceIP.frontendFeeAmounts = updatedFrontendFeeAmounts;
          } else {
            rawAccountBalanceIP.incentivesGivenAmount[index] =
              rawAccountBalanceIP.incentivesGivenAmount[index].plus(
                event.params.incentiveAmounts[i]
              ); // update
            rawAccountBalanceIP.protocolFeeAmounts[index] =
              rawAccountBalanceIP.protocolFeeAmounts[index].plus(
                event.params.protocolFeeAmounts[i]
              );
            rawAccountBalanceIP.frontendFeeAmounts[index] =
              rawAccountBalanceIP.frontendFeeAmounts[index].plus(
                event.params.frontendFeeAmounts[i]
              );
          }
        }

        rawAccountBalanceIP.save();
      }
      // ============== xxxxx ==============

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
        rawActivityAP.marketType = MARKET_TYPE;
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
      rawActivityIP.marketType = MARKET_TYPE;
      rawActivityIP.marketId = rawMarket.marketId;
      rawActivityIP.accountAddress = event.transaction.from.toHexString();
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
      .concat(MARKET_TYPE.toString())
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
        .concat(MARKET_TYPE.toString())
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

      for (let i = 0; i < rawOffer.tokenIds.length; i++) {
        let tokenId = rawOffer.tokenIds[i];

        let index = incentivesAskedIds.indexOf(tokenId);

        if (index != -1) {
          rawMarket.incentivesAskedAmount[index] =
            rawMarket.incentivesAskedAmount[index].minus(
              rawOffer.tokenAmounts[i]
            );
        }
      }

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
      rawActivityAP.marketType = MARKET_TYPE;
      rawActivityAP.marketId = rawOffer.marketId.toString();
      rawActivityAP.accountAddress = event.transaction.from.toHexString();
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
