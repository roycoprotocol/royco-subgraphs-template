import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  IPOfferCancelled as IPOfferCancelledEvent,
  IPOfferCreated as IPOfferCreatedEvent,
  IPOfferFilled as IPOfferFilledEvent,
} from "../generated/RecipeMarketHub/RecipeMarketHub";
import {
  IPOfferCancelled,
  IPOfferCreated,
  IPOfferFilled,
  RawAccountBalance,
  RawActivity,
  RawMarket,
  RawOffer,
  RawPosition,
} from "../generated/schema";
import {
  AP_OFFER_SIDE,
  CHAIN_ID,
  IP_OFFER_CANCELLED,
  IP_OFFER_CREATED,
  IP_OFFER_FILLED,
  IP_OFFER_SIDE,
  RECIPE_MARKET_TYPE,
  NULL_ADDRESS,
  UPFRONT_REWARD_STYLE,
} from "./constants";

export function handleIPOfferCreated(event: IPOfferCreatedEvent): void {
  let entity = new IPOfferCreated(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.offerId = event.params.offerID;
  entity.offerHash = event.params.offerHash.toHexString();
  entity.marketHash = event.params.marketHash.toHexString();
  entity.quantity = event.params.quantity;
  entity.incentivesOffered = event.params.incentivesOffered.map<string>(
    (token: Address) => token.toHexString()
  );
  entity.incentiveAmounts = event.params.incentiveAmounts;
  entity.protocolFeeAmounts = event.params.protocolFeeAmounts;
  entity.frontendFeeAmounts = event.params.frontendFeeAmounts;
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
    // Update quantityOffered
    rawMarket.quantityOffered = rawMarket.quantityOffered.plus(
      event.params.quantity
    );

    // Update incentivesOffered
    let incentivesOfferedIds = rawMarket.incentivesOfferedIds;

    for (let i = 0; i < event.params.incentivesOffered.length; i++) {
      let tokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.incentivesOffered[i].toHexString());

      let index = incentivesOfferedIds.indexOf(tokenId);

      if (index == -1) {
        let updatedIncentivesOfferedIds = rawMarket.incentivesOfferedIds;
        let updatedIncentivesOfferedAmount = rawMarket.incentivesOfferedAmount;

        updatedIncentivesOfferedIds.push(tokenId);
        updatedIncentivesOfferedAmount.push(event.params.incentiveAmounts[i]);

        rawMarket.incentivesOfferedIds = updatedIncentivesOfferedIds;
        rawMarket.incentivesOfferedAmount = updatedIncentivesOfferedAmount;
      } else {
        rawMarket.incentivesOfferedAmount[index] =
          rawMarket.incentivesOfferedAmount[index].plus(
            event.params.incentiveAmounts[i]
          );
      }
    }

    // Update volume token ids and amounts for incentives
    for (let i = 0; i < event.params.incentiveAmounts.length; i++) {
      let tokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.incentivesOffered[i].toHexString());

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
        .concat(IP_OFFER_SIDE.toString())
        .concat("_")
        .concat(event.params.offerHash.toHexString())
    );

    rawOffer.chainId = CHAIN_ID;
    rawOffer.marketType = RECIPE_MARKET_TYPE;
    rawOffer.offerSide = IP_OFFER_SIDE;
    rawOffer.offerId = event.params.offerHash.toHexString();
    rawOffer.marketId = event.params.marketHash.toHexString();
    rawOffer.creator = event.transaction.from.toHexString();
    rawOffer.fundingVault = NULL_ADDRESS;
    rawOffer.inputTokenId = rawMarket.inputTokenId;
    rawOffer.quantity = event.params.quantity;
    rawOffer.quantityRemaining = event.params.quantity;
    rawOffer.expiry = event.params.expiry;
    rawOffer.tokenIds = event.params.incentivesOffered.map<string>(
      (token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
    );
    rawOffer.tokenAmounts = event.params.incentiveAmounts;
    rawOffer.protocolFeeAmounts = event.params.protocolFeeAmounts;
    rawOffer.frontendFeeAmounts = event.params.frontendFeeAmounts;
    rawOffer.isCancelled = false;
    rawOffer.blockNumber = event.block.number;
    rawOffer.blockTimestamp = event.block.timestamp;
    rawOffer.transactionHash = event.transaction.hash.toHexString();
    rawOffer.logIndex = event.logIndex;

    rawOffer.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // New Raw Account Balance entity for IP
  let rawAccountBalanceIP = RawAccountBalance.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(RECIPE_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.params.marketHash.toHexString())
      .concat("_")
      .concat(event.transaction.from.toHexString())
  );

  if (rawAccountBalanceIP == null) {
    if (rawMarket != null) {
      rawAccountBalanceIP = new RawAccountBalance(
        CHAIN_ID.toString()
          .concat("_")
          .concat(RECIPE_MARKET_TYPE.toString())
          .concat("_")
          .concat(event.params.marketHash.toHexString())
          .concat("_")
          .concat(event.transaction.from.toHexString())
      );

      rawAccountBalanceIP.chainId = CHAIN_ID;
      rawAccountBalanceIP.marketType = RECIPE_MARKET_TYPE;
      rawAccountBalanceIP.marketId = event.params.marketHash.toHexString();
      rawAccountBalanceIP.accountAddress = event.transaction.from.toHexString();
      rawAccountBalanceIP.inputTokenId = rawMarket.inputTokenId;
      rawAccountBalanceIP.quantityReceivedAmount = BigInt.zero();
      rawAccountBalanceIP.quantityGivenAmount = BigInt.zero();
      rawAccountBalanceIP.incentivesReceivedIds = [];
      rawAccountBalanceIP.incentivesReceivedAmount = [];

      let incentivesGivenIds: string[] = [];
      let incentivesGivenAmount: BigInt[] = [];
      let protocolFeeAmounts: BigInt[] = [];
      let frontendFeeAmounts: BigInt[] = [];

      for (let i = 0; i < event.params.incentivesOffered.length; i++) {
        let tokenId = CHAIN_ID.toString()
          .concat("-")
          .concat(event.params.incentivesOffered[i].toHexString());

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

      rawAccountBalanceIP.save();
    }
  } else {
    for (let i = 0; i < event.params.incentivesOffered.length; i++) {
      let tokenId = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.incentivesOffered[i].toHexString());
      let index = rawAccountBalanceIP.incentivesGivenIds.indexOf(tokenId);

      if (index == -1) {
        let updatedIncentivesGivenIds = rawAccountBalanceIP.incentivesGivenIds;
        let updatedIncentivesGivenAmount =
          rawAccountBalanceIP.incentivesGivenAmount;
        let updatedProtocolFeeAmounts = rawAccountBalanceIP.protocolFeeAmounts;
        let updatedFrontendFeeAmounts = rawAccountBalanceIP.frontendFeeAmounts;

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
          );

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
    rawActivity.accountAddress = event.transaction.from.toHexString();
    rawActivity.activityType = IP_OFFER_CREATED;
    rawActivity.tokensGivenIds = event.params.incentivesOffered.map<string>(
      (token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
    );

    let tokensGivenAmount: BigInt[] = [];

    for (let i = 0; i < event.params.incentiveAmounts.length; i++) {
      tokensGivenAmount.push(
        event.params.incentiveAmounts[i]
          .plus(event.params.protocolFeeAmounts[i])
          .plus(event.params.frontendFeeAmounts[i])
      );
    }

    rawActivity.tokensGivenAmount = tokensGivenAmount;
    rawActivity.tokensReceivedIds = [];
    rawActivity.tokensReceivedAmount = [];
    rawActivity.blockNumber = event.block.number;
    rawActivity.blockTimestamp = event.block.timestamp;
    rawActivity.transactionHash = event.transaction.hash.toHexString();
    rawActivity.logIndex = event.logIndex;

    rawActivity.save();
  }
  // ============== xxxxx ==============
}

export function handleIPOfferFilled(event: IPOfferFilledEvent): void {
  let entity = new IPOfferFilled(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.offerHash = event.params.offerHash.toHexString();
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
      .concat(IP_OFFER_SIDE.toString())
      .concat("_")
      .concat(event.params.offerHash.toHexString())
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
      rawMarket.quantityOffered = rawMarket.quantityOffered.minus(
        event.params.fillAmount
      );

      // Update quantityOfferedFilled
      rawMarket.quantityOfferedFilled = rawMarket.quantityOfferedFilled.plus(
        event.params.fillAmount
      );

      // Update incentivesOffered
      let incentivesOfferedIds = rawMarket.incentivesOfferedIds;

      for (let i = 0; i < event.params.incentiveAmounts.length; i++) {
        let tokenId = rawOffer.tokenIds[i];

        let index = incentivesOfferedIds.indexOf(tokenId);

        if (index != -1) {
          rawMarket.incentivesOfferedAmount[index] =
            rawMarket.incentivesOfferedAmount[index].minus(
              event.params.incentiveAmounts[i]
            );
        }
      }

      // Update volume token ids and amounts for quantity
      let index = rawMarket.volumeTokenIds.indexOf(rawOffer.inputTokenId);

      if (index == -1) {
        let updatedVolumeTokenIds = rawMarket.volumeTokenIds;
        let updatedVolumeAmounts = rawMarket.volumeAmounts;

        updatedVolumeTokenIds.push(rawOffer.inputTokenId);
        updatedVolumeAmounts.push(event.params.fillAmount);

        rawMarket.volumeTokenIds = updatedVolumeTokenIds;
        rawMarket.volumeAmounts = updatedVolumeAmounts;
      } else {
        rawMarket.volumeAmounts[index] = rawMarket.volumeAmounts[index].plus(
          event.params.fillAmount
        );
      }

      rawMarket.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // New Weiroll Wallet entity for AP
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
      rawPositionAP.accountAddress = event.transaction.from.toHexString();
      rawPositionAP.ap = event.params.weirollWallet.toHexString();
      rawPositionAP.ip = rawOffer.creator;
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
      rawPositionIP.accountAddress = rawOffer.creator;
      rawPositionIP.ap = event.params.weirollWallet.toHexString();
      rawPositionIP.ip = rawOffer.creator;
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
          .concat(event.transaction.from.toHexString())
      );

      // Update Raw Account Balance entity for AP
      if (rawAccountBalanceAP == null) {
        rawAccountBalanceAP = new RawAccountBalance(
          CHAIN_ID.toString()
            .concat("_")
            .concat(RECIPE_MARKET_TYPE.toString())
            .concat("_")
            .concat(rawMarket.marketId)
            .concat("_")
            .concat(event.transaction.from.toHexString())
        );

        rawAccountBalanceAP.chainId = CHAIN_ID;
        rawAccountBalanceAP.marketType = RECIPE_MARKET_TYPE;
        rawAccountBalanceAP.marketId = rawMarket.marketId;
        rawAccountBalanceAP.accountAddress =
          event.transaction.from.toHexString();
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
          .concat(RECIPE_MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(rawOffer.creator)
      );

      if (rawAccountBalanceIP == null) {
        // this case will never happen,
        // because the account balance for IP is created when the IP offer is created
      } else {
        rawAccountBalanceIP.quantityReceivedAmount =
          rawAccountBalanceIP.quantityReceivedAmount.plus(
            event.params.fillAmount
          ); // update

        // rest of the update logic was already made in the IP offer created event

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
        rawActivityAP.marketType = RECIPE_MARKET_TYPE;
        rawActivityAP.marketId = rawMarket.marketId;
        rawActivityAP.accountAddress = event.transaction.from.toHexString();
        rawActivityAP.activityType = IP_OFFER_FILLED;
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
      rawActivityIP.accountAddress = rawOffer.creator;
      rawActivityIP.activityType = IP_OFFER_FILLED;
      rawActivityIP.tokensGivenIds = []; // incentives were already given
      rawActivityIP.tokensGivenAmount = []; // incentives were already given
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

export function handleIPOfferCancelled(event: IPOfferCancelledEvent): void {
  let entity = new IPOfferCancelled(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.offerHash = event.params.offerHash.toHexString();
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
      .concat(IP_OFFER_SIDE.toString())
      .concat("_")
      .concat(event.params.offerHash.toHexString())
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

      // Update quantityOffered
      rawMarket.quantityOffered = rawMarket.quantityOffered.minus(
        rawOffer.quantityRemaining
      );

      // Update quantityOffered
      let incentivesOfferedIds = rawMarket.incentivesOfferedIds;
      let incentivesOfferedAmount = rawMarket.incentivesOfferedAmount;
      let volumeTokenIds = rawMarket.volumeTokenIds;
      let volumeAmounts = rawMarket.volumeAmounts;

      for (let i = 0; i < rawOffer.tokenIds.length; i++) {
        let tokenId = CHAIN_ID.toString()
          .concat("-")
          .concat(rawOffer.tokenIds[i]);

        let index = incentivesOfferedIds.indexOf(tokenId);

        if (index != -1) {
          incentivesOfferedAmount[index] = incentivesOfferedAmount[index].minus(
            rawOffer.tokenAmounts[i]
          );

          // Update volume token ids and amounts for incentives
          let indexVolume = volumeTokenIds.indexOf(tokenId);
          if (indexVolume != -1) {
            volumeAmounts[indexVolume] = volumeAmounts[indexVolume].minus(
              rawOffer.tokenAmounts[i]
            );
          }
        }
      }

      rawMarket.incentivesOfferedIds = incentivesOfferedIds;
      rawMarket.incentivesOfferedAmount = incentivesOfferedAmount;
      rawMarket.volumeTokenIds = volumeTokenIds;
      rawMarket.volumeAmounts = volumeAmounts;

      rawMarket.save();
      // ============== xxxxx ==============

      // ============== ..... ==============
      // Update Raw Account Balance entity for IP
      let rawAccountBalanceIP = RawAccountBalance.load(
        CHAIN_ID.toString()
          .concat("_")
          .concat(RECIPE_MARKET_TYPE.toString())
          .concat("_")
          .concat(rawMarket.marketId)
          .concat("_")
          .concat(event.transaction.from.toHexString())
      );

      if (rawAccountBalanceIP != null) {
        for (let i = 0; i < rawOffer.tokenIds.length; i++) {
          let tokenId = rawOffer.tokenIds[i];
          let index = rawAccountBalanceIP.incentivesGivenIds.indexOf(tokenId);

          if (index != -1) {
            rawAccountBalanceIP.incentivesGivenAmount[index] =
              rawAccountBalanceIP.incentivesGivenAmount[index].minus(
                rawOffer.tokenAmounts[i]
              );

            // Protocol fees are not returned

            rawAccountBalanceIP.frontendFeeAmounts[index] =
              rawAccountBalanceIP.frontendFeeAmounts[index].minus(
                rawOffer.frontendFeeAmounts[i]
                  .times(rawOffer.quantityRemaining)
                  .div(rawOffer.quantity)
              );
          }
        }

        rawAccountBalanceIP.save();
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
      );

      rawActivityIP.chainId = CHAIN_ID;
      rawActivityIP.marketType = RECIPE_MARKET_TYPE;
      rawActivityIP.marketId = rawOffer.marketId.toString();
      rawActivityIP.accountAddress = event.transaction.from.toHexString();
      rawActivityIP.activityType = IP_OFFER_CANCELLED;
      rawActivityIP.tokensGivenIds = [];
      rawActivityIP.tokensGivenAmount = [];
      rawActivityIP.tokensReceivedIds = rawOffer.tokenIds;

      let tokensReceivedAmount: BigInt[] = [];
      for (let i = 0; i < rawOffer.tokenAmounts.length; i++) {
        tokensReceivedAmount.push(
          rawOffer.tokenAmounts[i].plus(
            rawOffer.frontendFeeAmounts[i]
              .times(rawOffer.quantityRemaining)
              .div(rawOffer.quantity)
          )
        );
      }

      rawActivityIP.tokensReceivedAmount = tokensReceivedAmount;
      rawActivityIP.blockNumber = event.block.number;
      rawActivityIP.blockTimestamp = event.block.timestamp;
      rawActivityIP.transactionHash = event.transaction.hash.toHexString();
      rawActivityIP.logIndex = event.logIndex;

      rawActivityIP.save();
      // ============== xxxxx ==============
    }
  }
}
