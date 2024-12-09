import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  APOfferCancelled as APOfferCancelledEvent,
  APOfferCreated as APOfferCreatedEvent,
  APOfferFilled as APOfferFilledEvent,
} from "../generated/VaultMarketHub/VaultMarketHub";

import {
  APOfferCancelled,
  APOfferCreated,
  APOfferFilled,
  RawActivity,
  RawMarket,
  RawOffer,
} from "../generated/schema";
import {
  AP_OFFER_CANCELLED,
  AP_OFFER_CREATED,
  AP_OFFER_FILLED,
  AP_OFFER_SIDE,
  CHAIN_ID,
  IP_OFFER_SIDE,
  VAULT_MARKET_TYPE,
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
  entity.marketId = event.params.marketID.toHexString();
  entity.ap = event.params.ap.toHexString();
  entity.fundingVault = event.params.fundingVault.toHexString();
  entity.quantity = event.params.quantity;
  entity.incentivesRequested = event.params.incentivesRequested.map<string>(
    (token: Address) => token.toHexString()
  );
  entity.incentivesRates = event.params.incentivesRates;
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
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.params.marketID.toHexString())
  );

  if (rawMarket != null) {
    // Update quantityAsked
    rawMarket.quantityAsked = rawMarket.quantityAsked.plus(
      event.params.quantity
    );

    // (Not required for vault markets) Update incentivesAsked

    rawMarket.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // New RawOffer
  if (rawMarket != null) {
    let rawOffer = new RawOffer(
      CHAIN_ID.toString()
        .concat("_")
        .concat(VAULT_MARKET_TYPE.toString())
        .concat("_")
        .concat(AP_OFFER_SIDE.toString())
        .concat("_")
        .concat(event.params.offerID.toString())
    );

    rawOffer.chainId = CHAIN_ID;
    rawOffer.marketType = VAULT_MARKET_TYPE;
    rawOffer.offerSide = AP_OFFER_SIDE;
    rawOffer.offerId = event.params.offerID.toString();
    rawOffer.marketId = event.params.marketID.toHexString();
    rawOffer.creator = event.params.ap.toHexString();
    rawOffer.fundingVault = event.params.fundingVault.toHexString();
    rawOffer.inputTokenId = rawMarket.inputTokenId;
    rawOffer.quantity = event.params.quantity;
    rawOffer.quantityRemaining = event.params.quantity;
    rawOffer.expiry = event.params.expiry;
    rawOffer.tokenIds = event.params.incentivesRequested.map<string>(
      (token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
    );
    rawOffer.tokenAmounts = event.params.incentivesRates;
    rawOffer.protocolFeeAmounts = event.params.incentivesRates.map<BigInt>(
      (amount: BigInt) => BigInt.zero()
    );
    rawOffer.frontendFeeAmounts = event.params.incentivesRates.map<BigInt>(
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
    rawActivity.marketType = VAULT_MARKET_TYPE;
    rawActivity.marketId = event.params.marketID.toHexString();
    rawActivity.accountAddress = event.params.ap.toHexString();
    rawActivity.activityType = AP_OFFER_CREATED;
    rawActivity.tokensGivenIds = [rawMarket.inputTokenId];
    rawActivity.tokensGivenAmount = [event.params.quantity];
    rawActivity.tokensReceivedIds =
      event.params.incentivesRequested.map<string>((token: Address) =>
        CHAIN_ID.toString().concat("-").concat(token.toHexString())
      );
    rawActivity.tokensReceivedAmount = event.params.incentivesRates;
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
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  let rawOffer = RawOffer.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
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
        .concat(VAULT_MARKET_TYPE.toString())
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

      // (Not required for vault markets) Update incentivesAsked

      rawMarket.save();
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
        rawActivityAP.marketType = VAULT_MARKET_TYPE;
        rawActivityAP.marketId = rawMarket.marketId;
        rawActivityAP.accountAddress = rawOffer.creator;
        rawActivityAP.activityType = AP_OFFER_FILLED;
        rawActivityAP.tokensGivenIds = [rawMarket.inputTokenId];
        rawActivityAP.tokensGivenAmount = [event.params.fillAmount];
        rawActivityAP.tokensReceivedIds = rawOffer.tokenIds;
        rawActivityAP.tokensReceivedAmount = rawOffer.tokenAmounts;
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
      rawActivityIP.marketType = VAULT_MARKET_TYPE;
      rawActivityIP.marketId = rawMarket.marketId;
      rawActivityIP.accountAddress = rawMarket.owner;
      rawActivityIP.activityType = AP_OFFER_FILLED;
      rawActivityIP.tokensGivenIds = rawOffer.tokenIds;
      rawActivityIP.tokensGivenAmount = rawOffer.tokenAmounts;
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
      .concat(VAULT_MARKET_TYPE.toString())
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
        .concat(VAULT_MARKET_TYPE.toString())
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

      // (Not required for vault markets) Update incentivesAsked

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
      rawActivityAP.marketType = VAULT_MARKET_TYPE;
      rawActivityAP.marketId = rawOffer.marketId;
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
