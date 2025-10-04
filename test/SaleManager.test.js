const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SaleManager", function () {
  let ticketNFT;
  let saleManager;
  let owner;
  let organizer;
  let verifier;
  let user1;
  let user2;
  let eventId = 1;
  let salePrice;
  let saleCap = 100;

  beforeEach(async function () {
    [owner, organizer, verifier, user1, user2] = await ethers.getSigners();
    
    // Deploy TicketNFT
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy();
    await ticketNFT.waitForDeployment();
    
    // Deploy SaleManager
    const SaleManager = await ethers.getContractFactory("SaleManager");
    saleManager = await SaleManager.deploy(await ticketNFT.getAddress());
    await saleManager.waitForDeployment();
    
    // Grant roles
    const ORGANIZER_ROLE = await ticketNFT.ORGANIZER_ROLE();
    const VERIFIER_ROLE = await ticketNFT.VERIFIER_ROLE();
    const SALE_ORGANIZER_ROLE = await saleManager.ORGANIZER_ROLE();
    const SALE_VERIFIER_ROLE = await saleManager.VERIFIER_ROLE();
    
    await ticketNFT.grantRole(ORGANIZER_ROLE, await saleManager.getAddress());
    await ticketNFT.grantRole(VERIFIER_ROLE, verifier.address);
    await saleManager.grantRole(SALE_ORGANIZER_ROLE, organizer.address);
    await saleManager.grantRole(SALE_VERIFIER_ROLE, verifier.address);
    
    // Create event
    await ticketNFT.connect(organizer).createEvent(
      eventId,
      "Test Event",
      "Description",
      Math.floor(Date.now() / 1000) + 86400,
      "Location"
    );
    
    salePrice = ethers.parseEther("0.01");
  });

  describe("Sale Creation", function () {
    it("Should create a sale", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      const sale = await saleManager.getSaleInfo(eventId);
      expect(sale.eventId).to.equal(eventId);
      expect(sale.price).to.equal(salePrice);
      expect(sale.cap).to.equal(saleCap);
      expect(sale.active).to.be.true;
    });

    it("Should not allow non-organizer to create sale", async function () {
      await expect(
        saleManager.connect(user1).createSale(
          eventId,
          salePrice,
          saleCap,
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400
        )
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + await saleManager.ORGANIZER_ROLE());
    });

    it("Should not create sale with invalid parameters", async function () {
      await expect(
        saleManager.connect(organizer).createSale(
          eventId,
          0, // Invalid price
          saleCap,
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400
        )
      ).to.be.revertedWith("Price must be greater than 0");
      
      await expect(
        saleManager.connect(organizer).createSale(
          eventId,
          salePrice,
          0, // Invalid cap
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400
        )
      ).to.be.revertedWith("Cap must be greater than 0");
    });
  });

  describe("Ticket Purchasing", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
    });

    it("Should purchase tickets", async function () {
      const amount = 3;
      const totalCost = salePrice * BigInt(amount);
      
      await expect(
        saleManager.connect(user1).mint(eventId, amount, { value: totalCost })
      ).to.emit(saleManager, "TicketPurchased")
        .withArgs(user1.address, eventId, amount, totalCost);
      
      const sale = await saleManager.getSaleInfo(eventId);
      expect(sale.sold).to.equal(amount);
    });

    it("Should refund excess payment", async function () {
      const amount = 2;
      const totalCost = salePrice * BigInt(amount);
      const excessPayment = ethers.parseEther("0.01");
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await saleManager.connect(user1).mint(eventId, amount, { 
        value: totalCost + excessPayment 
      });
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      const balanceDiff = initialBalance - finalBalance;
      
      // Should only pay the exact cost
      expect(balanceDiff).to.be.closeTo(totalCost, ethers.parseEther("0.001"));
    });

    it("Should not allow purchase with insufficient payment", async function () {
      const amount = 2;
      const insufficientPayment = salePrice * BigInt(amount) - ethers.parseEther("0.001");
      
      await expect(
        saleManager.connect(user1).mint(eventId, amount, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not allow purchase when sale is not active", async function () {
      await saleManager.connect(organizer).endSale(eventId);
      
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Sale not active");
    });

    it("Should not allow purchase when sale is ended", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const endTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await saleManager.connect(organizer).createSale(
        eventId + 1,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      await expect(
        saleManager.connect(user1).mint(eventId + 1, 1, { value: salePrice })
      ).to.be.revertedWith("Sale ended");
    });
  });

  describe("Anti-bot Protection", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
    });

    it("Should enforce wallet cap", async function () {
      const perWalletCap = 2;
      await saleManager.connect(organizer).updateBotProtection(eventId, perWalletCap, 0);
      
      // First purchase should succeed
      await saleManager.connect(user1).mint(eventId, perWalletCap, { 
        value: salePrice * BigInt(perWalletCap) 
      });
      
      // Second purchase should fail
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Exceeds wallet cap");
    });

    it("Should enforce cooldown period", async function () {
      const cooldownBlocks = 5;
      await saleManager.connect(organizer).updateBotProtection(eventId, 10, cooldownBlocks);
      
      // First purchase should succeed
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // Second purchase should fail due to cooldown
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Cooldown period not passed");
    });

    it("Should allow purchase after cooldown", async function () {
      const cooldownBlocks = 1;
      await saleManager.connect(organizer).updateBotProtection(eventId, 10, cooldownBlocks);
      
      // First purchase
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // Mine blocks to pass cooldown
      for (let i = 0; i < cooldownBlocks + 1; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      // Second purchase should succeed
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });
  });

  describe("Check-in System", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      // Purchase a ticket
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });

    it("Should check-in ticket", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await expect(
        saleManager.connect(verifier).checkIn(tokenId)
      ).to.emit(saleManager, "TicketCheckedIn")
        .withArgs(tokenId, verifier.address);
    });

    it("Should not allow non-verifier to check-in", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await expect(
        saleManager.connect(user1).checkIn(tokenId)
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + await saleManager.VERIFIER_ROLE());
    });
  });

  describe("Refund System", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      // Purchase a ticket
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // End sale to allow refunds
      await saleManager.connect(organizer).endSale(eventId);
    });

    it("Should process refund", async function () {
      const tokenId = (eventId << 128) | 1;
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(
        saleManager.connect(user1).refund(eventId, tokenId)
      ).to.emit(saleManager, "RefundProcessed")
        .withArgs(eventId, tokenId, user1.address);
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow duplicate refunds", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await saleManager.connect(user1).refund(eventId, tokenId);
      
      await expect(
        saleManager.connect(user1).refund(eventId, tokenId)
      ).to.be.revertedWith("Already refunded");
    });

    it("Should not allow refund for active sale", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId + 1,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      await saleManager.connect(user1).mint(eventId + 1, 1, { value: salePrice });
      
      const tokenId = ((eventId + 1) << 128) | 1;
      
      await expect(
        saleManager.connect(user1).refund(eventId + 1, tokenId)
      ).to.be.revertedWith("Sale still active");
    });
  });

  describe("Proceeds Withdrawal", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
      
      // Purchase tickets to generate proceeds
      await saleManager.connect(user1).mint(eventId, 5, { value: salePrice * 5n });
    });

    it("Should withdraw proceeds", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(
        saleManager.connect(owner).withdrawProceeds(owner.address)
      ).to.emit(saleManager, "ProceedsWithdrawn");
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-admin to withdraw", async function () {
      await expect(
        saleManager.connect(user1).withdrawProceeds(user1.address)
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + await saleManager.DEFAULT_ADMIN_ROLE());
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(organizer).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime
      );
    });

    it("Should check if user can mint", async function () {
      const [canMint, reason] = await saleManager.canMint(eventId, user1.address, 1);
      expect(canMint).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should return false for invalid mint conditions", async function () {
      // Purchase up to wallet cap
      await saleManager.connect(user1).mint(eventId, 5, { value: salePrice * 5n });
      
      const [canMint, reason] = await saleManager.canMint(eventId, user1.address, 1);
      expect(canMint).to.be.false;
      expect(reason).to.equal("Exceeds wallet cap");
    });
  });
});
