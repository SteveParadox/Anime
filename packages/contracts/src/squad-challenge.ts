import type {RoleRequirement,VersionRole,StrategicTrait} from '@anime/domain/squad-synergy';
import type {ChallengeObjective,ChallengeRestrictions} from './advanced-challenge';
export const SQUAD_CHALLENGE_TYPES=['defeat_target','survive','defend','rescue','capture','open_build'] as const;
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
 restrictions?:ChallengeRestrictions;
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
 objective:ChallengeObjective;
 sourceType?:string;
 rulesVersion?:number;
 scoringVersion?:number;
 balanceVersion?:string|null;
 tacticalAnalysisVersion?:number;
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
