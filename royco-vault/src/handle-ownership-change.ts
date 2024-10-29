import { OwnershipTransferred, RawMarket } from "../generated/schema";
import { OwnershipTransferred as OwnershipTransferredEvent } from "../generated/templates/WrappedVaultTemplate/WrappedVault";
import { CHAIN_ID, VAULT_MARKET_TYPE } from "./constants";

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.user = event.params.user.toHexString();
  entity.newOwner = event.params.newOwner.toHexString();
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();

  // ============== ..... ==============
  // Update RawMarket owner
  let rawMarket = RawMarket.load(
    CHAIN_ID.toString()
      .concat("_")
      .concat(VAULT_MARKET_TYPE.toString())
      .concat("_")
      .concat(event.address.toHexString())
  );

  if (rawMarket != null) {
    rawMarket.owner = event.params.newOwner.toHexString();
    rawMarket.save();
  }
  // ============== xxxxx ==============
}
