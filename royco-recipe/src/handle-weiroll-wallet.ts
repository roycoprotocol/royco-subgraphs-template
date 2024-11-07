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
    let rawAccountBalanceAP = RawAccountBalance.load(
      CHAIN_ID.toString()
        .concat("_")
        .concat(RECIPE_MARKET_TYPE.toString())
        .concat("_")
        .concat(rawPositionAP.marketId)
        .concat("_")
        .concat(rawPositionAP.ap)
    );

    if (rawAccountBalanceAP != null) {
      let claimedToken = CHAIN_ID.toString()
        .concat("-")
        .concat(event.params.incentive.toHexString());

      let index = rawPositionAP.tokenIds.indexOf(claimedToken);

      let newIsClaimedAP = rawPositionAP.isClaimed;

      if (newIsClaimedAP[index] == false) {
        let incentiveAmount = rawPositionAP.tokenAmounts[index];

        // incentive is being claimed for first time
        let incentivesReceivedIds = rawAccountBalanceAP.incentivesReceivedIds;
        let incentivesReceivedAmount =
          rawAccountBalanceAP.incentivesReceivedAmount;

        let incentiveIndex = incentivesReceivedIds.indexOf(claimedToken);

        if (incentiveIndex == -1) {
          incentivesReceivedIds.push(claimedToken);
          incentivesReceivedAmount.push(incentiveAmount);
        } else {
          incentivesReceivedAmount[incentiveIndex] =
            incentivesReceivedAmount[incentiveIndex].plus(incentiveAmount);
        }

        rawAccountBalanceAP.incentivesReceivedIds = incentivesReceivedIds;
        rawAccountBalanceAP.incentivesReceivedAmount = incentivesReceivedAmount;
      }

      newIsClaimedAP[index] = true;
      rawPositionAP.isClaimed = newIsClaimedAP;
      rawPositionAP.save();

      let newIsClaimedIP = rawPositionIP.isClaimed;
      newIsClaimedIP[index] = true;
      rawPositionIP.isClaimed = newIsClaimedIP;
      rawPositionIP.save();

      rawAccountBalanceAP.save();
    }
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
      // Subtract received incentives from AP's account balance
      let incentivesReceivedIds = rawAccountBalanceAP.incentivesReceivedIds;
      let incentivesReceivedAmount =
        rawAccountBalanceAP.incentivesReceivedAmount;

      for (let i = 0; i < rawPositionAP.tokenIds.length; i++) {
        let tokenId = rawPositionAP.tokenIds[i];
        let index = incentivesReceivedIds.indexOf(tokenId);

        if (index != -1) {
          incentivesReceivedAmount[index] = incentivesReceivedAmount[
            index
          ].minus(rawPositionAP.tokenAmounts[i]);
        }
      }

      rawAccountBalanceAP.incentivesReceivedAmount = incentivesReceivedAmount;
      // ================== xxxxx ==================

      if (rawOffer.offerSide == IP_OFFER_SIDE) {
        // rawOffer was IP Offer
        if (
          rawOffer.isCancelled == true ||
          rawOffer.expiry <= event.block.timestamp
        ) {
          // rawOffer is cancelled or expired
          // Return the incentives to IP
          if (rawPositionAP.ap == rawPositionIP.ip) {
            // AP and IP are the same
            let incentivesGivenIds = rawAccountBalanceAP.incentivesGivenIds;
            let incentivesGivenAmount =
              rawAccountBalanceAP.incentivesGivenAmount;
            let frontendFeeAmounts = rawAccountBalanceAP.frontendFeeAmounts;

            for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
              let tokenId = rawPositionIP.tokenIds[i];
              let index = incentivesGivenIds.indexOf(tokenId);

              if (index != -1) {
                incentivesGivenAmount[index] = incentivesGivenAmount[
                  index
                ].minus(rawPositionIP.tokenAmounts[i]);

                // Protocol fees are not returned

                frontendFeeAmounts[index] = frontendFeeAmounts[index].minus(
                  rawPositionIP.frontendFeeAmounts[i]
                );
              }
            }

            rawAccountBalanceAP.incentivesGivenAmount = incentivesGivenAmount;
            rawAccountBalanceAP.frontendFeeAmounts = frontendFeeAmounts;
          } else {
            // AP and IP are different
            let incentivesGivenIds = rawAccountBalanceIP.incentivesGivenIds;
            let incentivesGivenAmount =
              rawAccountBalanceIP.incentivesGivenAmount;
            let frontendFeeAmounts = rawAccountBalanceIP.frontendFeeAmounts;

            for (let i = 0; i < rawPositionIP.tokenIds.length; i++) {
              let tokenId = rawPositionIP.tokenIds[i];
              let index = incentivesGivenIds.indexOf(tokenId);

              if (index != -1) {
                incentivesGivenAmount[index] = incentivesGivenAmount[
                  index
                ].minus(rawPositionIP.tokenAmounts[i]);

                // Protocol fees are not returned

                frontendFeeAmounts[index] = frontendFeeAmounts[index].minus(
                  rawPositionIP.frontendFeeAmounts[i]
                );
              }
            }

            rawAccountBalanceIP.incentivesGivenAmount = incentivesGivenAmount;
            rawAccountBalanceIP.frontendFeeAmounts = frontendFeeAmounts;
          }
        } else {
          // rawOffer is not cancelled or expired
          // return the quantity to rawOffer
          rawOffer.quantityRemaining = rawOffer.quantityRemaining.plus(
            rawPositionAP.quantity
          );
        }
      } else {
        // rawOffer was AP Offer
        if (rawPositionAP.ap === rawPositionIP.ip) {
          // AP and IP are the same
          let incentivesGivenIds = rawAccountBalanceAP.incentivesGivenIds;
          let incentivesGivenAmount = rawAccountBalanceAP.incentivesGivenAmount;
          let frontendFeeAmounts = rawAccountBalanceAP.frontendFeeAmounts;

          for (let i = 0; i < rawPositionAP.tokenIds.length; i++) {
            let tokenId = rawPositionIP.tokenIds[i];
            let index = incentivesGivenIds.indexOf(tokenId);

            if (index != -1) {
              incentivesGivenAmount[index] = incentivesGivenAmount[index].minus(
                rawPositionAP.tokenAmounts[i]
              );

              // Protocol fees are not returned

              frontendFeeAmounts[index] = frontendFeeAmounts[index].minus(
                rawPositionAP.frontendFeeAmounts[i]
              );
            }
          }

          rawAccountBalanceAP.incentivesGivenAmount = incentivesGivenAmount;
          rawAccountBalanceAP.frontendFeeAmounts = frontendFeeAmounts;
        } else {
          // AP and IP are different
          let incentivesGivenIds = rawAccountBalanceIP.incentivesGivenIds;
          let incentivesGivenAmount = rawAccountBalanceIP.incentivesGivenAmount;
          let frontendFeeAmounts = rawAccountBalanceIP.frontendFeeAmounts;

          for (let i = 0; i < rawPositionAP.tokenIds.length; i++) {
            let tokenId = rawPositionAP.tokenIds[i];
            let index = incentivesGivenIds.indexOf(tokenId);

            if (index != -1) {
              incentivesGivenAmount[index] = incentivesGivenAmount[index].minus(
                rawPositionAP.tokenAmounts[i]
              );

              // Protocol fees are not returned

              frontendFeeAmounts[index] = frontendFeeAmounts[index].minus(
                rawPositionAP.frontendFeeAmounts[i]
              );
            }
          }

          rawAccountBalanceIP.incentivesGivenAmount = incentivesGivenAmount;
          rawAccountBalanceIP.frontendFeeAmounts = frontendFeeAmounts;
        }
      }

      if (rawPositionAP.ap == rawPositionIP.ip) {
        // Update account balance only once, that is for AP and IP together
        rawAccountBalanceAP.save();
      } else {
        // Update account balance for AP and IP separately
        rawAccountBalanceAP.save();
        rawAccountBalanceIP.save();
      }
    }

    if (rawOffer != null) {
      rawOffer.save();
    }

    if (rawPositionAP != null) {
      rawPositionAP.save();
    }

    if (rawPositionIP != null) {
      rawPositionIP.save();
    }
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
  if (
    rawPositionAP != null &&
    rawPositionIP != null &&
    rawPositionAP.isWithdrawn == false &&
    rawPositionIP.isWithdrawn == false
  ) {
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
        .concat(rawPositionIP.marketId)
        .concat("_")
        .concat(rawPositionIP.ip)
    );

    if (rawAccountBalanceAP != null && rawAccountBalanceIP != null) {
      if (rawPositionAP.ap == rawPositionIP.ip) {
        // Update account balance only once, that is for AP and IP together
        rawAccountBalanceAP.quantityGivenAmount =
          rawAccountBalanceAP.quantityGivenAmount.minus(rawPositionAP.quantity);
        rawAccountBalanceAP.quantityReceivedAmount =
          rawAccountBalanceAP.quantityReceivedAmount.minus(
            rawPositionIP.quantity
          );

        // Save new accounts
        rawAccountBalanceAP.save();
      } else {
        // Update account balance for AP and IP separately
        // AP gets their quantity back
        rawAccountBalanceAP.quantityGivenAmount =
          rawAccountBalanceAP.quantityGivenAmount.minus(rawPositionAP.quantity);

        // IP gives their quantity back
        rawAccountBalanceIP.quantityReceivedAmount =
          rawAccountBalanceIP.quantityReceivedAmount.minus(
            rawPositionIP.quantity
          );

        // Save new accounts
        rawAccountBalanceAP.save();
        rawAccountBalanceIP.save();
      }

      rawPositionAP.isWithdrawn = true;
      rawPositionAP.save();

      rawPositionIP.isWithdrawn = true;
      rawPositionIP.save();
    }
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
