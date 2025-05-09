const Upgrade = [
    {
        id : 0 ,
        name : "test",
        img : "",
        desc :"niveau par défaut",
        level : 0,
        price : 10
    },
    {
        id : 1 ,
        name : "test",
        img : "",
        desc :"je suis un placeholder version 2",
        level : 1,
        price : 20
    },
    {
        id : 2 ,
        name : "test",
        img : "",
        desc :"je suis un placeholder version 3",
        level : 2,
        price : 5
    },
    {
        id : 3 ,
        name : "test2",
        img : "",
        desc :"valeur par défaut",
        level : 0,
        price : 5
    },
    {
        id : 3 ,
        name : "test2",
        img : "",
        desc :"valeur par défaut",
        level : 1,
        price : 5
    },
    {
        id : 3 ,
        name : "test2",
        img : "",
        desc :"valeur par défaut",
        level : 2,
        price : 5
    }
]



export default Upgrade;
export  const defaultUpgrade = [Upgrade.filter(element => element.level ===0)];