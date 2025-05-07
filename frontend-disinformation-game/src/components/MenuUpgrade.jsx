import React from "react"
import Upgrade from "../data/listUpgrade";

// var PlayerUpgrade = ["test", "test2"];

export function MenuUpgrade({PlayerUpgrades , SetPlayerUpgrade,
    Money, SetMoney,
    Score,
    Diplay}){
    
    SetMoney(Money+Score);


    if (PlayerUpgrades.length === 0){
        var displayUpgrades = Upgrade;
        console.log('display created with everything')
    }
    else{
        var displayUpgrades = Upgrade.filter(a => !PlayerUpgrades.some(b => a.name== b));
        console.log(displayUpgrades);
    }
    
    // console.log(Money);
    // console.log(SetMoney);
    // SetMoney(10);
    // console.log(Money);
    // console.log(SetMoney);
    return (
        
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
            onClick={Diplay}>
            <div className="flex max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white/95 p-6 shadow-xl border border-white/20"
            onClick={(e) => e.stopPropagation()}>
                <div>{Money} {displayUpgrades.length}</div>
                {displayUpgrades.map(element =>
                <div>
                    <div>{`${element.name} ${element.level}`} </div>
                    <div>{element.price}</div>
                    {/* <img src ={element.img}/> */}
                    <div>{element.desc}</div>
                    <button onClick={() => {
                        if(Money>=element.price){
                            SetMoney(Money - element.price);
                            PlayerUpgrades.push(element.name);
                            console.log(PlayerUpgrades);
                            SetPlayerUpgrade(PlayerUpgrades);
                            console.log(PlayerUpgrades);
                      
                            
                        
                    }}}>Buy</button>
                </div>
                    ) }
            </div>
        </div>
    );
}

export default MenuUpgrade