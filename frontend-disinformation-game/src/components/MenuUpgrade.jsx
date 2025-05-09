import React from "react"
import Upgrade from "../data/listUpgrade";


// var PlayerUpgrade = ["test", "test2"];

export function MenuUpgrade({PlayerUpgrades , SetPlayerUpgrade,
    Money, SetMoney,
    Score,
    Diplay}){

        // MARCHE MAIS PROBLEME DOUBLE TABLEAU A REGLE 
    
    
    var displayUpgrades = [];

    SetMoney(Money+Score);

        
        //var displayUpgrades = Upgrade.filter(a => !PlayerUpgrades.some(b => a== b));
        console.log(PlayerUpgrades)
        for (var presentUpgrade of PlayerUpgrades[0]){
            // console.log(presentUpgrade)
            var possibleUpgrade = Upgrade.find(futurupgrade  =>  (presentUpgrade.name== futurupgrade.name) && (presentUpgrade.level + 1 == futurupgrade.level  ));
        //     Upgrade.forEach(futurupgrade  =>  {if((presentUpgrade.level + 1 == futurupgrade.level )){
        //         console.log(futurupgrade);
        //         console.log(futurupgrade.level )
        //         console.log(futurupgrade.level + 1 )

        //     }
        // else{
        //     console.log("bruh");
        // }})

            if(possibleUpgrade != undefined){
                displayUpgrades.push(possibleUpgrade);
            }
        } 
        // console.log("displayUpgrades",displayUpgrades);
    
    
    
    return (
        
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
            onClick={Diplay}>
            <div>{Money}</div>
            <div className="flex max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white/95 p-6 shadow-xl border border-white/20"
            onClick={(e) => e.stopPropagation()}>
                
                {displayUpgrades.map(element =>
                <div>
                    <div>{`${element.name} ${element.level}`} </div>
                    <div>{element.price}</div>
                    {/* <img src ={element.img}/> */}
                    <div>{element.desc}</div>
                    <button onClick={() => {
                        if(Money>=element.price){
                            SetMoney(Money - element.price);
                            PlayerUpgrades[0]= PlayerUpgrades[0].filter(Pup => Pup.name != element.name);
                            console.log(PlayerUpgrades);
                            PlayerUpgrades[0].push(element);
                            PlayerUpgrades[0].sort((a, b) => a.id - b.id);
                            console.log('New table upgrade ');
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