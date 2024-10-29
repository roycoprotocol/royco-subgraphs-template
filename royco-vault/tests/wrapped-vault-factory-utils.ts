import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  ProtocolFeeRecipientUpdated,
  ProtocolFeeUpdated,
  ReferralFeeUpdated,
  WrappedVaultCreated
} from "../generated/WrappedVaultFactory/WrappedVaultFactory"

export function createOwnershipTransferredEvent(
  user: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createProtocolFeeRecipientUpdatedEvent(
  newRecipient: Address
): ProtocolFeeRecipientUpdated {
  let protocolFeeRecipientUpdatedEvent =
    changetype<ProtocolFeeRecipientUpdated>(newMockEvent())

  protocolFeeRecipientUpdatedEvent.parameters = new Array()

  protocolFeeRecipientUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newRecipient",
      ethereum.Value.fromAddress(newRecipient)
    )
  )

  return protocolFeeRecipientUpdatedEvent
}

export function createProtocolFeeUpdatedEvent(
  newProtocolFee: BigInt
): ProtocolFeeUpdated {
  let protocolFeeUpdatedEvent = changetype<ProtocolFeeUpdated>(newMockEvent())

  protocolFeeUpdatedEvent.parameters = new Array()

  protocolFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newProtocolFee",
      ethereum.Value.fromUnsignedBigInt(newProtocolFee)
    )
  )

  return protocolFeeUpdatedEvent
}

export function createReferralFeeUpdatedEvent(
  newReferralFee: BigInt
): ReferralFeeUpdated {
  let referralFeeUpdatedEvent = changetype<ReferralFeeUpdated>(newMockEvent())

  referralFeeUpdatedEvent.parameters = new Array()

  referralFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newReferralFee",
      ethereum.Value.fromUnsignedBigInt(newReferralFee)
    )
  )

  return referralFeeUpdatedEvent
}

export function createWrappedVaultCreatedEvent(
  underlyingVaultAddress: Address,
  incentivizedVaultAddress: Address,
  owner: Address,
  inputToken: Address,
  frontendFee: BigInt,
  name: string,
  vaultSymbol: string
): WrappedVaultCreated {
  let wrappedVaultCreatedEvent = changetype<WrappedVaultCreated>(newMockEvent())

  wrappedVaultCreatedEvent.parameters = new Array()

  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "underlyingVaultAddress",
      ethereum.Value.fromAddress(underlyingVaultAddress)
    )
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "incentivizedVaultAddress",
      ethereum.Value.fromAddress(incentivizedVaultAddress)
    )
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "inputToken",
      ethereum.Value.fromAddress(inputToken)
    )
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "frontendFee",
      ethereum.Value.fromUnsignedBigInt(frontendFee)
    )
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  wrappedVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "vaultSymbol",
      ethereum.Value.fromString(vaultSymbol)
    )
  )

  return wrappedVaultCreatedEvent
}
