import { BigInt } from "@graphprotocol/graph-ts";
import {
  WeirollWalletForfeited as WeirollWalletForfeitedEvent,
  WeirollWalletExecutedWithdrawal as WeirollWalletExecutedWithdrawalEvent,
  WeirollWalletClaimedIncentive as WeirollWalletClaimedIncentiveEvent,
} from "../generated/RecipeMarketHub/RecipeMarketHub";
import {
  RawAccountBalance,
  RawActivity,
  RawOffer,
  RawPosition,
  WeirollWalletClaimedIncentive,
  WeirollWalletForfeited,
  WeirollWalletExecutedWithdrawal,
} from "../generated/schema";
import {
  AP_OFFER_SIDE,
  CHAIN_ID,
  IP_OFFER_SIDE,
  RECIPE_MARKET_TYPE,
  WEIROLL_WALLET_CLAIMED_INCENTIVE,
  WEIROLL_WALLET_FORFEITED,
  WEIROLL_WALLET_EXECUTED_WITHDRAWAL,
} from "./constants";

export function handleWeirollWalletClaimedIncentive(
  event: WeirollWalletClaimedIncentiveEvent
): void {
  let entity = new WeirollWalletClaimedIncentive(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.weirollWallet = event.params.weirollWallet.toHexString();
  entity.recipient = event.params.recipient.toHexString();
  entity.incentive = event.params.incentive.toHexString();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // Update Raw Weiroll Wallet entity for AP
  let rawPositionAP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
  );

  // Update Raw Weiroll Wallet entity for IP
  let rawPositionIP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(IP_OFFER_SIDE.toString())
  );

  if (rawPositionAP != null && rawPositionIP != null) {
    let claimedToken = CHAIN_ID.toString()
      .concat("-")
      .concat(event.params.incentive.toHexString());

    let index = rawPositionAP.tokenIds.indexOf(claimedToken);

    let newIsClaimedAP = rawPositionAP.isClaimed;
    newIsClaimedAP[index] = true;
    rawPositionAP.isClaimed = newIsClaimedAP;
    rawPositionAP.save();

    let newIsClaimedIP = rawPositionIP.isClaimed;
    newIsClaimedIP[index] = true;
    rawPositionIP.isClaimed = newIsClaimedIP;
    rawPositionIP.save();
  }

  // ============== ..... ==============
  // New Raw Activity for AP
  let rawActivityAP = new RawActivity(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
  );

  if (rawPositionAP != null) {
    let claimedToken = CHAIN_ID.toString()
      .concat("-")
      .concat(event.params.incentive.toHexString());

    let index = rawPositionAP.tokenIds.indexOf(claimedToken);

    rawActivityAP.chainId = CHAIN_ID;
    rawActivityAP.marketType = RECIPE_MARKET_TYPE;
    rawActivityAP.marketId = rawPositionAP.marketId;
    rawActivityAP.accountAddress = rawPositionAP.ap;
    rawActivityAP.activityType = WEIROLL_WALLET_CLAIMED_INCENTIVE;
    rawActivityAP.tokensGivenIds = [];
    rawActivityAP.tokensGivenAmount = [];
    rawActivityAP.tokensReceivedIds = [event.params.incentive.toHexString()];
    rawActivityAP.tokensReceivedAmount = [rawPositionAP.tokenAmounts[index]];
    rawActivityAP.transactionHash = event.transaction.hash.toHexString();
    rawActivityAP.blockNumber = event.block.number;
    rawActivityAP.blockTimestamp = event.block.timestamp;
    rawActivityAP.logIndex = event.logIndex;

    rawActivityAP.save();
  }
  // ============== xxxxx ==============
}

