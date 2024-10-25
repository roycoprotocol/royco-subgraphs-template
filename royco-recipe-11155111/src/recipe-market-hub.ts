import {
  APOfferCancelled as APOfferCancelledEvent,
  APOfferCreated as APOfferCreatedEvent,
  APOfferFilled as APOfferFilledEvent,
  FeesClaimed as FeesClaimedEvent,
  IPOfferCancelled as IPOfferCancelledEvent,
  IPOfferCreated as IPOfferCreatedEvent,
  IPOfferFilled as IPOfferFilledEvent,
  MarketCreated as MarketCreatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  WeirollWalletClaimedIncentive as WeirollWalletClaimedIncentiveEvent,
  WeirollWalletExecutedWithdrawal as WeirollWalletExecutedWithdrawalEvent,
  WeirollWalletForfeited as WeirollWalletForfeitedEvent
} from "../generated/RecipeMarketHub/RecipeMarketHub"
import {
  APOfferCancelled,
  APOfferCreated,
  APOfferFilled,
  FeesClaimed,
  IPOfferCancelled,
  IPOfferCreated,
  IPOfferFilled,
  MarketCreated,
  OwnershipTransferred,
  WeirollWalletClaimedIncentive,
  WeirollWalletExecutedWithdrawal,
  WeirollWalletForfeited
} from "../generated/schema"

export function handleAPOfferCancelled(event: APOfferCancelledEvent): void {
  let entity = new APOfferCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerID = event.params.offerID

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAPOfferCreated(event: APOfferCreatedEvent): void {
  let entity = new APOfferCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerID = event.params.offerID
  entity.marketHash = event.params.marketHash
  entity.fundingVault = event.params.fundingVault
  entity.quantity = event.params.quantity
  entity.incentiveAddresses = event.params.incentiveAddresses
  entity.incentiveAmounts = event.params.incentiveAmounts
  entity.expiry = event.params.expiry

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAPOfferFilled(event: APOfferFilledEvent): void {
  let entity = new APOfferFilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerID = event.params.offerID
  entity.fillAmount = event.params.fillAmount
  entity.weirollWallet = event.params.weirollWallet
  entity.incentiveAmounts = event.params.incentiveAmounts
  entity.protocolFeeAmounts = event.params.protocolFeeAmounts
  entity.frontendFeeAmounts = event.params.frontendFeeAmounts

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.claimant = event.params.claimant
  entity.incentive = event.params.incentive
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIPOfferCancelled(event: IPOfferCancelledEvent): void {
  let entity = new IPOfferCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerHash = event.params.offerHash

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIPOfferCreated(event: IPOfferCreatedEvent): void {
  let entity = new IPOfferCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerID = event.params.offerID
  entity.offerHash = event.params.offerHash
  entity.marketHash = event.params.marketHash
  entity.quantity = event.params.quantity
  entity.incentivesOffered = event.params.incentivesOffered
  entity.incentiveAmounts = event.params.incentiveAmounts
  entity.protocolFeeAmounts = event.params.protocolFeeAmounts
  entity.frontendFeeAmounts = event.params.frontendFeeAmounts
  entity.expiry = event.params.expiry

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIPOfferFilled(event: IPOfferFilledEvent): void {
  let entity = new IPOfferFilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.offerHash = event.params.offerHash
  entity.fillAmount = event.params.fillAmount
  entity.weirollWallet = event.params.weirollWallet
  entity.incentiveAmounts = event.params.incentiveAmounts
  entity.protocolFeeAmounts = event.params.protocolFeeAmounts
  entity.frontendFeeAmounts = event.params.frontendFeeAmounts

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMarketCreated(event: MarketCreatedEvent): void {
  let entity = new MarketCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketID = event.params.marketID
  entity.marketHash = event.params.marketHash
  entity.inputToken = event.params.inputToken
  entity.lockupTime = event.params.lockupTime
  entity.frontendFee = event.params.frontendFee
  entity.rewardStyle = event.params.rewardStyle

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWeirollWalletClaimedIncentive(
  event: WeirollWalletClaimedIncentiveEvent
): void {
  let entity = new WeirollWalletClaimedIncentive(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.weirollWallet = event.params.weirollWallet
  entity.recipient = event.params.recipient
  entity.incentive = event.params.incentive

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWeirollWalletExecutedWithdrawal(
  event: WeirollWalletExecutedWithdrawalEvent
): void {
  let entity = new WeirollWalletExecutedWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.weirollWallet = event.params.weirollWallet

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWeirollWalletForfeited(
  event: WeirollWalletForfeitedEvent
): void {
  let entity = new WeirollWalletForfeited(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.weirollWallet = event.params.weirollWallet

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
