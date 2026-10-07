CREATE TABLE `character_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text,
	`aliases` text DEFAULT '[]' NOT NULL,
	`description` text NOT NULL,
	`era` text,
	`arc` text,
	`sort_order` integer NOT NULL,
	`canonical` integer DEFAULT 1 NOT NULL,
	`source_endpoint` text,
	`parent_version_id` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_character_versions_character` ON `character_versions` (`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_character_versions_character_order` ON `character_versions` (`character_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `idx_character_versions_parent` ON `character_versions` (`parent_version_id`);
--> statement-breakpoint
CREATE TABLE `abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_abilities_character` ON `abilities` (`character_id`);
--> statement-breakpoint
CREATE TABLE `version_abilities` (
	`version_id` text NOT NULL,
	`ability_id` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`version_id`, `ability_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_version_abilities_version` ON `version_abilities` (`version_id`);
--> statement-breakpoint
CREATE INDEX `idx_version_abilities_ability` ON `version_abilities` (`ability_id`);
--> statement-breakpoint
ALTER TABLE `evidence_records` ADD `version_id` text;
--> statement-breakpoint
ALTER TABLE `evidence_records` ADD `ability_id` text;
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_version` ON `evidence_records` (`version_id`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_version_category` ON `evidence_records` (`version_id`,`category`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_ability` ON `evidence_records` (`ability_id`);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-saiyan-saga','goku','Saiyan Saga Goku','Saiyan Saga','["Saiyan Saga"]','Goku combat profile during the Saiyan Saga.','Dragon Ball Z','Saiyan Saga',10,1,'Dragon Ball Z · Saiyan Saga',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-namek-saga','goku','Namek Saga Goku','Namek Saga','["Namek"]','Goku combat profile during the Namek conflict before later Super Saiyan-era states.','Dragon Ball Z','Namek Saga',20,1,'Dragon Ball Z · Namek Saga','goku-saiyan-saga',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-super-saiyan','goku','Super Saiyan Goku','Super Saiyan','["SSJ","Super Saiyan 1"]','Goku using the Super Saiyan state.','Dragon Ball Z',NULL,30,1,'Dragon Ball Z','goku-namek-saga',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-super-saiyan-2','goku','Super Saiyan 2 Goku','Super Saiyan 2','["SSJ2"]','Goku using Super Saiyan 2.','Dragon Ball Z',NULL,40,1,'Dragon Ball Z','goku-super-saiyan',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-super-saiyan-3','goku','Super Saiyan 3 Goku','Super Saiyan 3','["SSJ3"]','Goku using Super Saiyan 3.','Dragon Ball Z',NULL,50,1,'Dragon Ball Z','goku-super-saiyan-2',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-end-z','goku','End of Dragon Ball Z Goku','End of Z','["End Z"]','Compatibility version for the existing starter matchup endpoint.','Dragon Ball Z',NULL,55,1,'End of Dragon Ball Z','goku-super-saiyan-3',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-super-saiyan-god','goku','Super Saiyan God Goku','Super Saiyan God','["SSG"]','Goku using Super Saiyan God.','Dragon Ball Super',NULL,60,1,'Dragon Ball Super','goku-end-z',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-super-saiyan-blue','goku','Super Saiyan Blue Goku','Super Saiyan Blue','["SSB","Super Saiyan God Super Saiyan"]','Goku using Super Saiyan Blue.','Dragon Ball Super',NULL,70,1,'Dragon Ball Super','goku-super-saiyan-god',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-ui-sign','goku','Ultra Instinct Sign Goku','UI Sign','["Ultra Instinct Omen","UI Sign"]','Goku using the incomplete Ultra Instinct Sign state.','Dragon Ball Super',NULL,80,1,'Dragon Ball Super','goku-super-saiyan-blue',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('goku-mastered-ultra-instinct','goku','Mastered Ultra Instinct Goku','Mastered Ultra Instinct','["MUI","Ultra Instinct"]','Goku using the completed Ultra Instinct state represented by the current catalog endpoint.','Dragon Ball Super',NULL,90,1,'Dragon Ball Super anime, episode 131','goku-ui-sign',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-academy','naruto','Academy Naruto','Academy','["Academy"]','Naruto during his academy-era combat profile.','Naruto',NULL,10,1,'Naruto · Academy era',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-chunin-exam','naruto','Chunin Exam Naruto','Chunin Exam','["Chūnin Exam","Chunin Exams"]','Naruto during the Chunin Exam era.','Naruto','Chunin Exams',20,1,'Naruto · Chunin Exams','naruto-academy',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-original-series-end','naruto','End of Original Series Naruto','Original Series End','["End of original Naruto"]','Compatibility version for the existing starter matchup endpoint.','Naruto',NULL,25,1,'End of original Naruto series','naruto-chunin-exam',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-shippuden','naruto','Shippuden Naruto','Shippuden','["Base Shippuden"]','Naruto in his Shippuden-era baseline combat profile.','Naruto Shippuden',NULL,30,1,'Naruto Shippuden','naruto-original-series-end',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-sage-mode','naruto','Sage Mode Naruto','Sage Mode','["Sage Naruto"]','Naruto using Sage Mode.','Naruto Shippuden',NULL,40,1,'Naruto Shippuden','naruto-shippuden',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-kcm','naruto','KCM Naruto','KCM','["Kurama Chakra Mode","KCM"]','Naruto using Kurama Chakra Mode.','Naruto Shippuden',NULL,50,1,'Naruto Shippuden','naruto-sage-mode',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-six-paths','naruto','Six Paths Naruto','Six Paths','["Six Paths Sage Mode","SPSM"]','Naruto using his Six Paths-era combat profile.','Naruto Shippuden','Fourth Shinobi World War',60,1,'Naruto Shippuden · Fourth Shinobi World War','naruto-kcm',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('naruto-baryon-mode','naruto','Baryon Mode Naruto','Baryon Mode','["Baryon"]','Naruto using Baryon Mode.','Boruto',NULL,70,1,'Boruto-era material','naruto-six-paths',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('ichigo-shikai','ichigo','Shikai Ichigo','Shikai','["Shikai"]','Ichigo using the Shikai state represented in the existing catalog.',NULL,NULL,10,1,'Bleach anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('ichigo-bankai','ichigo','Bankai Ichigo','Bankai','["Bankai"]','Ichigo using Bankai.',NULL,NULL,20,1,'Bleach anime','ichigo-shikai',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('ichigo-hollowfication','ichigo','Hollowfication Ichigo','Hollowfication','["Hollow Mask"]','Ichigo using the Hollowfication state represented in the existing catalog.',NULL,NULL,30,1,'Bleach anime','ichigo-bankai',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('ichigo-original-anime-end','ichigo','End of Original Bleach Anime Ichigo','Original Anime End','["End of original Bleach anime"]','Compatibility version for the existing starter matchup endpoint.',NULL,NULL,40,1,'End of original Bleach anime','ichigo-hollowfication',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('luffy-east-blue-end','luffy','East Blue Luffy','East Blue','["End of East Blue"]','Compatibility profile for the existing East Blue starter matchup.',NULL,NULL,10,1,'End of East Blue',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('luffy-base','luffy','Base Luffy','Base','["Base"]','Luffy baseline combat profile represented in the existing catalog.',NULL,NULL,20,1,'One Piece anime','luffy-east-blue-end',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('luffy-gear-2','luffy','Gear 2 Luffy','Gear 2','["Gear Second"]','Luffy using Gear 2.',NULL,NULL,30,1,'One Piece anime','luffy-base',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('luffy-gear-4','luffy','Gear 4 Luffy','Gear 4','["Gear Fourth"]','Luffy using Gear 4.',NULL,NULL,40,1,'One Piece anime','luffy-gear-2',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('luffy-gear-5','luffy','Gear 5 Luffy','Gear 5','["Gear Fifth"]','Luffy using Gear 5 as represented by the current catalog endpoint.',NULL,NULL,50,1,'Egghead anime arc','luffy-gear-4',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('tanjiro-season-1','tanjiro','Season 1 Tanjiro','Season 1','["Season 1"]','Compatibility version for the existing starter matchup.',NULL,NULL,10,1,'Demon Slayer Season 1',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('tanjiro-water-breathing','tanjiro','Water Breathing Tanjiro','Water Breathing','["Water Breathing"]','Tanjiro combat profile centered on Water Breathing from the existing catalog.',NULL,NULL,20,1,'Demon Slayer anime','tanjiro-season-1',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('tanjiro-hinokami-kagura','tanjiro','Hinokami Kagura Tanjiro','Hinokami Kagura','["Hinokami Kagura"]','Tanjiro combat profile using Hinokami Kagura from the existing catalog.',NULL,NULL,30,1,'Hashira Training anime arc','tanjiro-water-breathing',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('levi-season-1','levi','Season 1 Levi','Season 1','["Season 1"]','Compatibility version for the existing starter matchup.',NULL,NULL,10,1,'Attack on Titan Season 1',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('levi-standard-odm','levi','Standard ODM Levi','Standard ODM','["Standard ODM gear"]','Levi with standard ODM gear as represented in the existing catalog.',NULL,NULL,20,1,'Attack on Titan anime','levi-season-1',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('levi-thunder-spears','levi','Thunder Spear Levi','Thunder Spears','["Thunder spears"]','Levi with Thunder Spear equipment as represented in the existing catalog.',NULL,NULL,30,1,'Attack on Titan Final Season','levi-standard-odm',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('sakura-byakugo','sakura','Byakugō Seal Sakura','Byakugō Seal','["Byakugo Seal"]','Sakura using the Byakugō Seal state represented in the current catalog.',NULL,NULL,10,1,'Naruto Shippuden anime, episode 500',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('shikamaru-standard','shikamaru','Standard Shikamaru','Standard','["Standard shinobi equipment"]','Shikamaru with the standard shinobi equipment represented in the current catalog.',NULL,NULL,10,1,'Naruto Shippuden anime, episode 500',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('chopper-brain-point','chopper','Brain Point Chopper','Brain Point','["Brain Point"]','Chopper using Brain Point.',NULL,NULL,10,1,'One Piece anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('chopper-guard-point','chopper','Guard Point Chopper','Guard Point','["Guard Point"]','Chopper using Guard Point.',NULL,NULL,20,1,'One Piece anime','chopper-brain-point',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('chopper-monster-point','chopper','Monster Point Chopper','Monster Point','["Monster Point"]','Chopper using Monster Point as represented in the existing catalog.',NULL,NULL,30,1,'Egghead anime arc','chopper-guard-point',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('mikasa-standard-odm','mikasa','Standard ODM Mikasa','Standard ODM','["Standard ODM gear"]','Mikasa with standard ODM gear as represented in the existing catalog.',NULL,NULL,10,1,'Attack on Titan anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('mikasa-thunder-spears','mikasa','Thunder Spear Mikasa','Thunder Spears','["Thunder spears"]','Mikasa with Thunder Spear equipment as represented in the existing catalog.',NULL,NULL,20,1,'Attack on Titan Final Season','mikasa-standard-odm',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('usopp-kabuto','usopp','Kabuto Usopp','Kabuto','["Kabuto"]','Usopp using Kabuto as represented in the existing catalog.',NULL,NULL,10,1,'One Piece anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('usopp-pop-greens','usopp','Pop Greens Usopp','Pop Greens','["Pop Greens"]','Usopp using Pop Greens as represented in the current catalog.',NULL,NULL,20,1,'Egghead anime arc','usopp-kabuto',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('rukia-shikai','rukia','Shikai Rukia','Shikai','["Shikai"]','Rukia using Shikai.',NULL,NULL,10,1,'Bleach anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('rukia-bankai','rukia','Bankai Rukia','Bankai','["Bankai"]','Rukia using Bankai as represented in the current catalog endpoint.',NULL,NULL,20,1,'Thousand-Year Blood War anime','rukia-shikai',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('deku-full-cowling','deku','Full Cowling Deku','Full Cowling','["Full Cowling"]','Deku using Full Cowling as represented in the existing catalog.',NULL,NULL,10,1,'My Hero Academia anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('deku-ofa-100','deku','One For All 100% Deku','OFA 100%','["One For All 100%","OFA 100"]','Deku using the One For All 100% state represented in the current catalog.',NULL,NULL,20,1,'My Hero Academia anime, Final Season','deku-full-cowling',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('yuji-cursed-energy','yuji','Cursed Energy Reinforcement Yuji','Cursed Energy','["Cursed energy reinforcement"]','Yuji using cursed-energy reinforcement as represented in the existing catalog.',NULL,NULL,10,1,'Jujutsu Kaisen anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('yuji-black-flash','yuji','Black Flash Yuji','Black Flash','["Black Flash"]','Yuji combat profile centered on Black Flash as represented in the existing catalog.',NULL,NULL,20,1,'Shibuya Incident anime arc','yuji-cursed-energy',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('denji-human','denji','Human Denji','Human','["Human"]','Denji in human state.',NULL,NULL,10,1,'Chainsaw Man anime season 1',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('denji-chainsaw-hybrid','denji','Chainsaw Hybrid Denji','Chainsaw Hybrid','["Chainsaw hybrid"]','Denji in his hybrid transformation as represented in the current catalog.',NULL,NULL,20,1,'Chainsaw Man anime season 1','denji-human',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('asta-black-form','asta','Black Form Asta','Black Form','["Black form"]','Asta using Black Form as represented in the existing catalog.',NULL,NULL,10,1,'Black Clover anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('asta-devil-union','asta','Devil Union Asta','Devil Union','["Devil Union"]','Asta using Devil Union as represented in the current catalog.',NULL,NULL,20,1,'Black Clover anime, episode 170','asta-black-form',1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('senku-science-kingdom','senku','Science Kingdom Senku','Science Kingdom','["Science Kingdom equipment"]','Senku with the Science Kingdom equipment state represented in the existing catalog.',NULL,NULL,10,1,'Dr. Stone anime, Science Future',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('shinra-adolla-burst','shinra','Adolla Burst Shinra','Adolla Burst','["Adolla Burst"]','Shinra using the Adolla Burst state represented in the existing catalog.',NULL,NULL,10,1,'Fire Force anime',NULL,1791375000000);
--> statement-breakpoint
INSERT INTO `character_versions` (id,character_id,name,short_name,aliases,description,era,arc,sort_order,canonical,source_endpoint,parent_version_id,created) VALUES ('shinra-rapid','shinra','Rapid Shinra','Rapid','["Rapid"]','Shinra combat profile represented by the existing Rapid catalog state.',NULL,NULL,20,1,'Fire Force anime season 3','shinra-adolla-burst',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-martial-arts','goku','Martial Arts','Close-range martial arts skill from the existing catalog profile.','physical',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-ki-control','goku','Ki Control','Energy manipulation and combat reinforcement.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-kamehameha','goku','Kamehameha','Signature ki-wave technique.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-super-saiyan-ability','goku','Super Saiyan','Super Saiyan transformation access.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-god-ki','goku','God Ki','Divine ki used by later Dragon Ball Super profiles.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-blue-ability','goku','Super Saiyan Blue','God-ki Super Saiyan state.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('goku-ui','goku','Ultra Instinct','Autonomous combat movement associated with Ultra Instinct states.','passive',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-shadow-clone','naruto','Shadow Clone Technique','Clone technique represented in the existing catalog summary.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-rasengan','naruto','Rasengan','Rotating chakra technique and its later variants.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-sage-ability','naruto','Sage Mode','Sage Mode transformation and sensory combat state.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-kurama-chakra','naruto','Kurama Chakra Mode','Kurama chakra transformation state.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-six-paths-sage','naruto','Six Paths Sage Mode','Six Paths-era enhanced state.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-truth-seeking-orbs','naruto','Truth-Seeking Orbs','Six Paths-era orb technique.','hax',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('naruto-baryon','naruto','Baryon Mode','Baryon Mode transformation state.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('ichigo-zanpakuto','ichigo','Zanpakutō Combat','Sword combat from the existing catalog summary.','weapon',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('ichigo-getsuga','ichigo','Getsuga Tenshō','Energy attack from the existing catalog summary.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('luffy-haki','luffy','Haki','Haki-based combat from the existing catalog summary.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('tanjiro-swordplay','tanjiro','Precision Swordplay','Sword technique from the existing catalog summary.','weapon',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('levi-odm','levi','ODM Mobility','ODM movement and aerial positioning from the existing catalog summary.','mobility',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('sakura-medical','sakura','Medical Ninjutsu','Medical support from the existing catalog summary.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('shikamaru-shadow','shikamaru','Shadow Possession','Shadow possession control from the existing catalog summary.','hax',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('chopper-medicine','chopper','Field Medicine','Medical support from the existing catalog summary.','technique',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('mikasa-odm','mikasa','ODM Mobility','ODM movement from the existing catalog summary.','mobility',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('usopp-marksmanship','usopp','Long-range Marksmanship','Ranged combat from the existing catalog summary.','weapon',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('rukia-ice-zanpakuto','rukia','Ice-type Zanpakutō','Ice-based Zanpakutō combat from the existing catalog summary.','weapon',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('deku-ofa','deku','One For All','One For All output from the existing catalog summary.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('yuji-cursed-energy-ability','yuji','Cursed Energy Reinforcement','Cursed-energy reinforcement from the existing catalog summary.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('denji-chainsaws','denji','Chainsaw Hybrid Transformation','Hybrid transformation from the existing catalog summary.','transformation',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('asta-anti-magic','asta','Anti-Magic Swords','Anti-magic sword combat from the existing catalog summary.','weapon',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('senku-science','senku','Scientific Planning','Scientific planning and invention from the existing catalog summary.','other',1791375000000);
--> statement-breakpoint
INSERT INTO `abilities` (id,character_id,name,description,category,created) VALUES ('shinra-ignition','shinra','Third-generation Ignition','Ignition ability from the existing catalog summary.','energy',1791375000000);
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-saiyan-saga','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-saiyan-saga','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-saiyan-saga','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-namek-saga','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-namek-saga','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-namek-saga','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-2','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-2','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-2','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-3','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-3','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-3','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-end-z','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-end-z','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-end-z','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-god','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-god','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-god','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-blue','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-blue','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-blue','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-ui-sign','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-ui-sign','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-ui-sign','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-mastered-ultra-instinct','goku-martial-arts','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-mastered-ultra-instinct','goku-ki-control','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-mastered-ultra-instinct','goku-kamehameha','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan','goku-super-saiyan-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-2','goku-super-saiyan-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-3','goku-super-saiyan-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-end-z','goku-super-saiyan-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-god','goku-god-ki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-blue','goku-god-ki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-ui-sign','goku-god-ki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-mastered-ultra-instinct','goku-god-ki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-chunin-exam','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-original-series-end','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-shippuden','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-sage-mode','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-kcm','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-six-paths','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-baryon-mode','naruto-shadow-clone','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-original-series-end','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-shippuden','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-sage-mode','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-kcm','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-six-paths','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-baryon-mode','naruto-rasengan','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-shikai','ichigo-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-bankai','ichigo-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-hollowfication','ichigo-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-original-anime-end','ichigo-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-shikai','ichigo-getsuga','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-bankai','ichigo-getsuga','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-hollowfication','ichigo-getsuga','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('ichigo-original-anime-end','ichigo-getsuga','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('luffy-base','luffy-haki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('luffy-gear-2','luffy-haki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('luffy-gear-4','luffy-haki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('luffy-gear-5','luffy-haki','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('tanjiro-season-1','tanjiro-swordplay','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('tanjiro-water-breathing','tanjiro-swordplay','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('tanjiro-hinokami-kagura','tanjiro-swordplay','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('levi-season-1','levi-odm','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('levi-standard-odm','levi-odm','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('levi-thunder-spears','levi-odm','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('chopper-brain-point','chopper-medicine','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('chopper-guard-point','chopper-medicine','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('chopper-monster-point','chopper-medicine','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('mikasa-standard-odm','mikasa-odm','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('mikasa-thunder-spears','mikasa-odm','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('usopp-kabuto','usopp-marksmanship','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('usopp-pop-greens','usopp-marksmanship','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('rukia-shikai','rukia-ice-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('rukia-bankai','rukia-ice-zanpakuto','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('deku-full-cowling','deku-ofa','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('deku-ofa-100','deku-ofa','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('yuji-cursed-energy','yuji-cursed-energy-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('yuji-black-flash','yuji-cursed-energy-ability','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('asta-black-form','asta-anti-magic','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('asta-devil-union','asta-anti-magic','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('shinra-adolla-burst','shinra-ignition','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('shinra-rapid','shinra-ignition','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-super-saiyan-blue','goku-blue-ability','mastered','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-ui-sign','goku-ui','limited','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('goku-mastered-ultra-instinct','goku-ui','mastered','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-sage-mode','naruto-sage-ability','mastered','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-kcm','naruto-kurama-chakra','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-six-paths','naruto-six-paths-sage','mastered','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-six-paths','naruto-truth-seeking-orbs','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('naruto-baryon-mode','naruto-baryon','conditional','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('sakura-byakugo','sakura-medical','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('shikamaru-standard','shikamaru-shadow','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('denji-chainsaw-hybrid','denji-chainsaws','available','');
--> statement-breakpoint
INSERT INTO `version_abilities` (version_id,ability_id,status,notes) VALUES ('senku-science-kingdom','senku-science','available','');