export function handleWeirollWalletForfeited(
  event: WeirollWalletForfeitedEvent
): void {
  let entity = new WeirollWalletForfeited(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.weirollWallet = event.params.weirollWallet.toHexString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  let rawPositionAP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
  );

  let rawPositionIP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(IP_OFFER_SIDE.toString())
  );

  // ============== ..... ==============
  // @note We are not updating rawMarket entity here
  // ============== xxxxx ==============

  // ============== ..... ==============
  // Market position as forfeited
  if (rawPositionAP != null && rawPositionIP !== null) {
    rawPositionAP.isForfeited = true;
    rawPositionIP.isForfeited = true;
  }
  // ============== xxxxx ==============

  if (rawPositionAP != null && rawPositionIP != null) {
    let rawOffer = RawOffer.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawPositionAP.rawOfferSide.toString())
        .concat("_")
        .concat(rawPositionAP.rawOfferId.toString())
    );

    let rawAccountBalanceAP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawPositionAP.marketId)
        .concat("_")
        .concat(rawPositionAP.ap)
    );

    let rawAccountBalanceIP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawPositionAP.marketId)
        .concat("_")
        .concat(rawPositionAP.ip)
    );

    if (
      rawOffer != null &&
      rawAccountBalanceAP != null &&
      rawAccountBalanceIP != null
    ) {
      // ================== ..... ==================
      // Update Account Balance for AP
      for (let i = 0; i < rawPositionAP.tokenIds.length; i++) {
        let tokenId = rawPositionAP.tokenIds[i];
        let index = rawAccountBalanceAP.incentivesReceivedIds.indexOf(tokenId);

        if (index != -1) {
          rawAccountBalanceAP.incentivesReceivedAmount[index] =
            rawAccountBalanceAP.incentivesReceivedAmount[index].minus(
              rawPositionAP.tokenAmounts[i]
            );
        }
      }
      // ================== xxxxx ==================

      // rawOffer was IP Offer
      if (rawOffer.offerSide == IP_OFFER_SIDE) {
        // rawOffer is cancelled or expired
        if (
          rawOffer.isCancelled == true ||
          (rawOffer.expiry != BigInt.zero() &&
            rawOffer.expiry <= event.block.timestamp)
        ) {
          // Return the incentives to IP
          // Return the frontend fees to IP, but not the protocol fees
          // Update Account Balance for IP
          for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
            let tokenId = rawPositionIP.tokenIds[i];
            let index = rawAccountBalanceIP.incentivesGivenIds.indexOf(tokenId);
            let incentivesToReturn = rawPositionIP.tokenAmounts[i].plus(
              rawPositionIP.frontendFeeAmounts[i]
                .times(rawPositionIP.quantity)
                .div(rawOffer.quantity)
            );

            if (index != -1) {
              rawAccountBalanceIP.incentivesGivenAmount[index] =
                rawAccountBalanceIP.incentivesGivenAmount[index].minus(
                  incentivesToReturn
                );
            }
          }
        }
        // return the quantity to rawOffer
        else {
          rawOffer.quantityRemaining = rawOffer.quantityRemaining.plus(
            rawPositionIP.quantity
          );
        }
      }
      // rawOffer was AP Offer
      else {
        // Return the incentives to IP
        // Return the frontend fees to IP, but not the protocol fees
        // Update Account Balance for IP
        for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
          let tokenId = rawPositionIP.tokenIds[i];
          let index = rawAccountBalanceIP.incentivesGivenIds.indexOf(tokenId);
          let incentivesToReturn = rawPositionIP.tokenAmounts[i].plus(
            rawPositionIP.frontendFeeAmounts[i]
              .times(rawPositionIP.quantity)
              .div(rawOffer.quantity)
          );

          if (index != -1) {
            rawAccountBalanceIP.incentivesGivenAmount[index] =
              rawAccountBalanceIP.incentivesGivenAmount[index].minus(
                incentivesToReturn
              );
          }
        }
      }

      // Save all entities
      rawOffer.save();
      rawAccountBalanceAP.save();
      rawAccountBalanceIP.save();
    }

    // Save all entities
    rawPositionAP.save();
    rawPositionIP.save();
  }

  // ============== ..... ==============
  // New Raw Activity for AP
  if (rawPositionAP != null) {
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
    rawActivityAP.marketId = rawPositionAP.marketId;
    rawActivityAP.accountAddress = rawPositionAP.ap;
    rawActivityAP.activityType = WEIROLL_WALLET_FORFEITED;
    rawActivityAP.tokensGivenIds = rawPositionAP.tokenIds;
    rawActivityAP.tokensGivenAmount = rawPositionAP.tokenAmounts;
    rawActivityAP.tokensReceivedIds = [];
    rawActivityAP.tokensReceivedAmount = [];
    rawActivityAP.transactionHash = event.transaction.hash.toHexString();
    rawActivityAP.blockNumber = event.block.number;
    rawActivityAP.blockTimestamp = event.block.timestamp;
    rawActivityAP.logIndex = event.logIndex;

    rawActivityAP.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // New Raw Activity for IP

  if (rawPositionIP != null) {
    let rawOffer = RawOffer.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawPositionIP.rawOfferSide.toString())
        .concat("_")
        .concat(rawPositionIP.rawOfferId.toString())
    );

    if (rawOffer != null) {
      let tokensReceivedIds: Array<string> = [];
      let tokensReceivedAmount: Array<BigInt> = [];

      if (rawOffer.offerSide == IP_OFFER_SIDE) {
        if (
          rawOffer.isCancelled == true ||
          (rawOffer.expiry != BigInt.zero() &&
            rawOffer.expiry <= event.block.timestamp)
        ) {
          for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
            tokensReceivedIds.push(rawPositionIP.tokenIds[i]);
            tokensReceivedAmount.push(
              rawPositionIP.tokenAmounts[i].plus(
                rawPositionIP.frontendFeeAmounts[i]
                  .times(rawPositionIP.quantity)
                  .div(rawOffer.quantity)
              )
            );
          }
        } else {
          // do nothing
        }
      } else {
        for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
          tokensReceivedIds.push(rawPositionIP.tokenIds[i]);
          tokensReceivedAmount.push(
            rawPositionIP.tokenAmounts[i].plus(
              rawPositionIP.frontendFeeAmounts[i]
                .times(rawPositionIP.quantity)
                .div(rawOffer.quantity)
            )
          );
        }
      }

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
      rawActivityIP.marketId = rawPositionIP.marketId;
      rawActivityIP.accountAddress = rawPositionIP.ip;
      rawActivityIP.activityType = WEIROLL_WALLET_FORFEITED;
      rawActivityIP.tokensGivenIds = [];
      rawActivityIP.tokensGivenAmount = [];
      rawActivityIP.tokensReceivedIds = tokensReceivedIds;
      rawActivityIP.tokensReceivedAmount = tokensReceivedAmount;

      rawActivityIP.transactionHash = event.transaction.hash.toHexString();
      rawActivityIP.blockNumber = event.block.number;
      rawActivityIP.blockTimestamp = event.block.timestamp;
      rawActivityIP.logIndex = event.logIndex;

      rawActivityIP.save();
    }
  }
  // ============== xxxxx ==============
}

