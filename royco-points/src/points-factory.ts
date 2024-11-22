import { NewPointsProgram as NewPointsProgramEvent } from "../generated/PointsFactory/PointsFactory";
import { NewPointsProgram, RawPoint } from "../generated/schema";
import { Points as PointsProgram } from "../generated/templates/PointsProgramTemplate/Points";
import { CHAIN_ID } from "./constants";

export function handleNewPointsProgram(event: NewPointsProgramEvent): void {
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

  /**
   * Get details of the new Points program
   */
  let contract = PointsProgram.bind(event.params.points);

  let nameResult = contract.try_name();
  let symbolResult = contract.try_symbol();
  let decimalsResult = contract.try_decimals();
  let ownerResult = contract.try_owner();

  if (nameResult.reverted || symbolResult.reverted || decimalsResult.reverted) {
    let rawPoint = new RawPoint(
      CHAIN_ID.toString().concat("_").concat(event.params.points.toHexString())
    );

    rawPoint.chainId = CHAIN_ID;
    rawPoint.contractAddress = event.params.points.toHexString();
    rawPoint.owner = ownerResult.value.toHexString();
    rawPoint.name = nameResult.value;
    rawPoint.symbol = symbolResult.value;
    rawPoint.decimals = decimalsResult.value;

    rawPoint.blockNumber = event.block.number;
    rawPoint.blockTimestamp = event.block.timestamp;
    rawPoint.transactionHash = event.transaction.hash.toHexString();
    rawPoint.logIndex = event.logIndex;

    rawPoint.save();
  }
}
