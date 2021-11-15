import React, { useEffect, useState, useCallback }  from 'react';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Provider, Program, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';

// React Icons
import { IconContext } from 'react-icons/lib';
import { FcLike } from 'react-icons/fc';
import { FaMoneyBillWave } from 'react-icons/fa';
import PayPopUp from './payPopUp';

// SystemProgram is a reference to the Solana runtime
const { SystemProgram } = web3;
// Create a keypair for the account what will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
// Get our program's id from the IDL file
const programID = new PublicKey(idl.metadata.address);
// Set our network to devenet.
const network = clusterApiUrl('devnet');
// Control's how we want to acknowledge when a transaction is "done"
const opts = { preflightCommitment: "processed" }

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [payPopUp, setPayPopUp] = useState(false);
  const [recievingAddress, setRecievingAddress] = useState(null);
  /*
   * Holds thie logic for deciding if a Phantom Wallet is connected or not 
  */

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          /*
          * Connect directly with the user's wallets
          */

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:', response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  }

  /*
   * Button handler for connecting wallet
  */ 
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString())
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString());
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  }

  const sendGif = async () => {
    if (inputValue === 0) {
      console.log("No gif link given");
      return
    }
    console.log("Gif link:", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF sucessfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  }

  const addVote = async (gifLink) => {
    console.log("Upvoting", gifLink);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.updateGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucessfully upvoted");
      await getGifList();
    } catch (error) {
      console.log("error upvoting GIF:", error)
    }
  }

  const renderNotConnectedContainer = () => {
    return (
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    )
  }

  const handlePopUp = (userAddress) => {
    if (userAddress === getProvider().wallet.publicKey.toString()) {
      console.log("Cannot Tip Youself! 🤣");
    } else {
      setPayPopUp(!payPopUp);
      setRecievingAddress(userAddress);
    }
  }
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-program" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } 
    // Account exists
    return (
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        {payPopUp ? 
          <PayPopUp 
            userAddress={recievingAddress} 
            toggle={handlePopUp} 
            getProvider={getProvider}
          /> 
        : null}
        <div className="gif-grid">
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img alt="gif-link" src={item.gifLink} />
              <p>{item.userAddress.toString()}</p>
              <IconContext.Provider value={{ className: "react-icons-heart" }}>
                <div className="update-system">
                  <p>{item.votes}</p>
                  <FcLike className="upvote" onClick={() => addVote(item.gifLink)}>Upvote</FcLike>
                  <FaMoneyBillWave className="send-tip" onClick={() => handlePopUp(item.userAddress.toString())}>Send a Tip</FaMoneyBillWave>
                </div>
              </IconContext.Provider>
            </div>
          ))}
        </div>
      </div>
    )
  }
  /*
   * When the component first loads, check if a Phantom Wallet is connected
  */
  useEffect(() => {
    window.addEventListener('load', async(event) => {
      await checkIfWalletIsConnected();
    });
  }, []);
  
  const getGifList = useCallback(async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);

      setGifList(account.gifList)
    } catch (error) {
      console.log("Error in getGifs: ", error);
      setGifList(null)
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching Gift list...');
      getGifList();
    }

  }, [walletAddress, getGifList])



  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">Naruto GIF Portal</p>
          <p className="sub-text">View your GIF collection in the metaverse</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;
