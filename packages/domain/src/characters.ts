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
