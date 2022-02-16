export declare const KANON_GLOBAL_SEED = "SYNESIS_KANON";
export declare const KANON_GLOBAL_SEASON_SEED = "SEASON";
export declare const COLLECTION_STATE_PREFIX = "collection_state";
export declare const COLLECTION_AUTHORITY_PREFIX = "collection_authority";
export declare const USER_MINT_RESERVE_STATE_PREFIX = "user_mint_reserve_state";
export declare const ADMIN_TREASURY_ACCOUNT_PREFIX = "admin_treasury_account";
export declare const GLOBAL_STATE_ACCOUNT_KEY_DEVNET = "knGbvYZWpbCch6LUP37NdPubmZHGwtZSy9PTwALj854";
export declare const GLOBAL_STATE_ACCOUNT_KEY_MAINNET = "KNGB5XoZFBDT9vQSDRmGzgvdyWCnCrofn9F88mJtPt5";
import { PublicKey } from '@solana/web3.js';
export declare const CANDY_MACHINE = "candy_machine";
export declare const AUCTION_HOUSE = "auction_house";
export declare const TOKEN_ENTANGLER = "token_entangler";
export declare const ESCROW = "escrow";
export declare const A = "A";
export declare const B = "B";
export declare const FEE_PAYER = "fee_payer";
export declare const TREASURY = "treasury";
export declare const MAX_NAME_LENGTH = 32;
export declare const MAX_URI_LENGTH = 200;
export declare const MAX_SYMBOL_LENGTH = 10;
export declare const MAX_CREATOR_LEN: number;
export declare const MAX_CREATOR_LIMIT = 5;
export declare const ARWEAVE_PAYMENT_WALLET: PublicKey;
export declare const CANDY_MACHINE_PROGRAM_ID: PublicKey;
export declare const CANDY_MACHINE_PROGRAM_V2_ID: PublicKey;
export declare const TOKEN_METADATA_PROGRAM_ID: PublicKey;
export declare const NATIVE_SOL_MINT: PublicKey;
export declare const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey;
export declare const TOKEN_PROGRAM_ID: PublicKey;
export declare const FAIR_LAUNCH_PROGRAM_ID: PublicKey;
export declare const AUCTION_HOUSE_PROGRAM_ID: PublicKey;
export declare const TOKEN_ENTANGLEMENT_PROGRAM_ID: PublicKey;
export declare const WRAPPED_SOL_MINT: PublicKey;
export declare const GUMDROP_DISTRIBUTOR_ID: PublicKey;
export declare const GUMDROP_TEMPORAL_SIGNER: PublicKey;
export declare const AUCTIONHOUSE_ACCOUNT_KEY_DEVNET = "2JG4FMfu8Vx84RamR2jz6BhfE4dFcteEux4xawh6LPCZ";
export declare const AUCTIONHOUSE_ACCOUNT_KEY_MAINNET = "2JG4FMfu8Vx84RamR2jz6BhfE4dFcteEux4xawh6LPCZ";
export declare const CONFIG_ARRAY_START: number;
export declare const CONFIG_ARRAY_START_V2: number;
export declare const CONFIG_LINE_SIZE_V2: number;
export declare const CONFIG_LINE_SIZE: number;
export declare const CACHE_PATH = "./.cache";
export declare const DEFAULT_TIMEOUT = 15000;
export declare const EXTENSION_PNG = ".png";
export declare const EXTENSION_JPG = ".jpg";
export declare const EXTENSION_GIF = ".gif";
export declare const EXTENSION_MP4 = ".mp4";
export declare const EXTENSION_MOV = ".mov";
export declare const EXTENSION_MP3 = ".mp3";
export declare const EXTENSION_FLAC = ".flac";
export declare const EXTENSION_WAV = ".wav";
export declare const EXTENSION_GLB = ".glb";
export declare const EXTENSION_HTML = ".html";
export declare const EXTENSION_JSON = ".json";
declare type Cluster = {
    name: string;
    url: string;
};
export declare const CLUSTERS: Cluster[];
export declare const DEFAULT_CLUSTER: Cluster;
export {};