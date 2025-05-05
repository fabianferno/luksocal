"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { client, walletClient } from "@/components/client";
import { CALABI, CAL_ADDRESS } from "@/components/const";
import { parseEther } from "viem";

interface RegisterButtonProps {
  username: string;
  cost15: string;
  cost30: string;
  onSuccess: (code: string) => void;
}

export function RegisterButton({
  username,
  cost15,
  cost30,
  onSuccess,
}: RegisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const tx = await walletClient?.writeContract({
        account: address,
        address: CAL_ADDRESS,
        abi: CALABI,
        functionName: "registerUser",
        args: [username, parseEther(cost15), parseEther(cost30)],
      });

      console.log(tx);

      const receipt = await client.waitForTransactionReceipt({
        hash: tx!,
      });

      console.log(receipt);

      // Base64 encode the username
      const encodedUsername = Buffer.from(username).toString("base64");

      const code = `${process.env.NEXT_PUBLIC_APP_URL}/?profileId=${encodedUsername}`;
      onSuccess(code);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="submit"
      onClick={handleSubmit}
      //   disabled={isLoading || !isConnected}
      className="w-full py-3 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-bold text-lg shadow transition-colors font-sans border border-pink-700 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Creating..." : "Create your grid"}
    </button>
  );
}
