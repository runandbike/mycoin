
import {
    PROGRAM_ID,
    DataV2, CreateMetadataAccountV2InstructionAccounts, CreateMetadataAccountV2InstructionArgs, createCreateMetadataAccountV2Instruction, UpdateMetadataAc>
} from "@metaplex-foundation/mpl-token-metadata";
import { Keypair, PublicKey, Connection, Transaction, sendAndConfirmTransaction, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { utils } from '@project-serum/anchor';
import data from "../src/config/config.json";
import metaData from "./config/metaData.json";

export function loadWalletKey(keypairFile: string): Keypair {
    const fs = require("fs");
    const loaded =Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
}

const INITIALIZE = false;

export async function createMetaData() {
    console.log("Creating metaData account")
    const myKeypair = loadWalletKey(data.keyFileLocation);
    console.log(myKeypair.publicKey.toBase58());
    const mint = new PublicKey(data.keypair);
    const seed1 = Buffer.from(utils.bytes.utf8.encode('metadata'));
    const seed2 = Buffer.from(PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());

    const [metadataPDA, _bump] = PublicKey.findProgramAddressSync([seed1, seed2, seed3], PROGRAM_ID);
    const accounts: CreateMetadataAccountV2InstructionAccounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    const dataV2: DataV2 = {
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    }
    let ix;
    if (INITIALIZE) {
        const args = {
            createMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true
            }
        };
        ix = createCreateMetadataAccountV2Instruction(accounts, args);
    } else {
        const args: UpdateMetadataAccountV2InstructionArgs = {
            updateMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };
        ix = createUpdateMetadataAccountV2Instruction(accounts, args)
    }
    const tx = new Transaction();
    tx.add(ix);
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const txid = await sendAndConfirmTransaction(connection, tx, [myKeypair]);
    console.log(txid);

}


