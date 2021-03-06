import { Provider ,BN, web3, Program} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { TOKEN_METADATA_PROGRAM_ID, AUCTION_HOUSE,AUCTION_HOUSE_PROGRAM_ID,  WRAPPED_SOL_MINT,
} from "../helpers/constant"
import { Keypair, PublicKey } from "@solana/web3.js";
import { BinaryReader, BinaryWriter, deserializeUnchecked } from 'borsh';
import { Metadata, METADATA_SCHEMA } from "./schema";

const TOKEN_PROGRAM_ID = new web3.PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

export const getUnixTimestamp = (date?: Date | string | number) => {
  if (date) {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  return Math.floor(new Date().getTime() / 1000);
};

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

export const hexToBytes = (hex: string): any[] => {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// export const getAtaForMint = async (
//   mint: PublicKey,
//   owner: PublicKey
// ): Promise<[PublicKey, number]> => {
//   return await PublicKey.findProgramAddress(
//     [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
//     ASSOCIATED_TOKEN_PROGRAM_ID
//   );
// };

export const  getAtaForMint = async(
  mint: PublicKey,
  owner: PublicKey
): Promise<[PublicKey, number]> =>{
  return await web3.PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  );
};



export const getMetadata = async (
  mint: PublicKey,
): Promise<PublicKey> => {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};



export const getAuctionHouseTradeState = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: BN,
  buyPrice: BN,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(AUCTION_HOUSE),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      buyPrice.toBuffer('le', 8),
      tokenSize.toBuffer('le', 8),
    ],
    AUCTION_HOUSE_PROGRAM_ID,
  );
};



export const getAuctionHouseBuyerEscrow = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), wallet.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID,
  );
};

export const getAuctionHouseProgramAsSigner = async (): Promise<
  [PublicKey, number]
> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from(AUCTION_HOUSE), Buffer.from('signer')],
    AUCTION_HOUSE_PROGRAM_ID,
  );
};



const METADATA_REPLACE = new RegExp('\u0000', 'g');

export const decodeMetadata = (buffer: Buffer): Metadata => {
  const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer,
  ) as Metadata;
  metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
  metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
  metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
  return metadata;
};

export const getPriceWithMantissa = async (
  price: number,
): Promise<number> => {
  const mantissa = 10 ** 9;
  return Math.ceil(price * mantissa);
}

export async function getTokenAmount(
  anchorProgram: Program,
  account: web3.PublicKey,
  mint: web3.PublicKey,
): Promise<number> {
  let amount = 0;
  if (!mint.equals(WRAPPED_SOL_MINT)) {
    try {
      const token:any = await anchorProgram.provider.connection.getTokenAccountBalance(account);
      amount = token.value.uiAmount * Math.pow(10, token.value.decimals);
    } catch{

    }
  } else {
    amount = await anchorProgram.provider.connection.getBalance(account);
  }
  return amount;
}


export async function loadAuctionHouseProgram(
  _provider:Provider
) {
  const provider = _provider
  const idl:any = await Program.fetchIdl(AUCTION_HOUSE_PROGRAM_ID, provider);
  return new Program(idl, AUCTION_HOUSE_PROGRAM_ID, provider);
}