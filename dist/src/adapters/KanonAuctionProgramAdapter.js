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
const kanon_auctionhouse_devnet_json_1 = __importDefault(require("../idl/kanon_auctionhouse_devnet.json"));
const kanon_auctionhouse_mainnet_json_1 = __importDefault(require("../idl/kanon_auctionhouse_mainnet.json")); //change when mainnet idl is added
const anchor_1 = require("@project-serum/anchor");
const constant_1 = require("../helpers/constant");
const util_1 = require("../helpers/util");
const schema_1 = require("../helpers/schema");
const utils_1 = require("@project-serum/anchor/dist/cjs/utils");
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
        this.PREFIX = Buffer.from(utils_1.bytes.utf8.encode("auction_house"));
        this.FEE_PAYER = Buffer.from(utils_1.bytes.utf8.encode("fee_payer"));
        this.TREASURY = Buffer.from(utils_1.bytes.utf8.encode("treasury"));
        this.SIGNER = Buffer.from(utils_1.bytes.utf8.encode("signer"));
        // Constant accounts.
        this.authority = web3_js_1.Keypair.generate().publicKey;
        this.feeWithdrawalDestination = web3_js_1.Keypair.generate().publicKey;
        this.treasuryWithdrawalDestination = web3_js_1.Keypair.generate().publicKey;
        this.treasuryWithdrawalDestinationOwner = web3_js_1.Keypair.generate().publicKey;
        this.treasuryMint = constant_1.NATIVE_SOL_MINT;
        this.tokenProgram = spl_token_1.TOKEN_PROGRAM_ID;
        this.systemProgram = web3_js_1.SystemProgram.programId;
        this.ataProgram = spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID;
        this.rent = web3_js_1.SYSVAR_RENT_PUBKEY;
        // Uninitialized constant accounts.
        this.metadata = web3_js_1.Keypair.generate().publicKey;
        this.programAsSigner = web3_js_1.Keypair.generate().publicKey;
        this.auctionHouse = web3_js_1.Keypair.generate().publicKey;
        this.auctionHouseTreasury = web3_js_1.Keypair.generate().publicKey;
        this.auctionHouseFeeAccount = web3_js_1.Keypair.generate().publicKey;
        this.programAsSignerBump = 0;
        this.auctionHouseTreasuryBump = 0;
        this.auctionHouseFeeAccountBump = 0;
        this.bump = 0;
        // initialize anchor program instance
        // initialize anchor program instance
        this._program_id = config.isDevNet ?
            new web3_js_1.PublicKey(kanon_auctionhouse_devnet_json_1.default.metadata.address) :
            new web3_js_1.PublicKey(kanon_auctionhouse_mainnet_json_1.default.metadata.address);
        this._program = config.isDevNet ?
            new anchor_1.Program(kanon_auctionhouse_devnet_json_1.default, this._program_id, provider) :
            new anchor_1.Program(kanon_auctionhouse_mainnet_json_1.default, this._program_id, provider);
        this._provider = provider;
        this._config = config;
        this.authority = config.authority ?
            new web3_js_1.PublicKey(config.authority) : web3_js_1.Keypair.generate().publicKey;
    }
    getProgram() {
        return this._program;
    }
    getAuctionHouseProgram() {
        return this.auctionHouseProgram;
    }
    getProvider() {
        return this._provider;
    }
    /**
     * update accounts for connected wallet
     */
    refreshByWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const [_auctionHouse, _bump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.authority.toBuffer(),
                this.treasuryMint.toBuffer(),
            ], this._program_id);
            const [_auctionHouseFeeAccount, _auctionHouseFeeAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                _auctionHouse.toBuffer(),
                this.FEE_PAYER,
            ], this._program_id);
            const [_auctionHouseTreasury, _auctionHouseTreasuryBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                _auctionHouse.toBuffer(),
                this.TREASURY,
            ], this._program_id);
            const [_programAsSigner, _programAsSignerBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.SIGNER,
            ], this._program_id);
            this.auctionHouseProgram = this._program;
            this.auctionHouse = _auctionHouse;
            this.bump = _bump;
            this.auctionHouseFeeAccount = _auctionHouseFeeAccount;
            this.auctionHouseFeeAccountBump = _auctionHouseFeeAccountBump;
            this.auctionHouseTreasury = _auctionHouseTreasury;
            this.auctionHouseTreasuryBump = _auctionHouseTreasuryBump;
            this.programAsSigner = _programAsSigner;
            this.programAsSignerBump = _programAsSignerBump;
        });
    }
    /**
       * create auction house
      */
    createAuctionHouse(requiresSignOff, treasuryWithdrawalDestinationOwner, feeWithdrawalDestination, sfbp, canChangeSalePrice, treasuryWithdrawalDestination) {
        return __awaiter(this, void 0, void 0, function* () {
            const sellerFeeBasisPoints = parseInt(sfbp);
            const authorityClient = this.auctionHouseProgram;
            let twdKey, fwdKey;
            if (!treasuryWithdrawalDestinationOwner) {
                twdKey = this._provider.wallet.publicKey;
            }
            else {
                twdKey = new anchor.web3.PublicKey(treasuryWithdrawalDestination);
            }
            if (!feeWithdrawalDestination) {
                fwdKey = this._provider.wallet.publicKey;
            }
            else {
                fwdKey = new anchor.web3.PublicKey(feeWithdrawalDestination);
            }
            let acc = {
                treasuryMint: this.treasuryMint,
                payer: this.authority,
                authority: this.authority,
                feeWithdrawalDestination: fwdKey,
                treasuryWithdrawalDestination: treasuryWithdrawalDestination,
                treasuryWithdrawalDestinationOwner: twdKey,
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
    deposit(amount, transferAuthority, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const User = new anchor.web3.PublicKey(user);
            const [_buyerEscrow, _buyerEscrowBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.auctionHouse.toBuffer(),
                User.toBuffer(), // Important here the provider should be buyer
            ], this._program_id);
            const buyerClient = this.auctionHouseProgram;
            let acc = {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    paymentAccount: this._provider.wallet.publicKey,
                    transferAuthority: transferAuthority,
                    escrowPaymentAccount: _buyerEscrow,
                    treasuryMint: this.treasuryMint,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tokenProgram: this.tokenProgram,
                    systemProgram: this.systemProgram,
                    rent: this.rent,
                },
            };
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.deposit(_buyerEscrowBump, amount, acc));
            return tx;
        });
    }
    /**
    *
    * Withdraws from an escrow account
    *  */
    withdraw(amount, transferAuthority, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const User = new anchor.web3.PublicKey(user);
            const [_buyerEscrow, _buyerEscrowBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.auctionHouse.toBuffer(),
                User.toBuffer(), // Important here the provider should be buyer
            ], this._program_id);
            const buyerClient = this.auctionHouseProgram;
            let acc = {
                accounts: {
                    wallet: this._provider.wallet.publicKey,
                    receiptAccount: this._provider.wallet.publicKey,
                    escrowPaymentAccount: _buyerEscrow,
                    treasuryMint: this.treasuryMint,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tokenProgram: this.tokenProgram,
                    systemProgram: this.systemProgram,
                    rent: this.rent,
                },
            };
            // const amount = new BN(10*10**9);
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.withdraw(_buyerEscrowBump, amount, acc));
            return tx;
        });
    }
    /*
    * Posts an offer (BUY)
    */
    postOffer(buyerPrice, tokenSize, mintKey, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let buyerClient = this.auctionHouseProgram;
            const zero = new spl_token_1.u64(0);
            const User = new anchor.web3.PublicKey(user);
            const mint = new anchor.web3.PublicKey(mintKey);
            const buyPriceAdjusted = buyerPrice;
            const tokenSizeAdjusted = tokenSize;
            const results = yield buyerClient.provider.connection.getTokenLargestAccounts(mintKey);
            const tokenAccountKey = results.value[0].address;
            const [tradeState, tradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, User, tokenAccountKey, this.treasuryMint, mint, tokenSizeAdjusted, buyPriceAdjusted);
            const [_buyerEscrow, _buyerEscrowBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.auctionHouse.toBuffer(),
                User.toBuffer(), // Important here the provider should be buyer
            ], this._program_id);
            const isNative = this.treasuryMint.equals(constant_1.WRAPPED_SOL_MINT);
            const ata = (yield (0, util_1.getAtaForMint)(this.treasuryMint, User))[0];
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.buy(tradeBump, _buyerEscrowBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: User,
                    paymentAccount: isNative ? User : ata,
                    transferAuthority: isNative
                        ? anchor.web3.SystemProgram.programId
                        : User,
                    metadata: yield (0, util_1.getMetadata)(mintKey),
                    tokenAccount: tokenAccountKey,
                    escrowPaymentAccount: _buyerEscrow,
                    treasuryMint: this.treasuryMint,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
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
    cancelOffer(buyerPrice, tokenSize, mint, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let buyerClient = this.auctionHouseProgram;
            const mintKey = new anchor.web3.PublicKey(mint);
            const User = new anchor.web3.PublicKey(user);
            const buyPriceAdjusted = buyerPrice;
            const tokenSizeAdjusted = tokenSize;
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, User))[0];
            const tradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, User, tokenAccountKey, this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            let tx = new web3_js_1.Transaction();
            tx.add(yield buyerClient.instruction.cancel(buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: User.toBuffer(),
                    tokenAccount: tokenAccountKey,
                    tokenMint: mintKey,
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                    tradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                },
            }));
            return tx;
        });
    }
    /**
     * Sell Nft
     */
    // public async sellNft(mint: PublicKey, buyPriceAdjusted: any, tokenSizeAdjusted: any, user: PublicKey) {
    //   let sellerClient = this.auctionHouseProgram;
    //   const mintKey = new anchor.web3.PublicKey(mint);
    //   const User = new anchor.web3.PublicKey(user);
    //   const tokenAccountKey = (
    //     await getAtaForMint(mintKey, User)
    //   )[0];
    //   const tokenSize = new BN(
    //     await getPriceWithMantissa(
    //       tokenSizeAdjusted,
    //     ),
    //   );
    //   const buyPrice = new BN(
    //     await getPriceWithMantissa(
    //       buyPriceAdjusted,
    //     ),
    //   );
    //   const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
    //     this.auctionHouse,
    //     User,
    //     tokenAccountKey,
    //     this.treasuryMint,
    //     mintKey,
    //     tokenSizeAdjusted,
    //     new BN(0),
    //   );
    //   const [tradeState, tradeBump] = await getAuctionHouseTradeState(
    //     this.auctionHouse,
    //     User,
    //     tokenAccountKey,
    //     this.treasuryMint,
    //     mintKey,
    //     tokenSize,
    //     buyPrice,
    //   );
    //   let instructions = await sellerClient.instruction.sell(
    //     tradeBump,
    //     freeTradeBump,
    //     this.programAsSignerBump,
    //     buyPriceAdjusted,
    //     tokenSizeAdjusted,
    //     {
    //       accounts: {
    //         wallet: User,
    //         metadata: await getMetadata(mintKey),
    //         tokenAccount: tokenAccountKey,
    //         authority: this.authority,
    //         auctionHouse: this.auctionHouse,
    //         auctionHouseFeeAccount: this.auctionHouseFeeAccount,
    //         sellerTradeState: tradeState,
    //         freeSellerTradeState: freeTradeState,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         programAsSigner: this.programAsSigner,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //       },
    //     },
    //   )
    //   return instructions;
    // }
    sellNFT(mint, buyPriceAdjusted, tokenSizeAdjusted, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let auctionHouseObj = yield this.getAuctionHouseDetails();
            let tMintKey = constant_1.WRAPPED_SOL_MINT;
            let userPubkey = new anchor.web3.PublicKey(user);
            const mintKey = new anchor.web3.PublicKey(mint);
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, userPubkey))[0];
            const [programAsSigner, programAsSignerBump] = yield (0, util_1.getAuctionHouseProgramAsSigner)();
            // const metadata = await getMetadata(mintKey);
            const [tradeState, tradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, userPubkey, tokenAccountKey, tMintKey, mintKey, tokenSizeAdjusted, buyPriceAdjusted);
            const [freeTradeState, freeTradeBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, userPubkey, tokenAccountKey, tMintKey, mintKey, tokenSizeAdjusted, new anchor_1.BN(0));
            let anchorProgram = yield this.getAuctionHouseProgram();
            const instructions = anchorProgram.instruction.sell(tradeBump, freeTradeBump, programAsSignerBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    wallet: userPubkey,
                    metadata: yield (0, util_1.getMetadata)(mintKey),
                    tokenAccount: tokenAccountKey,
                    authority: auctionHouseObj.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
                    sellerTradeState: tradeState,
                    freeSellerTradeState: freeTradeState,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    programAsSigner,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            });
            if (auctionHouseObj.requiresSignOff) {
                instructions.keys
                    .filter(k => k.pubkey.equals(auctionHouseObj.authority))
                    .map(k => (k.isSigner = true));
            }
            return instructions;
        });
    }
    /**
     * Execute Sale
     *
     */
    executeSales(mint, buyerWallet, sellerWallet, buyPriceAdjusted, tokenSizeAdjusted) {
        return __awaiter(this, void 0, void 0, function* () {
            let sellerClient = this.auctionHouseProgram;
            const mintKey = new anchor.web3.PublicKey(mint);
            const buyerWalletKey = new anchor.web3.PublicKey(buyerWallet);
            const sellerWalletKey = new anchor.web3.PublicKey(sellerWallet);
            const isNative = this.treasuryMint.equals(constant_1.WRAPPED_SOL_MINT);
            const tokenAccountKey = (yield (0, util_1.getAtaForMint)(mintKey, sellerWalletKey))[0];
            const buyerTradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, buyerWalletKey, tokenAccountKey, this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            const sellerTradeState = (yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, sellerWalletKey, tokenAccountKey, this.treasuryMint, mintKey, tokenSizeAdjusted, buyPriceAdjusted))[0];
            const [freeTradeState, freeTradeStateBump] = yield (0, util_1.getAuctionHouseTradeState)(this.auctionHouse, sellerWalletKey, tokenAccountKey, this.treasuryMint, mintKey, tokenSizeAdjusted, new anchor_1.BN(0));
            const [_buyerEscrow, _buyerEscrowBump] = yield anchor.web3.PublicKey.findProgramAddress([
                this.PREFIX,
                this.auctionHouse.toBuffer(),
                buyerWalletKey.toBuffer(), // Important here the provider should be buyer
            ], this._program_id);
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
                        pubkey: (yield (0, util_1.getAtaForMint)(this.treasuryMint, remainingAccounts[remainingAccounts.length - 1].pubkey))[0],
                        isWritable: true,
                        isSigner: false,
                    });
                }
            }
            const tMint = this.treasuryMint;
            let tx = new web3_js_1.Transaction();
            tx.add(yield sellerClient.instruction.executeSale(_buyerEscrowBump, freeTradeStateBump, this.programAsSignerBump, buyPriceAdjusted, tokenSizeAdjusted, {
                accounts: {
                    buyer: buyerWalletKey,
                    seller: sellerWalletKey,
                    metadata,
                    tokenAccount: tokenAccountKey,
                    tokenMint: mintKey,
                    escrowPaymentAccount: _buyerEscrow,
                    treasuryMint: tMint,
                    sellerPaymentReceiptAccount: isNative
                        ? sellerWalletKey
                        : (yield (0, util_1.getAtaForMint)(tMint, sellerWalletKey))[0],
                    buyerReceiptTokenAccount: (yield (0, util_1.getAtaForMint)(mintKey, buyerWalletKey))[0],
                    authority: this.authority,
                    auctionHouse: this.auctionHouse,
                    auctionHouseFeeAccount: this.auctionHouseFeeAccount,
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
            }));
            return tx;
        });
    }
    /**
     * Withdraws from the fee account
     */
    withdrawFromFee(amount, feeWithdrawalDestination) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this.auctionHouseProgram;
            let acc = {
                authority: this.authority,
                feeWithdrawalDestination: feeWithdrawalDestination,
                auctionHouseFeeAccount: this.auctionHouseFeeAccount,
                auctionHouse: this.auctionHouse,
                systemProgram: this.systemProgram,
            };
            const amountAdjusted = amount;
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
    withFromTreasury(amount, treasuryWithdrawalDestination) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this.auctionHouseProgram;
            let acc = {
                treasuryMint: this.treasuryMint,
                authority: this.authority,
                treasuryWithdrawalDestination: treasuryWithdrawalDestination,
                auctionHouseTreasury: this.auctionHouseTreasury,
                auctionHouse: this.auctionHouse,
                tokenProgram: this.tokenProgram,
                systemProgram: this.systemProgram,
            };
            const amountAdjusted = amount;
            let tx = new web3_js_1.Transaction();
            tx.add(yield authorityClient.instruction.withdrawFromTreasury(amountAdjusted, {
                accounts: acc
            }));
            let txSig = yield authorityClient.provider.send(tx);
            return txSig;
        });
    }
    /**Update auction house */
    updateAuctionHouse(requiresSignOff, treasuryWithdrawalDestinationOwner, feeWithdrawalDestination, sfbp, canChangeSalePrice, treasuryWithdrawalDestination) {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this.auctionHouseProgram;
            const sellerFeeBasisPoints = parseInt(sfbp);
            let twdKey, fwdKey;
            if (!treasuryWithdrawalDestinationOwner) {
                twdKey = this._provider.wallet.publicKey;
            }
            else {
                twdKey = new anchor.web3.PublicKey(treasuryWithdrawalDestination);
            }
            if (!feeWithdrawalDestination) {
                fwdKey = this._provider.wallet.publicKey;
            }
            else {
                fwdKey = new anchor.web3.PublicKey(feeWithdrawalDestination);
            }
            const tx = new web3_js_1.Transaction();
            tx.add(authorityClient.instruction.updateAuctionHouse(sellerFeeBasisPoints, requiresSignOff, canChangeSalePrice, {
                accounts: {
                    treasuryMint: this.treasuryMint,
                    payer: this.authority,
                    authority: this.authority,
                    newAuthority: this.authority,
                    feeWithdrawalDestination: fwdKey,
                    treasuryWithdrawalDestination: treasuryWithdrawalDestination,
                    treasuryWithdrawalDestinationOwner: twdKey,
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
    /**
     * get auction house accounts
     */
    getAuctionHouseDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this._program;
            const auctionHouseObj = yield authorityClient.account.auctionHouse.fetchNullable(this.auctionHouse);
            return auctionHouseObj;
        });
    }
    /**
     * get fee account balance
     */
    getFeeAccBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this.auctionHouseProgram;
            const auctionHouseObj = yield authorityClient.account.auctionHouse.fetch(this.auctionHouse);
            const feeAmount = yield authorityClient.provider.connection.getBalance(auctionHouseObj.auctionHouseFeeAccount);
            return feeAmount;
        });
    }
    /**
     * get fee account balance
     */
    getTreasuryAccBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            let authorityClient = this.auctionHouseProgram;
            const auctionHouseObj = yield authorityClient.account.auctionHouse.fetch(this.auctionHouse);
            const treasuryAmount = yield (0, util_1.getTokenAmount)(authorityClient, auctionHouseObj.auctionHouseTreasury, auctionHouseObj.treasuryMint);
            return treasuryAmount;
        });
    }
}
exports.default = KanonAuctionProgramAdapter;
//# sourceMappingURL=KanonAuctionProgramAdapter.js.map