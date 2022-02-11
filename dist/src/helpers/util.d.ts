/// <reference types="node" />
import { Provider, BN, web3, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Metadata } from "./schema";
export declare const getUnixTimestamp: (date?: string | number | Date | undefined) => number;
export declare const hexToBytes: (hex: string) => any[];
export declare const getAtaForMint: (mint: PublicKey, owner: PublicKey) => Promise<[PublicKey, number]>;
export declare const getMetadata: (mint: PublicKey) => Promise<PublicKey>;
export declare const getAuctionHouseTradeState: (auctionHouse: PublicKey, wallet: PublicKey, tokenAccount: PublicKey, treasuryMint: PublicKey, tokenMint: PublicKey, tokenSize: BN, buyPrice: BN) => Promise<[PublicKey, number]>;
export declare const getAuctionHouseBuyerEscrow: (auctionHouse: PublicKey, wallet: PublicKey) => Promise<[PublicKey, number]>;
export declare const getAuctionHouseProgramAsSigner: () => Promise<[
    PublicKey,
    number
]>;
export declare const decodeMetadata: (buffer: Buffer) => Metadata;
export declare const getPriceWithMantissa: (price: number, mint: web3.PublicKey, walletKeyPair: any, anchorProgram: Program) => Promise<number>;
export declare function getTokenAmount(anchorProgram: Program, account: web3.PublicKey, mint: web3.PublicKey): Promise<number>;
export declare function loadAuctionHouseProgram(_provider: Provider): Promise<Program<any>>;
