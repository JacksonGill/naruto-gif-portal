import React, { useState } from 'react';
import { GiCancel } from 'react-icons/gi'
import idl from './idl.json';

// Anchor imports
import { PublicKey } from '@solana/web3.js';
import { Program, web3, BN } from '@project-serum/anchor';
const { SystemProgram } = web3;

const programID = new PublicKey(idl.metadata.address);

const PayPopUp = ({ 
    userAddress, 
    toggle,
    getProvider,
}) => {
    const [inputValue, setInputValue] = useState(0.001);

    const handleExit = () => {
        toggle(null);
    }

    const handleSolTip = async () => {
        const parsedInput = parseFloat(inputValue)
        if (!isNaN(parsedInput) & inputValue > 0) {
            console.log(`Sending ${inputValue} SOL to ${userAddress}`);
            try {
                const provider = getProvider();
                const program = new Program(idl, programID, provider);
                 // SOL to lamports
                await program.rpc.sendSol(new BN(parsedInput * 1000000000), {
                    accounts: {
                        from: provider.wallet.publicKey,
                        to: new PublicKey(userAddress),
                        systemProgram: SystemProgram.programId,
                    }
                })
                console.log(`💰${inputValue} SOL successfully sent to ${userAddress}`);
            } catch (error) {
                console.log("Error sending SOL tip:", error);
            }
        } else {
            console.log("Only Valid SOL amount can be inputed");
        }
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <p>Send SOL tip to:</p>
                <p>{userAddress}</p>
                <div className="amount-form">
                    <p>Amount:</p>
                    <input onChange={(e) => setInputValue(e.target.value)} value={inputValue}/>   
                </div>
                <button className="send-button" onClick={handleSolTip}><span>Send</span></button>
                <GiCancel className="exit" onClick={handleExit}>Cancel</GiCancel>
            </div>
        </div>
    )
}


export default PayPopUp;