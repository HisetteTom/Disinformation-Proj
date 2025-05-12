import { useMemo } from "react";
import Upgrade from "../data/listUpgrade";

export function useUpgradeEffects(user) {
  // Calculate upgrade effects based on user upgrades
  const upgradeEffect = useMemo(() => {
    const effects = {};

    if (!user) return effects;

    // Get user upgrades from the user object
    // This works with both the user profile from the backend API and the auth user
    const userUpgrades = user.upgrades || {};
    
    // Calculate effects for each upgrade
    for (let upgradeId in userUpgrades) {
      const upgradeDefinition = Upgrade.find((element) => element.id === upgradeId);
      if (upgradeDefinition && userUpgrades[upgradeId] > 0) {
        const level = userUpgrades[upgradeId];
        const levelEffects = upgradeDefinition.effect(level);

        // Merge effects
        Object.assign(effects, levelEffects);
      }
    }

    return effects;
  }, [user]);

  // Helper functions to get specific effects with defaults
  const getFactChecksBonus = () => upgradeEffect.factChecksBonus || 0;
  const getSpeedMultiplier = () => upgradeEffect.speedMultiplier || 1;
  const getMistakePenaltyReduction = () => upgradeEffect.mistakePenaltyReduction || 1;
  const getTimeScoreBonus = () => upgradeEffect.timeScoreBonus || 0;

  return {
    upgradeEffect,
    getFactChecksBonus,
    getSpeedMultiplier,
    getMistakePenaltyReduction,
    getTimeScoreBonus,
  };
}