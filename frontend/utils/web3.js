import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses (will be set from environment variables)
const TICKET_NFT_ADDRESS = process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS;
const SALE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_SALE_MANAGER_ADDRESS;

// Contract ABIs (simplified for demo)
const TICKET_NFT_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function uri(uint256 id) view returns (string)",
  "function createEvent(uint256 eventId, string name, string description, uint256 date, string location) external",
  "function mintTo(address to, uint256 eventId, uint256[] calldata serials) external",
  "function checkIn(uint256 tokenId) external",
  "function events(uint256 eventId) view returns (string name, string description, uint256 date, string location, bool active)",
  "function usedTickets(uint256 eventId, uint256 serial) view returns (bool)"
];

const SALE_MANAGER_ABI = [
  "function createSale(uint256 eventId, uint256 price, uint256 cap, uint256 startTime, uint256 endTime) external",
  "function mint(uint256 eventId, uint256 amount) external payable",
  "function checkIn(uint256 tokenId) external",
  "function refund(uint256 eventId, uint256 tokenId) external",
  "function withdrawProceeds(address payable to) external",
  "function getSaleInfo(uint256 eventId) view returns (uint256 eventId, uint256 price, uint256 cap, uint256 sold, bool active, uint256 startTime, uint256 endTime)",
  "function canMint(uint256 eventId, address user, uint256 amount) view returns (bool canMint, string reason)"
];

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Web3 connection
  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        // Get network info
        const network = await provider.getNetwork();
        setNetwork(network);
        
        // Check if already connected
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          setSigner(signer);
          setAccount(accounts[0].address);
        }
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    } catch (err) {
      console.error('Error initializing Web3:', err);
      setError('Failed to initialize Web3 connection');
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setNetwork(network);
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setError(null);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainId) => {
    // Reload the page to update network
    window.location.reload();
  };

  // Contract interaction functions
  const getTicketNFTContract = () => {
    if (!signer || !TICKET_NFT_ADDRESS) {
      throw new Error('Signer or contract address not available');
    }
    return new ethers.Contract(TICKET_NFT_ADDRESS, TICKET_NFT_ABI, signer);
  };

  const getSaleManagerContract = () => {
    if (!signer || !SALE_MANAGER_ADDRESS) {
      throw new Error('Signer or contract address not available');
    }
    return new ethers.Contract(SALE_MANAGER_ADDRESS, SALE_MANAGER_ABI, signer);
  };

  // Ticket functions
  const getUserTickets = async () => {
    try {
      const contract = getTicketNFTContract();
      // TODO: Implement ticket loading logic
      // This would query the contract for user's tickets
      return [];
    } catch (err) {
      console.error('Error getting user tickets:', err);
      throw err;
    }
  };

  const createEvent = async (eventId, name, description, date, location) => {
    try {
      const contract = getTicketNFTContract();
      const tx = await contract.createEvent(eventId, name, description, date, location);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  const mintTickets = async (eventId, amount, price) => {
    try {
      const contract = getSaleManagerContract();
      const tx = await contract.mint(eventId, amount, { value: price });
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error minting tickets:', err);
      throw err;
    }
  };

  const checkInTicket = async (tokenId) => {
    try {
      const contract = getSaleManagerContract();
      const tx = await contract.checkIn(tokenId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error checking in ticket:', err);
      throw err;
    }
  };

  const createSale = async (eventId, price, cap, startTime, endTime) => {
    try {
      const contract = getSaleManagerContract();
      const tx = await contract.createSale(eventId, price, cap, startTime, endTime);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Error creating sale:', err);
      throw err;
    }
  };

  const getSaleInfo = async (eventId) => {
    try {
      const contract = getSaleManagerContract();
      return await contract.getSaleInfo(eventId);
    } catch (err) {
      console.error('Error getting sale info:', err);
      throw err;
    }
  };

  const canMint = async (eventId, amount) => {
    try {
      const contract = getSaleManagerContract();
      return await contract.canMint(eventId, account, amount);
    } catch (err) {
      console.error('Error checking if can mint:', err);
      throw err;
    }
  };

  const value = {
    // State
    account,
    provider,
    signer,
    network,
    loading,
    error,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Contract functions
    getUserTickets,
    createEvent,
    mintTickets,
    checkInTicket,
    createSale,
    getSaleInfo,
    canMint,
    
    // Contract getters
    getTicketNFTContract,
    getSaleManagerContract
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
