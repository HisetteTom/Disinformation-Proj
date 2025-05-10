import React, { useState, useEffect } from "react";
import Upgrade from "../../data/listUpgrade";
import { updateUserUpgrades } from "../../services/authService";

export function MenuUpgrade({ user, Score, Diplay }) {
  const [money, setMoney] = useState(0);
  const [playerUpgrades, setPlayerUpgrades] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Initialize from user data or set defaults
  useEffect(() => {
    if (user) {
      // Fetch current user data including money and upgrades
      fetch(`http://localhost:3001/api/protected/profile`, {
        headers: {
          Authorization: `Bearer ${user.stsTokenManager.accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            // Start with existing money + new score
            setMoney((data.user.money || 0) + Score);
            // Load existing upgrades or empty object
            setPlayerUpgrades(data.user.upgrades || {});
          }
        })
        .catch((err) => {
          console.error("Error loading user profile:", err);
          // If error, just use the score as money
          setMoney(Score);
        });
    } else {
      // Guest mode - just use the score as money
      setMoney(Score);
    }
  }, [user, Score]);

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
        await updateUserUpgrades(newMoney, newUpgrades);
        setMessage("Upgrade purchased and saved!");
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
      <div className="flex max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/20 bg-white/95 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-blue-600">Upgrade Shop</h2>
            <div className="text-xl font-bold">Credits: ${money}</div>
          </div>

          {message && <div className="mb-4 rounded-md bg-green-100 p-3 text-green-800">{message}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {availableUpgrades.map((upgrade) => (
              <div key={upgrade.id} className="rounded-lg border bg-white p-4 shadow">
                <div className="flex items-start gap-3">
                  {upgrade.img && (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-200">
                      {/* Can add actual image here */}
                      <span className="text-3xl">🔧</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{upgrade.name}</h3>
                    <p className="mb-2 text-sm text-gray-600">{upgrade.desc}</p>

                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        Level: {upgrade.currentLevel}/{upgrade.maxLevel}
                      </span>
                      {upgrade.currentLevel > 0 && <p className="text-xs text-blue-600">Current: {upgrade.levelDesc[upgrade.currentLevel - 1]}</p>}
                    </div>

                    {upgrade.canPurchase ? (
                      <button onClick={() => handlePurchase(upgrade)} disabled={isLoading} className="mt-2 w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700">
                        {isLoading ? "Processing..." : `Upgrade: $${upgrade.nextPrice}`}
                      </button>
                    ) : upgrade.currentLevel >= upgrade.maxLevel ? (
                      <div className="mt-2 w-full rounded-md bg-green-600 py-2 text-center text-white">Maxed Out</div>
                    ) : (
                      <div className="mt-2 w-full rounded-md bg-gray-300 py-2 text-center text-gray-600">
                        Need ${upgrade.nextPrice} (${upgrade.nextPrice - money} more)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-6 rounded-md bg-yellow-50 p-4 text-yellow-800">
              <p className="font-medium">Playing as Guest</p>
              <p className="text-sm">Sign in to save your upgrades and money between games!</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={Diplay} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuUpgrade;
