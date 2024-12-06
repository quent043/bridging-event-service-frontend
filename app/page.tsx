'use client';

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const [tokenVolumes, setTokenVolumes] = useState<Record<string, number>>({});
  const [chainVolumes, setChainVolumes] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const [tokenResponse, chainResponse] = await Promise.all([
          fetch("http://localhost:3000/metrics/total_volume"), // Replace with your backend's API
          fetch("http://localhost:3000/metrics/total_volume_by_chain"),
        ]);

        if (!tokenResponse.ok || !chainResponse.ok) {
          throw new Error("Failed to fetch data from the API");
        }

        const tokenData = await tokenResponse.json();
        const chainData = await chainResponse.json();

        setTokenVolumes(tokenData.data);
        setChainVolumes(chainData.data);
        setError(null); // Clear errors if successful
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch data from the backend.");
      }
    };

    fetchData();

    // Setup WebSocket connection
    const socket = io("http://localhost:3000"); // Replace with your backend WebSocket URL

    // Listen for token volume updates
    socket.on("token_volume_update", (args: any) => {
      console.log("Token volume update:", args);
      // setTokenVolumes((prev) => ({
      //   ...prev,
      //   [token]: Number(updatedTokenVolume),
      // }));
    });

    // Listen for chain volume updates
    socket.on("chain_volume_update", (args: any) => {
      console.log("Chain volume update:", args);
      // setChainVolumes((prev) => ({
      //   ...prev,
      //   [chainId]: Number(updatedChainVolume),
      // }));
    });

    // Cleanup WebSocket on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <header className="text-center text-2xl font-bold mb-8">Live Dashboard</header>

        {error && (
            <div className="bg-red-500 text-white text-center p-4 rounded mb-8">
              {error}
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Token Volumes */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Token Volumes</h2>
            <ul className="list-disc list-inside">
              {Object.entries(tokenVolumes).map(([token, volume]) => (
                  <li key={token} className="text-gray-700">
                    <span className="font-medium">{token}</span>: {volume}
                  </li>
              ))}
            </ul>
          </div>

          {/* Chain Volumes */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Chain Volumes</h2>
            <ul className="list-disc list-inside">
              {Object.entries(chainVolumes).map(([chain, volume]) => (
                  <li key={chain} className="text-gray-700">
                    <span className="font-medium">{chain}</span>: {volume}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
}
