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
 {id:'shinra-rapid',characterId:'shinra',name:'Rapid Shinra',shortName:'Rapid',aliases:['Rapid'],description:'Shinra combat profile represented by the existing Rapid catalog state.',sortOrder:20,canonical:true,sourceEndpoint:'Fire Force anime season 3',parentVersionId:'shinra-adolla-burst'}
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
 {id:'shinra-ignition',characterId:'shinra',name:'Third-generation Ignition',description:'Ignition ability from the existing catalog summary.',category:'energy'}
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
 ...['shinra-adolla-burst','shinra-rapid'].map(versionId=>({versionId,abilityId:'shinra-ignition',status:'available' as const}))
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
