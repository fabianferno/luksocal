import { createPublicClient, createWalletClient, custom, http } from "viem";
import { luksoTestnet } from "viem/chains";

// Create public client that works on server and client
export const client = createPublicClient({
  chain: luksoTestnet,
  transport: http(),
});

// Safely create wallet client only in browser environment
export const walletClient =
  typeof window !== "undefined"
    ? createWalletClient({
        chain: luksoTestnet,
        transport: custom(window.ethereum),
      })
    : null;
