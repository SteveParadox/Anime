export type SquadIdentitySelection={characterId:string;versionId:string};
export type PricedSquadMember={cost:number};

export class SquadPolicyError extends Error{
 readonly status=400;
 constructor(message:string){super(message);this.name='SquadPolicyError';}
}

export function validateSquadIdentities(selections:SquadIdentitySelection[],minMembers:number,maxMembers:number){
 if(!Number.isInteger(minMembers)||!Number.isInteger(maxMembers)||minMembers<1||maxMembers<minMembers)throw new SquadPolicyError('Challenge member limits are invalid.');
 if(selections.length<minMembers||selections.length>maxMembers)throw new SquadPolicyError(`Choose between ${minMembers} and ${maxMembers} fighters.`);
 const characterIds=selections.map(item=>item.characterId);
 const versionIds=selections.map(item=>item.versionId);
 if(new Set(characterIds).size!==characterIds.length)throw new SquadPolicyError('Each character may appear only once in a challenge squad.');
 if(new Set(versionIds).size!==versionIds.length)throw new SquadPolicyError('Duplicate character versions are not allowed.');
}

export function validateSquadBudget(members:PricedSquadMember[],budget:number){
 if(!Number.isFinite(budget)||budget<=0)throw new SquadPolicyError('Challenge budget is invalid.');
 if(members.some(member=>!Number.isInteger(member.cost)||member.cost<1))throw new SquadPolicyError('A fighter has an invalid challenge cost.');
 const totalCost=members.reduce((sum,item)=>sum+item.cost,0);
 if(totalCost>budget)throw new SquadPolicyError(`Squad costs ${totalCost} points but this challenge budget is ${budget}.`);
 return totalCost;
}


export type SquadLifecycleStatus='scheduled'|'active'|'closed';

export function resolveSquadChallengeStatus(status:SquadLifecycleStatus,startsAt:number,endsAt:number,now=Date.now()):SquadLifecycleStatus{
 if(status==='closed'||now>=endsAt)return 'closed';
 if(now<startsAt)return 'scheduled';
 return 'active';
}


export function dailyChallengeRotationIndex(day:string,templateCount:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isInteger(templateCount)||templateCount<1)throw new SquadPolicyError('Daily challenge rotation input is invalid.');
 const timestamp=Date.parse(`${day}T00:00:00.000Z`);
 if(!Number.isFinite(timestamp))throw new SquadPolicyError('Daily challenge date is invalid.');
 const epochDay=Math.floor(timestamp/86_400_000);
 return ((epochDay%templateCount)+templateCount)%templateCount;
}
