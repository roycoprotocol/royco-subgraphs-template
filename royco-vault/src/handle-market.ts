import { BigInt } from "@graphprotocol/graph-ts";
import { WrappedVaultCreated as WrappedVaultCreatedEvent } from "../generated/WrappedVaultFactory/WrappedVaultFactory";
import { RawMarket, WrappedVaultCreated } from "../generated/schema";
import { CHAIN_ID, VAULT_MARKET_TYPE } from "./constants";
import { WrappedVaultTemplate } from "../generated/templates";

export function handleWrappedVaultCreated(
  event: WrappedVaultCreatedEvent
): void {
  // Extract the address of the new child contract (ERC4626i)
  let erc4626iAddress = event.params.incentivizedVaultAddress;

  // Dynamically create a new data source for the ERC4626i contract
  WrappedVaultTemplate.create(erc4626iAddress);

  let entity = new WrappedVaultCreated(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.underlyingVaultAddress =
    event.params.underlyingVaultAddress.toHexString();
  entity.incentivizedVaultAddress =
    event.params.incentivizedVaultAddress.toHexString();
  entity.owner = event.params.owner.toHexString();
  entity.inputToken = event.params.inputToken.toHexString();
  entity.frontendFee = event.params.frontendFee;
  entity.name = event.params.name;
  entity.vaultSymbol = event.params.vaultSymbol;

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
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.params.incentivizedVaultAddress.toHexString())
  );

  rawMarket.chainId = CHAIN_ID;
  rawMarket.marketType = VAULT_MARKET_TYPE;
  rawMarket.marketId = event.params.incentivizedVaultAddress.toHexString();
  rawMarket.owner = event.params.owner.toHexString();
  rawMarket.inputTokenId = CHAIN_ID.toString()
    .concat("-")
    .concat(event.params.inputToken.toHexString());
  rawMarket.lockupTime = BigInt.zero();
  rawMarket.frontendFee = event.params.frontendFee;
  rawMarket.rewardStyle = 0;

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

  // Vault Fields
  rawMarket.underlyingVaultAddress =
    event.params.underlyingVaultAddress.toHexString();
  rawMarket.incentivesRates = [];
  rawMarket.startTimestamps = [];
  rawMarket.endTimestamps = [];

  rawMarket.save();
  // ============== xxxxx ==============
}
