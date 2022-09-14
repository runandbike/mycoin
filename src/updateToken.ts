import {
    PROGRAM_ID, UpdateMetadataAccountV2InstructionAccounts,
    DataV2, UpdateMetadataAccountV2InstructionArgs, createUpdateMetadataAccountV2Instruction
} from "@metaplex-foundation/mpl-token-metadata";
import { Keypair, PublicKey, Connection, Transaction, sendAndConfirmTransaction, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { utils } from '@project-serum/anchor';
import data from "/root/src/config/config.json";
import metaData from "/root/src/config/metaData.json";


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

/**
    * Arguments for the instruction
    * @type {UpdateMetadataAccountV2InstructionArgs}
    */
function createInstructionSet(dataV2: DataV2, myKeypair: Keypair): UpdateMetadataAccountV2InstructionArgs {
    return {
        updateMetadataAccountArgsV2: {
            data: dataV2,
            isMutable: true,
            updateAuthority: myKeypair.publicKey,
            primarySaleHappened: false
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

/**
* Run the script
*/
export async function updateMetaData() {
    console.log("Updating metadata for existing metadata account")
    const myKeypair = loadWalletKey(data.keyFileLocation);
    console.log(myKeypair.publicKey.toBase58());
    const mint = new PublicKey(data.keypair);
    const seed1 = Buffer.from(utils.bytes.utf8.encode('metadata'));
    const seed2 = Buffer.from(PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());

    const [metadataPDA, _bump] = PublicKey.findProgramAddressSync([seed1, seed2, seed3], PROGRAM_ID);
    const accounts: UpdateMetadataAccountV2InstructionAccounts = {
        metadata: metadataPDA,
        updateAuthority: myKeypair.publicKey,
    }

    const dataV2: DataV2 = createDataSet()

    const args: UpdateMetadataAccountV2InstructionArgs = createInstructionSet(dataV2, myKeypair);
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    let instructionSet: TransactionInstruction = createUpdateMetadataAccountV2Instruction(accounts, args);
    let transaction = new Transaction();
    transaction.add(instructionSet);

    /**
     * Send the transaction
     * @type {Promise<string>}
     * @returns Transaction id
     */
    sendAndConfirmTransaction(connection, transaction, [myKeypair])
        .then(txid => {
            console.log("Transaction id: ", txid);
        }).catch(err => {
            console.log("Error: ", err);
        }).finally(() => {
            console.log("Done");
        });
}
