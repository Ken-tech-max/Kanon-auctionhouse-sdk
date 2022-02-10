/// <reference types="node" />
/// <reference types="bn.js" />
import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { u64 } from '@solana/spl-token';
import * as metaplex from '@metaplex/js';
import { KanonProgramConfig } from '..';
import { Program, Provider, BN } from "@project-serum/anchor";
export default class KanonProgramAdapter {
    protected _provider: Provider;
    protected _program: Program;
    protected _config: KanonProgramConfig;
    protected MetadataDataData: typeof metaplex.programs.metadata.MetadataDataData;
    protected CreateMetadata: typeof metaplex.programs.metadata.CreateMetadata;
    protected TOKEN_METADATA_PROGRAM_ID: anchor.web3.PublicKey;
    protected AUCTION_HOUSE_PROGRAM_ID: anchor.web3.PublicKey;
    protected NATIVE_SOL_MINT: anchor.web3.PublicKey;
    protected authorityClient: any;
    protected sellerClient: any;
    protected buyerClient: any;
    protected nftMintClient: any;
    protected PREFIX: Buffer;
    protected FEE_PAYER: Buffer;
    protected TREASURY: Buffer;
    protected SIGNER: Buffer;
    protected authority: any;
    protected feeWithdrawalDestination: any;
    protected treasuryWithdrawalDestination: any;
    protected treasuryWithdrawalDestinationOwner: any;
    protected treasuryMint: anchor.web3.PublicKey;
    protected tokenProgram: anchor.web3.PublicKey;
    protected systemProgram: anchor.web3.PublicKey;
    protected ataProgram: anchor.web3.PublicKey;
    protected rent: anchor.web3.PublicKey;
    protected metadata: any;
    protected programAsSigner: any;
    protected auctionHouse: any;
    protected auctionHouseTreasury: any;
    protected auctionHouseFeeAccount: any;
    protected programAsSignerBump: number;
    protected auctionHouseTreasuryBump: number;
    protected auctionHouseFeeAccountBump: number;
    protected bump: number;
    protected buyerWallet: any;
    protected buyerTokenAccount: any;
    protected buyerEscrow: any;
    protected buyerEscrowBump: number;
    protected sellerWallet: any;
    protected sellerTokenAccount: any;
    protected _program_id: PublicKey;
    constructor(provider: Provider, config: KanonProgramConfig);
    getProgram(): Program;
    getProvider(): Provider;
    /**
     * update accounts for connected wallet
     */
    refreshByWallet(): Promise<void>;
    /**
       * create auction house
      */
    createAuctionHouse(requiresSignOff: boolean): Promise<anchor.web3.Transaction>;
    /**
     *
     * deposit into escrow acount
     *  */
    deposit(amount: BN): Promise<anchor.web3.Transaction>;
    /**
    *
    * Withdraws from an escrow account
    *  */
    withdraw(amount: BN): Promise<anchor.web3.Transaction>;
    postOffer(buyerPrice: u64, tokenSize: u64, mintKey: PublicKey): Promise<anchor.web3.Transaction>;
    cancelOffer(buyerPrice: u64, tokenSize: u64, mint: PublicKey): Promise<anchor.web3.Transaction>;
    /**
     * Sell Nft
     */
    sellNft(mint: PublicKey, buyPriceAdjusted: u64, tokenSizeAdjusted: u64): Promise<anchor.web3.Transaction>;
    /**
     * Execute Sale
     *
     */
    executeSales(mint: PublicKey, buyerWallet: PublicKey, sellerWallet: PublicKey, buyPriceAdjusted: u64, tokenSizeAdjusted: u64): Promise<anchor.web3.Transaction>;
    /**
     * Withdraws from the fee account
     */
    withdrawFromFee(amount: any): Promise<anchor.web3.Transaction>;
    /**
     * Withdraws from the treasury account
     */
    withFromTreasury(amount: any): Promise<any>;
    /**Update auction house */
    updateAuctionHouse(requiresSignOff: boolean): Promise<string>;
}
