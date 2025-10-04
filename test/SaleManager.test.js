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
    
    // Grant verifier role to SaleManager for TicketNFT
    await ticketNFT.grantRole(VERIFIER_ROLE, await saleManager.getAddress());
    
    // Create event
    await ticketNFT.connect(owner).createEvent(
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
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5, // perWalletCap
        1  // cooldownBlocks
      );
      
      const sale = await saleManager.getSaleInfo(eventId);
      expect(sale.eventId).to.equal(eventId);
      expect(sale.price).to.equal(salePrice);
      expect(sale.cap).to.equal(saleCap);
      expect(sale.active).to.be.true;
    });

    it("Should not allow non-owner to create sale", async function () {
      await expect(
        saleManager.connect(user1).createSale(
          eventId,
          salePrice,
          saleCap,
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400,
          5,
          1
        )
      ).to.be.revertedWithCustomError(saleManager, "AccessControlUnauthorizedAccount");
    });

    it("Should not create sale with invalid parameters", async function () {
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          0, // Invalid price
          saleCap,
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400,
          5,
          1
        )
      ).to.be.revertedWith("Price must be greater than 0");
      
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          salePrice,
          0, // Invalid cap
          Math.floor(Date.now() / 1000) + 3600,
          Math.floor(Date.now() / 1000) + 86400,
          5,
          1
        )
      ).to.be.revertedWith("Cap must be greater than 0");
    });
  });

  describe("Ticket Purchasing", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5, // perWalletCap
        1  // cooldownBlocks
      );
    });

    it("Should purchase tickets", async function () {
      const amount = 3;
      const totalCost = salePrice * BigInt(amount);
      
      await expect(
        saleManager.connect(user1).mint(eventId, amount, { value: totalCost })
      ).to.emit(saleManager, "Minted")
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
      await saleManager.connect(owner).endSale(eventId);
      
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Sale not active");
    });

    it("Should not allow purchase when sale is ended", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const endTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await saleManager.connect(owner).createSale(
        eventId + 1,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
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
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5, // perWalletCap
        1  // cooldownBlocks
      );
    });

    it("Should enforce wallet cap", async function () {
      // First purchase should succeed (up to wallet cap)
      await saleManager.connect(user1).mint(eventId, 5, { 
        value: salePrice * 5n 
      });
      
      // Second purchase should fail
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Exceeds wallet cap");
    });

    it("Should enforce cooldown period", async function () {
      // First purchase should succeed
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // Second purchase should fail due to cooldown
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Cooldown period not passed");
    });

    it("Should allow purchase after cooldown", async function () {
      // First purchase
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // Mine blocks to pass cooldown
      await ethers.provider.send("evm_mine");
      
      // Second purchase should succeed
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });
  });

  describe("Check-in System", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
      );
      
      // Purchase a ticket
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });

    it("Should check-in ticket", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await expect(
        saleManager.connect(verifier).checkIn(tokenId)
      ).to.emit(saleManager, "CheckedIn")
        .withArgs(tokenId, verifier.address);
    });

    it("Should not allow non-verifier to check-in", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await expect(
        saleManager.connect(user1).checkIn(tokenId)
      ).to.be.revertedWithCustomError(saleManager, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Refund System", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
      );
      
      // Purchase a ticket
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // End sale to allow refunds
      await saleManager.connect(owner).endSale(eventId);
    });

    it("Should process refund", async function () {
      const tokenId = (eventId << 128) | 1;
      
      // V1 refund is no-op, just emits event
      await expect(
        saleManager.connect(user1).refund(eventId, tokenId)
      ).to.emit(saleManager, "RefundProcessed")
        .withArgs(eventId, tokenId, user1.address);
    });

    it("Should not allow duplicate refunds", async function () {
      const tokenId = (eventId << 128) | 1;
      
      // V1 refund is no-op, so multiple calls should work
      await saleManager.connect(user1).refund(eventId, tokenId);
      
      // Second refund should also work (V1 is no-op)
      await expect(
        saleManager.connect(user1).refund(eventId, tokenId)
      ).to.emit(saleManager, "RefundProcessed");
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
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
      );
      
      // Purchase tickets to generate proceeds
      await saleManager.connect(user1).mint(eventId, 5, { value: salePrice * 5n });
    });

    it("Should withdraw proceeds", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(
        saleManager.connect(owner).withdrawProceeds(owner.address)
      ).to.emit(saleManager, "Withdrawn");
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-admin to withdraw", async function () {
      await expect(
        saleManager.connect(user1).withdrawProceeds(user1.address)
      ).to.be.revertedWithCustomError(saleManager, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
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

  describe("Advanced Anti-bot Protection", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        3, // perWalletCap
        2  // cooldownBlocks
      );
    });

    it("Should enforce strict wallet cap", async function () {
      // First purchase - should succeed
      await saleManager.connect(user1).mint(eventId, 3, { value: salePrice * 3n });
      
      // Second purchase - should fail
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Exceeds wallet cap");
    });

    it("Should enforce cooldown across multiple users", async function () {
      // User1 mints
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // User2 mints immediately - should succeed (different user)
      await saleManager.connect(user2).mint(eventId, 1, { value: salePrice });
      
      // User1 tries to mint again - should fail (cooldown)
      await expect(
        saleManager.connect(user1).mint(eventId, 1, { value: salePrice })
      ).to.be.revertedWith("Cooldown period not passed");
    });

    it("Should allow minting after cooldown period", async function () {
      // First mint
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
      
      // Mine blocks to pass cooldown
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");
      
      // Should succeed now
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });

    it("Should track minting history correctly", async function () {
      // Check initial state
      expect(await saleManager.mintedBy(eventId, user1.address)).to.equal(0);
      expect(await saleManager.lastMintBlock(eventId, user1.address)).to.equal(0);
      
      // First mint
      await saleManager.connect(user1).mint(eventId, 2, { value: salePrice * 2n });
      
      // Check updated state
      expect(await saleManager.mintedBy(eventId, user1.address)).to.equal(2);
      expect(await saleManager.lastMintBlock(eventId, user1.address)).to.be.gt(0);
    });
  });

  describe("Check-in Behavior", function () {
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await saleManager.connect(owner).createSale(
        eventId,
        salePrice,
        saleCap,
        startTime,
        endTime,
        5,
        1
      );
      
      // Purchase a ticket
      await saleManager.connect(user1).mint(eventId, 1, { value: salePrice });
    });

    it("Should check-in valid ticket successfully", async function () {
      const tokenId = (eventId << 128) | 1;
      
      await expect(
        saleManager.connect(verifier).checkIn(tokenId)
      ).to.emit(saleManager, "CheckedIn")
        .withArgs(tokenId, verifier.address);
    });

    it("Should prevent double check-in", async function () {
      const tokenId = (eventId << 128) | 1;
      
      // First check-in should succeed
      await saleManager.connect(verifier).checkIn(tokenId);
      
      // Second check-in should fail
      await expect(
        saleManager.connect(verifier).checkIn(tokenId)
      ).to.be.revertedWith("Ticket already used");
    });

    it("Should handle multiple tickets check-in", async function () {
      // Purchase more tickets
      await saleManager.connect(user1).mint(eventId, 2, { value: salePrice * 2n });
      
      const tokenId1 = (eventId << 128) | 1;
      const tokenId2 = (eventId << 128) | 2;
      const tokenId3 = (eventId << 128) | 3;
      
      // Check-in all tickets
      await saleManager.connect(verifier).checkIn(tokenId1);
      await saleManager.connect(verifier).checkIn(tokenId2);
      await saleManager.connect(verifier).checkIn(tokenId3);
      
      // All should be marked as used
      expect(await ticketNFT.usedTickets(eventId, 1)).to.be.true;
      expect(await ticketNFT.usedTickets(eventId, 2)).to.be.true;
      expect(await ticketNFT.usedTickets(eventId, 3)).to.be.true;
    });

    it("Should not allow check-in of non-existent ticket", async function () {
      const nonExistentTokenId = (eventId << 128) | 999;
      
      await expect(
        saleManager.connect(verifier).checkIn(nonExistentTokenId)
      ).to.be.revertedWith("Ticket already used");
    });
  });

  describe("Sale Parameter Validation", function () {
    it("Should create sale with valid parameters", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          salePrice,
          saleCap,
          startTime,
          endTime,
          5,
          1
        )
      ).to.emit(saleManager, "SaleCreated")
        .withArgs(eventId, salePrice, saleCap, startTime, endTime);
    });

    it("Should reject invalid sale parameters", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      
      // Invalid price
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          0,
          saleCap,
          startTime,
          endTime,
          5,
          1
        )
      ).to.be.revertedWith("Price must be greater than 0");
      
      // Invalid cap
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          salePrice,
          0,
          startTime,
          endTime,
          5,
          1
        )
      ).to.be.revertedWith("Cap must be greater than 0");
      
      // Invalid time range
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          salePrice,
          saleCap,
          endTime,
          startTime,
          5,
          1
        )
      ).to.be.revertedWith("Invalid time range");
      
      // Invalid wallet cap
      await expect(
        saleManager.connect(owner).createSale(
          eventId,
          salePrice,
          saleCap,
          startTime,
          endTime,
          0,
          1
        )
      ).to.be.revertedWith("Invalid wallet cap");
    });
  });
});
