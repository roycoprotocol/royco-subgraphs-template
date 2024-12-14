import { NewPointsProgram as NewPointsProgramEvent } from "../generated/PointsFactory/PointsFactory";
import { NewPointsProgram } from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { PointsProgramTemplate } from "../generated/templates";

export function handleNewPointsProgram(event: NewPointsProgramEvent): void {
  // Extract the address of the new child contract (ERC4626i)
  let pointsProgramAddress = event.params.points;

  // Dynamically create a new data source for the ERC4626i contract
  PointsProgramTemplate.create(pointsProgramAddress);

  let entity = new NewPointsProgram(
    CHAIN_ID.toString()
      .concat("_")
      .concat(event.transaction.hash.toHexString())
      .concat("_")
      .concat(event.logIndex.toString())
  );

  entity.points = event.params.points.toHexString();
  entity.name = event.params.name.toString();
  entity.symbol = event.params.symbol.toString();

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.logIndex = event.logIndex;

  entity.save();
}
