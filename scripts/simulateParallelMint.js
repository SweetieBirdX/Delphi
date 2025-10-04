const { ethers } = require("hardhat");

/**
 * Simulate parallel minting to demonstrate Monad's capabilities
 * This script sends multiple mint transactions simultaneously
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
  const numSigners = Math.min(signers.length, 10); // Use up to 10 signers
  
  console.log(`👥 Using ${numSigners} accounts for parallel minting`);
  
  // Configuration
  const eventId = 1;
  const ticketsPerAccount = 5;
  const mintPrice = ethers.parseEther("0.01");
  const totalCost = mintPrice * BigInt(ticketsPerAccount);
  
  console.log(`💰 Each account will mint ${ticketsPerAccount} tickets at ${ethers.formatEther(mintPrice)} ETH each`);
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
  
  for (let i = 0; i < numSigners; i++) {
    const signer = signers[i];
    const balance = await signer.provider.getBalance(signer.address);
    
    if (balance < totalCost) {
      console.log(`⚠️  Account ${i} (${signer.address}) has insufficient balance: ${ethers.formatEther(balance)} ETH`);
      continue;
    }
    
    try {
      const tx = await saleManager.connect(signer).mint(eventId, ticketsPerAccount, {
        value: totalCost
      });
      transactions.push({
        signer: signer.address,
        tx: tx,
        index: i
      });
      console.log(`📝 Transaction ${i + 1} sent: ${tx.hash}`);
    } catch (error) {
      console.log(`❌ Transaction ${i + 1} failed:`, error.message);
    }
  }
  
  console.log(`\n⏱️  Sent ${transactions.length} transactions in ${Date.now() - startTime}ms`);
  
  // Wait for all transactions to be mined
  console.log("⏳ Waiting for transactions to be mined...");
  const results = [];
  
  for (const { signer, tx, index } of transactions) {
    try {
      const receipt = await tx.wait();
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
        transactionHash: receipt.hash
      });
      
      console.log(`✅ Transaction ${index + 1} confirmed in block ${receipt.blockNumber}`);
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
  
  console.log("\n📊 Simulation Results:");
  console.log("======================");
  console.log(`✅ Successful transactions: ${successfulTxs.length}`);
  console.log(`❌ Failed transactions: ${failedTxs.length}`);
  console.log(`⏱️  Total time: ${Date.now() - startTime}ms`);
  console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
  console.log(`⛽ Average gas price: ${avgGasPrice.toFixed(2)} gwei`);
  
  if (successfulTxs.length > 0) {
    const totalTicketsMinted = successfulTxs.length * ticketsPerAccount;
    const totalCost = ethers.formatEther(mintPrice * BigInt(totalTicketsMinted));
    console.log(`🎫 Total tickets minted: ${totalTicketsMinted}`);
    console.log(`💰 Total cost: ${totalCost} ETH`);
    
    // Check final sale status
    const finalSaleInfo = await saleManager.getSaleInfo(eventId);
    console.log(`📊 Final sale status: ${finalSaleInfo.sold}/${finalSaleInfo.cap} tickets sold`);
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
