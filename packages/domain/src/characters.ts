export const ABILITY_CATEGORIES=['physical','energy','transformation','technique','weapon','sensory','defensive','mobility','hax','summoning','passive','other'] as const;
export const VERSION_ABILITY_STATUSES=['available','limited','mastered','lost','conditional'] as const;

export type AbilityCategory=typeof ABILITY_CATEGORIES[number];
export type VersionAbilityStatus=typeof VERSION_ABILITY_STATUSES[number];

export type CharacterVersion={
 id:string;
 characterId:string;
 name:string;
 shortName?:string;
 aliases:string[];
 description:string;
 era?:string;
 arc?:string;
 sortOrder:number;
 canonical:boolean;
 sourceEndpoint?:string;
 parentVersionId?:string|null;
};

export type Ability={
 id:string;
 characterId:string;
 name:string;
 description:string;
 category:AbilityCategory;
};

export type VersionAbility={
 versionId:string;
 abilityId:string;
 status:VersionAbilityStatus;
 notes?:string;
};

export const characterVersions:CharacterVersion[]=[
 {id:"byakuya-standard",characterId:"byakuya",name:"Standard Byakuya Kuchiki",shortName:'Standard',aliases:[],description:"Senbonzakura and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"toshiro-standard",characterId:"toshiro",name:"Standard Toshiro Hitsugaya",shortName:'Standard',aliases:[],description:"Hyorinmaru and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"urahara-standard",characterId:"urahara",name:"Standard Kisuke Urahara",shortName:'Standard',aliases:[],description:"Benihime and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"mayuri-standard",characterId:"mayuri",name:"Standard Mayuri Kurotsuchi",shortName:'Standard',aliases:[],description:"Ashisogi Jizo and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"shunsui-standard",characterId:"shunsui",name:"Standard Shunsui Kyoraku",shortName:'Standard',aliases:[],description:"Katen Kyokotsu and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"yamamoto-standard",characterId:"yamamoto",name:"Standard Genryusai Yamamoto",shortName:'Standard',aliases:[],description:"Ryujin Jakka and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"renji-standard",characterId:"renji",name:"Standard Renji Abarai",shortName:'Standard',aliases:[],description:"Zabimaru and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"uryu-standard",characterId:"uryu",name:"Standard Uryu Ishida",shortName:'Standard',aliases:[],description:"Quincy Spirit Bow and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"chad-standard",characterId:"chad",name:"Standard Yasutora Sado",shortName:'Standard',aliases:[],description:"Brazo Derecha de Gigante and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"unohana-standard",characterId:"unohana",name:"Standard Retsu Unohana",shortName:'Standard',aliases:[],description:"Kaido Healing and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"komamura-standard",characterId:"komamura",name:"Standard Sajin Komamura",shortName:'Standard',aliases:[],description:"Tenken and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"soifon-standard",characterId:"soifon",name:"Standard Soi Fon",shortName:'Standard',aliases:[],description:"Suzumebachi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"grimmjow-standard",characterId:"grimmjow",name:"Standard Grimmjow Jaegerjaquez",shortName:'Standard',aliases:[],description:"Pantera and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"ulquiorra-standard",characterId:"ulquiorra",name:"Standard Ulquiorra Cifer",shortName:'Standard',aliases:[],description:"Murcielago and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"starrk-standard",characterId:"starrk",name:"Standard Coyote Starrk",shortName:'Standard',aliases:[],description:"Los Lobos and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"barragan-standard",characterId:"barragan",name:"Standard Barragan Louisenbairn",shortName:'Standard',aliases:[],description:"Respira and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"nelliel-standard",characterId:"nelliel",name:"Standard Nelliel Tu Odelschwanck",shortName:'Standard',aliases:[],description:"Gamuza and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"harribel-standard",characterId:"harribel",name:"Standard Tier Harribel",shortName:'Standard',aliases:[],description:"Tiburon and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"yhwach-standard",characterId:"yhwach",name:"Standard Yhwach",shortName:'Standard',aliases:[],description:"The Almighty and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"jugram-standard",characterId:"jugram",name:"Standard Jugram Haschwalth",shortName:'Standard',aliases:[],description:"The Balance and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"askin-standard",characterId:"askin",name:"Standard Askin Nakk Le Vaar",shortName:'Standard',aliases:[],description:"The Deathdealing and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"lille-standard",characterId:"lille",name:"Standard Lille Barro",shortName:'Standard',aliases:[],description:"The X-Axis and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"gerard-standard",characterId:"gerard",name:"Standard Gerard Valkyrie",shortName:'Standard',aliases:[],description:"The Miracle and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"gremmy-standard",characterId:"gremmy",name:"Standard Gremmy Thoumeaux",shortName:'Standard',aliases:[],description:"The Visionary and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"pernida-standard",characterId:"pernida",name:"Standard Pernida Parnkgjas",shortName:'Standard',aliases:[],description:"The Compulsory and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"gin-standard",characterId:"gin",name:"Standard Gin Ichimaru",shortName:'Standard',aliases:[],description:"Shinso and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"kaname-standard",characterId:"kaname",name:"Standard Kaname Tosen",shortName:'Standard',aliases:[],description:"Suzumushi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"ikkaku-standard",characterId:"ikkaku",name:"Standard Ikkaku Madarame",shortName:'Standard',aliases:[],description:"Hozukimaru and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"yumichika-standard",characterId:"yumichika",name:"Standard Yumichika Ayasegawa",shortName:'Standard',aliases:[],description:"Ruri'iro Kujaku and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"nnoitra-standard",characterId:"nnoitra",name:"Standard Nnoitra Gilga",shortName:'Standard',aliases:[],description:"Santa Teresa and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"szayel-standard",characterId:"szayel",name:"Standard Szayelaporro Granz",shortName:'Standard',aliases:[],description:"Fornicaras and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"halibel-fraccion-standard",characterId:"halibel-fraccion",name:"Standard Apache",shortName:'Standard',aliases:[],description:"Resurreccion and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"kensei-standard",characterId:"kensei",name:"Standard Kensei Muguruma",shortName:'Standard',aliases:[],description:"Tachikaze and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"shiniji-standard",characterId:"shiniji",name:"Standard Shinji Hirako",shortName:'Standard',aliases:[],description:"Sakanade and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"hiyori-standard",characterId:"hiyori",name:"Standard Hiyori Sarugaki",shortName:'Standard',aliases:[],description:"Kubikiri Orochi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Bleach anime/manga",parentVersionId:null},
 {id:"obito-standard",characterId:"obito",name:"Standard Obito Uchiha",shortName:'Standard',aliases:[],description:"Kamui and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"orochimaru-standard",characterId:"orochimaru",name:"Standard Orochimaru",shortName:'Standard',aliases:[],description:"Snake Summoning and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"pain-standard",characterId:"pain",name:"Standard Nagato",shortName:'Standard',aliases:[],description:"Six Paths of Pain and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"kaguya-standard",characterId:"kaguya",name:"Standard Kaguya Otsutsuki",shortName:'Standard',aliases:[],description:"Amenominaka and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"kabuto-standard",characterId:"kabuto",name:"Standard Kabuto Yakushi",shortName:'Standard',aliases:[],description:"Medical Ninjutsu and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"deidara-standard",characterId:"deidara",name:"Standard Deidara",shortName:'Standard',aliases:[],description:"Explosive Clay and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"sasori-standard",characterId:"sasori",name:"Standard Sasori",shortName:'Standard',aliases:[],description:"Human Puppet Technique and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"kisame-standard",characterId:"kisame",name:"Standard Kisame Hoshigaki",shortName:'Standard',aliases:[],description:"Samehada and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"frieza-standard",characterId:"frieza",name:"Standard Frieza",shortName:'Standard',aliases:[],description:"Death Beam and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"cell-standard",characterId:"cell",name:"Standard Cell",shortName:'Standard',aliases:[],description:"Cell Regeneration and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"majin-buu-standard",characterId:"majin-buu",name:"Standard Majin Buu",shortName:'Standard',aliases:[],description:"Majin Regeneration and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"goku-black-standard",characterId:"goku-black",name:"Standard Goku Black",shortName:'Standard',aliases:[],description:"Ki Blade and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"zamasu-standard",characterId:"zamasu",name:"Standard Zamasu",shortName:'Standard',aliases:[],description:"Immortality and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"kenjaku-standard",characterId:"kenjaku",name:"Standard Kenjaku",shortName:'Standard',aliases:[],description:"Cursed Spirit Manipulation and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"mahito-standard",characterId:"mahito",name:"Standard Mahito",shortName:'Standard',aliases:[],description:"Idle Transfiguration and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"jogo-standard",characterId:"jogo",name:"Standard Jogo",shortName:'Standard',aliases:[],description:"Volcanic Cursed Technique and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"hanami-standard",characterId:"hanami",name:"Standard Hanami",shortName:'Standard',aliases:[],description:"Plant Manipulation and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"dagon-standard",characterId:"dagon",name:"Standard Dagon",shortName:'Standard',aliases:[],description:"Death Swarm and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"meruem-standard",characterId:"meruem",name:"Standard Meruem",shortName:'Standard',aliases:[],description:"Chimera Ant Physiology and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Hunter x Hunter anime/manga",parentVersionId:null},
 {id:"chrollo-standard",characterId:"chrollo",name:"Standard Chrollo Lucilfer",shortName:'Standard',aliases:[],description:"Skill Hunter and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Hunter x Hunter anime/manga",parentVersionId:null},
 {id:"hisoka-standard",characterId:"hisoka",name:"Standard Hisoka Morow",shortName:'Standard',aliases:[],description:"Bungee Gum and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Hunter x Hunter anime/manga",parentVersionId:null},
 {id:"neferpitou-standard",characterId:"neferpitou",name:"Standard Neferpitou",shortName:'Standard',aliases:[],description:"Doctor Blythe and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Hunter x Hunter anime/manga",parentVersionId:null},
 {id:"blackbeard-standard",characterId:"blackbeard",name:"Standard Marshall D. Teach",shortName:'Standard',aliases:[],description:"Yami Yami no Mi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"doflamingo-standard",characterId:"doflamingo",name:"Standard Donquixote Doflamingo",shortName:'Standard',aliases:[],description:"Ito Ito no Mi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"crocodile-standard",characterId:"crocodile",name:"Standard Crocodile",shortName:'Standard',aliases:[],description:"Suna Suna no Mi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"enel-standard",characterId:"enel",name:"Standard Enel",shortName:'Standard',aliases:[],description:"Goro Goro no Mi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"kaido-standard",characterId:"kaido",name:"Standard Kaido",shortName:'Standard',aliases:[],description:"Azure Dragon Transformation and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"big-mom-standard",characterId:"big-mom",name:"Standard Charlotte Linlin",shortName:'Standard',aliases:[],description:"Soru Soru no Mi and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"lucci-standard",characterId:"lucci",name:"Standard Rob Lucci",shortName:'Standard',aliases:[],description:"Leopard Zoan and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"marco-standard",characterId:"marco",name:"Standard Marco",shortName:'Standard',aliases:[],description:"Phoenix Flames and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"One Piece anime/manga",parentVersionId:null},
 {id:"tsunade-standard",characterId:"tsunade",name:"Standard Tsunade",shortName:'Standard',aliases:[],description:"Creation Rebirth and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Naruto anime/manga",parentVersionId:null},
 {id:"shoko-standard",characterId:"shoko",name:"Standard Shoko Ieiri",shortName:'Standard',aliases:[],description:"Reverse Cursed Technique and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen anime/manga",parentVersionId:null},
 {id:"dende-standard",characterId:"dende",name:"Standard Dende",shortName:'Standard',aliases:[],description:"Namekian Healing and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball anime/manga",parentVersionId:null},
 {id:"wendy-standard",characterId:"wendy",name:"Standard Wendy Marvell",shortName:'Standard',aliases:[],description:"Sky Dragon Healing Magic and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Fairy Tail anime/manga",parentVersionId:null},
 {id:"lucy-standard",characterId:"lucy",name:"Standard Lucy Heartfilia",shortName:'Standard',aliases:[],description:"Celestial Spirit Magic and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Fairy Tail anime/manga",parentVersionId:null},
 {id:"jinwoo-standard",characterId:"jinwoo",name:"Standard Sung Jinwoo",shortName:'Standard',aliases:[],description:"Shadow Extraction and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Solo Leveling anime/manga",parentVersionId:null},
 {id:"rimuru-standard",characterId:"rimuru",name:"Standard Rimuru Tempest",shortName:'Standard',aliases:[],description:"Predator and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"That Time I Got Reincarnated as a Slime anime/manga",parentVersionId:null},
 {id:"giorno-standard",characterId:"giorno",name:"Standard Giorno Giovanna",shortName:'Standard',aliases:[],description:"Gold Experience and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"JoJo's Bizarre Adventure anime/manga",parentVersionId:null},
 {id:"asta-extra-standard",characterId:"asta-extra",name:"Standard Noelle Silva",shortName:'Standard',aliases:[],description:"Water Magic and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Black Clover anime/manga",parentVersionId:null},
 {id:"mimosa-standard",characterId:"mimosa",name:"Standard Mimosa Vermillion",shortName:'Standard',aliases:[],description:"Plant Healing Magic and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Black Clover anime/manga",parentVersionId:null},
 {id:"vanessa-standard",characterId:"vanessa",name:"Standard Vanessa Enoteca",shortName:'Standard',aliases:[],description:"Red Thread of Fate and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Black Clover anime/manga",parentVersionId:null},
 {id:"charmy-standard",characterId:"charmy",name:"Standard Charmy Pappitson",shortName:'Standard',aliases:[],description:"Food Magic and associated combat techniques; exact effects require matchup rules.",sortOrder:10,canonical:true,sourceEndpoint:"Black Clover anime/manga",parentVersionId:null},
 {id:'yoruichi-standard',characterId:'yoruichi',name:'Standard Yoruichi',shortName:'Standard Yoruichi',aliases:[],description:'Flash Step, Hakuda and Shunko high-speed close combat',sortOrder:10,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'yoruichi-shunko',characterId:'yoruichi',name:'Shunko Yoruichi',shortName:'Shunko Yoruichi',aliases:[],description:'Flash Step, Hakuda and Shunko high-speed close combat',sortOrder:20,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'orihime-arrancar',characterId:'orihime',name:'Arrancar Arc Orihime',shortName:'Arrancar Arc Orihime',aliases:[],description:'Shun Shun Rikka healing and defensive rejection techniques',sortOrder:10,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'orihime-tybw',characterId:'orihime',name:'TYBW Orihime',shortName:'TYBW Orihime',aliases:[],description:'Shun Shun Rikka healing and defensive rejection techniques',sortOrder:20,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'kenpachi-early',characterId:'kenpachi',name:'Early Kenpachi',shortName:'Early Kenpachi',aliases:[],description:'High-endurance sword combat and Nozarashi offensive pressure',sortOrder:10,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'kenpachi-shikai',characterId:'kenpachi',name:'Shikai Kenpachi',shortName:'Shikai Kenpachi',aliases:[],description:'High-endurance sword combat and Nozarashi offensive pressure',sortOrder:20,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'kenpachi-bankai',characterId:'kenpachi',name:'Bankai Kenpachi',shortName:'Bankai Kenpachi',aliases:[],description:'High-endurance sword combat and Nozarashi offensive pressure',sortOrder:30,canonical:true,sourceEndpoint:'Bleach manga / anime',parentVersionId:null},
 {id:'goku-saiyan-saga',characterId:'goku',name:'Saiyan Saga Goku',shortName:'Saiyan Saga',aliases:['Saiyan Saga'],description:'Goku combat profile during the Saiyan Saga.',era:'Dragon Ball Z',arc:'Saiyan Saga',sortOrder:10,canonical:true,sourceEndpoint:'Dragon Ball Z · Saiyan Saga',parentVersionId:null},
 {id:'goku-namek-saga',characterId:'goku',name:'Namek Saga Goku',shortName:'Namek Saga',aliases:['Namek'],description:'Goku combat profile during the Namek conflict before later Super Saiyan-era states.',era:'Dragon Ball Z',arc:'Namek Saga',sortOrder:20,canonical:true,sourceEndpoint:'Dragon Ball Z · Namek Saga',parentVersionId:'goku-saiyan-saga'},
 {id:'goku-super-saiyan',characterId:'goku',name:'Super Saiyan Goku',shortName:'Super Saiyan',aliases:['SSJ','Super Saiyan 1'],description:'Goku using the Super Saiyan state.',era:'Dragon Ball Z',sortOrder:30,canonical:true,sourceEndpoint:'Dragon Ball Z',parentVersionId:'goku-namek-saga'},
 {id:'goku-super-saiyan-2',characterId:'goku',name:'Super Saiyan 2 Goku',shortName:'Super Saiyan 2',aliases:['SSJ2'],description:'Goku using Super Saiyan 2.',era:'Dragon Ball Z',sortOrder:40,canonical:true,sourceEndpoint:'Dragon Ball Z',parentVersionId:'goku-super-saiyan'},
 {id:'goku-super-saiyan-3',characterId:'goku',name:'Super Saiyan 3 Goku',shortName:'Super Saiyan 3',aliases:['SSJ3'],description:'Goku using Super Saiyan 3.',era:'Dragon Ball Z',sortOrder:50,canonical:true,sourceEndpoint:'Dragon Ball Z',parentVersionId:'goku-super-saiyan-2'},
 {id:'goku-end-z',characterId:'goku',name:'End of Dragon Ball Z Goku',shortName:'End of Z',aliases:['End Z'],description:'Compatibility version for the existing starter matchup endpoint.',era:'Dragon Ball Z',sortOrder:55,canonical:true,sourceEndpoint:'End of Dragon Ball Z',parentVersionId:'goku-super-saiyan-3'},
 {id:'goku-super-saiyan-god',characterId:'goku',name:'Super Saiyan God Goku',shortName:'Super Saiyan God',aliases:['SSG'],description:'Goku using Super Saiyan God.',era:'Dragon Ball Super',sortOrder:60,canonical:true,sourceEndpoint:'Dragon Ball Super',parentVersionId:'goku-end-z'},
 {id:'goku-super-saiyan-blue',characterId:'goku',name:'Super Saiyan Blue Goku',shortName:'Super Saiyan Blue',aliases:['SSB','Super Saiyan God Super Saiyan'],description:'Goku using Super Saiyan Blue.',era:'Dragon Ball Super',sortOrder:70,canonical:true,sourceEndpoint:'Dragon Ball Super',parentVersionId:'goku-super-saiyan-god'},
 {id:'goku-ui-sign',characterId:'goku',name:'Ultra Instinct Sign Goku',shortName:'UI Sign',aliases:['Ultra Instinct Omen','UI Sign'],description:'Goku using the incomplete Ultra Instinct Sign state.',era:'Dragon Ball Super',sortOrder:80,canonical:true,sourceEndpoint:'Dragon Ball Super',parentVersionId:'goku-super-saiyan-blue'},
 {id:'goku-mastered-ultra-instinct',characterId:'goku',name:'Mastered Ultra Instinct Goku',shortName:'Mastered Ultra Instinct',aliases:['MUI','Ultra Instinct'],description:'Goku using the completed Ultra Instinct state represented by the current catalog endpoint.',era:'Dragon Ball Super',sortOrder:90,canonical:true,sourceEndpoint:'Dragon Ball Super anime, episode 131',parentVersionId:'goku-ui-sign'},

 {id:'naruto-academy',characterId:'naruto',name:'Academy Naruto',shortName:'Academy',aliases:['Academy'],description:'Naruto during his academy-era combat profile.',era:'Naruto',sortOrder:10,canonical:true,sourceEndpoint:'Naruto · Academy era',parentVersionId:null},
 {id:'naruto-chunin-exam',characterId:'naruto',name:'Chunin Exam Naruto',shortName:'Chunin Exam',aliases:['Chūnin Exam','Chunin Exams'],description:'Naruto during the Chunin Exam era.',era:'Naruto',arc:'Chunin Exams',sortOrder:20,canonical:true,sourceEndpoint:'Naruto · Chunin Exams',parentVersionId:'naruto-academy'},
 {id:'naruto-original-series-end',characterId:'naruto',name:'End of Original Series Naruto',shortName:'Original Series End',aliases:['End of original Naruto'],description:'Compatibility version for the existing starter matchup endpoint.',era:'Naruto',sortOrder:25,canonical:true,sourceEndpoint:'End of original Naruto series',parentVersionId:'naruto-chunin-exam'},
 {id:'naruto-shippuden',characterId:'naruto',name:'Shippuden Naruto',shortName:'Shippuden',aliases:['Base Shippuden'],description:'Naruto in his Shippuden-era baseline combat profile.',era:'Naruto Shippuden',sortOrder:30,canonical:true,sourceEndpoint:'Naruto Shippuden',parentVersionId:'naruto-original-series-end'},
 {id:'naruto-sage-mode',characterId:'naruto',name:'Sage Mode Naruto',shortName:'Sage Mode',aliases:['Sage Naruto'],description:'Naruto using Sage Mode.',era:'Naruto Shippuden',sortOrder:40,canonical:true,sourceEndpoint:'Naruto Shippuden',parentVersionId:'naruto-shippuden'},
 {id:'naruto-kcm',characterId:'naruto',name:'KCM Naruto',shortName:'KCM',aliases:['Kurama Chakra Mode','KCM'],description:'Naruto using Kurama Chakra Mode.',era:'Naruto Shippuden',sortOrder:50,canonical:true,sourceEndpoint:'Naruto Shippuden',parentVersionId:'naruto-sage-mode'},
 {id:'naruto-six-paths',characterId:'naruto',name:'Six Paths Naruto',shortName:'Six Paths',aliases:['Six Paths Sage Mode','SPSM'],description:'Naruto using his Six Paths-era combat profile.',era:'Naruto Shippuden',arc:'Fourth Shinobi World War',sortOrder:60,canonical:true,sourceEndpoint:'Naruto Shippuden · Fourth Shinobi World War',parentVersionId:'naruto-kcm'},
 {id:'naruto-baryon-mode',characterId:'naruto',name:'Baryon Mode Naruto',shortName:'Baryon Mode',aliases:['Baryon'],description:'Naruto using Baryon Mode.',era:'Boruto',sortOrder:70,canonical:true,sourceEndpoint:'Boruto-era material',parentVersionId:'naruto-six-paths'},

 {id:'ichigo-shikai',characterId:'ichigo',name:'Shikai Ichigo',shortName:'Shikai',aliases:['Shikai'],description:'Ichigo using the Shikai state represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Bleach anime',parentVersionId:null},
 {id:'ichigo-bankai',characterId:'ichigo',name:'Bankai Ichigo',shortName:'Bankai',aliases:['Bankai'],description:'Ichigo using Bankai.',sortOrder:20,canonical:true,sourceEndpoint:'Bleach anime',parentVersionId:'ichigo-shikai'},
 {id:'ichigo-hollowfication',characterId:'ichigo',name:'Hollowfication Ichigo',shortName:'Hollowfication',aliases:['Hollow Mask'],description:'Ichigo using the Hollowfication state represented in the existing catalog.',sortOrder:30,canonical:true,sourceEndpoint:'Bleach anime',parentVersionId:'ichigo-bankai'},
 {id:'ichigo-original-anime-end',characterId:'ichigo',name:'End of Original Bleach Anime Ichigo',shortName:'Original Anime End',aliases:['End of original Bleach anime'],description:'Compatibility version for the existing starter matchup endpoint.',sortOrder:40,canonical:true,sourceEndpoint:'End of original Bleach anime',parentVersionId:'ichigo-hollowfication'},

 {id:'luffy-east-blue-end',characterId:'luffy',name:'East Blue Luffy',shortName:'East Blue',aliases:['End of East Blue'],description:'Compatibility profile for the existing East Blue starter matchup.',sortOrder:10,canonical:true,sourceEndpoint:'End of East Blue',parentVersionId:null},
 {id:'luffy-base',characterId:'luffy',name:'Base Luffy',shortName:'Base',aliases:['Base'],description:'Luffy baseline combat profile represented in the existing catalog.',sortOrder:20,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:'luffy-east-blue-end'},
 {id:'luffy-gear-2',characterId:'luffy',name:'Gear 2 Luffy',shortName:'Gear 2',aliases:['Gear Second'],description:'Luffy using Gear 2.',sortOrder:30,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:'luffy-base'},
 {id:'luffy-gear-4',characterId:'luffy',name:'Gear 4 Luffy',shortName:'Gear 4',aliases:['Gear Fourth'],description:'Luffy using Gear 4.',sortOrder:40,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:'luffy-gear-2'},
 {id:'luffy-gear-5',characterId:'luffy',name:'Gear 5 Luffy',shortName:'Gear 5',aliases:['Gear Fifth'],description:'Luffy using Gear 5 as represented by the current catalog endpoint.',sortOrder:50,canonical:true,sourceEndpoint:'Egghead anime arc',parentVersionId:'luffy-gear-4'},

 {id:'tanjiro-season-1',characterId:'tanjiro',name:'Season 1 Tanjiro',shortName:'Season 1',aliases:['Season 1'],description:'Compatibility version for the existing starter matchup.',sortOrder:10,canonical:true,sourceEndpoint:'Demon Slayer Season 1',parentVersionId:null},
 {id:'tanjiro-water-breathing',characterId:'tanjiro',name:'Water Breathing Tanjiro',shortName:'Water Breathing',aliases:['Water Breathing'],description:'Tanjiro combat profile centered on Water Breathing from the existing catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Demon Slayer anime',parentVersionId:'tanjiro-season-1'},
 {id:'tanjiro-hinokami-kagura',characterId:'tanjiro',name:'Hinokami Kagura Tanjiro',shortName:'Hinokami Kagura',aliases:['Hinokami Kagura'],description:'Tanjiro combat profile using Hinokami Kagura from the existing catalog.',sortOrder:30,canonical:true,sourceEndpoint:'Hashira Training anime arc',parentVersionId:'tanjiro-water-breathing'},

 {id:'levi-season-1',characterId:'levi',name:'Season 1 Levi',shortName:'Season 1',aliases:['Season 1'],description:'Compatibility version for the existing starter matchup.',sortOrder:10,canonical:true,sourceEndpoint:'Attack on Titan Season 1',parentVersionId:null},
 {id:'levi-standard-odm',characterId:'levi',name:'Standard ODM Levi',shortName:'Standard ODM',aliases:['Standard ODM gear'],description:'Levi with standard ODM gear as represented in the existing catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Attack on Titan anime',parentVersionId:'levi-season-1'},
 {id:'levi-thunder-spears',characterId:'levi',name:'Thunder Spear Levi',shortName:'Thunder Spears',aliases:['Thunder spears'],description:'Levi with Thunder Spear equipment as represented in the existing catalog.',sortOrder:30,canonical:true,sourceEndpoint:'Attack on Titan Final Season',parentVersionId:'levi-standard-odm'},

 {id:'sakura-byakugo',characterId:'sakura',name:'Byakugō Seal Sakura',shortName:'Byakugō Seal',aliases:['Byakugo Seal'],description:'Sakura using the Byakugō Seal state represented in the current catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Naruto Shippuden anime, episode 500',parentVersionId:null},
 {id:'shikamaru-standard',characterId:'shikamaru',name:'Standard Shikamaru',shortName:'Standard',aliases:['Standard shinobi equipment'],description:'Shikamaru with the standard shinobi equipment represented in the current catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Naruto Shippuden anime, episode 500',parentVersionId:null},
 {id:'chopper-brain-point',characterId:'chopper',name:'Brain Point Chopper',shortName:'Brain Point',aliases:['Brain Point'],description:'Chopper using Brain Point.',sortOrder:10,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:null},
 {id:'chopper-guard-point',characterId:'chopper',name:'Guard Point Chopper',shortName:'Guard Point',aliases:['Guard Point'],description:'Chopper using Guard Point.',sortOrder:20,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:'chopper-brain-point'},
 {id:'chopper-monster-point',characterId:'chopper',name:'Monster Point Chopper',shortName:'Monster Point',aliases:['Monster Point'],description:'Chopper using Monster Point as represented in the existing catalog.',sortOrder:30,canonical:true,sourceEndpoint:'Egghead anime arc',parentVersionId:'chopper-guard-point'},
 {id:'mikasa-standard-odm',characterId:'mikasa',name:'Standard ODM Mikasa',shortName:'Standard ODM',aliases:['Standard ODM gear'],description:'Mikasa with standard ODM gear as represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Attack on Titan anime',parentVersionId:null},
 {id:'mikasa-thunder-spears',characterId:'mikasa',name:'Thunder Spear Mikasa',shortName:'Thunder Spears',aliases:['Thunder spears'],description:'Mikasa with Thunder Spear equipment as represented in the existing catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Attack on Titan Final Season',parentVersionId:'mikasa-standard-odm'},
 {id:'usopp-kabuto',characterId:'usopp',name:'Kabuto Usopp',shortName:'Kabuto',aliases:['Kabuto'],description:'Usopp using Kabuto as represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'One Piece anime',parentVersionId:null},
 {id:'usopp-pop-greens',characterId:'usopp',name:'Pop Greens Usopp',shortName:'Pop Greens',aliases:['Pop Greens'],description:'Usopp using Pop Greens as represented in the current catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Egghead anime arc',parentVersionId:'usopp-kabuto'},
 {id:'rukia-shikai',characterId:'rukia',name:'Shikai Rukia',shortName:'Shikai',aliases:['Shikai'],description:'Rukia using Shikai.',sortOrder:10,canonical:true,sourceEndpoint:'Bleach anime',parentVersionId:null},
 {id:'rukia-bankai',characterId:'rukia',name:'Bankai Rukia',shortName:'Bankai',aliases:['Bankai'],description:'Rukia using Bankai as represented in the current catalog endpoint.',sortOrder:20,canonical:true,sourceEndpoint:'Thousand-Year Blood War anime',parentVersionId:'rukia-shikai'},
 {id:'deku-full-cowling',characterId:'deku',name:'Full Cowling Deku',shortName:'Full Cowling',aliases:['Full Cowling'],description:'Deku using Full Cowling as represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'My Hero Academia anime',parentVersionId:null},
 {id:'deku-ofa-100',characterId:'deku',name:'One For All 100% Deku',shortName:'OFA 100%',aliases:['One For All 100%','OFA 100'],description:'Deku using the One For All 100% state represented in the current catalog.',sortOrder:20,canonical:true,sourceEndpoint:'My Hero Academia anime, Final Season',parentVersionId:'deku-full-cowling'},
 {id:'yuji-cursed-energy',characterId:'yuji',name:'Cursed Energy Reinforcement Yuji',shortName:'Cursed Energy',aliases:['Cursed energy reinforcement'],description:'Yuji using cursed-energy reinforcement as represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Jujutsu Kaisen anime',parentVersionId:null},
 {id:'yuji-black-flash',characterId:'yuji',name:'Black Flash Yuji',shortName:'Black Flash',aliases:['Black Flash'],description:'Yuji combat profile centered on Black Flash as represented in the existing catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Shibuya Incident anime arc',parentVersionId:'yuji-cursed-energy'},
 {id:'denji-human',characterId:'denji',name:'Human Denji',shortName:'Human',aliases:['Human'],description:'Denji in human state.',sortOrder:10,canonical:true,sourceEndpoint:'Chainsaw Man anime season 1',parentVersionId:null},
 {id:'denji-chainsaw-hybrid',characterId:'denji',name:'Chainsaw Hybrid Denji',shortName:'Chainsaw Hybrid',aliases:['Chainsaw hybrid'],description:'Denji in his hybrid transformation as represented in the current catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Chainsaw Man anime season 1',parentVersionId:'denji-human'},
 {id:'asta-black-form',characterId:'asta',name:'Black Form Asta',shortName:'Black Form',aliases:['Black form'],description:'Asta using Black Form as represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Black Clover anime',parentVersionId:null},
 {id:'asta-devil-union',characterId:'asta',name:'Devil Union Asta',shortName:'Devil Union',aliases:['Devil Union'],description:'Asta using Devil Union as represented in the current catalog.',sortOrder:20,canonical:true,sourceEndpoint:'Black Clover anime, episode 170',parentVersionId:'asta-black-form'},
 {id:'senku-science-kingdom',characterId:'senku',name:'Science Kingdom Senku',shortName:'Science Kingdom',aliases:['Science Kingdom equipment'],description:'Senku with the Science Kingdom equipment state represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Dr. Stone anime, Science Future',parentVersionId:null},
 {id:'shinra-adolla-burst',characterId:'shinra',name:'Adolla Burst Shinra',shortName:'Adolla Burst',aliases:['Adolla Burst'],description:'Shinra using the Adolla Burst state represented in the existing catalog.',sortOrder:10,canonical:true,sourceEndpoint:'Fire Force anime',parentVersionId:null},
 {id:'shinra-rapid',characterId:'shinra',name:'Rapid Shinra',shortName:'Rapid',aliases:['Rapid'],description:'Shinra combat profile represented by the existing Rapid catalog state.',sortOrder:20,canonical:true,sourceEndpoint:'Fire Force anime season 3',parentVersionId:'shinra-adolla-burst'},

 {id:'madara-edo-tensei',characterId:'madara',name:'Edo Tensei Madara',shortName:'Edo Tensei',aliases:['Reanimated Madara','Edo Madara'],description:'Madara in his reanimated Fourth Shinobi World War combat state.',era:'Naruto Shippuden',arc:'Fourth Shinobi World War',sortOrder:10,canonical:true,sourceEndpoint:'Naruto Shippuden · Fourth Shinobi World War',parentVersionId:null},
 {id:'madara-revived',characterId:'madara',name:'Revived Madara',shortName:'Revived',aliases:['Alive Madara','Revived Uchiha Madara'],description:'Madara after returning to a living body during the Fourth Shinobi World War.',era:'Naruto Shippuden',arc:'Fourth Shinobi World War',sortOrder:20,canonical:true,sourceEndpoint:'Naruto Shippuden · Fourth Shinobi World War',parentVersionId:'madara-edo-tensei'},
 {id:'madara-ten-tails-jinchuriki',characterId:'madara',name:'Ten-Tails Jinchuriki Madara',shortName:'Ten-Tails Jinchuriki',aliases:['Juubi Madara','Six Paths Madara','Ten Tails Madara'],description:'Madara in his Ten-Tails jinchuriki Six Paths-era combat state.',era:'Naruto Shippuden',arc:'Fourth Shinobi World War',sortOrder:30,canonical:true,sourceEndpoint:'Naruto Shippuden · Fourth Shinobi World War',parentVersionId:'madara-revived'},

 {id:'gojo-hidden-inventory-awakened',characterId:'gojo',name:'Awakened Hidden Inventory Gojo',shortName:'Awakened',aliases:['Awakened Gojo','Teen Gojo'],description:'Gojo after his awakening during the Hidden Inventory period.',era:'Jujutsu Kaisen',arc:'Hidden Inventory',sortOrder:10,canonical:true,sourceEndpoint:'Jujutsu Kaisen · Hidden Inventory',parentVersionId:null},
 {id:'gojo-shibuya',characterId:'gojo',name:'Shibuya Incident Gojo',shortName:'Shibuya',aliases:['Shibuya Gojo','Adult Gojo'],description:'Gojo at the Shibuya Incident anime endpoint.',era:'Jujutsu Kaisen',arc:'Shibuya Incident',sortOrder:20,canonical:true,sourceEndpoint:'Jujutsu Kaisen · Shibuya Incident',parentVersionId:'gojo-hidden-inventory-awakened'},
 {id:'gojo-shinjuku',characterId:'gojo',name:'Shinjuku Showdown Gojo',shortName:'Shinjuku',aliases:['Shinjuku Gojo'],description:'Gojo at his Shinjuku Showdown manga combat endpoint.',era:'Jujutsu Kaisen',arc:'Shinjuku Showdown',sortOrder:30,canonical:true,sourceEndpoint:'Jujutsu Kaisen manga · Shinjuku Showdown',parentVersionId:'gojo-shibuya'},

 {id:'itachi-akatsuki',characterId:'itachi',name:'Akatsuki Itachi',shortName:'Akatsuki',aliases:['Living Itachi','Akatsuki-era Itachi'],description:'Itachi during his Akatsuki-era combat profile.',era:'Naruto Shippuden',sortOrder:10,canonical:true,sourceEndpoint:'Naruto Shippuden · Akatsuki era',parentVersionId:null},
 {id:'itachi-edo-tensei',characterId:'itachi',name:'Edo Tensei Itachi',shortName:'Edo Tensei',aliases:['Reanimated Itachi','Edo Itachi'],description:'Itachi in his reanimated Fourth Shinobi World War combat state.',era:'Naruto Shippuden',arc:'Fourth Shinobi World War',sortOrder:20,canonical:true,sourceEndpoint:'Naruto Shippuden · Fourth Shinobi World War',parentVersionId:'itachi-akatsuki'},

 {id:'aizen-soul-society',characterId:'aizen',name:'Soul Society Aizen',shortName:'Soul Society',aliases:['Captain Aizen'],description:'Aizen at the Soul Society conflict endpoint before later Hogyoku transformations.',era:'Bleach',arc:'Soul Society',sortOrder:10,canonical:true,sourceEndpoint:'Bleach · Soul Society arc',parentVersionId:null},
 {id:'aizen-hogyoku',characterId:'aizen',name:'Hogyoku Aizen',shortName:'Hogyoku',aliases:['Hōgyoku Aizen','Transcendent Aizen'],description:'Aizen during his Hogyoku-evolved combat state.',era:'Bleach',arc:'Arrancar / Fake Karakura Town',sortOrder:20,canonical:true,sourceEndpoint:'Bleach · Arrancar conflict',parentVersionId:'aizen-soul-society'},
 {id:'aizen-tybw',characterId:'aizen',name:'Thousand-Year Blood War Aizen',shortName:'TYBW',aliases:['TYBW Aizen','Muken Aizen'],description:'Aizen at the Thousand-Year Blood War anime endpoint.',era:'Bleach: Thousand-Year Blood War',sortOrder:30,canonical:true,sourceEndpoint:'Bleach: Thousand-Year Blood War anime',parentVersionId:'aizen-hogyoku'},

 {id:'saitama-hero-association',characterId:'saitama',name:'Hero Association Saitama',shortName:'Hero Association',aliases:['Caped Baldy','Saitama'],description:'Saitama at the current anime Hero Association combat endpoint.',era:'One-Punch Man',sortOrder:10,canonical:true,sourceEndpoint:'One-Punch Man anime',parentVersionId:null},

 {id:'megumi-season-1',characterId:'megumi',name:'Season 1 Megumi',shortName:'Season 1',aliases:['Season 1'],description:'Megumi at the first-season anime combat endpoint.',era:'Jujutsu Kaisen',sortOrder:10,canonical:true,sourceEndpoint:'Jujutsu Kaisen anime season 1',parentVersionId:null},
 {id:'megumi-shibuya',characterId:'megumi',name:'Shibuya Incident Megumi',shortName:'Shibuya',aliases:['Shibuya Megumi'],description:'Megumi at the Shibuya Incident anime endpoint.',era:'Jujutsu Kaisen',arc:'Shibuya Incident',sortOrder:20,canonical:true,sourceEndpoint:'Jujutsu Kaisen · Shibuya Incident',parentVersionId:'megumi-season-1'},

 {id:"vegeta-saiyan-saga",characterId:"vegeta",name:"Saiyan Saga Vegeta",shortName:"Saiyan Saga",aliases:["Saiyan Prince"],description:"Vegeta during his early confrontation with Earth defenders.",era:"Dragon Ball Z",arc:"Saiyan Saga",sortOrder:10,canonical:true,sourceEndpoint:"Dragon Ball Z · Saiyan Saga",parentVersionId:null},
 {id:"vegeta-super-saiyan-blue",characterId:"vegeta",name:"Super Saiyan Blue Vegeta",shortName:"SSB",aliases:["Super Saiyan Blue","SSB Vegeta"],description:"Vegeta with Super Saiyan Blue as shown in Dragon Ball Super.",era:"Dragon Ball Super",arc:undefined,sortOrder:20,canonical:true,sourceEndpoint:"Dragon Ball Super",parentVersionId:"vegeta-saiyan-saga"},
 {id:"sasuke-hebi",characterId:"sasuke",name:"Hebi Sasuke",shortName:"Hebi",aliases:["Hebi","Post-timeskip"],description:"Sasuke during the Hebi period with Chidori and Sharingan.",era:"Naruto Shippuden",arc:"Hebi",sortOrder:10,canonical:true,sourceEndpoint:"Naruto Shippuden · Hebi",parentVersionId:null},
 {id:"sasuke-rinnegan",characterId:"sasuke",name:"Rinnegan Sasuke",shortName:"Rinnegan",aliases:["Six Paths Sasuke","War Arc Sasuke"],description:"Sasuke after receiving the Rinnegan in the Fourth Shinobi World War.",era:"Naruto Shippuden",arc:"Fourth Shinobi World War",sortOrder:20,canonical:true,sourceEndpoint:"Naruto Shippuden · Fourth Shinobi World War",parentVersionId:"sasuke-hebi"},
 {id:"kakashi-sharingan",characterId:"kakashi",name:"Sharingan Kakashi",shortName:"Sharingan",aliases:["Copy Ninja Kakashi"],description:"Kakashi with Sharingan combat and Raikiri.",era:"Naruto",arc:"Original series",sortOrder:10,canonical:true,sourceEndpoint:"Naruto · Original series",parentVersionId:null},
 {id:"kakashi-war-arc",characterId:"kakashi",name:"War Arc Kakashi",shortName:"War Arc",aliases:["Kamui Kakashi"],description:"Kakashi using Kamui during the Fourth Shinobi World War.",era:"Naruto Shippuden",arc:"Fourth Shinobi World War",sortOrder:20,canonical:true,sourceEndpoint:"Naruto Shippuden · Fourth Shinobi World War",parentVersionId:"kakashi-sharingan"},
 {id:"zoro-enies-lobby",characterId:"zoro",name:"Enies Lobby Zoro",shortName:"Enies Lobby",aliases:["Asura Zoro"],description:"Zoro with three-sword style during Enies Lobby.",era:"One Piece",arc:"Enies Lobby",sortOrder:10,canonical:true,sourceEndpoint:"One Piece · Enies Lobby",parentVersionId:null},
 {id:"zoro-wano",characterId:"zoro",name:"Wano Zoro",shortName:"Wano",aliases:["King of Hell Zoro","Enma Zoro"],description:"Zoro with Wano-era sword techniques and Haki.",era:"One Piece",arc:"Wano Country",sortOrder:20,canonical:true,sourceEndpoint:"One Piece · Wano Country",parentVersionId:"zoro-enies-lobby"},
 {id:"sanji-enies-lobby",characterId:"sanji",name:"Enies Lobby Sanji",shortName:"Enies Lobby",aliases:["Diable Jambe Sanji"],description:"Sanji during Enies Lobby with Diable Jambe.",era:"One Piece",arc:"Enies Lobby",sortOrder:10,canonical:true,sourceEndpoint:"One Piece · Enies Lobby",parentVersionId:null},
 {id:"sanji-wano",characterId:"sanji",name:"Wano Sanji",shortName:"Wano",aliases:["Ifrit Jambe Sanji"],description:"Sanji using Ifrit Jambe during Wano.",era:"One Piece",arc:"Wano Country",sortOrder:20,canonical:true,sourceEndpoint:"One Piece · Wano Country",parentVersionId:"sanji-enies-lobby"},
 {id:"sukuna-vessel",characterId:"sukuna",name:"Early Vessel Sukuna",shortName:"Vessel",aliases:["Yuji Vessel","Early Sukuna"],description:"Sukuna manifesting through Yuji's body during early anime arcs.",era:"Jujutsu Kaisen",arc:"Season 1",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen · Season 1",parentVersionId:null},
 {id:"sukuna-shibuya",characterId:"sukuna",name:"Shibuya Sukuna",shortName:"Shibuya",aliases:["Malevolent Shrine Sukuna"],description:"Sukuna during the Shibuya Incident anime arc.",era:"Jujutsu Kaisen",arc:"Shibuya Incident",sortOrder:20,canonical:true,sourceEndpoint:"Jujutsu Kaisen · Shibuya Incident",parentVersionId:"sukuna-vessel"},
 {id:"yuta-jujutsu-zero",characterId:"yuta",name:"Jujutsu Kaisen 0 Yuta",shortName:"JJK 0",aliases:["Jujutsu Kaisen Zero","Yuta Okkotsu Film"],description:"Yuta at the end of the Jujutsu Kaisen 0 film.",era:"Jujutsu Kaisen 0",arc:"JJK 0",sortOrder:10,canonical:true,sourceEndpoint:"Jujutsu Kaisen 0 · JJK 0",parentVersionId:null},
 {id:"yuta-culling-game",characterId:"yuta",name:"Culling Game Yuta",shortName:"Culling Game",aliases:["Sendai Colony Yuta","Manga Yuta"],description:"Yuta during the Culling Game manga arc; manga spoilers.",era:"Jujutsu Kaisen manga",arc:"Culling Game",sortOrder:20,canonical:true,sourceEndpoint:"Jujutsu Kaisen manga · Culling Game",parentVersionId:"yuta-jujutsu-zero"},
 {id:"nezuko-season-1",characterId:"nezuko",name:"Season 1 Nezuko",shortName:"Season 1",aliases:["Early Nezuko"],description:"Nezuko's initial demon combat profile.",era:"Demon Slayer",arc:"Season 1",sortOrder:10,canonical:true,sourceEndpoint:"Demon Slayer · Season 1",parentVersionId:null},
 {id:"nezuko-entertainment-district",characterId:"nezuko",name:"Entertainment District Nezuko",shortName:"Entertainment District",aliases:["Exploding Blood Nezuko"],description:"Nezuko during the Entertainment District anime arc.",era:"Demon Slayer",arc:"Entertainment District",sortOrder:20,canonical:true,sourceEndpoint:"Demon Slayer · Entertainment District",parentVersionId:"nezuko-season-1"},
];

export const abilities:Ability[]=[
 {id:"byakuya-senbonzakura",characterId:"byakuya",name:"Senbonzakura",description:"Senbonzakura and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"toshiro-hyorinmaru",characterId:"toshiro",name:"Hyorinmaru",description:"Hyorinmaru and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"urahara-benihime",characterId:"urahara",name:"Benihime",description:"Benihime and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"mayuri-ashisogi",characterId:"mayuri",name:"Ashisogi Jizo",description:"Ashisogi Jizo and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"shunsui-katen",characterId:"shunsui",name:"Katen Kyokotsu",description:"Katen Kyokotsu and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"yamamoto-ryujin",characterId:"yamamoto",name:"Ryujin Jakka",description:"Ryujin Jakka and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"renji-zabimaru",characterId:"renji",name:"Zabimaru",description:"Zabimaru and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"uryu-quincy-bow",characterId:"uryu",name:"Quincy Spirit Bow",description:"Quincy Spirit Bow and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"chad-brazo",characterId:"chad",name:"Brazo Derecha de Gigante",description:"Brazo Derecha de Gigante and associated combat techniques; exact effects require matchup rules.",category:"physical"},
 {id:"unohana-kaido",characterId:"unohana",name:"Kaido Healing",description:"Kaido Healing and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"komamura-tenken",characterId:"komamura",name:"Tenken",description:"Tenken and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"soifon-suzumebachi",characterId:"soifon",name:"Suzumebachi",description:"Suzumebachi and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"grimmjow-pantera",characterId:"grimmjow",name:"Pantera",description:"Pantera and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"ulquiorra-murcielago",characterId:"ulquiorra",name:"Murcielago",description:"Murcielago and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"starrk-los-lobos",characterId:"starrk",name:"Los Lobos",description:"Los Lobos and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"barragan-respira",characterId:"barragan",name:"Respira",description:"Respira and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"nelliel-gamuza",characterId:"nelliel",name:"Gamuza",description:"Gamuza and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"harribel-tiburon",characterId:"harribel",name:"Tiburon",description:"Tiburon and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"yhwach-almighty",characterId:"yhwach",name:"The Almighty",description:"The Almighty and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"jugram-balance",characterId:"jugram",name:"The Balance",description:"The Balance and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"askin-deathdealing",characterId:"askin",name:"The Deathdealing",description:"The Deathdealing and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"lille-x-axis",characterId:"lille",name:"The X-Axis",description:"The X-Axis and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"gerard-miracle",characterId:"gerard",name:"The Miracle",description:"The Miracle and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"gremmy-visionary",characterId:"gremmy",name:"The Visionary",description:"The Visionary and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"pernida-compulsory",characterId:"pernida",name:"The Compulsory",description:"The Compulsory and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"gin-shinso",characterId:"gin",name:"Shinso",description:"Shinso and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"kaname-suzumushi",characterId:"kaname",name:"Suzumushi",description:"Suzumushi and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"ikkaku-hozuki",characterId:"ikkaku",name:"Hozukimaru",description:"Hozukimaru and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"yumichika-ruri-iro",characterId:"yumichika",name:"Ruri'iro Kujaku",description:"Ruri'iro Kujaku and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"nnoitra-santa-teresa",characterId:"nnoitra",name:"Santa Teresa",description:"Santa Teresa and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"szayel-fornicaras",characterId:"szayel",name:"Fornicaras",description:"Fornicaras and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"halibel-fraccion-resurreccion",characterId:"halibel-fraccion",name:"Resurreccion",description:"Resurreccion and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"kensei-tachikaze",characterId:"kensei",name:"Tachikaze",description:"Tachikaze and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"shiniji-sakanade",characterId:"shiniji",name:"Sakanade",description:"Sakanade and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"hiyori-kubikiri",characterId:"hiyori",name:"Kubikiri Orochi",description:"Kubikiri Orochi and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"obito-kamui",characterId:"obito",name:"Kamui",description:"Kamui and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"orochimaru-snake-summoning",characterId:"orochimaru",name:"Snake Summoning",description:"Snake Summoning and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"pain-six-paths",characterId:"pain",name:"Six Paths of Pain",description:"Six Paths of Pain and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"kaguya-dimension-shift",characterId:"kaguya",name:"Amenominaka",description:"Amenominaka and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"kabuto-medical-ninjutsu",characterId:"kabuto",name:"Medical Ninjutsu",description:"Medical Ninjutsu and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"deidara-explosive-clay",characterId:"deidara",name:"Explosive Clay",description:"Explosive Clay and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"sasori-puppetry",characterId:"sasori",name:"Human Puppet Technique",description:"Human Puppet Technique and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"kisame-samehada",characterId:"kisame",name:"Samehada",description:"Samehada and associated combat techniques; exact effects require matchup rules.",category:"weapon"},
 {id:"frieza-death-beam",characterId:"frieza",name:"Death Beam",description:"Death Beam and associated combat techniques; exact effects require matchup rules.",category:"energy"},
 {id:"cell-regeneration",characterId:"cell",name:"Cell Regeneration",description:"Cell Regeneration and associated combat techniques; exact effects require matchup rules.",category:"passive"},
 {id:"majin-buu-regeneration",characterId:"majin-buu",name:"Majin Regeneration",description:"Majin Regeneration and associated combat techniques; exact effects require matchup rules.",category:"passive"},
 {id:"goku-black-ki-blade",characterId:"goku-black",name:"Ki Blade",description:"Ki Blade and associated combat techniques; exact effects require matchup rules.",category:"energy"},
 {id:"zamasu-immortality",characterId:"zamasu",name:"Immortality",description:"Immortality and associated combat techniques; exact effects require matchup rules.",category:"passive"},
 {id:"kenjaku-curse-manipulation",characterId:"kenjaku",name:"Cursed Spirit Manipulation",description:"Cursed Spirit Manipulation and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"mahito-idle-transfiguration",characterId:"mahito",name:"Idle Transfiguration",description:"Idle Transfiguration and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"jogo-volcanic-curses",characterId:"jogo",name:"Volcanic Cursed Technique",description:"Volcanic Cursed Technique and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"hanami-plant-manipulation",characterId:"hanami",name:"Plant Manipulation",description:"Plant Manipulation and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"dagon-death-swarm",characterId:"dagon",name:"Death Swarm",description:"Death Swarm and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"meruem-royal-guard-physique",characterId:"meruem",name:"Chimera Ant Physiology",description:"Chimera Ant Physiology and associated combat techniques; exact effects require matchup rules.",category:"physical"},
 {id:"chrollo-skill-hunter",characterId:"chrollo",name:"Skill Hunter",description:"Skill Hunter and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"hisoka-bungee-gum",characterId:"hisoka",name:"Bungee Gum",description:"Bungee Gum and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"neferpitou-doctor-blythe",characterId:"neferpitou",name:"Doctor Blythe",description:"Doctor Blythe and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"blackbeard-yami-yami",characterId:"blackbeard",name:"Yami Yami no Mi",description:"Yami Yami no Mi and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"doflamingo-ito-ito",characterId:"doflamingo",name:"Ito Ito no Mi",description:"Ito Ito no Mi and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"crocodile-suna-suna",characterId:"crocodile",name:"Suna Suna no Mi",description:"Suna Suna no Mi and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"enel-goro-goro",characterId:"enel",name:"Goro Goro no Mi",description:"Goro Goro no Mi and associated combat techniques; exact effects require matchup rules.",category:"energy"},
 {id:"kaido-dragon-form",characterId:"kaido",name:"Azure Dragon Transformation",description:"Azure Dragon Transformation and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"big-mom-soru-soru",characterId:"big-mom",name:"Soru Soru no Mi",description:"Soru Soru no Mi and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"lucci-leopard",characterId:"lucci",name:"Leopard Zoan",description:"Leopard Zoan and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"marco-phoenix",characterId:"marco",name:"Phoenix Flames",description:"Phoenix Flames and associated combat techniques; exact effects require matchup rules.",category:"transformation"},
 {id:"tsunade-creation-rebirth",characterId:"tsunade",name:"Creation Rebirth",description:"Creation Rebirth and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"shoko-rct",characterId:"shoko",name:"Reverse Cursed Technique",description:"Reverse Cursed Technique and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"dende-healing",characterId:"dende",name:"Namekian Healing",description:"Namekian Healing and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"wendy-sky-dragon",characterId:"wendy",name:"Sky Dragon Healing Magic",description:"Sky Dragon Healing Magic and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"lucy-celestial",characterId:"lucy",name:"Celestial Spirit Magic",description:"Celestial Spirit Magic and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"jinwoo-shadow-extraction",characterId:"jinwoo",name:"Shadow Extraction",description:"Shadow Extraction and associated combat techniques; exact effects require matchup rules.",category:"summoning"},
 {id:"rimuru-predator",characterId:"rimuru",name:"Predator",description:"Predator and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"giorno-gold-experience",characterId:"giorno",name:"Gold Experience",description:"Gold Experience and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"asta-extra-water-magic",characterId:"asta-extra",name:"Water Magic",description:"Water Magic and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"mimosa-plant-healing",characterId:"mimosa",name:"Plant Healing Magic",description:"Plant Healing Magic and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:"vanessa-rouge",characterId:"vanessa",name:"Red Thread of Fate",description:"Red Thread of Fate and associated combat techniques; exact effects require matchup rules.",category:"hax"},
 {id:"charmy-food-magic",characterId:"charmy",name:"Food Magic",description:"Food Magic and associated combat techniques; exact effects require matchup rules.",category:"technique"},
 {id:'yoruichi-flash-step',characterId:'yoruichi',name:'Flash Step',description:'Flash Step as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'mobility'},
 {id:'yoruichi-hakuda',characterId:'yoruichi',name:'Hakuda',description:'Hakuda as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'physical'},
 {id:'yoruichi-shunko',characterId:'yoruichi',name:'Shunko',description:'Shunko as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'technique'},
 {id:'orihime-santen',characterId:'orihime',name:'Santen Kesshun',description:'Santen Kesshun as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'defensive'},
 {id:'orihime-soten',characterId:'orihime',name:'Soten Kisshun',description:'Soten Kisshun as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'technique'},
 {id:'orihime-koten',characterId:'orihime',name:'Koten Zanshun',description:'Koten Zanshun as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'technique'},
 {id:'kenpachi-sword',characterId:'kenpachi',name:'Zanpakuto Swordsmanship',description:'Zanpakuto Swordsmanship as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'physical'},
 {id:'kenpachi-nozarashi',characterId:'kenpachi',name:'Nozarashi Shikai',description:'Nozarashi Shikai as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'weapon'},
 {id:'kenpachi-bankai',characterId:'kenpachi',name:'Bankai',description:'Bankai as shown in the associated Bleach continuity; only available to explicitly linked versions.',category:'transformation'},
 {id:'goku-martial-arts',characterId:'goku',name:'Martial Arts',description:'Close-range martial arts skill from the existing catalog profile.',category:'physical'},
 {id:'goku-ki-control',characterId:'goku',name:'Ki Control',description:'Energy manipulation and combat reinforcement.',category:'energy'},
 {id:'goku-kamehameha',characterId:'goku',name:'Kamehameha',description:'Signature ki-wave technique.',category:'technique'},
 {id:'goku-super-saiyan-ability',characterId:'goku',name:'Super Saiyan',description:'Super Saiyan transformation access.',category:'transformation'},
 {id:'goku-god-ki',characterId:'goku',name:'God Ki',description:'Divine ki used by later Dragon Ball Super profiles.',category:'energy'},
 {id:'goku-blue-ability',characterId:'goku',name:'Super Saiyan Blue',description:'God-ki Super Saiyan state.',category:'transformation'},
 {id:'goku-ui',characterId:'goku',name:'Ultra Instinct',description:'Autonomous combat movement associated with Ultra Instinct states.',category:'passive'},

 {id:'naruto-shadow-clone',characterId:'naruto',name:'Shadow Clone Technique',description:'Clone technique represented in the existing catalog summary.',category:'technique'},
 {id:'naruto-rasengan',characterId:'naruto',name:'Rasengan',description:'Rotating chakra technique and its later variants.',category:'technique'},
 {id:'naruto-sage-ability',characterId:'naruto',name:'Sage Mode',description:'Sage Mode transformation and sensory combat state.',category:'transformation'},
 {id:'naruto-kurama-chakra',characterId:'naruto',name:'Kurama Chakra Mode',description:'Kurama chakra transformation state.',category:'transformation'},
 {id:'naruto-six-paths-sage',characterId:'naruto',name:'Six Paths Sage Mode',description:'Six Paths-era enhanced state.',category:'transformation'},
 {id:'naruto-truth-seeking-orbs',characterId:'naruto',name:'Truth-Seeking Orbs',description:'Six Paths-era orb technique.',category:'hax'},
 {id:'naruto-baryon',characterId:'naruto',name:'Baryon Mode',description:'Baryon Mode transformation state.',category:'transformation'},

 {id:'ichigo-zanpakuto',characterId:'ichigo',name:'Zanpakutō Combat',description:'Sword combat from the existing catalog summary.',category:'weapon'},
 {id:'ichigo-getsuga',characterId:'ichigo',name:'Getsuga Tenshō',description:'Energy attack from the existing catalog summary.',category:'technique'},
 {id:'luffy-haki',characterId:'luffy',name:'Haki',description:'Haki-based combat from the existing catalog summary.',category:'energy'},
 {id:'tanjiro-swordplay',characterId:'tanjiro',name:'Precision Swordplay',description:'Sword technique from the existing catalog summary.',category:'weapon'},
 {id:'levi-odm',characterId:'levi',name:'ODM Mobility',description:'ODM movement and aerial positioning from the existing catalog summary.',category:'mobility'},
 {id:'sakura-medical',characterId:'sakura',name:'Medical Ninjutsu',description:'Medical support from the existing catalog summary.',category:'technique'},
 {id:'shikamaru-shadow',characterId:'shikamaru',name:'Shadow Possession',description:'Shadow possession control from the existing catalog summary.',category:'hax'},
 {id:'chopper-medicine',characterId:'chopper',name:'Field Medicine',description:'Medical support from the existing catalog summary.',category:'technique'},
 {id:'mikasa-odm',characterId:'mikasa',name:'ODM Mobility',description:'ODM movement from the existing catalog summary.',category:'mobility'},
 {id:'usopp-marksmanship',characterId:'usopp',name:'Long-range Marksmanship',description:'Ranged combat from the existing catalog summary.',category:'weapon'},
 {id:'rukia-ice-zanpakuto',characterId:'rukia',name:'Ice-type Zanpakutō',description:'Ice-based Zanpakutō combat from the existing catalog summary.',category:'weapon'},
 {id:'deku-ofa',characterId:'deku',name:'One For All',description:'One For All output from the existing catalog summary.',category:'energy'},
 {id:'yuji-cursed-energy-ability',characterId:'yuji',name:'Cursed Energy Reinforcement',description:'Cursed-energy reinforcement from the existing catalog summary.',category:'energy'},
 {id:'denji-chainsaws',characterId:'denji',name:'Chainsaw Hybrid Transformation',description:'Hybrid transformation from the existing catalog summary.',category:'transformation'},
 {id:'asta-anti-magic',characterId:'asta',name:'Anti-Magic Swords',description:'Anti-magic sword combat from the existing catalog summary.',category:'weapon'},
 {id:'senku-science',characterId:'senku',name:'Scientific Planning',description:'Scientific planning and invention from the existing catalog summary.',category:'other'},
 {id:'shinra-ignition',characterId:'shinra',name:'Third-generation Ignition',description:'Ignition ability from the existing catalog summary.',category:'energy'},

 {id:'madara-ocular',characterId:'madara',name:'Sharingan and Rinnegan',description:'Ocular techniques associated with Madara combat profiles.',category:'sensory'},
 {id:'madara-susanoo',characterId:'madara',name:'Susanoo',description:'Uchiha chakra avatar used for offense and defense.',category:'defensive'},
 {id:'madara-limbo',characterId:'madara',name:'Limbo',description:'Six Paths-era parallel shadow technique.',category:'hax'},
 {id:'madara-ten-tails',characterId:'madara',name:'Ten-Tails Jinchuriki',description:'Ten-Tails jinchuriki transformation state.',category:'transformation'},

 {id:'gojo-limitless',characterId:'gojo',name:'Limitless',description:'Spatial cursed technique used for Infinity, Blue, Red, and Hollow Purple applications.',category:'hax'},
 {id:'gojo-six-eyes',characterId:'gojo',name:'Six Eyes',description:'Exceptional cursed-energy perception and efficiency.',category:'sensory'},
 {id:'gojo-unlimited-void',characterId:'gojo',name:'Unlimited Void',description:'Gojo domain expansion.',category:'hax'},
 {id:'gojo-rct',characterId:'gojo',name:'Reverse Cursed Technique',description:'Reverse cursed energy used for recovery and technique support.',category:'technique'},

 {id:'itachi-genjutsu',characterId:'itachi',name:'Sharingan Genjutsu',description:'Sharingan-based illusion techniques including high-level genjutsu.',category:'hax'},
 {id:'itachi-amaterasu',characterId:'itachi',name:'Amaterasu',description:'Mangekyo Sharingan black-flame technique.',category:'technique'},
 {id:'itachi-susanoo',characterId:'itachi',name:'Susanoo',description:'Itachi defensive and offensive chakra avatar.',category:'defensive'},

 {id:'aizen-kyoka-suigetsu',characterId:'aizen',name:'Kyoka Suigetsu',description:'Complete hypnosis through Aizen zanpakuto ability.',category:'hax'},
 {id:'aizen-kido',characterId:'aizen',name:'Kido',description:'High-level Soul Reaper spell techniques.',category:'technique'},
 {id:'aizen-hogyoku-ability',characterId:'aizen',name:'Hogyoku Evolution',description:'Hogyoku-driven transformation and adaptation state.',category:'transformation'},

 {id:'saitama-physical',characterId:'saitama',name:'Overwhelming Physical Ability',description:'Extreme strength, speed, durability, and close-range combat.',category:'physical'},
 {id:'saitama-serious-punch',characterId:'saitama',name:'Serious Punch',description:'A named high-output punch from Saitama serious-series attacks.',category:'technique'},

 {id:'megumi-ten-shadows',characterId:'megumi',name:'Ten Shadows Technique',description:'Shikigami-based inherited cursed technique.',category:'summoning'},
 {id:'megumi-chimera-shadow-garden',characterId:'megumi',name:'Chimera Shadow Garden',description:'Megumi incomplete domain expansion.',category:'hax'},

 {id:"vegeta-ki",characterId:"vegeta",name:"Saiyan Ki Combat",description:"Ki blasts and martial arts with Saiyan combat strength.",category:"energy"},
 {id:"vegeta-galick-gun",characterId:"vegeta",name:"Galick Gun",description:"Directed ki-beam attack.",category:"technique"},
 {id:"vegeta-blue",characterId:"vegeta",name:"Super Saiyan Blue",description:"God-ki Super Saiyan transformation.",category:"transformation"},
 {id:"sasuke-chidori",characterId:"sasuke",name:"Chidori",description:"Lightning nature transformation concentrated in a close-range thrust.",category:"technique"},
 {id:"sasuke-sharingan",characterId:"sasuke",name:"Sharingan",description:"Uchiha visual perception and genjutsu.",category:"sensory"},
 {id:"sasuke-rinnegan-ability",characterId:"sasuke",name:"Rinnegan",description:"Six Paths ocular techniques including space-time substitution.",category:"hax"},
 {id:"kakashi-raikiri",characterId:"kakashi",name:"Raikiri",description:"Lightning Blade, a precision lightning attack.",category:"technique"},
 {id:"kakashi-sharingan",characterId:"kakashi",name:"Sharingan",description:"Copy-ninja ocular tracking and combat analysis.",category:"sensory"},
 {id:"kakashi-kamui",characterId:"kakashi",name:"Kamui",description:"Mangekyo Sharingan space-time technique.",category:"hax"},
 {id:"zoro-three-sword",characterId:"zoro",name:"Three-Sword Style",description:"Santoryu swordsmanship using three blades.",category:"weapon"},
 {id:"zoro-armament",characterId:"zoro",name:"Armament Haki",description:"Haki reinforcement for attacks and defense.",category:"energy"},
 {id:"zoro-king-of-hell",characterId:"zoro",name:"King of Hell Style",description:"Advanced sword techniques associated with Enma and Haki.",category:"technique"},
 {id:"sanji-black-leg",characterId:"sanji",name:"Black Leg Style",description:"High-speed kicking-based martial arts.",category:"physical"},
 {id:"sanji-diable-jambe",characterId:"sanji",name:"Diable Jambe",description:"Flame-enhanced kicks.",category:"technique"},
 {id:"sanji-ifrit-jambe",characterId:"sanji",name:"Ifrit Jambe",description:"Advanced hotter flame-enhanced kicks.",category:"technique"},
 {id:"sukuna-slashes",characterId:"sukuna",name:"Cleave and Dismantle",description:"Sukuna's slashing cursed techniques.",category:"technique"},
 {id:"sukuna-rct",characterId:"sukuna",name:"Reverse Cursed Technique",description:"Cursed-energy-based regeneration.",category:"defensive"},
 {id:"sukuna-domain",characterId:"sukuna",name:"Malevolent Shrine",description:"Open-barrier domain expansion.",category:"hax"},
 {id:"yuta-sword",characterId:"yuta",name:"Cursed Energy Swordplay",description:"Katana fighting reinforced with cursed energy.",category:"weapon"},
 {id:"yuta-rika",characterId:"yuta",name:"Rika",description:"Rika manifestation used for support and combat.",category:"summoning"},
 {id:"yuta-copy",characterId:"yuta",name:"Copy",description:"Conditional use of copied cursed techniques.",category:"hax"},
 {id:"nezuko-regeneration",characterId:"nezuko",name:"Demon Regeneration",description:"Rapid healing as a demon.",category:"defensive"},
 {id:"nezuko-kicks",characterId:"nezuko",name:"Close-Range Kicks",description:"Powerful close-range physical combat.",category:"physical"},
 {id:"nezuko-exploding-blood",characterId:"nezuko",name:"Exploding Blood",description:"Nezuko's burning Blood Demon Art.",category:"technique"},
];

export const versionAbilities:VersionAbility[]=[
 {versionId:"byakuya-standard",abilityId:"byakuya-senbonzakura",status:'available'},
 {versionId:"toshiro-standard",abilityId:"toshiro-hyorinmaru",status:'available'},
 {versionId:"urahara-standard",abilityId:"urahara-benihime",status:'available'},
 {versionId:"mayuri-standard",abilityId:"mayuri-ashisogi",status:'available'},
 {versionId:"shunsui-standard",abilityId:"shunsui-katen",status:'available'},
 {versionId:"yamamoto-standard",abilityId:"yamamoto-ryujin",status:'available'},
 {versionId:"renji-standard",abilityId:"renji-zabimaru",status:'available'},
 {versionId:"uryu-standard",abilityId:"uryu-quincy-bow",status:'available'},
 {versionId:"chad-standard",abilityId:"chad-brazo",status:'available'},
 {versionId:"unohana-standard",abilityId:"unohana-kaido",status:'available'},
 {versionId:"komamura-standard",abilityId:"komamura-tenken",status:'available'},
 {versionId:"soifon-standard",abilityId:"soifon-suzumebachi",status:'available'},
 {versionId:"grimmjow-standard",abilityId:"grimmjow-pantera",status:'available'},
 {versionId:"ulquiorra-standard",abilityId:"ulquiorra-murcielago",status:'available'},
 {versionId:"starrk-standard",abilityId:"starrk-los-lobos",status:'available'},
 {versionId:"barragan-standard",abilityId:"barragan-respira",status:'available'},
 {versionId:"nelliel-standard",abilityId:"nelliel-gamuza",status:'available'},
 {versionId:"harribel-standard",abilityId:"harribel-tiburon",status:'available'},
 {versionId:"yhwach-standard",abilityId:"yhwach-almighty",status:'available'},
 {versionId:"jugram-standard",abilityId:"jugram-balance",status:'available'},
 {versionId:"askin-standard",abilityId:"askin-deathdealing",status:'available'},
 {versionId:"lille-standard",abilityId:"lille-x-axis",status:'available'},
 {versionId:"gerard-standard",abilityId:"gerard-miracle",status:'available'},
 {versionId:"gremmy-standard",abilityId:"gremmy-visionary",status:'available'},
 {versionId:"pernida-standard",abilityId:"pernida-compulsory",status:'available'},
 {versionId:"gin-standard",abilityId:"gin-shinso",status:'available'},
 {versionId:"kaname-standard",abilityId:"kaname-suzumushi",status:'available'},
 {versionId:"ikkaku-standard",abilityId:"ikkaku-hozuki",status:'available'},
 {versionId:"yumichika-standard",abilityId:"yumichika-ruri-iro",status:'available'},
 {versionId:"nnoitra-standard",abilityId:"nnoitra-santa-teresa",status:'available'},
 {versionId:"szayel-standard",abilityId:"szayel-fornicaras",status:'available'},
 {versionId:"halibel-fraccion-standard",abilityId:"halibel-fraccion-resurreccion",status:'available'},
 {versionId:"kensei-standard",abilityId:"kensei-tachikaze",status:'available'},
 {versionId:"shiniji-standard",abilityId:"shiniji-sakanade",status:'available'},
 {versionId:"hiyori-standard",abilityId:"hiyori-kubikiri",status:'available'},
 {versionId:"obito-standard",abilityId:"obito-kamui",status:'available'},
 {versionId:"orochimaru-standard",abilityId:"orochimaru-snake-summoning",status:'available'},
 {versionId:"pain-standard",abilityId:"pain-six-paths",status:'available'},
 {versionId:"kaguya-standard",abilityId:"kaguya-dimension-shift",status:'available'},
 {versionId:"kabuto-standard",abilityId:"kabuto-medical-ninjutsu",status:'available'},
 {versionId:"deidara-standard",abilityId:"deidara-explosive-clay",status:'available'},
 {versionId:"sasori-standard",abilityId:"sasori-puppetry",status:'available'},
 {versionId:"kisame-standard",abilityId:"kisame-samehada",status:'available'},
 {versionId:"frieza-standard",abilityId:"frieza-death-beam",status:'available'},
 {versionId:"cell-standard",abilityId:"cell-regeneration",status:'available'},
 {versionId:"majin-buu-standard",abilityId:"majin-buu-regeneration",status:'available'},
 {versionId:"goku-black-standard",abilityId:"goku-black-ki-blade",status:'available'},
 {versionId:"zamasu-standard",abilityId:"zamasu-immortality",status:'available'},
 {versionId:"kenjaku-standard",abilityId:"kenjaku-curse-manipulation",status:'available'},
 {versionId:"mahito-standard",abilityId:"mahito-idle-transfiguration",status:'available'},
 {versionId:"jogo-standard",abilityId:"jogo-volcanic-curses",status:'available'},
 {versionId:"hanami-standard",abilityId:"hanami-plant-manipulation",status:'available'},
 {versionId:"dagon-standard",abilityId:"dagon-death-swarm",status:'available'},
 {versionId:"meruem-standard",abilityId:"meruem-royal-guard-physique",status:'available'},
 {versionId:"chrollo-standard",abilityId:"chrollo-skill-hunter",status:'available'},
 {versionId:"hisoka-standard",abilityId:"hisoka-bungee-gum",status:'available'},
 {versionId:"neferpitou-standard",abilityId:"neferpitou-doctor-blythe",status:'available'},
 {versionId:"blackbeard-standard",abilityId:"blackbeard-yami-yami",status:'available'},
 {versionId:"doflamingo-standard",abilityId:"doflamingo-ito-ito",status:'available'},
 {versionId:"crocodile-standard",abilityId:"crocodile-suna-suna",status:'available'},
 {versionId:"enel-standard",abilityId:"enel-goro-goro",status:'available'},
 {versionId:"kaido-standard",abilityId:"kaido-dragon-form",status:'available'},
 {versionId:"big-mom-standard",abilityId:"big-mom-soru-soru",status:'available'},
 {versionId:"lucci-standard",abilityId:"lucci-leopard",status:'available'},
 {versionId:"marco-standard",abilityId:"marco-phoenix",status:'available'},
 {versionId:"tsunade-standard",abilityId:"tsunade-creation-rebirth",status:'available'},
 {versionId:"shoko-standard",abilityId:"shoko-rct",status:'available'},
 {versionId:"dende-standard",abilityId:"dende-healing",status:'available'},
 {versionId:"wendy-standard",abilityId:"wendy-sky-dragon",status:'available'},
 {versionId:"lucy-standard",abilityId:"lucy-celestial",status:'available'},
 {versionId:"jinwoo-standard",abilityId:"jinwoo-shadow-extraction",status:'available'},
 {versionId:"rimuru-standard",abilityId:"rimuru-predator",status:'available'},
 {versionId:"giorno-standard",abilityId:"giorno-gold-experience",status:'available'},
 {versionId:"asta-extra-standard",abilityId:"asta-extra-water-magic",status:'available'},
 {versionId:"mimosa-standard",abilityId:"mimosa-plant-healing",status:'available'},
 {versionId:"vanessa-standard",abilityId:"vanessa-rouge",status:'available'},
 {versionId:"charmy-standard",abilityId:"charmy-food-magic",status:'available'},
 {versionId:'yoruichi-standard',abilityId:'yoruichi-flash-step',status:'available'},
 {versionId:'yoruichi-standard',abilityId:'yoruichi-hakuda',status:'available'},
 {versionId:'yoruichi-shunko',abilityId:'yoruichi-flash-step',status:'available'},
 {versionId:'yoruichi-shunko',abilityId:'yoruichi-hakuda',status:'available'},
 {versionId:'yoruichi-shunko',abilityId:'yoruichi-shunko',status:'available'},
 {versionId:'orihime-arrancar',abilityId:'orihime-santen',status:'available'},
 {versionId:'orihime-arrancar',abilityId:'orihime-soten',status:'available'},
 {versionId:'orihime-arrancar',abilityId:'orihime-koten',status:'available'},
 {versionId:'orihime-tybw',abilityId:'orihime-santen',status:'available'},
 {versionId:'orihime-tybw',abilityId:'orihime-soten',status:'available'},
 {versionId:'orihime-tybw',abilityId:'orihime-koten',status:'available'},
 {versionId:'kenpachi-early',abilityId:'kenpachi-sword',status:'available'},
 {versionId:'kenpachi-shikai',abilityId:'kenpachi-sword',status:'available'},
 {versionId:'kenpachi-shikai',abilityId:'kenpachi-nozarashi',status:'available'},
 {versionId:'kenpachi-bankai',abilityId:'kenpachi-sword',status:'available'},
 {versionId:'kenpachi-bankai',abilityId:'kenpachi-nozarashi',status:'available'},
 {versionId:'kenpachi-bankai',abilityId:'kenpachi-bankai',status:'available'},
 ...['goku-saiyan-saga','goku-namek-saga','goku-super-saiyan','goku-super-saiyan-2','goku-super-saiyan-3','goku-end-z','goku-super-saiyan-god','goku-super-saiyan-blue','goku-ui-sign','goku-mastered-ultra-instinct'].flatMap(versionId=>[
  {versionId,abilityId:'goku-martial-arts',status:'available' as const},
  {versionId,abilityId:'goku-ki-control',status:'available' as const},
  {versionId,abilityId:'goku-kamehameha',status:'available' as const}
 ]),
 ...['goku-super-saiyan','goku-super-saiyan-2','goku-super-saiyan-3','goku-end-z'].map(versionId=>({versionId,abilityId:'goku-super-saiyan-ability',status:'available' as const})),
 ...['goku-super-saiyan-god','goku-super-saiyan-blue','goku-ui-sign','goku-mastered-ultra-instinct'].map(versionId=>({versionId,abilityId:'goku-god-ki',status:'available' as const})),
 {versionId:'goku-super-saiyan-blue',abilityId:'goku-blue-ability',status:'mastered'},
 {versionId:'goku-ui-sign',abilityId:'goku-ui',status:'limited'},
 {versionId:'goku-mastered-ultra-instinct',abilityId:'goku-ui',status:'mastered'},

 ...['naruto-chunin-exam','naruto-original-series-end','naruto-shippuden','naruto-sage-mode','naruto-kcm','naruto-six-paths','naruto-baryon-mode'].map(versionId=>({versionId,abilityId:'naruto-shadow-clone',status:'available' as const})),
 ...['naruto-original-series-end','naruto-shippuden','naruto-sage-mode','naruto-kcm','naruto-six-paths','naruto-baryon-mode'].map(versionId=>({versionId,abilityId:'naruto-rasengan',status:'available' as const})),
 {versionId:'naruto-sage-mode',abilityId:'naruto-sage-ability',status:'mastered'},
 {versionId:'naruto-kcm',abilityId:'naruto-kurama-chakra',status:'available'},
 {versionId:'naruto-six-paths',abilityId:'naruto-six-paths-sage',status:'mastered'},
 {versionId:'naruto-six-paths',abilityId:'naruto-truth-seeking-orbs',status:'available'},
 {versionId:'naruto-baryon-mode',abilityId:'naruto-baryon',status:'conditional'},

 ...['ichigo-shikai','ichigo-bankai','ichigo-hollowfication','ichigo-original-anime-end'].map(versionId=>({versionId,abilityId:'ichigo-zanpakuto',status:'available' as const})),
 ...['ichigo-shikai','ichigo-bankai','ichigo-hollowfication','ichigo-original-anime-end'].map(versionId=>({versionId,abilityId:'ichigo-getsuga',status:'available' as const})),
 ...['luffy-base','luffy-gear-2','luffy-gear-4','luffy-gear-5'].map(versionId=>({versionId,abilityId:'luffy-haki',status:'available' as const})),
 ...['tanjiro-season-1','tanjiro-water-breathing','tanjiro-hinokami-kagura'].map(versionId=>({versionId,abilityId:'tanjiro-swordplay',status:'available' as const})),
 ...['levi-season-1','levi-standard-odm','levi-thunder-spears'].map(versionId=>({versionId,abilityId:'levi-odm',status:'available' as const})),
 {versionId:'sakura-byakugo',abilityId:'sakura-medical',status:'available'},
 {versionId:'shikamaru-standard',abilityId:'shikamaru-shadow',status:'available'},
 ...['chopper-brain-point','chopper-guard-point','chopper-monster-point'].map(versionId=>({versionId,abilityId:'chopper-medicine',status:'available' as const})),
 ...['mikasa-standard-odm','mikasa-thunder-spears'].map(versionId=>({versionId,abilityId:'mikasa-odm',status:'available' as const})),
 ...['usopp-kabuto','usopp-pop-greens'].map(versionId=>({versionId,abilityId:'usopp-marksmanship',status:'available' as const})),
 ...['rukia-shikai','rukia-bankai'].map(versionId=>({versionId,abilityId:'rukia-ice-zanpakuto',status:'available' as const})),
 ...['deku-full-cowling','deku-ofa-100'].map(versionId=>({versionId,abilityId:'deku-ofa',status:'available' as const})),
 ...['yuji-cursed-energy','yuji-black-flash'].map(versionId=>({versionId,abilityId:'yuji-cursed-energy-ability',status:'available' as const})),
 {versionId:'denji-chainsaw-hybrid',abilityId:'denji-chainsaws',status:'available'},
 ...['asta-black-form','asta-devil-union'].map(versionId=>({versionId,abilityId:'asta-anti-magic',status:'available' as const})),
 {versionId:'senku-science-kingdom',abilityId:'senku-science',status:'available'},
 ...['shinra-adolla-burst','shinra-rapid'].map(versionId=>({versionId,abilityId:'shinra-ignition',status:'available' as const})),

 ...['madara-edo-tensei','madara-revived','madara-ten-tails-jinchuriki'].flatMap(versionId=>[
  {versionId,abilityId:'madara-ocular',status:'available' as const},
  {versionId,abilityId:'madara-susanoo',status:'available' as const}
 ]),
 {versionId:'madara-revived',abilityId:'madara-limbo',status:'available'},
 {versionId:'madara-ten-tails-jinchuriki',abilityId:'madara-limbo',status:'available'},
 {versionId:'madara-ten-tails-jinchuriki',abilityId:'madara-ten-tails',status:'mastered'},

 ...['gojo-hidden-inventory-awakened','gojo-shibuya','gojo-shinjuku'].flatMap(versionId=>[
  {versionId,abilityId:'gojo-limitless',status:'mastered' as const},
  {versionId,abilityId:'gojo-six-eyes',status:'available' as const},
  {versionId,abilityId:'gojo-rct',status:'available' as const}
 ]),
 ...['gojo-shibuya','gojo-shinjuku'].map(versionId=>({versionId,abilityId:'gojo-unlimited-void',status:'mastered' as const})),

 ...['itachi-akatsuki','itachi-edo-tensei'].flatMap(versionId=>[
  {versionId,abilityId:'itachi-genjutsu',status:'mastered' as const},
  {versionId,abilityId:'itachi-amaterasu',status:'available' as const},
  {versionId,abilityId:'itachi-susanoo',status:'available' as const}
 ]),

 ...['aizen-soul-society','aizen-hogyoku','aizen-tybw'].flatMap(versionId=>[
  {versionId,abilityId:'aizen-kyoka-suigetsu',status:'mastered' as const},
  {versionId,abilityId:'aizen-kido',status:'available' as const}
 ]),
 ...['aizen-hogyoku','aizen-tybw'].map(versionId=>({versionId,abilityId:'aizen-hogyoku-ability',status:'available' as const})),

 {versionId:'saitama-hero-association',abilityId:'saitama-physical',status:'mastered'},
 {versionId:'saitama-hero-association',abilityId:'saitama-serious-punch',status:'available'},

 ...['megumi-season-1','megumi-shibuya'].map(versionId=>({versionId,abilityId:'megumi-ten-shadows',status:'available' as const})),
 ...['megumi-season-1','megumi-shibuya'].map(versionId=>({versionId,abilityId:'megumi-chimera-shadow-garden',status:'limited' as const}))
,
 {versionId:"vegeta-saiyan-saga",abilityId:"vegeta-ki",status:'available'},
 {versionId:"vegeta-saiyan-saga",abilityId:"vegeta-galick-gun",status:'available'},
 {versionId:"vegeta-super-saiyan-blue",abilityId:"vegeta-ki",status:'available'},
 {versionId:"vegeta-super-saiyan-blue",abilityId:"vegeta-galick-gun",status:'available'},
 {versionId:"vegeta-super-saiyan-blue",abilityId:"vegeta-blue",status:'available'},
 {versionId:"sasuke-hebi",abilityId:"sasuke-chidori",status:'available'},
 {versionId:"sasuke-hebi",abilityId:"sasuke-sharingan",status:'available'},
 {versionId:"sasuke-rinnegan",abilityId:"sasuke-chidori",status:'available'},
 {versionId:"sasuke-rinnegan",abilityId:"sasuke-sharingan",status:'available'},
 {versionId:"sasuke-rinnegan",abilityId:"sasuke-rinnegan-ability",status:'available'},
 {versionId:"kakashi-sharingan",abilityId:"kakashi-raikiri",status:'available'},
 {versionId:"kakashi-sharingan",abilityId:"kakashi-sharingan",status:'available'},
 {versionId:"kakashi-war-arc",abilityId:"kakashi-raikiri",status:'available'},
 {versionId:"kakashi-war-arc",abilityId:"kakashi-sharingan",status:'available'},
 {versionId:"kakashi-war-arc",abilityId:"kakashi-kamui",status:'available'},
 {versionId:"zoro-enies-lobby",abilityId:"zoro-three-sword",status:'available'},
 {versionId:"zoro-wano",abilityId:"zoro-three-sword",status:'available'},
 {versionId:"zoro-wano",abilityId:"zoro-armament",status:'available'},
 {versionId:"zoro-wano",abilityId:"zoro-king-of-hell",status:'available'},
 {versionId:"sanji-enies-lobby",abilityId:"sanji-black-leg",status:'available'},
 {versionId:"sanji-enies-lobby",abilityId:"sanji-diable-jambe",status:'available'},
 {versionId:"sanji-wano",abilityId:"sanji-black-leg",status:'available'},
 {versionId:"sanji-wano",abilityId:"sanji-diable-jambe",status:'available'},
 {versionId:"sanji-wano",abilityId:"sanji-ifrit-jambe",status:'available'},
 {versionId:"sukuna-vessel",abilityId:"sukuna-slashes",status:'available'},
 {versionId:"sukuna-vessel",abilityId:"sukuna-rct",status:'available'},
 {versionId:"sukuna-shibuya",abilityId:"sukuna-slashes",status:'available'},
 {versionId:"sukuna-shibuya",abilityId:"sukuna-rct",status:'available'},
 {versionId:"sukuna-shibuya",abilityId:"sukuna-domain",status:'available'},
 {versionId:"yuta-jujutsu-zero",abilityId:"yuta-sword",status:'available'},
 {versionId:"yuta-jujutsu-zero",abilityId:"yuta-rika",status:'available'},
 {versionId:"yuta-culling-game",abilityId:"yuta-sword",status:'available'},
 {versionId:"yuta-culling-game",abilityId:"yuta-rika",status:'available'},
 {versionId:"yuta-culling-game",abilityId:"yuta-copy",status:'available'},
 {versionId:"nezuko-season-1",abilityId:"nezuko-regeneration",status:'available'},
 {versionId:"nezuko-season-1",abilityId:"nezuko-kicks",status:'available'},
 {versionId:"nezuko-entertainment-district",abilityId:"nezuko-regeneration",status:'available'},
 {versionId:"nezuko-entertainment-district",abilityId:"nezuko-kicks",status:'available'},
 {versionId:"nezuko-entertainment-district",abilityId:"nezuko-exploding-blood",status:'available'}
];

export function versionsForCharacter(characterId:string){
 return characterVersions.filter(v=>v.characterId===characterId).sort((a,b)=>a.sortOrder-b.sortOrder);
}

export function versionById(versionId:string){
 return characterVersions.find(v=>v.id===versionId);
}

export function abilityById(abilityId:string){
 return abilities.find(a=>a.id===abilityId);
}

export function abilitiesForVersion(versionId:string){
 const version=versionById(versionId);
 if(!version)return [];
 return versionAbilities
  .filter(link=>link.versionId===versionId)
  .map(link=>({link,ability:abilityById(link.abilityId)}))
  .filter((item):item is {link:VersionAbility;ability:Ability}=>Boolean(item.ability&&item.ability.characterId===version.characterId));
}

export function legacyFormsForCharacter(characterId:string){
 return versionsForCharacter(characterId).map(v=>v.shortName||v.name);
}

export function characterVersionSearchText(characterId:string){
 const versions=versionsForCharacter(characterId);
 const abilityIds=new Set(versionAbilities.filter(link=>versions.some(v=>v.id===link.versionId)).map(link=>link.abilityId));
 const abilityNames=abilities.filter(a=>abilityIds.has(a.id)).map(a=>a.name);
 return [...versions.flatMap(v=>[v.name,v.shortName||'',v.arc||'',v.era||'',...v.aliases]),...abilityNames].join(' ');
}

export function versionBelongsToCharacter(versionId:string,characterId:string){
 return versionById(versionId)?.characterId===characterId;
}

export function validateBattleVersionSelection(fighterAId:string,fighterAVersionId:string,fighterBId:string,fighterBVersionId:string){
 const versionA=versionById(fighterAVersionId),versionB=versionById(fighterBVersionId);
 return Boolean(fighterAId&&fighterBId&&fighterAId!==fighterBId&&versionA&&versionB&&versionA.characterId===fighterAId&&versionB.characterId===fighterBId&&versionA.canonical&&versionB.canonical);
}
