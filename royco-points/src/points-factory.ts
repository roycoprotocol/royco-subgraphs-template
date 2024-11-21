import {
  NewPointsProgram as NewPointsProgramEvent,
  OwnershipTransferStarted as OwnershipTransferStartedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  RecipeMarketHubAdded as RecipeMarketHubAddedEvent,
} from "../generated/PointsFactory/PointsFactory";
import {
  NewPointsProgram,
  OwnershipTransferStarted,
  OwnershipTransferred,
  RecipeMarketHubAdded,
} from "../generated/schema";

export function handleNewPointsProgram(event: NewPointsProgramEvent): void {
  let entity = new NewPointsProgram(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.points = event.params.points;
  entity.name = event.params.name.toString();
  entity.symbol = event.params.symbol.toString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRecipeMarketHubAdded(
  event: RecipeMarketHubAddedEvent
): void {
  let entity = new RecipeMarketHubAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.recipeMarketHub = event.params.recipeMarketHub;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
