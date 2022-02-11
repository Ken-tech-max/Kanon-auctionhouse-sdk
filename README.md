# kanon-auctionhouse-sdk

## Load Kanon program
```typescript
const { connection } = useConnection();
const { wallet, sendTransaction } = useWallet();

const provider = new Provider(connection, wallet as any, {
  preflightCommitment: "confirmed",
});

// initialize KanonProgramAdapter w/o wallet connected
const program = new KanonProgramAdapter(provider, {
  isDevNet: true
});
```

## Initialize with connected wallet
```typescript
// re-initialize KanonAuctionProgramAdapter with updated provider
const program = new KanonAuctionProgramAdapter(provider, {
  isDevNet: true,
});

// initialize user reserved PDA addresses
await program.refreshByWallet();
```

## Sign & send transaction w/ connected wallet
```typescript
try {
  const tx = await program.createAuctionHouse(requiresSignOff); 
  let signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(signature, "processed");
} catch (err) {
  // handle custom program error code
}
``` 