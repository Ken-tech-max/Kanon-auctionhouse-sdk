import * as assert from 'assert';
import * as anchor from '@project-serum/anchor';
import {
  Transaction,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  u64,
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as metaplex from '@metaplex/js';
import { IDL, KanonAuctionhouse } from '../types/kanon_program_devnet';
import { NodeWallet } from "@metaplex/js";
import { KanonProgramConfig } from '..';
import idl_devnet from "../idl/kanon_auctionhouse_devnet.json";
import idl_mainnet from "../idl/kanon_auctionhouse_mainnet.json"; //change when mainnet idl is added
import { Program, Provider, Idl, BN, } from "@project-serum/anchor";
import {
  TOKEN_METADATA_PROGRAM_ID,
  AUCTION_HOUSE_PROGRAM_ID,
  NATIVE_SOL_MINT,
  WRAPPED_SOL_MINT,
} from "../helpers/constant";
import { getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseProgramAsSigner, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa, getTokenAmount, loadAuctionHouseProgram } from '../helpers/util';
import { decodeMetadata, Metadata } from '../helpers/schema';
import { bytes } from '@project-serum/anchor/dist/cjs/utils';


export default class KanonAuctionProgramAdapter {
  protected _provider: Provider;
  protected _program: Program;
  protected _config: KanonProgramConfig;

  protected MetadataDataData = metaplex.programs.metadata.MetadataDataData;
  protected CreateMetadata = metaplex.programs.metadata.CreateMetadata;

  protected TOKEN_METADATA_PROGRAM_ID = TOKEN_METADATA_PROGRAM_ID;
  protected AUCTION_HOUSE_PROGRAM_ID = ASSOCIATED_TOKEN_PROGRAM_ID;
  // Mint address for native SOL token accounts.
  //
  // The program uses this when one wants to pay with native SOL vs an SPL token.
  protected NATIVE_SOL_MINT = NATIVE_SOL_MINT;

  // Clients.
  protected authorityClient: any; // Reprents the exchange authority.
  protected sellerClient: any; // Represents the seller.
  protected buyerClient: any; // Represents the buyer.
  protected nftMintClient: any; // Represents the NFT to be traded.

  // Seeds constants.
         
  protected PREFIX = Buffer.from(bytes.utf8.encode("auction_house"));
  protected FEE_PAYER = Buffer.from(bytes.utf8.encode("fee_payer"));
  protected TREASURY = Buffer.from(bytes.utf8.encode("treasury"));
  protected SIGNER = Buffer.from(bytes.utf8.encode("signer"));
  

  // Constant accounts.
  protected authority : PublicKey = Keypair.generate().publicKey;
  protected feeWithdrawalDestination:PublicKey = Keypair.generate().publicKey;
  protected treasuryWithdrawalDestination:  PublicKey = Keypair.generate().publicKey;
  protected treasuryWithdrawalDestinationOwner: PublicKey = Keypair.generate().publicKey;
  protected treasuryMint = NATIVE_SOL_MINT;
  protected tokenProgram = TOKEN_PROGRAM_ID;
  protected systemProgram = SystemProgram.programId;
  protected ataProgram = ASSOCIATED_TOKEN_PROGRAM_ID;
  protected rent = SYSVAR_RENT_PUBKEY;

  // Uninitialized constant accounts.
  protected metadata: PublicKey = Keypair.generate().publicKey;
  protected programAsSigner: PublicKey = Keypair.generate().publicKey;
  protected auctionHouse : PublicKey = Keypair.generate().publicKey;
  protected auctionHouseTreasury: PublicKey = Keypair.generate().publicKey;
  protected auctionHouseFeeAccount: PublicKey = Keypair.generate().publicKey;
  protected programAsSignerBump = 0;
  protected auctionHouseTreasuryBump = 0;
  protected auctionHouseFeeAccountBump = 0;
  protected bump: number = 0;

  // Buyer specific vars.
  protected buyerWallet: any;
  protected auctionHouseProgram: any;

  protected buyerTokenAccount: any;
  

  // Seller specific vars.
  protected sellerWallet: any;
  protected sellerTokenAccount: any;

  //program id
  protected _program_id: PublicKey;

  constructor(provider: Provider, config: KanonProgramConfig) {
    // initialize anchor program instance
    // initialize anchor program instance
    this._program_id = config.isDevNet ?
      new PublicKey(idl_devnet.metadata.address) :
      new PublicKey(idl_mainnet.metadata.address);
    this._program = config.isDevNet ?
      new Program(idl_devnet as Idl, this._program_id, provider) :
      new Program(idl_mainnet as Idl, this._program_id, provider);

    this._provider = provider;
    this._config = config;
    this.authority= config.authority ?
    new PublicKey(config.authority) : Keypair.generate().publicKey;
  }

  public getProgram(): Program {
    return this._program;
  }

  public getAuctionHouseProgram(): Program<KanonAuctionhouse> {
    return this.auctionHouseProgram
  }

  public getProvider(): Provider {
    return this._provider;
  }

  /**
   * update accounts for connected wallet
   */
  public async refreshByWallet() {
    const [_auctionHouse, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        this.authority.toBuffer(),
        this.treasuryMint.toBuffer(),
      ],
      this._program_id
    );
    const [_auctionHouseFeeAccount, _auctionHouseFeeAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        _auctionHouse.toBuffer(),
        this.FEE_PAYER,
      ],
      this._program_id
      );
    const [_auctionHouseTreasury, _auctionHouseTreasuryBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        _auctionHouse.toBuffer(),
        this.TREASURY,
      ],
      this._program_id,
    );
  
    const [_programAsSigner, _programAsSignerBump] = await
      anchor.web3.PublicKey.findProgramAddress(
        [
          this.PREFIX,
          this.SIGNER,
        ],
        this._program_id,
      );

    this.auctionHouseProgram = this._program;
    this.auctionHouse = _auctionHouse;
    this.bump = _bump;
    this.auctionHouseFeeAccount = _auctionHouseFeeAccount;
    this.auctionHouseFeeAccountBump = _auctionHouseFeeAccountBump;
    this.auctionHouseTreasury = _auctionHouseTreasury;
    this.auctionHouseTreasuryBump = _auctionHouseTreasuryBump;
    this.programAsSigner = _programAsSigner;
    this.programAsSignerBump = _programAsSignerBump;
  }

  /**
     * create auction house
    */
  public async createAuctionHouse(requiresSignOff: boolean,
    treasuryWithdrawalDestinationOwner: PublicKey,
    feeWithdrawalDestination: PublicKey,
    sfbp: any,
    canChangeSalePrice: boolean,
    treasuryWithdrawalDestination:PublicKey,
  ) {
    const sellerFeeBasisPoints = parseInt(sfbp);

    const authorityClient = this.auctionHouseProgram

    let twdKey: anchor.web3.PublicKey,
      fwdKey: anchor.web3.PublicKey;
    if (!treasuryWithdrawalDestinationOwner) {
      twdKey = this._provider.wallet.publicKey;
    } else {
      twdKey = new anchor.web3.PublicKey(treasuryWithdrawalDestination);
    }
    if (!feeWithdrawalDestination) {
      fwdKey = this._provider.wallet.publicKey;
    } else {
      fwdKey = new anchor.web3.PublicKey(feeWithdrawalDestination);
    }

    let acc: any = {
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

    const tx = new Transaction();
    tx.add(
      await authorityClient.instruction.createAuctionHouse(
        this.bump,
        this.auctionHouseFeeAccountBump,
        this.auctionHouseTreasuryBump,
        sellerFeeBasisPoints,
        requiresSignOff,
        canChangeSalePrice,
        {
          accounts: acc,
        }
      )
    )
    return tx;
  } 


  /**
   * 
   * deposit into escrow acount
   *  */

  public async deposit(amount: BN , transferAuthority:PublicKey, user:PublicKey) {
    const User = new anchor.web3.PublicKey(user);
    const [_buyerEscrow, _buyerEscrowBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        this.auctionHouse.toBuffer(),
        User.toBuffer(),  // Important here the provider should be buyer
      ],
      this._program_id,
    );

    const buyerClient = this.auctionHouseProgram;
    let acc: any = {
      accounts: {
        wallet: this._provider.wallet.publicKey, //buyer wallet
        paymentAccount: this._provider.wallet.publicKey,
        transferAuthority:transferAuthority,
        escrowPaymentAccount: _buyerEscrow,
        treasuryMint: this.treasuryMint,
        authority: this.authority,
        auctionHouse: this.auctionHouse,
        auctionHouseFeeAccount: this.auctionHouseFeeAccount,
        tokenProgram: this.tokenProgram,
        systemProgram: this.systemProgram,
        rent: this.rent,
      },
    }
    let tx = new Transaction()
    tx.add(await buyerClient.instruction.deposit(_buyerEscrowBump, amount, acc))
    return tx
  }


  /**
  * 
  * Withdraws from an escrow account
  *  */
  public async withdraw(amount: BN, transferAuthority: PublicKey, user:PublicKey) {
    const User = new anchor.web3.PublicKey(user);
    const [_buyerEscrow, _buyerEscrowBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        this.auctionHouse.toBuffer(),
        User.toBuffer(),  // Important here the provider should be buyer
      ],
      this._program_id,
    );
    const buyerClient = this.auctionHouseProgram;
    let acc: any = {
      accounts: {
        wallet: this._provider.wallet.publicKey, //user wallet
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
    }

    // const amount = new BN(10*10**9);
    let tx = new Transaction()
    tx.add(await buyerClient.instruction.withdraw(_buyerEscrowBump, amount, acc))
    return tx
  }

  /*
  * Posts an offer (BUY)
  */
  public async postOffer(buyerPrice: BN, tokenSize: BN, mintKey: PublicKey , user:PublicKey) {
    let buyerClient = this.auctionHouseProgram;
    const zero = new u64(0);
    const User = new anchor.web3.PublicKey(user);


    const mint = new anchor.web3.PublicKey(mintKey);


    const buyPriceAdjusted = buyerPrice;

    const tokenSizeAdjusted = tokenSize;

    const results = await buyerClient.provider.connection.getTokenLargestAccounts(mintKey);

    const tokenAccountKey: anchor.web3.PublicKey = results.value[0].address

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      User,
      tokenAccountKey,
      this.treasuryMint,
      mint,
      tokenSizeAdjusted,
      buyPriceAdjusted,
    );

    const [_buyerEscrow, _buyerEscrowBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.PREFIX,
        this.auctionHouse.toBuffer(),
        User.toBuffer(),  // Important here the provider should be buyer
      ],
      this._program_id,
    );

    const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);

    const ata = (
      await getAtaForMint(
        this.treasuryMint,
        User,
      )
    )[0];

    let tx = new Transaction()
    tx.add(await buyerClient.instruction.buy(
      tradeBump,
      _buyerEscrowBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
        accounts: {
          wallet: User,
          paymentAccount: isNative ? User: ata,
          transferAuthority: isNative
            ? anchor.web3.SystemProgram.programId
            : User,
          metadata: await getMetadata(mintKey),
          tokenAccount: tokenAccountKey,
          escrowPaymentAccount: _buyerEscrow,
          treasuryMint: this.treasuryMint,
          authority: this.authority,
          auctionHouse: this.auctionHouse,
          auctionHouseFeeAccount: this.auctionHouseFeeAccount,
          buyerTradeState: tradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    )
    )

    return tx;
  }

  /*
  Cancels an offer
  */
  public async cancelOffer(buyerPrice: BN, tokenSize: BN, mint: PublicKey,user:PublicKey) {
    let buyerClient = this.auctionHouseProgram;

    const mintKey = new anchor.web3.PublicKey(mint);
    const User = new anchor.web3.PublicKey(user);

    const buyPriceAdjusted = buyerPrice;
    const tokenSizeAdjusted = tokenSize;

    const tokenAccountKey = (
      await getAtaForMint(mintKey, User)
    )[0];

    const tradeState = (
      await getAuctionHouseTradeState(
        this.auctionHouse,
        User,
        tokenAccountKey,
        this.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
      )
    )[0];


    let tx = new Transaction();
    tx.add(
      await buyerClient.instruction.cancel(
        buyPriceAdjusted,
        tokenSizeAdjusted,
        {
          accounts: {
            wallet: User.toBuffer(),
            tokenAccount: tokenAccountKey,
            tokenMint: mintKey,
            authority: this.authority,
            auctionHouse: this.auctionHouse,
            auctionHouseFeeAccount: this.auctionHouseFeeAccount,
            tradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        },
      )
    )
    return tx;
  }


  /**
   * Sell Nft
   */
  public async sellNft(mint: PublicKey, buyPriceAdjusted: any, tokenSizeAdjusted: any , user:PublicKey) {
    let sellerClient = this.auctionHouseProgram;
    const mintKey = new anchor.web3.PublicKey(mint);
    const User = new anchor.web3.PublicKey(user);

    const tokenAccountKey = (
      await getAtaForMint(mintKey, User)
    )[0];

    const tokenSize = new BN(
      await getPriceWithMantissa(
        tokenSizeAdjusted,
      ),
    );

    const buyPrice = new BN(
      await getPriceWithMantissa(
        buyPriceAdjusted,
      ),
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      User,
      tokenAccountKey,
      this.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      new BN(0),
    );

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      User,
      tokenAccountKey,
      this.treasuryMint,
      mintKey,
      tokenSize,
      buyPrice,
    );

    let instructions = await sellerClient.instruction.sell(
      tradeBump,
      freeTradeBump,
      this.programAsSignerBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
        accounts: {
          wallet: User,
          metadata: await getMetadata(mintKey),
          tokenAccount: tokenAccountKey,
          authority: this.authority,
          auctionHouse: this.auctionHouse,
          auctionHouseFeeAccount: this.auctionHouseFeeAccount,
          sellerTradeState: tradeState,
          freeSellerTradeState: freeTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          programAsSigner: this.programAsSigner,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      },
    )

    return instructions;
  }

  /**
   * Execute Sale
   * 
   */
  public async executeSales(mint: PublicKey, buyerWallet: PublicKey,
    sellerWallet: PublicKey, buyPriceAdjusted: BN, tokenSizeAdjusted: BN) {
    let sellerClient = this.auctionHouseProgram

    const mintKey = new anchor.web3.PublicKey(mint);


    const buyerWalletKey = new anchor.web3.PublicKey(buyerWallet);
    const sellerWalletKey = new anchor.web3.PublicKey(sellerWallet);


    const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);

    const tokenAccountKey = (await getAtaForMint(mintKey, sellerWalletKey))[0];

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        this.auctionHouse,
        buyerWalletKey,
        tokenAccountKey,
        this.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
      )
    )[0];

    const sellerTradeState = (
      await getAuctionHouseTradeState(
        this.auctionHouse,
        sellerWalletKey,
        tokenAccountKey,
        this.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
      )
    )[0];

    const [freeTradeState, freeTradeStateBump] =
      await getAuctionHouseTradeState(
        this.auctionHouse,
        sellerWalletKey,
        tokenAccountKey,
        this.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        new BN(0),
      );

      const [_buyerEscrow, _buyerEscrowBump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          this.PREFIX,
          this.auctionHouse.toBuffer(),
          buyerWalletKey.toBuffer(),  // Important here the provider should be buyer
        ],
        this._program_id,
      );

    const metadata = await getMetadata(mintKey);

    const metadataObj: any = await sellerClient.provider.connection.getAccountInfo(
      metadata,
    );
    const metadataDecoded: any = decodeMetadata(
      Buffer.from(metadataObj.data),
    );

    const remainingAccounts = [];

    for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
      remainingAccounts.push({
        pubkey: new anchor.web3.PublicKey(metadataDecoded.data.creators[i].address),
        isWritable: true,
        isSigner: false,
      });
      if (!isNative) {
        remainingAccounts.push({
          pubkey: (
            await getAtaForMint(
              this.treasuryMint,
              remainingAccounts[remainingAccounts.length - 1].pubkey,
            )
          )[0],
          isWritable: true,
          isSigner: false,
        });
      }
    }


    const tMint: anchor.web3.PublicKey = this.treasuryMint;

    let tx = new Transaction();
    tx.add(await sellerClient.instruction.executeSale(
      _buyerEscrowBump,
      freeTradeStateBump,
      this.programAsSignerBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
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
            : (
              await getAtaForMint(tMint, sellerWalletKey)
            )[0],
          buyerReceiptTokenAccount: (
            await getAtaForMint(mintKey, buyerWalletKey)
          )[0],

          authority: this.authority,
          auctionHouse: this.auctionHouse,
          auctionHouseFeeAccount: this.auctionHouseFeeAccount,
          auctionHouseTreasury: this.auctionHouseTreasury,
          sellerTradeState,
          buyerTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          programAsSigner: this.programAsSigner,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          freeTradeState,
        },
        remainingAccounts,
      },
    ));

    return tx;
  }

  /**
   * Withdraws from the fee account
   */
  public async withdrawFromFee(amount: BN , feeWithdrawalDestination:PublicKey) {
    let authorityClient = this.auctionHouseProgram;
    let acc = {
      authority: this.authority,
      feeWithdrawalDestination: feeWithdrawalDestination,
      auctionHouseFeeAccount: this.auctionHouseFeeAccount,
      auctionHouse: this.auctionHouse,
      systemProgram: this.systemProgram,
    }
    const amountAdjusted = amount;
    let tx = new Transaction();
    tx.add(await authorityClient.instruction.withdrawFromFee(
      amountAdjusted,
      {
        accounts: acc,
      }
    ))
    return tx;
  }

  /**
   * Withdraws from the treasury account
   */
  public async withFromTreasury(amount: BN,treasuryWithdrawalDestination:PublicKey) {
    let authorityClient = this.auctionHouseProgram
    let acc = {
      treasuryMint: this.treasuryMint,
      authority: this.authority,
      treasuryWithdrawalDestination: treasuryWithdrawalDestination,
      auctionHouseTreasury: this.auctionHouseTreasury,
      auctionHouse: this.auctionHouse,
      tokenProgram: this.tokenProgram,
      systemProgram: this.systemProgram,
    }

    const amountAdjusted = amount;

    let tx = new Transaction();
    tx.add(await authorityClient.instruction.withdrawFromTreasury(
      amountAdjusted,
      {
        accounts: acc
      },
    ))

    let txSig = await authorityClient.provider.send(tx);
    return txSig
  }

  /**Update auction house */
  public async updateAuctionHouse(requiresSignOff: boolean,
    treasuryWithdrawalDestinationOwner: PublicKey,
    feeWithdrawalDestination: PublicKey,
    sfbp: any,
    canChangeSalePrice: boolean,
    treasuryWithdrawalDestination:PublicKey
    ) {
    let authorityClient = this.auctionHouseProgram;
    const sellerFeeBasisPoints = parseInt(sfbp);
    let twdKey: anchor.web3.PublicKey,
      fwdKey: anchor.web3.PublicKey;
    if (!treasuryWithdrawalDestinationOwner) {
      twdKey = this._provider.wallet.publicKey;
    } else {
      twdKey = new anchor.web3.PublicKey(treasuryWithdrawalDestination);
    }
    if (!feeWithdrawalDestination) {
      fwdKey = this._provider.wallet.publicKey;
    } else {
      fwdKey = new anchor.web3.PublicKey(feeWithdrawalDestination);
    }
    const tx = new Transaction();  

    tx.add(
      authorityClient.instruction.updateAuctionHouse(
        sellerFeeBasisPoints,
        requiresSignOff,
        canChangeSalePrice,
        {
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
        }
      )
    );
    const txSig = await authorityClient.provider.send(tx);
    return txSig;

  }


  /**
   * get auction house accounts
   */
  public async getAuctionHouseDetails() {
    let authorityClient = this._program;
    const auctionHouseObj :any= await authorityClient.account.auctionHouse.fetchNullable(
      this.auctionHouse,
    );
    return auctionHouseObj;
  }

  /**
   * get fee account balance
   */
  public async getFeeAccBalance() {
    let authorityClient = this.auctionHouseProgram
    const auctionHouseObj = await authorityClient.account.auctionHouse.fetch(
      this.auctionHouse,
    );
    const feeAmount = await authorityClient.provider.connection.getBalance(

      auctionHouseObj.auctionHouseFeeAccount,
    );
    return feeAmount;
  }

  /**
   * get fee account balance
   */
  public async getTreasuryAccBalance() {
    let authorityClient = this.auctionHouseProgram;
    const auctionHouseObj = await authorityClient.account.auctionHouse.fetch(
      this.auctionHouse,
    );
    const treasuryAmount = await getTokenAmount(
      authorityClient,

      auctionHouseObj.auctionHouseTreasury,

      auctionHouseObj.treasuryMint,
    );

    return treasuryAmount;
  }


}
