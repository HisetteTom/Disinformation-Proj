const Upgrade = [
    {
      id: "fact_checker",
      name: "Fact Checker Pro",
      img: "/upgrades/fact-checker.png",
      desc: "Increases your fact check allowance during games",
      maxLevel: 3,
      levelDesc: [
        "+2 fact checks per game",
        "+4 fact checks per game", 
        "+6 fact checks per game"
      ],
      price: [100, 250, 500],
      effect: (level) => ({ factChecksBonus: level * 2 })
    },
    {
      id: "speed_bonus",
      name: "Quick Reflexes",
      img: "/upgrades/speed-bonus.png",
      desc: "Increases points earned from speed bonuses",
      maxLevel: 3,
      levelDesc: [
        "+25% speed bonus points",
        "+50% speed bonus points",
        "+75% speed bonus points"
      ],
      price: [150, 300, 600],
      effect: (level) => ({ speedMultiplier: 1 + (level * 0.25) })
    },
    {
      id: "mistake_shield",
      name: "Mistake Shield",
      img: "/upgrades/shield.png",
      desc: "Reduces points lost from incorrect flags",
      maxLevel: 2,
      levelDesc: [
        "-25% points lost from mistakes",
        "-50% points lost from mistakes"
      ],
      price: [200, 450],
      effect: (level) => ({ mistakePenaltyReduction: level * 0.25 })
    },
    {
      id: "time_bonus",
      name: "Time Manager",
      img: "/upgrades/clock.png",
      desc: "Increases the passive points earned over time",
      maxLevel: 3,
      levelDesc: [
        "+20% passive time score",
        "+40% passive time score",
        "+60% passive time score"
      ],
      price: [175, 350, 700],
      effect: (level) => ({ timeScoreBonus: level * 0.2 })
    }
  ];
  
  export default Upgrade;
