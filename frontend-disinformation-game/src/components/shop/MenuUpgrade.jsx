import React, { useState, useEffect } from "react";
import Upgrade from "../../data/listUpgrade";
import { updateUserUpgrades } from "../../services/authService";
import { getCurrentUser } from "../../services/authService";

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
        if (result && result.profile && typeof onProfileUpdate === 'function') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={Diplay}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-lg border border-white/20 bg-white/95 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">Upgrade Shop</h2>
            <p className="text-gray-600">Enhance your moderator abilities</p>
          </div>
          <div className="text-xl font-bold text-green-600">${money}</div>
        </div>

        {message && <div className="mb-4 rounded-md bg-blue-50 p-3 text-blue-800">{message}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {availableUpgrades.map((upgrade) => (
            <div key={upgrade.id} className={`rounded-lg border p-4 ${upgrade.canPurchase ? "cursor-pointer bg-white hover:bg-blue-50" : "bg-gray-100 opacity-70"}`}>
              <div className="flex items-start">
                <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-md bg-blue-100">{upgrade.img ? <img src={upgrade.img} className="h-10 w-10" /> : <div className="text-2xl text-blue-500">⚡</div>}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{upgrade.name}</h3>
                  <div className="mb-1 flex items-center">
                    <div className="text-sm text-gray-600">
                      Level {upgrade.currentLevel}/{upgrade.maxLevel}
                    </div>
                    <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600"
                        style={{
                          width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">{upgrade.desc}</p>
                  <div className="text-xs text-gray-500">{upgrade.currentLevel > 0 ? <span>Current: {upgrade.levelDesc[upgrade.currentLevel - 1]}</span> : <span>Not purchased yet</span>}</div>
                  {upgrade.currentLevel < upgrade.maxLevel && <div className="text-xs text-blue-600">Next: {upgrade.levelDesc[upgrade.currentLevel]}</div>}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="font-bold">{upgrade.currentLevel < upgrade.maxLevel ? `$${upgrade.nextPrice}` : "Maxed Out"}</div>
                {upgrade.currentLevel < upgrade.maxLevel && (
                  <button onClick={() => handlePurchase(upgrade)} disabled={!upgrade.canPurchase || isLoading} className={`rounded px-3 py-1 text-white ${upgrade.canPurchase ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}`}>
                    {upgrade.canPurchase ? "Purchase" : "Can't Afford"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={Diplay} className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
            Close Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuUpgrade;
