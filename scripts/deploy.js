const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Delphi NFT Ticketing System deployment...");
  
  // Get the contract factories
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const SaleManager = await ethers.getContractFactory("SaleManager");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // Deploy TicketNFT contract
  console.log("🎫 Deploying TicketNFT contract...");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();
  const ticketNFTAddress = await ticketNFT.getAddress();
  console.log("✅ TicketNFT deployed to:", ticketNFTAddress);
  
  // Deploy SaleManager contract
  console.log("💼 Deploying SaleManager contract...");
  const saleManager = await SaleManager.deploy(ticketNFTAddress);
  await saleManager.waitForDeployment();
  const saleManagerAddress = await saleManager.getAddress();
  console.log("✅ SaleManager deployed to:", saleManagerAddress);
  
  // Grant roles
  console.log("🔐 Setting up roles...");
  const ORGANIZER_ROLE = await ticketNFT.ORGANIZER_ROLE();
  const VERIFIER_ROLE = await ticketNFT.VERIFIER_ROLE();
  
  // Grant SaleManager organizer role on TicketNFT
  await ticketNFT.grantRole(ORGANIZER_ROLE, saleManagerAddress);
  console.log("✅ Granted ORGANIZER_ROLE to SaleManager");
  
  // Grant verifier role to deployer (for testing)
  await ticketNFT.grantRole(VERIFIER_ROLE, deployer.address);
  await saleManager.grantRole(VERIFIER_ROLE, deployer.address);
  console.log("✅ Granted VERIFIER_ROLE to deployer");
  
  // Create a sample event
  console.log("🎪 Creating sample event...");
  const eventId = 1;
  const eventName = "Monad Blockchain Conference 2024";
  const eventDescription = "The future of parallel EVM execution";
  const eventDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  const eventLocation = "Monad Labs, San Francisco";
  
  await ticketNFT.createEvent(
    eventId,
    eventName,
    eventDescription,
    eventDate,
    eventLocation
  );
  console.log("✅ Sample event created:", eventName);
  
  // Create a sample sale
  console.log("💰 Creating sample sale...");
  const salePrice = ethers.parseEther("0.01"); // 0.01 ETH
  const saleCap = 1000;
  const saleStartTime = Math.floor(Date.now() / 1000) + (1 * 24 * 60 * 60); // 1 day from now
  const saleEndTime = Math.floor(Date.now() / 1000) + (29 * 24 * 60 * 60); // 29 days from now
  
  await saleManager.createSale(
    eventId,
    salePrice,
    saleCap,
    saleStartTime,
    saleEndTime
  );
  console.log("✅ Sample sale created:", {
    price: ethers.formatEther(salePrice),
    cap: saleCap,
    startTime: new Date(saleStartTime * 1000).toISOString(),
    endTime: new Date(saleEndTime * 1000).toISOString()
  });
  
  // Print deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("====================");
  console.log("📝 Deployer:", deployer.address);
  console.log("🎫 TicketNFT:", ticketNFTAddress);
  console.log("💼 SaleManager:", saleManagerAddress);
  console.log("🎪 Event ID:", eventId);
  console.log("💰 Sale Price:", ethers.formatEther(salePrice), "ETH");
  console.log("📊 Sale Cap:", saleCap, "tickets");
  
  // Generate frontend .env.local content
  console.log("\n📋 Frontend .env.local Configuration:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_TICKET_NFT_ADDRESS=${ticketNFTAddress}`);
  console.log(`NEXT_PUBLIC_SALE_MANAGER_ADDRESS=${saleManagerAddress}`);
  console.log(`NEXT_PUBLIC_NETWORK_NAME=${hre.network.name}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${hre.network.config.chainId}`);
  
  if (hre.network.name === "monad") {
    console.log(`NEXT_PUBLIC_MONAD_RPC_URL=${process.env.MONAD_RPC_URL}`);
  } else if (hre.network.name === "sepolia") {
    console.log(`NEXT_PUBLIC_ETH_RPC_URL=${process.env.ETH_RPC_URL}`);
  } else {
    console.log(`NEXT_PUBLIC_RPC_URL=${hre.network.config.url || "http://localhost:8545"}`);
  }
  
  console.log("\n🚀 Deployment completed successfully!");
  console.log("💡 Copy the frontend configuration above to your .env.local file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
