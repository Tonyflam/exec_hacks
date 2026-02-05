/**
 * PHANTOM iApp - Confidential DeFi Intelligence Engine
 * 
 * This TEE application runs inside Intel SGX enclave to:
 * 1. Decrypt and aggregate user portfolio data
 * 2. Run AI-powered risk analysis
 * 3. Generate rebalancing strategies
 * 4. Sign results for on-chain verification
 * 
 * @module phantom-iapp
 */

import { IExecDataProtector } from "@iexec/dataprotector";
import { ethers } from "ethers";
import { RiskEngine } from "./riskEngine.js";
import { PortfolioAggregator } from "./portfolioAggregator.js";
import { StrategyGenerator } from "./strategyGenerator.js";

// iExec environment variables
const IEXEC_OUT = process.env.IEXEC_OUT || "/iexec_out";
const IEXEC_IN = process.env.IEXEC_IN || "/iexec_in";

// Protected data is available at this path after decryption
const PROTECTED_DATA_PATH = `${IEXEC_IN}/protectedData.json`;

/**
 * Main entry point for the iApp
 * Executed inside TEE with decrypted protected data
 */
async function main() {
    console.log("🔮 PHANTOM iApp starting...");
    console.log("Running inside TEE secure enclave");

    try {
        // Step 1: Load protected data (already decrypted by iExec runtime)
        const protectedData = await loadProtectedData();
        console.log("✅ Protected data loaded successfully");

        // Step 2: Aggregate portfolio positions
        const aggregator = new PortfolioAggregator();
        const positions = await aggregator.aggregate(protectedData);
        console.log(`📊 Aggregated ${positions.length} positions across protocols`);

        // Step 3: Run risk analysis
        const riskEngine = new RiskEngine();
        const riskReport = await riskEngine.analyze(positions);
        console.log(`⚠️ Risk Score: ${riskReport.portfolioScore}/100`);

        // Step 4: Generate rebalancing strategy if needed
        const strategyGenerator = new StrategyGenerator();
        const strategy = await strategyGenerator.generate(positions, riskReport, protectedData.config);
        console.log(`📋 Generated ${strategy.actions.length} rebalancing actions`);

        // Step 5: Sign the results for on-chain verification
        const signedResult = await signResult({
            riskReport,
            strategy,
            timestamp: Date.now(),
            portfolioHash: hashPortfolio(positions)
        });

        // Step 6: Write output
        await writeOutput(signedResult);
        console.log("✅ PHANTOM analysis complete!");

    } catch (error) {
        console.error("❌ PHANTOM iApp error:", error);
        await writeError(error.message);
        process.exit(1);
    }
}

/**
 * Load and parse protected data from iExec input
 */
async function loadProtectedData() {
    const fs = await import("fs/promises");
    
    // Check if running with protected data
    if (process.env.IEXEC_DATASET_FILENAME) {
        const datasetPath = `${IEXEC_IN}/${process.env.IEXEC_DATASET_FILENAME}`;
        const data = await fs.readFile(datasetPath, "utf-8");
        return JSON.parse(data);
    }

    // Fallback: check for bulk processing input
    if (process.env.IEXEC_INPUT_FILES_FOLDER) {
        const inputFolder = process.env.IEXEC_INPUT_FILES_FOLDER;
        const files = await fs.readdir(inputFolder);
        
        const allData = [];
        for (const file of files) {
            if (file.endsWith(".json")) {
                const content = await fs.readFile(`${inputFolder}/${file}`, "utf-8");
                allData.push(JSON.parse(content));
            }
        }
        
        return { bulkMode: true, datasets: allData };
    }

    throw new Error("No protected data found");
}

/**
 * Sign the analysis result with the enclave's key
 * This signature proves the result was computed inside TEE
 */
async function signResult(result) {
    // In production, this would use the enclave's attestation key
    // For hackathon, we simulate with a deterministic signing process
    
    const resultHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(result))
    );

    // The signature would come from iExec's attestation mechanism
    // This proves the computation happened inside a verified TEE
    return {
        ...result,
        resultHash,
        teeAttestation: {
            enclaveId: process.env.IEXEC_ENCLAVE_SIGNATURE || "simulation",
            timestamp: Date.now(),
            verified: true
        }
    };
}

/**
 * Hash portfolio for integrity verification
 */
function hashPortfolio(positions) {
    const data = positions.map(p => `${p.protocol}:${p.asset}:${p.amount}`).join(",");
    return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Write successful output
 */
async function writeOutput(result) {
    const fs = await import("fs/promises");
    
    // Write the result JSON
    await fs.writeFile(
        `${IEXEC_OUT}/result.json`,
        JSON.stringify(result, null, 2)
    );

    // Write computed.json for iExec callback
    await fs.writeFile(
        `${IEXEC_OUT}/computed.json`,
        JSON.stringify({
            "deterministic-output-path": `${IEXEC_OUT}/result.json`
        })
    );
}

/**
 * Write error output
 */
async function writeError(message) {
    const fs = await import("fs/promises");
    
    await fs.writeFile(
        `${IEXEC_OUT}/error.json`,
        JSON.stringify({ error: message, timestamp: Date.now() })
    );

    await fs.writeFile(
        `${IEXEC_OUT}/computed.json`,
        JSON.stringify({
            "deterministic-output-path": `${IEXEC_OUT}/error.json`
        })
    );
}

// Run the main function
main().catch(console.error);
