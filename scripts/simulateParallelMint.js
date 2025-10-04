const { ethers } = require("hardhat");

/**
 * Simulate parallel minting to demonstrate Monad's capabilities
 * This script sends 300+ mint transactions simultaneously
 */
async function main() {
  console.log("🧪 Starting parallel mint simulation...");
  
  // Get contract addresses from deployment
  const ticketNFTAddress = process.env.TICKET_NFT_ADDRESS;
  const saleManagerAddress = process.env.SALE_MANAGER_ADDRESS;
  
  if (!ticketNFTAddress || !saleManagerAddress) {
    console.error("❌ Contract addresses not found. Please set TICKET_NFT_ADDRESS and SALE_MANAGER_ADDRESS environment variables.");
    process.exit(1);
  }
  
  // Get contracts
  const saleManager = await ethers.getContractAt("SaleManager", saleManagerAddress);
  const ticketNFT = await ethers.getContractAt("TicketNFT", ticketNFTAddress);
  
  // Get signers
  const signers = await ethers.getSigners();
  const numSigners = Math.min(signers.length, 50); // Use up to 50 signers
  
  console.log(`👥 Using ${numSigners} accounts for parallel minting`);
  
  // Configuration
  const eventId = 1;
  const ticketsPerAccount = 1; // 1 ticket per account for better parallel simulation
  const mintPrice = ethers.parseEther("0.01");
  const totalCost = mintPrice * BigInt(ticketsPerAccount);
  
  console.log(`💰 Each account will mint ${ticketsPerAccount} ticket at ${ethers.formatEther(mintPrice)} ETH`);
  console.log(`💸 Total cost per account: ${ethers.formatEther(totalCost)} ETH`);
  
  // Check if sale is active
  const saleInfo = await saleManager.getSaleInfo(eventId);
  if (!saleInfo.active) {
    console.error("❌ Sale is not active");
    process.exit(1);
  }
  
  console.log(`📊 Sale info: ${saleInfo.sold}/${saleInfo.cap} tickets sold`);
  
  // Prepare parallel transactions
  const transactions = [];
  const startTime = Date.now();
  
  console.log("🚀 Sending parallel mint transactions...");
  
  // Create multiple transactions per signer to reach 300+ total
  const transactionsPerSigner = Math.ceil(300 / numSigners);
  
  for (let i = 0; i < numSigners; i++) {
    const signer = signers[i];
    const balance = await signer.provider.getBalance(signer.address);
    
    if (balance < totalCost * BigInt(transactionsPerSigner)) {
      console.log(`⚠️  Account ${i} (${signer.address}) has insufficient balance: ${ethers.formatEther(balance)} ETH`);
      continue;
    }
    
    // Create multiple transactions for this signer
    for (let j = 0; j < transactionsPerSigner; j++) {
      try {
        const tx = await saleManager.connect(signer).mint(eventId, ticketsPerAccount, {
          value: totalCost
        });
        transactions.push({
          signer: signer.address,
          tx: tx,
          index: transactions.length,
          signerIndex: i,
          transactionIndex: j
        });
        console.log(`📝 Transaction ${transactions.length} sent: ${tx.hash}`);
      } catch (error) {
        console.log(`❌ Transaction ${transactions.length + 1} failed:`, error.message);
      }
    }
  }
  
  console.log(`\n⏱️  Sent ${transactions.length} transactions in ${Date.now() - startTime}ms`);
  
  // Wait for all transactions to be mined
  console.log("⏳ Waiting for transactions to be mined...");
  const results = [];
  const latencies = [];
  
  for (const { signer, tx, index } of transactions) {
    try {
      const txStartTime = Date.now();
      const receipt = await tx.wait();
      const txEndTime = Date.now();
      const latency = txEndTime - txStartTime;
      
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.gasPrice;
      const totalGasCost = gasUsed * gasPrice;
      
      results.push({
        signer,
        success: true,
        gasUsed: gasUsed.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        totalCost: ethers.formatEther(totalGasCost),
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.hash,
        latency: latency
      });
      
      latencies.push(latency);
      
      console.log(`✅ Transaction ${index + 1} confirmed in block ${receipt.blockNumber} (${latency}ms)`);
    } catch (error) {
      results.push({
        signer,
        success: false,
        error: error.message
      });
      console.log(`❌ Transaction ${index + 1} failed:`, error.message);
    }
  }
  
  // Calculate statistics
  const successfulTxs = results.filter(r => r.success);
  const failedTxs = results.filter(r => !r.success);
  const totalGasUsed = successfulTxs.reduce((sum, r) => sum + BigInt(r.gasUsed), 0n);
  const avgGasPrice = successfulTxs.reduce((sum, r) => sum + parseFloat(r.gasPrice), 0) / successfulTxs.length;
  
  // Calculate latency statistics
  const sortedLatencies = latencies.sort((a, b) => a - b);
  const p50Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
  const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
  const p99Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  
  const successRate = (successfulTxs.length / transactions.length) * 100;
  
  console.log("\n📊 Simulation Results:");
  console.log("======================");
  console.log(`✅ Successful transactions: ${successfulTxs.length}`);
  console.log(`❌ Failed transactions: ${failedTxs.length}`);
  console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
  console.log(`⏱️  Total time: ${Date.now() - startTime}ms`);
  console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
  console.log(`⛽ Average gas price: ${avgGasPrice.toFixed(2)} gwei`);
  
  console.log("\n📊 Latency Statistics:");
  console.log("=====================");
  console.log(`⏱️  Average latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`⏱️  P50 latency: ${p50Latency}ms`);
  console.log(`⏱️  P95 latency: ${p95Latency}ms`);
  console.log(`⏱️  P99 latency: ${p99Latency}ms`);
  
  if (successfulTxs.length > 0) {
    const totalTicketsMinted = successfulTxs.length * ticketsPerAccount;
    const totalCost = ethers.formatEther(mintPrice * BigInt(totalTicketsMinted));
    console.log(`🎫 Total tickets minted: ${totalTicketsMinted}`);
    console.log(`💰 Total cost: ${totalCost} ETH`);
    
    // Check final sale status
    const finalSaleInfo = await saleManager.getSaleInfo(eventId);
    console.log(`📊 Final sale status: ${finalSaleInfo.sold}/${finalSaleInfo.cap} tickets sold`);
  }
  
  // Performance validation
  if (successRate >= 99) {
    console.log("\n✅ Performance Target Met:");
    console.log(`   Success rate: ${successRate.toFixed(2)}% >= 99%`);
    console.log(`   P95 latency: ${p95Latency}ms`);
  } else {
    console.log("\n⚠️  Performance Target Not Met:");
    console.log(`   Success rate: ${successRate.toFixed(2)}% < 99%`);
  }
  
  // Network comparison (if not on Monad)
  if (hre.network.name !== "monad") {
    console.log("\n💡 Performance Note:");
    console.log("This simulation was run on", hre.network.name);
    console.log("On Monad blockchain, these transactions would execute in parallel,");
    console.log("resulting in significantly faster confirmation times and lower gas costs.");
  }
  
  console.log("\n🎉 Parallel mint simulation completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Simulation failed:", error);
    process.exit(1);
  });
