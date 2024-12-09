import { BigInt } from "@graphprotocol/graph-ts";
import { MarketCreated as MarketCreatedEvent } from "../generated/RecipeMarketHub/RecipeMarketHub";
import { MarketCreated, RawMarket } from "../generated/schema";
import { CHAIN_ID, RECIPE_MARKET_TYPE, NULL_ADDRESS } from "./constants";

export function handleMarketCreated(event: MarketCreatedEvent): void {
  let entity = new MarketCreated(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );
  entity.marketId = event.params.marketID;
  entity.marketHash = event.params.marketHash.toHexString();
  entity.inputToken = event.params.inputToken.toHexString();
  entity.lockupTime = event.params.lockupTime;
  entity.frontendFee = event.params.frontendFee;
  entity.rewardStyle = event.params.rewardStyle;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // New Raw Market entity
  let rawMarket = new RawMarket(
    CHAIN_ID.toString()
      .concat("_")
      .concat(RECIPE_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.params.marketHash.toHexString())
  );

  rawMarket.chainId = CHAIN_ID;
  rawMarket.marketType = RECIPE_MARKET_TYPE;
  rawMarket.marketId = event.params.marketHash.toHexString();
  rawMarket.owner = NULL_ADDRESS;
  rawMarket.inputTokenId = CHAIN_ID.toString()
    .concat("-")
    .concat(event.params.inputToken.toHexString());
  rawMarket.lockupTime = event.params.lockupTime;
  rawMarket.frontendFee = event.params.frontendFee;
  rawMarket.rewardStyle = event.params.rewardStyle;

  rawMarket.incentivesAskedIds = [];
  rawMarket.incentivesOfferedIds = [];
  rawMarket.incentivesAskedAmount = [];
  rawMarket.incentivesOfferedAmount = [];

  rawMarket.quantityAsked = BigInt.zero();
  rawMarket.quantityOffered = BigInt.zero();
  rawMarket.quantityAskedFilled = BigInt.zero();
  rawMarket.quantityOfferedFilled = BigInt.zero();

  rawMarket.volumeTokenIds = [];
  rawMarket.volumeAmounts = [];

  rawMarket.transactionHash = event.transaction.hash.toHexString();
  rawMarket.blockNumber = event.block.number;
  rawMarket.blockTimestamp = event.block.timestamp;
  rawMarket.logIndex = event.logIndex;

  rawMarket.underlyingVaultAddress = NULL_ADDRESS;
  rawMarket.incentivesRates = [];
  rawMarket.startTimestamps = [];
  rawMarket.endTimestamps = [];

  rawMarket.save();
  // ============== xxxxx ==============
}
