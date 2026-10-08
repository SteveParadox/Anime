import type {RoleRequirement,VersionRole,StrategicTrait} from '@anime/domain/squad-synergy';
export const SQUAD_CHALLENGE_TYPES=['defeat_target','survive','defend','capture','open_build'] as const;
export const SQUAD_CHALLENGE_STATUSES=['scheduled','active','closed'] as const;
export const SQUAD_VOTE_VERDICTS=['yes','no'] as const;

export type SquadChallengeType=typeof SQUAD_CHALLENGE_TYPES[number];
export type SquadChallengeStatus=typeof SQUAD_CHALLENGE_STATUSES[number];
export type SquadVoteVerdict=typeof SQUAD_VOTE_VERDICTS[number];

export type SquadChallengeRules={
 battleType?:string;
 location?:string;
 speed?:string;
 knowledge?:string;
 prepTime?:string;
 transformationsAllowed?:boolean;
 standardEquipment?:boolean;
 notes?:string;
 roleRequirements?:RoleRequirement[];
};

export type SquadChallengeRecord={
 id:string;
 type:SquadChallengeType;
 title:string;
 description:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 minMembers:number;
 maxMembers:number;
 rules:SquadChallengeRules;
 startsAt:number;
 endsAt:number;
 status:SquadChallengeStatus;
 created:number;
};

export type SquadChallengeFighter={
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 versionShortName:string|null;
 cost:number;
 series:string;
 role:string; // Legacy catalog label; do not use for version composition.
 roles:VersionRole[];
 traits:StrategicTrait[];
 tags:string[];
 aliases:string[];
 keyAbilities:{id:string;name:string;status:string}[];
};

export type SquadMemberSelection={characterId:string;versionId:string};
export type SquadMemberSnapshot={
 position:number;
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 cost:number;
 roles:VersionRole[];
 traits:StrategicTrait[];
};
