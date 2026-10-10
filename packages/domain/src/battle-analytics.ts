/** Deterministic, versioned community-verdict policy.  Never infer canonical anime strength. */
export const BATTLE_POLICY_VERSION = 1;
export const BATTLE_VOTING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_OFFICIAL_VOTES = 10;

export type VerdictSide = 'a' | 'b' | 'draw';
export type VerdictOutcome = VerdictSide | 'no_contest';
export type VoteCounts = { a: number; b: number; draw: number };

export function battleVotingEndsAt(created: number): number {
 if (!Number.isFinite(created) || created <= 0) throw new Error('Invalid persisted battle creation timestamp.');
 return created + BATTLE_VOTING_WINDOW_MS;
}

export function resolveCommunityVerdict(counts: VoteCounts, minimum = MIN_OFFICIAL_VOTES): VerdictOutcome {
 const {a,b,draw} = counts;
 if (![a,b,draw,minimum].every(n => Number.isSafeInteger(n) && n >= 0) || minimum < 1) throw new Error('Invalid vote counts.');
 if (a + b + draw < minimum) return 'no_contest';
 // An exact top-rank tie is a draw, as is an outright winning draw ballot.
 if (draw > 0 && draw >= a && draw >= b) return 'draw';
 if (a === b) return 'draw';
 return a > b ? 'a' : 'b';
}

export function communityWinRate(wins: number, losses: number, draws: number): number | null {
 const total = wins + losses + draws;
 if (![wins,losses,draws].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Invalid record.');
 return total ? Math.round(wins / total * 10000) / 100 : null;
}

export function communityVoteMargin(counts: VoteCounts): number | null {
 const decisive = counts.a + counts.b;
 if (!decisive) return null;
 return Math.round(Math.abs(counts.a - counts.b) / decisive * 10000) / 100;
}

export function communityControversy(counts: VoteCounts, debates: number, disputes: number): number {
 const total=counts.a+counts.b+counts.draw;
 if (total < MIN_OFFICIAL_VOTES) return 0;
 const closeness = 1 - Math.abs(counts.a-counts.b) / Math.max(1,counts.a+counts.b);
 const confidence = 1 - Math.exp(-total/40);
 const debateIntensity = Math.min(1,Math.max(0,debates)/25);
 const disputeIntensity = Math.min(1,Math.max(0,disputes)/10);
 return Math.round((0.55*closeness*confidence+0.25*debateIntensity+0.20*disputeIntensity)*10000)/100;
}
