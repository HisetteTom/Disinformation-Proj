import React, { useState, useEffect } from "react";
import Upgrade from "../../data/listUpgrade";
import { updateUserUpgrades } from "../../services/authService";
import { getCurrentUser } from "../../services/authService";
import "./MenuUpgrade.css";

export function MenuUpgrade({ user, userProfile, Score, Diplay, onProfileUpdate }) {
  const [money, setMoney] = useState(0);
  const [playerUpgrades, setPlayerUpgrades] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Initialize from user data or set defaults
  useEffect(() => {
    // If userProfile is passed and has money, use that directly instead of fetching again
    if (userProfile && typeof userProfile.money !== "undefined") {
      console.log("Using passed userProfile with money:", userProfile.money);
      setMoney(userProfile.money);
      setPlayerUpgrades(userProfile.upgrades || {});
      return; // Skip the fetch
    }

    if (user) {
      // Get Firebase auth user for token access
      const authUser = getCurrentUser();
      if (!authUser) {
        console.error("No authenticated user found");
        return;
      }

      // Only fetch if we don't have the profile data already
      fetch(`http://localhost:3001/api/protected/profile`, {
        headers: {
          Authorization: `Bearer ${authUser.stsTokenManager.accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            console.log("Shop loaded user profile with money:", data.user.money);
            setMoney(data.user.money || 0);
            setPlayerUpgrades(data.user.upgrades || {});
          }
        })
        .catch((err) => {
          console.error("Error loading user profile:", err);
          setMoney(Score);
        });
    } else {
      setMoney(Score);
    }
  }, [user, userProfile, Score]);

  // Filter available upgrades based on current levels
  const getAvailableUpgrades = () => {
    return Upgrade.map((upgrade) => {
      const currentLevel = playerUpgrades[upgrade.id] || 0;
      const canUpgrade = currentLevel < upgrade.maxLevel;
      const nextPrice = upgrade.price[currentLevel] || 0;

      return {
        ...upgrade,
        currentLevel,
        nextLevel: currentLevel + 1,
        canPurchase: canUpgrade && money >= nextPrice,
        nextPrice,
      };
    });
  };

  const handlePurchase = async (upgrade) => {
    if (!upgrade.canPurchase) return;

    const newMoney = money - upgrade.nextPrice;
    const newUpgrades = {
      ...playerUpgrades,
      [upgrade.id]: (playerUpgrades[upgrade.id] || 0) + 1,
    };

    setMoney(newMoney);
    setPlayerUpgrades(newUpgrades);

    // Save changes if user is logged in
    if (user) {
      setIsLoading(true);
      try {
        const result = await updateUserUpgrades(newMoney, newUpgrades);
        setMessage("Upgrade purchased and saved!");

        // Update the parent component's userProfile state with the new profile data
        if (result && result.profile && typeof onProfileUpdate === "function") {
          onProfileUpdate(result.profile);
        }
      } catch (error) {
        console.error("Error saving upgrades:", error);
        setMessage("Failed to save purchase.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const availableUpgrades = getAvailableUpgrades();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pt-24 transition-all duration-500"
      onClick={Diplay}
      style={{  
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        backgroundColor: "rgba(0, 5, 20, 0.5)",
        backgroundImage: "linear-gradient(to bottom right, rgba(18, 60, 109, 0.25), rgba(77, 166, 255, 0.25))",
      }}
    >
      <div
        className="animate-fadeIn animate-scale-in flex max-h-[70vh] w-full max-w-4xl flex-col overflow-y-auto rounded-lg border border-[#4DA6FF]/60 bg-gradient-to-r from-[#123C6D]/80 to-[#1a4b82]/80 p-6 shadow-2xl backdrop-blur-md backdrop-filter"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "fadeIn 0.4s ease-out, scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(77, 166, 255, 0.25)",
        }}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[#4DA6FF]/30 pb-4">
          <div>
            <h2 className="text-shadow text-2xl font-bold text-white">Moderator Upgrades</h2>
            <p className="text-[#4DA6FF]/80">Enhance your detection capabilities</p>
          </div>
          <div className="rounded-full border border-[#4DA6FF]/50 bg-[#4DA6FF]/20 px-4 py-2 text-xl font-bold text-white backdrop-blur-md backdrop-filter">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-[#4DA6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${money}
            </span>
          </div>
        </div>

        {message && <div className="mb-4 rounded-md border border-[#4DA6FF]/40 bg-[#4DA6FF]/20 p-3 text-white backdrop-blur-sm backdrop-filter">{message}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {availableUpgrades.map((upgrade) => (
            <div key={upgrade.id} className={`rounded-lg border p-4 backdrop-blur-sm backdrop-filter transition-all duration-300 ${upgrade.canPurchase ? "cursor-pointer border-[#4DA6FF]/30 bg-[#123C6D]/60 hover:border-[#4DA6FF]/60 hover:bg-[#123C6D]/70" : "border-[#4DA6FF]/10 bg-[#123C6D]/30 opacity-70"}`}>
              <div className="flex items-start">
                <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-md border border-[#4DA6FF]/40 bg-[#4DA6FF]/20 backdrop-blur-sm backdrop-filter">
                  {upgrade.img ? (
                    <img src={`./img${upgrade.img}`} className="h-10 w-10" alt={upgrade.name} />
                  ) : (
                    <div className="text-2xl text-[#4DA6FF]">⚡</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{upgrade.name}</h3>
                  <div className="mb-1 flex items-center">
                    <div className="text-sm text-[#4DA6FF]/80">
                      Level {upgrade.currentLevel}/{upgrade.maxLevel}
                    </div>
                    <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-[#123C6D]/70 backdrop-blur-sm backdrop-filter">
                      <div
                        className="h-full bg-[#4DA6FF]/80"
                        style={{
                          width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-white/80">{upgrade.desc}</p>
                  <div className="text-xs text-[#4DA6FF]/70">
                    {upgrade.currentLevel > 0 ? (
                      <span>Current: {upgrade.levelDesc[upgrade.currentLevel - 1]}</span>
                    ) : (
                      <span>Not purchased yet</span>
                    )}
                  </div>
                  {upgrade.currentLevel < upgrade.maxLevel && (
                    <div className="text-xs text-[#4DA6FF]">Next: {upgrade.levelDesc[upgrade.currentLevel]}</div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="font-bold text-white">
                  {upgrade.currentLevel < upgrade.maxLevel ? `$${upgrade.nextPrice}` : "Maxed Out"}
                </div>
                {upgrade.currentLevel < upgrade.maxLevel && (
                  <button 
                    onClick={() => handlePurchase(upgrade)} 
                    disabled={!upgrade.canPurchase || isLoading} 
                    className={`rounded-md px-4 py-2 text-sm font-medium transition transform hover:scale-105 flex items-center space-x-1 ${
                      upgrade.canPurchase && !isLoading
                        ? "bg-[#4DA6FF] text-white hover:bg-[#4DA6FF]/80 shadow-md hover:shadow-lg" 
                        : "bg-gray-600/50 text-gray-300 cursor-not-allowed"
                    } ${isLoading ? "opacity-50" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : upgrade.canPurchase ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Purchase</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Can't Afford</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={Diplay} 
            className="rounded-md bg-gray-600/50 px-4 py-3 font-medium text-white transition hover:bg-gray-600/70 border border-gray-500/30 flex items-center space-x-2 mx-auto transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close Shop</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuUpgrade;