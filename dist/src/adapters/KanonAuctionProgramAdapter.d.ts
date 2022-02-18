/// <reference types="node" />
/// <reference types="bn.js" />
import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import * as metaplex from '@metaplex/js';
import { KanonAuctionhouse } from '../types/kanon_program_devnet';
import { KanonProgramConfig } from '..';
import { Program, Provider, BN } from "@project-serum/anchor";
export default class KanonAuctionProgramAdapter {
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
    protected authority: PublicKey;
    protected feeWithdrawalDestination: PublicKey;
    protected treasuryWithdrawalDestination: PublicKey;
    protected treasuryWithdrawalDestinationOwner: PublicKey;
    protected treasuryMint: anchor.web3.PublicKey;
    protected tokenProgram: anchor.web3.PublicKey;
    protected systemProgram: anchor.web3.PublicKey;
    protected ataProgram: anchor.web3.PublicKey;
    protected rent: anchor.web3.PublicKey;
    protected metadata: PublicKey;
    protected programAsSigner: PublicKey;
    protected auctionHouse: PublicKey;
    protected auctionHouseTreasury: PublicKey;
    protected auctionHouseFeeAccount: PublicKey;
    protected programAsSignerBump: number;
    protected auctionHouseTreasuryBump: number;
    protected auctionHouseFeeAccountBump: number;
    protected bump: number;
    protected buyerWallet: any;
    protected auctionHouseProgram: any;
    protected buyerTokenAccount: any;
    protected sellerWallet: any;
    protected sellerTokenAccount: any;
    protected _program_id: PublicKey;
    constructor(provider: Provider, config: KanonProgramConfig);
    getProgram(): Program;
    getAuctionHouseProgram(): Program<KanonAuctionhouse>;
    getProvider(): Provider;
    /**
     * update accounts for connected wallet
     */
    refreshByWallet(): Promise<void>;
    /**
       * create auction house
      */
    createAuctionHouse(requiresSignOff: boolean, treasuryWithdrawalDestinationOwner: PublicKey, feeWithdrawalDestination: PublicKey, sfbp: any, canChangeSalePrice: boolean, treasuryWithdrawalDestination: PublicKey): Promise<anchor.web3.Transaction>;
    /**
     *
     * deposit into escrow acount
     *  */
    deposit(amount: BN, transferAuthority: PublicKey, user: PublicKey): Promise<anchor.web3.Transaction>;
    /**
    *
    * Withdraws from an escrow account
    *  */
    withdraw(amount: BN, transferAuthority: PublicKey, user: PublicKey): Promise<anchor.web3.Transaction>;
    postOffer(buyerPrice: BN, tokenSize: BN, mintKey: PublicKey, user: PublicKey): Promise<anchor.web3.Transaction>;
    cancelOffer(buyerPrice: BN, tokenSize: BN, mint: PublicKey, user: PublicKey): Promise<anchor.web3.Transaction>;
    /**
     * Sell Nft
     */
    sellNft(mint: PublicKey, buyPriceAdjusted: any, tokenSizeAdjusted: any, user: PublicKey): Promise<any>;
    /**
     * Execute Sale
     *
     */
    executeSales(mint: PublicKey, buyerWallet: PublicKey, sellerWallet: PublicKey, buyPriceAdjusted: BN, tokenSizeAdjusted: BN): Promise<anchor.web3.Transaction>;
    /**
     * Withdraws from the fee account
     */
    withdrawFromFee(amount: BN, feeWithdrawalDestination: PublicKey): Promise<anchor.web3.Transaction>;
    /**
     * Withdraws from the treasury account
     */
    withFromTreasury(amount: BN, treasuryWithdrawalDestination: PublicKey): Promise<any>;
    /**Update auction house */
    updateAuctionHouse(requiresSignOff: boolean, treasuryWithdrawalDestinationOwner: PublicKey, feeWithdrawalDestination: PublicKey, sfbp: any, canChangeSalePrice: boolean, treasuryWithdrawalDestination: PublicKey): Promise<any>;
    /**
     * get auction house accounts
     */
    getAuctionHouseDetails(): Promise<any>;
    /**
     * get fee account balance
     */
    getFeeAccBalance(): Promise<any>;
    /**
     * get fee account balance
     */
    getTreasuryAccBalance(): Promise<number>;
}
