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
import { IDL, AuctionHouse } from '../types/kanon_program_devnet';
import { NodeWallet } from "@metaplex/js";
import { KanonProgramConfig } from '..';
import idl_devnet from "../idl/kanon_program_devnet.json";
import idl_mainnet from "../idl/kanon_program_devnet.json"; //change when mainnet idl is added
import { Program, Provider, Idl, BN, } from "@project-serum/anchor";
import {
  TOKEN_METADATA_PROGRAM_ID,
  AUCTION_HOUSE_PROGRAM_ID,
  NATIVE_SOL_MINT
} from "../helpers/constant";
import { getAtaForMint, getAuctionHouseBuyerEscrow, getAuctionHouseProgramAsSigner, getAuctionHouseTradeState, getMetadata, getPriceWithMantissa } from '../helpers/util';
import { decodeMetadata, Metadata } from '../helpers/schema';


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
  protected PREFIX = Buffer.from("auction_house");
  protected FEE_PAYER = Buffer.from("fee_payer");
  protected TREASURY = Buffer.from("treasury");
  protected SIGNER = Buffer.from("signer");

  // Constant accounts.
  protected authority: any;
  protected feeWithdrawalDestination: any;
  protected treasuryWithdrawalDestination: any;
  protected treasuryWithdrawalDestinationOwner: any;
  protected treasuryMint = NATIVE_SOL_MINT;
  protected tokenProgram = TOKEN_PROGRAM_ID;
  protected systemProgram = SystemProgram.programId;
  protected ataProgram = ASSOCIATED_TOKEN_PROGRAM_ID;
  protected rent = SYSVAR_RENT_PUBKEY;

  // Uninitialized constant accounts.
  protected metadata: any;
  protected programAsSigner: any;
  protected auctionHouse: any;
  protected auctionHouseTreasury: any;
  protected auctionHouseFeeAccount: any;
  protected programAsSignerBump = 0;
  protected auctionHouseTreasuryBump = 0;
  protected auctionHouseFeeAccountBump = 0;
  protected bump: number = 0;

  // Buyer specific vars.
  protected buyerWallet: any;;
  protected buyerTokenAccount: any;
  protected buyerEscrow: any;
  protected buyerEscrowBump: number = 0;

  // Seller specific vars.
  protected sellerWallet: any;
  protected sellerTokenAccount: any;

  //program id
  protected _program_id: PublicKey;

  constructor(provider: Provider, config: KanonProgramConfig) {
    // initialize anchor program instance
    this._program_id = config.isDevNet ?
      new PublicKey(idl_devnet.metadata.address) :
      new PublicKey(idl_mainnet.metadata.address);
    this._program = config.isDevNet ?
      new Program(idl_devnet as Idl, this._program_id, provider) :
      new Program(idl_mainnet as Idl, this._program_id, provider);

    this._provider = provider;
    this._config = config;

  }

  public getProgram(): Program {
    return this._program;
  }

  public getProvider(): Provider {
    return this._provider;
  }

  /**
   * update accounts for connected wallet
   */
  public async refreshByWallet() {
    this.authority = this._provider.wallet.publicKey;  //Important this must be admin's public key
    this.feeWithdrawalDestination = this.authority;
    this.treasuryWithdrawalDestination = this.authority;
    this.treasuryWithdrawalDestinationOwner = this.authority;

    const [_auctionHouse, _bump] = await PublicKey.findProgramAddress(
      [
        this.PREFIX,
        this.authority.toBuffer(),
        this.treasuryMint.toBuffer(),
      ],
      AUCTION_HOUSE_PROGRAM_ID,
    );
    const [_auctionHouseFeeAccount, _auctionHouseFeeAccountBump] = await PublicKey.findProgramAddress(
      [
        this.PREFIX,
        _auctionHouse.toBuffer(),
        this.FEE_PAYER,
      ],
      AUCTION_HOUSE_PROGRAM_ID,
    );
    const [_auctionHouseTreasury, _auctionHouseTreasuryBump] = await PublicKey.findProgramAddress(
      [
        this.PREFIX,
        _auctionHouse.toBuffer(),
        this.TREASURY,
      ],
      AUCTION_HOUSE_PROGRAM_ID,
    );
    const [_buyerEscrow, _buyerEscrowBump] = await PublicKey.findProgramAddress(
      [
        this.PREFIX,
        _auctionHouse.toBuffer(),
        this._provider.wallet.publicKey.toBuffer(),  // Important here the provider should be buyer
      ],
      AUCTION_HOUSE_PROGRAM_ID,
    );
    const [_programAsSigner, _programAsSignerBump] = await
      PublicKey.findProgramAddress(
        [
          this.PREFIX,
          this.SIGNER,
        ],
        AUCTION_HOUSE_PROGRAM_ID,
      );

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

  }

  /**
     * create auction house
    */
  public async createAuctionHouse(requiresSignOff:boolean) {
    const sellerFeeBasisPoints = 1;
    const canChangeSalePrice = true;

    const authorityClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this will be admin's wallet provider
    );

    let acc: any = {
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

  public async deposit(amount: BN) {

    const buyerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be user's keypair
    );

    let acc: any = {
      accounts: {
        wallet: this._provider.wallet.publicKey, //buyer wallet
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
    }
    // const amount = new BN(10*10**9);
    let tx = new Transaction()
    tx.add(await buyerClient.instruction.deposit(this.buyerEscrowBump, amount, acc))
    return tx
  }


  /**
  * 
  * Withdraws from an escrow account
  *  */
  public async withdraw(amount: BN) {

    const buyerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be user's keypair
    );


    let acc: any = {
      accounts: {
        wallet: this._provider.wallet.publicKey, //user wallet
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
    }

    // const amount = new BN(10*10**9);
    let tx = new Transaction()
    tx.add(await buyerClient.instruction.withdraw(this.buyerEscrowBump, amount, acc))
    return tx
  }

  /*
  * Posts an offer (BUY)
  */
  public async postOffer(buyerPrice: u64, tokenSize: u64, mintKey: PublicKey) {
    let buyerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be buyer's keypair
    );
    const zero = new u64(0);


    const mint = new anchor.web3.PublicKey(mintKey);


    const buyPriceAdjusted = buyerPrice;

    const tokenSizeAdjusted = tokenSize;


    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      this.auctionHouse,
      this._provider.wallet.publicKey,
    );

    const results = await buyerClient.provider.connection.getTokenLargestAccounts(mintKey);

    const tokenAccountKey: anchor.web3.PublicKey = results.value[0].address

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      this._provider.wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      this.treasuryMint,
      mint,
      tokenSizeAdjusted,
      buyPriceAdjusted,
    );

    //@ts-ignore
    const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);

    const ata = (
      await getAtaForMint(
        //@ts-ignore
        this.treasuryMint,
        this._provider.wallet.publicKey,
      )
    )[0];
    
    let tx = new Transaction()
    tx.add(await buyerClient.instruction.buy(
      tradeBump,
      this.buyerEscrowBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
        accounts: {
          wallet: this._provider.wallet.publicKey,
          paymentAccount: isNative ? this._provider.wallet.publicKey : ata,
          transferAuthority: isNative
            ? anchor.web3.SystemProgram.programId
            : this._provider.wallet.publicKey,
          metadata: await getMetadata(mintKey),
          tokenAccount: tokenAccountKey,
          escrowPaymentAccount:this.buyerEscrow,
          //@ts-ignore
          treasuryMint: this.treasuryMint,
          //@ts-ignore
          authority: this.authority,
          auctionHouse: this.auctionHouse,
          //@ts-ignore
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
  public async cancelOffer(buyerPrice: u64, tokenSize: u64, mint: PublicKey) {
    let buyerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be seller's keypair
    );

    const mintKey = new anchor.web3.PublicKey(mint);

    const buyPriceAdjusted = buyerPrice;
    const tokenSizeAdjusted = tokenSize;

    const tokenAccountKey = (
      await getAtaForMint(mintKey, this._provider.wallet.publicKey)
    )[0];

    const tradeState = (
      await getAuctionHouseTradeState(
        this.auctionHouse,
        this._provider.wallet.publicKey,
        tokenAccountKey,
        //@ts-ignore
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
            wallet: this._provider.wallet.publicKey.toBuffer(),
            tokenAccount: tokenAccountKey,
            tokenMint: mintKey,
            //@ts-ignore
            authority: this.authority,
            auctionHouse: this.auctionHouse,
            //@ts-ignore
            auctionHouseFeeAccount: this.auctionHouseFeeAccount,
            tradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          // signers: [authorityClient.provider.wallet.payer],
        },
      )
    )

    
    return tx;

  }


  /**
   * Sell Nft
   */
  public async sellNft(mint:PublicKey , buyPriceAdjusted:u64 ,tokenSizeAdjusted:u64 )
  {
    let sellerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be seller's keypair
    );

    const mintKey = new anchor.web3.PublicKey(mint);

    const tokenAccountKey = (
      await getAtaForMint(mintKey, this._provider.wallet.publicKey)
    )[0];

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      this._provider.wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      this.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      buyPriceAdjusted,
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      this.auctionHouse,
      this._provider.wallet.publicKey,
      tokenAccountKey,
      //@ts-ignore
      this.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      new BN(0),
    );

    let tx = new Transaction();
    

    tx.add( await sellerClient.instruction.sell(
      tradeBump,
      freeTradeBump,
      this.programAsSignerBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
        accounts: {
          wallet: this._provider.wallet.publicKey,          
          metadata: await getMetadata(mintKey),
          tokenAccount: tokenAccountKey,
          //@ts-ignore
          authority: this.authority,
          auctionHouse: this.auctionHouse,
          //@ts-ignore
          auctionHouseFeeAccount: this.auctionHouseFeeAccount,
          sellerTradeState: tradeState,
          freeSellerTradeState: freeTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          programAsSigner:this.programAsSigner,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      },
    ))

    return tx   
  }
  
  /**
   * Execute Sale
   * 
   */
  public async executeSales(mint:PublicKey,buyerWallet:PublicKey,
    sellerWallet:PublicKey,buyPriceAdjusted:u64 ,tokenSizeAdjusted:u64 ){
    let sellerClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be seller's keypair
    );

    const mintKey = new anchor.web3.PublicKey(mint);

    
    const buyerWalletKey = new anchor.web3.PublicKey(buyerWallet);
    const sellerWalletKey = new anchor.web3.PublicKey(sellerWallet);

    //@ts-ignore
    const isNative = this.treasuryMint.equals(WRAPPED_SOL_MINT);
   
    const tokenAccountKey = (await getAtaForMint(mintKey, sellerWalletKey))[0];

    const buyerTradeState = (
      await getAuctionHouseTradeState(
        this.auctionHouse,
        buyerWalletKey,
        tokenAccountKey,
        //@ts-ignore
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
        //@ts-ignore
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
        //@ts-ignore
        this.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        new BN(0),
      );
   
    const metadata = await getMetadata(mintKey);

    const metadataObj:any = await sellerClient.provider.connection.getAccountInfo(
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
              //@ts-ignore
             this.treasuryMint,
              remainingAccounts[remainingAccounts.length - 1].pubkey,
            )
          )[0],
          isWritable: true,
          isSigner: false,
        });
      }
    }
    //@ts-ignore
    const tMint: web3.PublicKey =this.treasuryMint;

    let tx = new Transaction();
    tx.add(await sellerClient.instruction.executeSale(
      this.buyerEscrowBump,
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
          escrowPaymentAccount:this.buyerEscrow,
          treasuryMint: tMint,
          sellerPaymentReceiptAccount: isNative
            ? sellerWalletKey
            : (
                await getAtaForMint(tMint, sellerWalletKey)
              )[0],
          buyerReceiptTokenAccount: (
            await getAtaForMint(mintKey, buyerWalletKey)
          )[0],
          //@ts-ignore
          authority:this.authority,
          auctionHouse: this.auctionHouse,
          //@ts-ignore
          auctionHouseFeeAccount:this.auctionHouseFeeAccount,
          //@ts-ignore
          auctionHouseTreasury:this.auctionHouseTreasury,
          sellerTradeState,
          buyerTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          programAsSigner:this.programAsSigner,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          freeTradeState,
        },
        remainingAccounts,
        // signers: [authorityClient.provider.wallet.payer],
      },
    ));

    return tx;
  }

  /**
   * Withdraws from the fee account
   */
  public async withdrawFromFee(amount:any){
    let authorityClient:any = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be auction house keypair
    );

    let acc = {
      authority:this.authority,
      feeWithdrawalDestination:this.feeWithdrawalDestination,
      auctionHouseFeeAccount:this.auctionHouseFeeAccount,
      auctionHouse:this.auctionHouse,
      systemProgram:this.systemProgram,
    }

    const amountAdjusted = new BN(
      await getPriceWithMantissa(
        amount,
        //@ts-ignore
        this.treasuryMint,
        this._provider.wallet.publicKey,
        authorityClient,
      ),
    );

    let tx = new Transaction();
    tx.add(await authorityClient.instruction.withdrawFromFee(
      amountAdjusted,
      {
        accounts:acc,
      }
    ))
    
    return tx;
    
  }

  /**
   * Withdraws from the treasury account
   */
  public async withFromTreasury(amount:any){
    let authorityClient:any = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be auction house keypair
    );
    let acc ={
      treasuryMint:this.treasuryMint,
      authority:this.authority,
      treasuryWithdrawalDestination:this.treasuryWithdrawalDestination,
      auctionHouseTreasury:this.auctionHouseTreasury,
      auctionHouse:this.auctionHouse,
      tokenProgram:this.tokenProgram,
      systemProgram:this.systemProgram,
    }

    const amountAdjusted = new BN(
      await getPriceWithMantissa(
        amount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        this._provider.wallet.publicKey,
        authorityClient,
      ),
    );

    let tx = new Transaction();
    tx.add(await authorityClient.instruction.withdrawFromTreasury(
      new u64(1),
      {
        accounts: acc
      },
    ))
    
    let txSig =  await authorityClient.provider.send(tx);
    return txSig
  }

  /**Update auction house */
  public async updateAuctionHouse(requiresSignOff:boolean){
    let authorityClient = new Program(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      this._provider, //this must be auction house keypair
    );
    const sellerFeeBasisPoints = 2;
    const canChangeSalePrice = true;
    const tx = new Transaction();
    tx.add(
       authorityClient.instruction.updateAuctionHouse(
        sellerFeeBasisPoints,
        requiresSignOff,
        canChangeSalePrice,
        {
          accounts: {
            treasuryMint:this.treasuryMint,
            payer: this.authority,
            authority:this.authority,
            newAuthority: this.authority,
            feeWithdrawalDestination:this.feeWithdrawalDestination,
            treasuryWithdrawalDestination:this.treasuryWithdrawalDestination,
            treasuryWithdrawalDestinationOwner:this.treasuryWithdrawalDestinationOwner,
            auctionHouse:this.auctionHouse,
            tokenProgram:this.tokenProgram,
            systemProgram:this.systemProgram,
            ataProgram:this.ataProgram,
            rent:this.rent,
          }
        }
      )
    );
    const txSig = await authorityClient.provider.send(tx);
    return txSig;

  }

}
