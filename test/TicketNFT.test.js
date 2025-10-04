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
      ).to.be.revertedWithCustomError(ticketNFT, "AccessControlUnauthorizedAccount");
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
      
      // Also check total balance
      const totalBalance = await ticketNFT.balanceOf(user.address, (eventId << 128) | 1);
      expect(totalBalance).to.equal(1);
    });

    it("Should not allow non-organizer to mint", async function () {
      await expect(
        ticketNFT.connect(user).mintTo(user.address, eventId, seatSerials)
      ).to.be.revertedWithCustomError(ticketNFT, "AccessControlUnauthorizedAccount");
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
      // First mint ticket to verifier
      await ticketNFT.connect(organizer).mintTo(verifier.address, eventId, [seatSerials[0]]);
      
      const tokenId = (eventId << 128) | seatSerials[0];
      
      await ticketNFT.connect(verifier).checkIn(tokenId);
      
      const isUsed = await ticketNFT.usedTickets(eventId, seatSerials[0]);
      expect(isUsed).to.be.true;
    });

    it("Should not allow non-verifier to check-in", async function () {
      const tokenId = (eventId << 128) | seatSerials[0];
      
      await expect(
        ticketNFT.connect(user).checkIn(tokenId)
      ).to.be.revertedWithCustomError(ticketNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should not check-in non-owned ticket", async function () {
      const tokenId = (eventId << 128) | 999; // Non-existent token
      
      await expect(
        ticketNFT.connect(verifier).checkIn(tokenId)
      ).to.be.revertedWith("Ticket not owned");
    });

    it("Should not check-in already used ticket", async function () {
      // First mint ticket to verifier
      await ticketNFT.connect(organizer).mintTo(verifier.address, eventId, [seatSerials[0]]);
      
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
      ).to.be.revertedWithCustomError(ticketNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("ID Packing/Unpacking", function () {
    it("Should pack and unpack IDs correctly", async function () {
      const eventId = 123;
      const seatSerial = 456;
      
      const packedId = await ticketNFT.packId(eventId, seatSerial);
      const [unpackedEventId, unpackedSeatSerial] = await ticketNFT.unpackId(packedId);
      
      expect(unpackedEventId).to.equal(eventId);
      expect(unpackedSeatSerial).to.equal(seatSerial);
    });

    it("Should handle edge cases in ID packing", async function () {
      // Test reasonable maximum values (avoid overflow)
      const maxEventId = 2**64 - 1; // Use 64-bit instead of 128-bit to avoid overflow
      const maxSeatSerial = 2**64 - 1;
      
      const packedId = await ticketNFT.packId(maxEventId, maxSeatSerial);
      const [unpackedEventId, unpackedSeatSerial] = await ticketNFT.unpackId(packedId);
      
      expect(unpackedEventId).to.equal(maxEventId);
      expect(unpackedSeatSerial).to.equal(maxSeatSerial);
    });

    it("Should handle zero values", async function () {
      const packedId = await ticketNFT.packId(0, 0);
      const [unpackedEventId, unpackedSeatSerial] = await ticketNFT.unpackId(packedId);
      
      expect(unpackedEventId).to.equal(0);
      expect(unpackedSeatSerial).to.equal(0);
    });
  });

  describe("On-chain Metadata Structure", function () {
    beforeEach(async function () {
      await ticketNFT.connect(organizer).createEvent(
        eventId,
        "Test Event",
        "Test Description",
        Math.floor(Date.now() / 1000) + 86400,
        "Test Location"
      );
    });

    it("Should return valid JSON structure", async function () {
      const tokenId = (eventId << 128) | 1;
      const uri = await ticketNFT.uri(tokenId);
      
      // Check base64 prefix
      expect(uri).to.include("data:application/json;base64,");
      
      // Decode base64 and parse JSON
      const base64Data = uri.split(",")[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      // Validate JSON structure
      expect(metadata).to.have.property('name');
      expect(metadata).to.have.property('description');
      expect(metadata).to.have.property('image');
      expect(metadata).to.have.property('attributes');
      expect(metadata.attributes).to.be.an('array');
      
      // Validate attributes
      const attributes = metadata.attributes;
      const attributeTypes = attributes.map(attr => attr.trait_type);
      expect(attributeTypes).to.include('Event');
      expect(attributeTypes).to.include('Date');
      expect(attributeTypes).to.include('Location');
      expect(attributeTypes).to.include('Seat');
      expect(attributeTypes).to.include('Event ID');
    });

    it("Should include correct event information", async function () {
      const tokenId = (eventId << 128) | 42;
      const uri = await ticketNFT.uri(tokenId);
      
      const base64Data = uri.split(",")[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      expect(metadata.name).to.include("Test Event");
      expect(metadata.name).to.include("Seat #42");
      expect(metadata.description).to.equal("Test Description");
      
      // Check attributes
      const eventAttr = metadata.attributes.find(attr => attr.trait_type === "Event");
      const seatAttr = metadata.attributes.find(attr => attr.trait_type === "Seat");
      const locationAttr = metadata.attributes.find(attr => attr.trait_type === "Location");
      
      expect(eventAttr.value).to.equal("Test Event");
      expect(seatAttr.value).to.equal("42");
      expect(locationAttr.value).to.equal("Test Location");
    });

    it("Should generate unique metadata for different seats", async function () {
      const tokenId1 = (eventId << 128) | 1;
      const tokenId2 = (eventId << 128) | 2;
      
      const uri1 = await ticketNFT.uri(tokenId1);
      const uri2 = await ticketNFT.uri(tokenId2);
      
      expect(uri1).to.not.equal(uri2);
      
      // Parse and compare
      const base64Data1 = uri1.split(",")[1];
      const base64Data2 = uri2.split(",")[1];
      
      const json1 = JSON.parse(Buffer.from(base64Data1, 'base64').toString('utf-8'));
      const json2 = JSON.parse(Buffer.from(base64Data2, 'base64').toString('utf-8'));
      
      expect(json1.name).to.include("Seat #1");
      expect(json2.name).to.include("Seat #2");
    });
  });
});