export function handleWeirollWalletExecutedWithdrawal(
  event: WeirollWalletExecutedWithdrawalEvent
): void {
  let entity = new WeirollWalletExecutedWithdrawal(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.weirollWallet = event.params.weirollWallet.toHexString();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // Get Raw Position entity for AP
  let rawPositionAP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(AP_OFFER_SIDE.toString())
  );

  // Get Raw Position entity for IP
  let rawPositionIP = RawPosition.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.params.weirollWallet.toHexString())
      .concat("_")
      .concat(IP_OFFER_SIDE.toString())
  );

  // ============== ..... ==============
  // Update Raw Position entity for AP & IP
  if (rawPositionAP != null && rawPositionIP != null) {
    rawPositionAP.isWithdrawn = true;
    rawPositionAP.save();

    rawPositionIP.isWithdrawn = true;
    rawPositionIP.save();
  }
  // ============== xxxxx ==============

  // ============== ..... ==============
  // @note: We are not updating account balances here because we are keeping the track of quantity given/received and incentives given/received, instead of tokens in and tokens out.
  // ============== xxxxx ==============

  // ============== ..... ==============
  if (rawPositionAP != null && rawPositionIP != null) {
    // New Raw Activity for AP
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
    rawActivityAP.marketId = rawPositionAP.marketId.toString();
    rawActivityAP.accountAddress = event.transaction.from.toHexString();
    rawActivityAP.activityType = WEIROLL_WALLET_EXECUTED_WITHDRAWAL;
    rawActivityAP.tokensGivenIds = [];
    rawActivityAP.tokensGivenAmount = [];
    rawActivityAP.tokensReceivedIds = [rawPositionAP.inputTokenId];
    rawActivityAP.tokensReceivedAmount = [rawPositionAP.quantity];
    rawActivityAP.transactionHash = event.transaction.hash.toHexString();
    rawActivityAP.blockNumber = event.block.number;
    rawActivityAP.blockTimestamp = event.block.timestamp;
    rawActivityAP.logIndex = event.logIndex;

    rawActivityAP.save();

    // New Raw Activity for IP
    let rawActivityIP = new RawActivity(
      CHAIN_ID.toString()
        .concat("_")
        .concat(event.transaction.hash.toHexString())
        .concat("_")
        .concat(event.logIndex.toString())
    );

    rawActivityIP.chainId = CHAIN_ID;
    rawActivityIP.marketType = RECIPE_MARKET_TYPE;
    rawActivityIP.marketId = rawPositionIP.marketId.toString();
    rawActivityIP.accountAddress = rawPositionIP.ip;
    rawActivityIP.activityType = WEIROLL_WALLET_EXECUTED_WITHDRAWAL;
    rawActivityIP.tokensGivenIds = [rawPositionIP.inputTokenId];
    rawActivityIP.tokensGivenAmount = [rawPositionIP.quantity];
    rawActivityIP.tokensReceivedIds = [];
    rawActivityIP.tokensReceivedAmount = [];
    rawActivityIP.transactionHash = event.transaction.hash.toHexString();
    rawActivityIP.blockNumber = event.block.number;
    rawActivityIP.blockTimestamp = event.block.timestamp;
    rawActivityIP.logIndex = event.logIndex;

    rawActivityIP.save();
  }
  // ============== xxxxx ==============
}
