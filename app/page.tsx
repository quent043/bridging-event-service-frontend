'use client';

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const [tokenVolumes, setTokenVolumes] = useState<Record<string, number>>({});
  const [chainVolumes, setChainVolumes] = useState<Record<string, number>>({});
  const [highlightedToken, setHighlightedToken] = useState<string | null>(null);
  const [highlightedChain, setHighlightedChain] = useState<string | null>(null);
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
        console.log(tokenData.data, chainData.data);

        const sortedTokenVolumes = Object.fromEntries(
            Object.entries(tokenData.data).sort(([, volA], [, volB]) => Number(volB) - Number(volA))
        ) as Record<string, number>;

        const sortedChainVolumes = Object.fromEntries(
            Object.entries(chainData.data).sort(([, volA], [, volB]) => Number(volB) - Number(volA))
        ) as Record<string, number>;

        console.log(sortedTokenVolumes, 'sortedTokenVolumes');
        console.log(sortedChainVolumes, 'sortedChainVolumes');


        // Set state with sorted data
        setTokenVolumes(sortedTokenVolumes);
        setChainVolumes(sortedChainVolumes);

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
      const { token, totalVolume } = args;
      setTokenVolumes((prev) => {
        const updated = {
          ...prev,
          [token]: Number(totalVolume),
        };

        // Sort entries by volume in descending order
        const sorted = Object.fromEntries(
            Object.entries(updated).sort(([, volA], [, volB]) => (volB as number) - (volA as number))
        ) as Record<string, number>;

        return sorted;
      });
      setHighlightedToken(token);
      setTimeout(() => setHighlightedToken(null), 2000); // Remove highlight after 2 seconds
    });

    socket.on("chain_volume_update", (args: any) => {
      const { chainId, totalVolume } = args;
      setChainVolumes((prev) => {
        const updated = {
          ...prev,
          [chainId]: Number(totalVolume),
        };

        // Sort entries by volume in descending order
        const sorted = Object.fromEntries(
            Object.entries(updated).sort(([, volA], [, volB]) => (volB as number) - (volA as number))
        ) as Record<string, number>;

        return sorted;
      });
      setHighlightedChain(chainId);
      setTimeout(() => setHighlightedChain(null), 2000); // Remove highlight after 2 seconds
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
                  <li
                      key={token}
                      className={`text-gray-700 transition-all duration-500 ${
                          highlightedToken === token ? "bg-yellow-200" : ""
                      }`}
                  >
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
                  <li
                      key={chain}
                      className={`text-gray-700 transition-all duration-500 ${
                          highlightedChain === chain ? "bg-green-200" : ""
                      }`}
                  >
                    <span className="font-medium">{chain}</span>: {volume}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
}
