const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketNFT", function () {
  let ticketNFT;
  let owner;
  let organizer;
  let verifier;
  let user;
  let eventId = 1;
  let seatSerials = [1, 2, 3];

  beforeEach(async function () {
    [owner, organizer, verifier, user] = await ethers.getSigners();
    
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy();
    await ticketNFT.waitForDeployment();
    
    // Grant roles
    const ORGANIZER_ROLE = await ticketNFT.ORGANIZER_ROLE();
    const VERIFIER_ROLE = await ticketNFT.VERIFIER_ROLE();
    
    await ticketNFT.grantRole(ORGANIZER_ROLE, organizer.address);
    await ticketNFT.grantRole(VERIFIER_ROLE, verifier.address);
  });

  describe("Event Management", function () {
    it("Should create an event", async function () {
      const eventName = "Test Event";
      const eventDescription = "A test event for demonstration";
      const eventDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const eventLocation = "Test Location";
      
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        eventName,
        eventDescription,
        eventDate,
        eventLocation
      );
      
      const event = await ticketNFT.events(eventId);
      expect(event.name).to.equal(eventName);
      expect(event.description).to.equal(eventDescription);
      expect(event.date).to.equal(eventDate);
      expect(event.location).to.equal(eventLocation);
      expect(event.active).to.be.true;
    });

    it("Should not allow non-organizer to create event", async function () {
      await expect(
        ticketNFT.connect(user).createEvent(
          eventId,
          "Test Event",
          "Description",
          Math.floor(Date.now() / 1000) + 86400,
          "Location"
        )
      ).to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await ticketNFT.ORGANIZER_ROLE());
    });

    it("Should not allow creating duplicate event", async function () {
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        "Test Event",
        "Description",
        Math.floor(Date.now() / 1000) + 86400,
        "Location"
      );
      
      await expect(
        ticketNFT.connect(organizer).createEvent(
          eventId,
          "Another Event",
          "Description",
          Math.floor(Date.now() / 1000) + 86400,
          "Location"
        )
      ).to.be.revertedWith("Event already exists");
    });
  });

  describe("Ticket Minting", function () {
    beforeEach(async function () {
      // Create an event first
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        "Test Event",
        "Description",
        Math.floor(Date.now() / 1000) + 86400,
        "Location"
      );
    });

    it("Should mint tickets to user", async function () {
      await ticketNFT.connect(organizer).mintTo(user.address, eventId, seatSerials);
      
      for (let i = 0; i < seatSerials.length; i++) {
        const tokenId = (eventId << 128) | seatSerials[i];
        const balance = await ticketNFT.balanceOf(user.address, tokenId);
        expect(balance).to.equal(1);
      }
    });

    it("Should not allow non-organizer to mint", async function () {
      await expect(
        ticketNFT.connect(user).mintTo(user.address, eventId, seatSerials)
      ).to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await ticketNFT.ORGANIZER_ROLE());
    });

    it("Should not mint for non-existent event", async function () {
      await expect(
        ticketNFT.connect(organizer).mintTo(user.address, 999, seatSerials)
      ).to.be.revertedWith("Event does not exist");
    });

    it("Should not mint with invalid serials", async function () {
      await expect(
        ticketNFT.connect(organizer).mintTo(user.address, eventId, [0])
      ).to.be.revertedWith("Invalid serial number");
    });
  });

  describe("Check-in System", function () {
    beforeEach(async function () {
      // Create event and mint tickets
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        "Test Event",
        "Description",
        Math.floor(Date.now() / 1000) + 86400,
        "Location"
      );
      
      await ticketNFT.connect(organizer).mintTo(user.address, eventId, seatSerials);
    });

    it("Should check-in ticket", async function () {
      const tokenId = (eventId << 128) | seatSerials[0];
      
      await ticketNFT.connect(verifier).checkIn(tokenId);
      
      const isUsed = await ticketNFT.usedTickets(eventId, seatSerials[0]);
      expect(isUsed).to.be.true;
    });

    it("Should not allow non-verifier to check-in", async function () {
      const tokenId = (eventId << 128) | seatSerials[0];
      
      await expect(
        ticketNFT.connect(user).checkIn(tokenId)
      ).to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await ticketNFT.VERIFIER_ROLE());
    });

    it("Should not check-in non-owned ticket", async function () {
      const tokenId = (eventId << 128) | 999; // Non-existent token
      
      await expect(
        ticketNFT.connect(verifier).checkIn(tokenId)
      ).to.be.revertedWith("Ticket not owned");
    });

    it("Should not check-in already used ticket", async function () {
      const tokenId = (eventId << 128) | seatSerials[0];
      
      await ticketNFT.connect(verifier).checkIn(tokenId);
      
      await expect(
        ticketNFT.connect(verifier).checkIn(tokenId)
      ).to.be.revertedWith("Ticket already used");
    });
  });

  describe("Metadata", function () {
    beforeEach(async function () {
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        "Test Event",
        "Test Description",
        Math.floor(Date.now() / 1000) + 86400,
        "Test Location"
      );
    });

    it("Should return valid metadata URI", async function () {
      const tokenId = (eventId << 128) | 1;
      const uri = await ticketNFT.uri(tokenId);
      
      expect(uri).to.include("data:application/json;base64,");
      expect(uri).to.include("Test Event");
      expect(uri).to.include("Test Description");
      expect(uri).to.include("Test Location");
    });

    it("Should not return metadata for non-existent event", async function () {
      const tokenId = (999 << 128) | 1;
      
      await expect(
        ticketNFT.uri(tokenId)
      ).to.be.revertedWith("Event does not exist");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      await ticketNFT.connect(owner).pause();
      expect(await ticketNFT.paused()).to.be.true;
      
      await ticketNFT.connect(owner).unpause();
      expect(await ticketNFT.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        ticketNFT.connect(user).pause()
      ).to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await ticketNFT.DEFAULT_ADMIN_ROLE());
    });
  });
});
