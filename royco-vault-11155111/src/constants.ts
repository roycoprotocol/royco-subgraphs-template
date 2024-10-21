import { BigInt } from "@graphprotocol/graph-ts";

export const MARKET_TYPE = 1; // Vault Market
export const CHAIN_ID = BigInt.fromU64(11155111); // Sepolia Chain ID
export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export const AP_OFFER_SIDE = 0;
export const IP_OFFER_SIDE = 1;

export const UPFRONT_REWARD_STYLE = 0;
export const ARREAR_REWARD_STYLE = 1;
export const FORFEITABLE_REWARD_STYLE = 2;

// Activity Types
export const MARKET_CREATED = "market_created";

export const AP_OFFER_CREATED = "ap_offer_created";
export const IP_OFFER_CREATED = "ip_offer_created";
export const AP_OFFER_FILLED = "ap_offer_filled";
export const IP_OFFER_FILLED = "ip_offer_filled";
export const AP_OFFER_CANCELLED = "ap_offer_cancelled";
export const IP_OFFER_CANCELLED = "ip_offer_cancelled";

export const DEPOSIT = "deposit";
export const WITHDRAW = "withdraw";
export const ADD_REWARD = "add_reward";
export const SET_REWARD = "set_reward";
export const FRONTEND_FEE_UPDATED = "frontend_fee_updated";
export const WEIROLL_WALLET_CLAIMED_INCENTIVE =
  "weiroll_wallet_claimed_incentive";
export const WEIROLL_WALLET_FORFEITED = "weiroll_wallet_forfeited";
export const WEIROLL_WALLET_EXECUTED_WITHDRAWAL =
  "weiroll_wallet_executed_withdrawal";
