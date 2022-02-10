"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenAmount = exports.getPriceWithMantissa = exports.decodeMetadata = exports.getAuctionHouseProgramAsSigner = exports.getAuctionHouseBuyerEscrow = exports.getAuctionHouseTradeState = exports.getMetadata = exports.getAtaForMint = exports.hexToBytes = exports.getUnixTimestamp = void 0;
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const constant_1 = require("../helpers/constant");
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("borsh");
const schema_1 = require("./schema");
const getUnixTimestamp = (date) => {
    if (date) {
        return Math.floor(new Date(date).getTime() / 1000);
    }
    return Math.floor(new Date().getTime() / 1000);
};
exports.getUnixTimestamp = getUnixTimestamp;
// export const getPriceWithMantissa = async (
//   price: number,
//   mint: PublicKey,
//   provider: Provider
// ): Promise<number> => {
//   const token = new Token(
//     provider.connection,
//     new PublicKey(mint),
//     TOKEN_PROGRAM_ID,
//     Keypair.generate()
//   );
//   const mintInfo = await token.getMintInfo();
//   const mantissa = 10 ** mintInfo.decimals;
//   return Math.ceil(price * mantissa);
// };
const hexToBytes = (hex) => {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
};
exports.hexToBytes = hexToBytes;
const getAtaForMint = (mint, owner) => __awaiter(void 0, void 0, void 0, function* () {
    return yield web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), spl_token_1.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
});
exports.getAtaForMint = getAtaForMint;
const getMetadata = (mint) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield web3_js_1.PublicKey.findProgramAddress([
        Buffer.from('metadata'),
        constant_1.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
    ], constant_1.TOKEN_METADATA_PROGRAM_ID))[0];
});
exports.getMetadata = getMetadata;
const getAuctionHouseTradeState = (auctionHouse, wallet, tokenAccount, treasuryMint, tokenMint, tokenSize, buyPrice) => __awaiter(void 0, void 0, void 0, function* () {
    return yield web3_js_1.PublicKey.findProgramAddress([
        Buffer.from(constant_1.AUCTION_HOUSE),
        wallet.toBuffer(),
        auctionHouse.toBuffer(),
        tokenAccount.toBuffer(),
        treasuryMint.toBuffer(),
        tokenMint.toBuffer(),
        buyPrice.toBuffer('le', 8),
        tokenSize.toBuffer('le', 8),
    ], constant_1.AUCTION_HOUSE_PROGRAM_ID);
});
exports.getAuctionHouseTradeState = getAuctionHouseTradeState;
const getAuctionHouseBuyerEscrow = (auctionHouse, wallet) => __awaiter(void 0, void 0, void 0, function* () {
    return yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(constant_1.AUCTION_HOUSE), auctionHouse.toBuffer(), wallet.toBuffer()], constant_1.AUCTION_HOUSE_PROGRAM_ID);
});
exports.getAuctionHouseBuyerEscrow = getAuctionHouseBuyerEscrow;
const getAuctionHouseProgramAsSigner = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(constant_1.AUCTION_HOUSE), Buffer.from('signer')], constant_1.AUCTION_HOUSE_PROGRAM_ID);
});
exports.getAuctionHouseProgramAsSigner = getAuctionHouseProgramAsSigner;
const METADATA_REPLACE = new RegExp('\u0000', 'g');
const decodeMetadata = (buffer) => {
    const metadata = (0, borsh_1.deserializeUnchecked)(schema_1.METADATA_SCHEMA, schema_1.Metadata, buffer);
    metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
    metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
    metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
    return metadata;
};
exports.decodeMetadata = decodeMetadata;
const getPriceWithMantissa = (price, mint, walletKeyPair, anchorProgram) => __awaiter(void 0, void 0, void 0, function* () {
    const token = new spl_token_1.Token(anchorProgram.provider.connection, new anchor_1.web3.PublicKey(mint), spl_token_1.TOKEN_PROGRAM_ID, walletKeyPair);
    const mintInfo = yield token.getMintInfo();
    const mantissa = Math.pow(10, mintInfo.decimals);
    return Math.ceil(price * mantissa);
});
exports.getPriceWithMantissa = getPriceWithMantissa;
function getTokenAmount(anchorProgram, account, mint) {
    return __awaiter(this, void 0, void 0, function* () {
        let amount = 0;
        if (!mint.equals(constant_1.WRAPPED_SOL_MINT)) {
            try {
                const token = yield anchorProgram.provider.connection.getTokenAccountBalance(account);
                amount = token.value.uiAmount * Math.pow(10, token.value.decimals);
            }
            catch (_a) {
            }
        }
        else {
            amount = yield anchorProgram.provider.connection.getBalance(account);
        }
        return amount;
    });
}
exports.getTokenAmount = getTokenAmount;
//# sourceMappingURL=util.js.map