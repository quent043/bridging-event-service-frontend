'use client';

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import _ from "lodash";

type TokenVolume = [string, number];
type ChainVolume = [string, number];

export default function Home() {
  const [tokenVolumes, setTokenVolumes] = useState<TokenVolume[]>([]);
  const [chainVolumes, setChainVolumes] = useState<ChainVolume[]>([]);
  const [highlightedToken, setHighlightedToken] = useState<string | null>(null);
  const [highlightedChain, setHighlightedChain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tokenResponse, chainResponse] = await Promise.all([
          fetch("http://localhost:3000/metrics/total_volume"),
          fetch("http://localhost:3000/metrics/total_volume_by_chain"),
        ]);

        if (!tokenResponse.ok || !chainResponse.ok) {
          throw new Error("Failed to fetch data from the API");
        }

        const tokenData: Record<string, number> = await tokenResponse.json();
        const chainData: Record<string, number> = await chainResponse.json();

        // Sort data and set state
        const sortedTokenVolumes = _.orderBy(
            Object.entries(tokenData.data),
            ([, volume]) => volume,
            ["desc"]
        );
        const sortedChainVolumes = _.orderBy(
            Object.entries(chainData.data),
            ([, volume]) => volume,
            ["desc"]
        );

        setTokenVolumes(sortedTokenVolumes);
        setChainVolumes(sortedChainVolumes);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch data from the backend.");
      }
    };

    fetchData();

    // WebSocket setup
    const socket = io("http://localhost:3000");

    socket.on("token_volume_update", (args: any) => {
      const { token, totalVolume } = args;
      setTokenVolumes((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(([key]) => key === token);

        if (index !== -1) {
          updated[index][1] = totalVolume;
        } else {
          updated.push([token, totalVolume]);
        }

        return _.orderBy(updated, ([, volume]) => volume, ["desc"]);
      });

      setHighlightedToken(token);
      setTimeout(() => setHighlightedToken(null), 2000);
    });

    socket.on("chain_volume_update", (args: any) => {
      const { chainId, totalVolume } = args;
      setChainVolumes((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(([key]) => key === chainId);

        if (index !== -1) {
          updated[index][1] = totalVolume;
        } else {
          updated.push([chainId, totalVolume]);
        }

        return _.orderBy(updated, ([, volume]) => volume, ["desc"]);
      });

      setHighlightedChain(chainId);
      setTimeout(() => setHighlightedChain(null), 2000);
    });

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
              {tokenVolumes.map(([token, volume]) => (
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
              {chainVolumes.map(([chainId, volume]) => (
                  <li
                      key={chainId}
                      className={`text-gray-700 transition-all duration-500 ${
                          highlightedChain === chainId ? "bg-green-200" : ""
                      }`}
                  >
                    <span className="font-medium">{chainId}</span>: {volume}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
}
