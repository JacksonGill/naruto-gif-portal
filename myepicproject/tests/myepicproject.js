const anchor = require("@project-serum/anchor");

const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log("🚀 Starting test...");

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Myepicproject;

  // Create an account keypair for our program to use
  const baseAccount = anchor.web3.Keypair.generate();

  // Call start_stuff_off, pass it the params it needs
  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount]
  });

  console.log("📝 Your transaction signature:", tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count:', account.totalGifs.toString());

  // Call add_gif
  await program.rpc.addGif("https://media3.giphy.com/media/w7CP59oLYw6PK/giphy.gif?cid=ecf05e47z5o17xgn9305d0x19eju7ilk8mjcg1g9fblefc8y&rid=giphy.gif&ct=g",
  {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    }
  })

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count:', account.totalGifs.toString());

  // Access gif_list on the account!
  console.log('👀 GIF List', account.gifList);
  console.log("Adding a vote...")
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  await program.rpc.updateGif("https://media3.giphy.com/media/w7CP59oLYw6PK/giphy.gif?cid=ecf05e47z5o17xgn9305d0x19eju7ilk8mjcg1g9fblefc8y&rid=giphy.gif&ct=g", 
  {
    accounts: {
      baseAccount: baseAccount.publicKey,
    }
  })

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF List', account.gifList);
  console.log("Sending 0.5 SOL to:");
  console.log("to -> baseAccount.publicKey:",baseAccount.publicKey.toString());
  console.log("from -> provider.wallet.publicKey:", provider.wallet.publicKey.toString());

  tx = await program.rpc.sendSol(new anchor.BN(500000000), {
    accounts: {
      from: provider.wallet.publicKey,
      to: baseAccount.publicKey,
      systemProgram: SystemProgram.programId,
    }
  });

  console.log("📝 Your transaction signature:", tx);

}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

runMain();