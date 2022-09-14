import {
    PROGRAM_ID,
    DataV2, CreateMetadataAccountV2InstructionAccounts, CreateMetadataAccountV2InstructionArgs, createCreateMetadataAccountV2Instruction
} from "@metaplex-foundation/mpl-token-metadata";
import { Keypair, PublicKey, Connection, Transaction, sendAndConfirmTransaction, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { utils } from '@project-serum/anchor';
import data from "../src/config/config.json";
import metaData from "./config/metaData.json";

/**
    * Data to update
    * @type {DataV2}
    */
function createDataSet(): DataV2 {
    return {
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };
}
function createInstructionSet(dataV2: DataV2, myKeypair: Keypair): CreateMetadataAccountV2InstructionArgs {
    return {
        createMetadataAccountArgsV2: {
            data: dataV2,
            isMutable: true
        }

    };
}
/**
 *
 * @param keypairFile : string
 * @returns Keypair from file
 */
function loadWalletKey(keypairFile: string): Keypair {
    return Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(require("fs").readFileSync(keypairFile).toString())));

}
export async function initMetaDataAccount() {
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

    const dataV2: DataV2 = createDataSet()

    const args: CreateMetadataAccountV2InstructionArgs = createInstructionSet(dataV2, myKeypair);
    let instructionSet: TransactionInstruction = createCreateMetadataAccountV2Instruction(accounts, args);
    let transaction = new Transaction();
    transaction.add(instructionSet);

    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    sendAndConfirmTransaction(connection, transaction, [myKeypair])
        .then(txid => {
            console.log("Transaction id: ", txid);
        }).catch(err => {
            console.log("Error: ", err);
        }).finally(() => {
            console.log("Done");
        });
}
