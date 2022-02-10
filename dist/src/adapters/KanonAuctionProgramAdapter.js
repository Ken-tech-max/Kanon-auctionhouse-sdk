"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const metaplex = __importStar(require("@metaplex/js"));
const kanon_program_devnet_1 = require("../types/kanon_program_devnet");
const kanon_program_devnet_json_1 = __importDefault(require("../idl/kanon_program_devnet.json"));
const kanon_program_devnet_json_2 = __importDefault(require("../idl/kanon_program_devnet.json")); //change when mainnet idl is added
const anchor_1 = require("@project-serum/anchor");
const constant_1 = require("../helpers/constant");
const util_1 = require("../helpers/util");
const schema_1 = require("../helpers/schema");
class KanonAuctionProgramAdapter {
    constructor(provider, config) {
        this.MetadataDataData = metaplex.programs.metadata.MetadataDataData;
        this.CreateMetadata = metaplex.programs.metadata.CreateMetadata;
        this.TOKEN_METADATA_PROGRAM_ID = constant_1.TOKEN_METADATA_PROGRAM_ID;
        this.AUCTION_HOUSE_PROGRAM_ID = spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID;
        // Mint address for native SOL token accounts.
        //
        // The program uses this when one wants to pay with native SOL vs an SPL token.
        this.NATIVE_SOL_MINT = constant_1.NATIVE_SOL_MINT;
        // Seeds constants.
        this.PREFIX = Buffer.from("auction_house");
        this.FEE_PAYER = Buffer.from("fee_payer");
        this.TREASURY = Buffer.from("treasury");
        this.SIGNER = Buffer.from("signer");
        this.treasuryMint = constant_1.NATIVE_SOL_MINT;
        this.tokenProgram = spl_token_1.TOKEN_PROGRAM_ID;
        this.systemProgram = web3_js_1.SystemProgram.programId;
        this.ataProgram = spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID;
        this.rent = web3_js_1.SYSVAR_RENT_PUBKEY;
        this.programAsSignerBump = 0;
        this.auctionHouseTreasuryBump = 0;
        this.auctionHouseFeeAccountBump = 0;
        this.bump = 0;
        this.buyerEscrowBump = 0;
        // initialize anchor program instance
        this._program_id = config.isDevNet ?
            new web3_js_1.PublicKey(kanon_program_devnet_json_1.default.metadata.address) :
            new web3_js_1.PublicKey(kanon_program_devnet_json_2.default.metadata.address);
        this._program = config.isDevNet ?
            new anchor_1.Program(kanon_program_devnet_json_1.default, this._program_id, provider) :
            new anchor_1.Program(kanon_program_devnet_json_2.default, this._program_id, provider);
        this._provider = provider;
        this._config = config;
    }
    ;
    getProgram() {
        return this._program;
    }
    getProvider() {
        return this._provider;
    }
    /**
     * update accounts for connected wallet
     */
    refreshByWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            this.authority = this._provider.wallet.publicKey; //Important this must be admin's public key
            this.feeWithdrawalDestination = this.authority;
            this.treasuryWithdrawalDestination = this.authority;
            this.treasuryWithdrawalDestinationOwner = this.authority;
            const [_auctionHouse, _bump] = yield web3_js_1.PublicKey.findProgramAddress([
                this.PREFIX,
                this.authority.toBuffer(),
                this.treasuryMint.toBuffer(),
            ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
            const [_auctionHouseFeeAccount, _auctionHouseFeeAccountBump] = yield web3_js_1.PublicKey.findProgramAddress([
                this.PREFIX,
                _auctionHouse.toBuffer(),
                this.FEE_PAYER,
            ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
            const [_auctionHouseTreasury, _auctionHouseTreasuryBump] = yield web3_js_1.PublicKey.findProgramAddress([
                this.PREFIX,
                _auctionHouse.toBuffer(),
                this.TREASURY,
            ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
            const [_buyerEscrow, _buyerEscrowBump] = yield web3_js_1.PublicKey.findProgramAddress([
                this.PREFIX,
                _auctionHouse.toBuffer(),
                this._provider.wallet.publicKey.toBuffer(), // Important here the provider should be buyer
            ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
            const [_programAsSigner, _programAsSignerBump] = yield web3_js_1.PublicKey.findProgramAddress([
                this.PREFIX,
                this.SIGNER,
            ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
            this.auctionHouse = _auctionHouse;
            this.bump = _bump;
            this.auctionHouseFeeAccount = _auctionHouseFeeAccount;
            this.auctionHouseFeeAccountBump = _auctionHouseFeeAccountBump;
            this.auctionHouseTreasury = _auctionHouseTreasury;
            this.auctionHouseTreasuryBump = _auctionHouseTreasuryBump;
            this.buyerEscrow = _buyerEscrow;
            this.buyerEscrowBump = _buyerEscrowBump;
            this.programAsSigner = _programAsSigner;
            this.programAsSignerBump = _programAsSignerBump;
        });
    }
    /**
       * create auction house
      */
    createAuctionHouse(requiresSignOff) {
        return __awaiter(this, void 0, void 0, function* () {
            const sellerFeeBasisPoints = 1;
            const canChangeSalePrice = true;
            const authorityClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            let acc = {
                treasuryMint: this.treasuryMint,
                payer: this.authority,
                authority: this.authority,
                feeWithdrawalDestination: this.feeWithdrawalDestination,
                treasuryWithdrawalDestination: this.treasuryWithdrawalDestination,
                treasuryWithdrawalDestinationOwner: this.treasuryWithdrawalDestinationOwner,
                auctionHouse: this.auctionHouse,
                auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                auctionHouseTreasury: this.auctionHouseTreasury,
                tokenProgram: this.tokenProgram,
                systemProgram: this.systemProgram,
                ataProgram: this.ataProgram,
                rent: this.rent,
            };
            const tx = new web3_js_1.Transaction();
            tx.add(yield authorityClient.instruction.createAuctionHouse(this.bump, this.auctionHouseFeeAccountBump, this.auctionHouseTreasuryBump, sellerFeeBasisPoints, requiresSignOff, canChangeSalePrice, {
                accounts: acc,
            }));
            return tx;
        });
    }
    /**
     *
     * deposit into escrow acount
     *  */
    deposit(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const buyerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            let acc = {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    paymentAccount: this._provider.wallet.publicKey,
                    transferAuthority: this._provider.wallet.publicKey,
                    escrowPaymentAccount: this.buyerEscrow,
                    treasuryMint: this.treasuryMint,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tokenProgram: this.tokenProgram,
                    systemProgram: this.systemProgram,
                    rent: this.rent,
                },
                // signers: [authorityClient.provider.wallet.payer],
            };
            // const amount = new BN(10*10**9);
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.deposit(this.buyerEscrowBump, amount, acc));
            return tx;
        });
    }
    /**
    *
    * Withdraws from an escrow account
    *  */
    withdraw(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const buyerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            let acc = {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    receiptAccount: this._provider.wallet.publicKey,
                    transferAuthority: this._provider.wallet.publicKey,
                    escrowPaymentAccount: this.buyerEscrow,
                    treasuryMint: this.treasuryMint,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tokenProgram: this.tokenProgram,
                    systemProgram: this.systemProgram,
                    rent: this.rent,
                },
                // signers: [authorityClient.provider.wallet.payer],
            };
            // const amount = new BN(10*10**9);
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.withdraw(this.buyerEscrowBump, amount, acc));
            return tx;
        });
    }
    /*
    * Posts an offer (BUY)
    */
    postOffer(buyerPrice, tokenSize, mintKey) {
        return __awaiter(this, void 0, void 0, function* () {
            let buyerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            const zero = new spl_token_1.u64(0);
            const mint = new anchor.web3.PublicKey(mintKey);
            const buyPriceAdjusted = buyerPrice;
            const tokenSizeAdjusted = tokenSize;
            const [escrowPaymentAccount, escrowBump] = yield (0, util_1.getAuctionHouseBuyerEscrow)(this.auctionHouse, this._provider.wallet.publicKey);
            const results = yield buyerClient.provider.connection.getTokenLargestAccounts(mintKey);
            const tokenAccountKey = results.value[0].address;
            const [tradeState, tradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, this._provider.wallet.publicKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mint, tokenSizeAdjusted, buyPriceAdjusted);
            //@ts-ignore
            const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);
            const ata = (yield (0, util_1.getAtaForMint)(
            //@ts-ignore
            this.treasuryMint, this._provider.wallet.publicKey))[0];
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.buy(tradeBump, this.buyerEscrowBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    paymentAccount: isNative ? this._provider.wallet.publicKey : ata,
                    transferAuthority: isNative
                        ? anchor.web3.SystemProgram.programId
                        : this._provider.wallet.publicKey,
                    metadata: yield (0, util_1.getMetadata)(mintKey),
                    tokenAccount: tokenAccountKey,
                    escrowPaymentAccount: this.buyerEscrow,
                    //@ts-ignore
                    treasuryMint: this.treasuryMint,
                    //@ts-ignore
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    //@ts-ignore
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    buyerTradeState: tradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }));
            return tx;
        });
    }
    /*
    Cancels an offer
    */
    cancelOffer(buyerPrice, tokenSize, mint) {
        return __awaiter(this, void 0, void 0, function* () {
            let buyerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            const mintKey = new anchor.web3.PublicKey(mint);
            const buyPriceAdjusted = buyerPrice;
            const tokenSizeAdjusted = tokenSize;
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, this._provider.wallet.publicKey))[0];
            const tradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, this._provider.wallet.publicKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.cancel(buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: this._provider.wallet.publicKey.toBuffer(),
                    tokenAccount: tokenAccountKey,
                    tokenMint: mintKey,
                    //@ts-ignore
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    //@ts-ignore
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                },
                // signers: [authorityClient.provider.wallet.payer],
            }));
            return tx;
        });
    }
    /**
     * Sell Nft
     */
    sellNft(mint, buyPriceAdjusted, tokenSizeAdjusted) {
        return __awaiter(this, void 0, void 0, function* () {
            let sellerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            const mintKey = new anchor.web3.PublicKey(mint);
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, this._provider.wallet.publicKey))[0];
            const [tradeState, tradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, this._provider.wallet.publicKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted);
            const [freeTradeState, freeTradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, this._provider.wallet.publicKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, new anchor_1.BN(0));
            let tx = new web3_js_1.Transaction();
            tx.add(yield sellerClient.instruction.sell(tradeBump, freeTradeBump, this.programAsSignerBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    metadata: yield (0, util_1.getMetadata)(mintKey),
                    tokenAccount: tokenAccountKey,
                    //@ts-ignore
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    //@ts-ignore
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    sellerTradeState: tradeState,
                    freeSellerTradeState: freeTradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    programAsSigner: this.programAsSigner,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }));
            return tx;
        });
    }
    /**
     * Execute Sale
     *
     */
    executeSales(mint, buyerWallet, sellerWallet, buyPriceAdjusted, tokenSizeAdjusted) {
        return __awaiter(this, void 0, void 0, function* () {
            let sellerClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            const mintKey = new anchor.web3.PublicKey(mint);
            const buyerWalletKey = new anchor.web3.PublicKey(buyerWallet);
            const sellerWalletKey = new anchor.web3.PublicKey(sellerWallet);
            //@ts-ignore
            const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, sellerWalletKey))[0];
            const buyerTradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, buyerWalletKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            const sellerTradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, sellerWalletKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            const [freeTradeState, freeTradeStateBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, sellerWalletKey, tokenAccountKey, 
            //@ts-ignore
            this.treasuryMint, mintKey, tokenSizeAdjusted, new anchor_1.BN(0));
            const metadata = yield (0, util_1.getMetadata)(mintKey);
            const metadataObj = yield sellerClient.provider.connection.getAccountInfo(metadata);
            const metadataDecoded = (0, schema_1.decodeMetadata)(Buffer.from(metadataObj.data));
            const remainingAccounts = [];
            for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
                remainingAccounts.push({
                    pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
                    isWritable: true,
                    isSigner: false,
                });
                if (!isNative) {
                    remainingAccounts.push({
                        pubkey: (yield (0, util_1.getAtaForMint)(
                        //@ts-ignore
                        this.treasuryMint, remainingAccounts[remainingAccounts.length - 1].pubkey))[0],
                        isWritable: true,
                        isSigner: false,
                    });
                }
            }
            //@ts-ignore
            const tMint = this.treasuryMint;
            let tx = new web3_js_1.Transaction();
            tx.add(yield sellerClient.instruction.executeSale(this.buyerEscrowBump, freeTradeStateBump, this.programAsSignerBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    buyer: buyerWalletKey,
                    seller: sellerWalletKey,
                    metadata,
                    tokenAccount: tokenAccountKey,
                    tokenMint: mintKey,
                    escrowPaymentAccount: this.buyerEscrow,
                    treasuryMint: tMint,
                    sellerPaymentReceiptAccount: isNative
                        ? sellerWalletKey
                        : (yield (0, util_1.getAtaForMint)(tMint, sellerWalletKey))[0],
                    buyerReceiptTokenAccount: (yield (0, util_1.getAtaForMint)(mintKey, buyerWalletKey))[0],
                    //@ts-ignore
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    //@ts-ignore
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    //@ts-ignore
                    auctionHouseTreasury: this.auctionHouseTreasury,
                    sellerTradeState,
                    buyerTradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ataProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                    programAsSigner: this.programAsSigner,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    freeTradeState,
                },
                remainingAccounts,
                // signers: [authorityClient.provider.wallet.payer],
            }));
            return tx;
        });
    }
    /**
     * Withdraws from the fee account
     */
    withdrawFromFee(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            let acc = {
                authority: this.authority,
                feeWithdrawalDestination: this.feeWithdrawalDestination,
                auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                auctionHouse: this.auctionHouse,
                systemProgram: this.systemProgram,
            };
            const amountAdjusted = new anchor_1.BN(yield (0, util_1.getPriceWithMantissa)(amount, 
            //@ts-ignore
            this.treasuryMint, this._provider.wallet.publicKey, authorityClient));
            let tx = new web3_js_1.Transaction();
            tx.add(yield authorityClient.instruction.withdrawFromFee(amountAdjusted, {
                accounts: acc,
            }));
            return tx;
        });
    }
    /**
     * Withdraws from the treasury account
     */
    withFromTreasury(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            let acc = {
                treasuryMint: this.treasuryMint,
                authority: this.authority,
                treasuryWithdrawalDestination: this.treasuryWithdrawalDestination,
                auctionHouseTreasury: this.auctionHouseTreasury,
                auctionHouse: this.auctionHouse,
                tokenProgram: this.tokenProgram,
                systemProgram: this.systemProgram,
            };
            const amountAdjusted = new anchor_1.BN(yield (0, util_1.getPriceWithMantissa)(amount, 
            //@ts-ignore
            auctionHouseObj.treasuryMint, this._provider.wallet.publicKey, authorityClient));
            let tx = new web3_js_1.Transaction();
            tx.add(yield authorityClient.instruction.withdrawFromTreasury(new spl_token_1.u64(1), {
                accounts: acc
            }));
            let txSig = yield authorityClient.provider.send(tx);
            return txSig;
        });
    }
    /**Update auction house */
    updateAuctionHouse(requiresSignOff) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = new anchor_1.Program(kanon_program_devnet_1.IDL, constant_1.AUCTION_HOUSE_PROGRAM_ID, this._provider);
            const sellerFeeBasisPoints = 2;
            const canChangeSalePrice = true;
            const tx = new web3_js_1.Transaction();
            tx.add(authorityClient.instruction.updateAuctionHouse(sellerFeeBasisPoints, requiresSignOff, canChangeSalePrice, {
                accounts: {
                    treasuryMint: this.treasuryMint,
                    payer: this.authority,
                    authority: this.authority,
                    newAuthority: this.authority,
                    feeWithdrawalDestination: this.feeWithdrawalDestination,
                    treasuryWithdrawalDestination: this.treasuryWithdrawalDestination,
                    treasuryWithdrawalDestinationOwner: this.treasuryWithdrawalDestinationOwner,
                    auctionHouse: this.auctionHouse,
                    tokenProgram: this.tokenProgram,
                    systemProgram: this.systemProgram,
                    ataProgram: this.ataProgram,
                    rent: this.rent,
                }
            }));
            const txSig = yield authorityClient.provider.send(tx);
            return txSig;
        });
    }
}
exports.default = KanonAuctionProgramAdapter;
//# sourceMappingURL=KanonAuctionProgramAdapter.js.map