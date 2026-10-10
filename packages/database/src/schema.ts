import {pgTable,text,bigint,integer,jsonb,primaryKey,index,uniqueIndex,check} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
export const battles=pgTable('battles',{id:text('id').primaryKey(),owner:text('owner').notNull(),payload:text('payload').notNull(),created:bigint('created',{mode:'number'}).notNull()});
export const votes=pgTable('votes',{argumentId:bigint('argument_id',{mode:'number'}).generatedByDefaultAsIdentity(),battle:text('battle').notNull(),user:text('user').notNull(),side:text('side').notNull(),difficulty:text('difficulty'),reason:text('reason').notNull(),evidence:text('evidence').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.battle,t.user]}),uniqueIndex('idx_votes_argument_id').on(t.argumentId)]);
export const argumentEvidence=pgTable('argument_evidence',{id:text('id').primaryKey(),battle:text('battle').notNull(),argumentUser:text('argument_user').notNull(),contributor:text('contributor').notNull(),reference:text('reference').notNull(),context:text('context').notNull().default(''),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_argument_evidence_battle_user').on(t.battle,t.argumentUser),index('idx_argument_evidence_created').on(t.created)]);
export const progress=pgTable('progress',{user:text('user').notNull(),club:text('club').notNull(),episode:bigint('episode',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.user,t.club]})]);
export const posts=pgTable('posts',{id:text('id').primaryKey(),user:text('user').notNull(),club:text('club').notNull(),episode:bigint('episode',{mode:'number'}).notNull(),body:text('body').notNull(),edited:bigint('edited',{mode:'number'}).notNull().default(0),deleted:bigint('deleted',{mode:'number'}).notNull().default(0),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_posts_club_episode').on(t.club,t.episode)]);
export const squads=pgTable('squads',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),members:text('members').notNull(),strategy:text('strategy').notNull(),challenge:text('challenge').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_squads_owner').on(t.owner)]);
export const profiles=pgTable('profiles',{user:text('user').primaryKey(),handle:text('handle').notNull(),displayName:text('display_name').notNull(),avatarUrl:text('avatar_url'),bio:text('bio').notNull().default(''),favoriteAnime:text('favorite_anime').notNull().default('[]'),favoriteCharacters:text('favorite_characters').notNull().default('[]'),created:bigint('created',{mode:'number'}).notNull(),updated:bigint('updated',{mode:'number'}).notNull()},t=>[uniqueIndex('idx_profiles_handle').on(t.handle)]);
export const comments=pgTable('comments',{id:text('id').primaryKey(),battle:text('battle').notNull(),argumentUser:text('argument_user').notNull(),user:text('user').notNull(),body:text('body').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_comments_argument').on(t.battle,t.argumentUser)]);
export const reactions=pgTable('reactions',{subjectType:text('subject_type').notNull(),subjectId:text('subject_id').notNull(),user:text('user').notNull(),reaction:text('reaction').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.subjectType,t.subjectId,t.user]})]);
export const squadChallenges=pgTable('squad_challenges',{id:text('id').primaryKey(),challenger:text('challenger').notNull(),challengerSquad:text('challenger_squad').notNull(),opponentSquad:text('opponent_squad').notNull(),rules:text('rules').notNull(),status:text('status').notNull().default('open'),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_challenges_created').on(t.created)]);
export const challengeVotes=pgTable('challenge_votes',{challenge:text('challenge').notNull(),user:text('user').notNull(),side:text('side').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.challenge,t.user]})]);

export const squadVersionCosts=pgTable('squad_version_costs',{
 versionId:text('version_id').primaryKey(),
 characterId:text('character_id').notNull(),
 cost:bigint('cost',{mode:'number'}).notNull(),
 updated:bigint('updated',{mode:'number'}).notNull()
},t=>[index('idx_squad_version_costs_character').on(t.characterId),index('idx_squad_version_costs_cost').on(t.cost)]);
export const characterFranchises=pgTable('character_franchises',{
 characterId:text('character_id').primaryKey(),franchiseId:text('franchise_id').notNull()
},t=>[index('idx_character_franchises_franchise').on(t.franchiseId,t.characterId)]);
export const versionChallengeAlignment=pgTable('version_challenge_alignment',{
 versionId:text('version_id').primaryKey().references(()=>characterVersions.id),alignment:text('alignment').notNull(),notes:text('notes').notNull().default('')
},t=>[index('idx_version_challenge_alignment_value').on(t.alignment,t.versionId)]);

export const dailySquadChallenges=pgTable('daily_squad_challenges',{
 id:text('id').primaryKey(),
 type:text('type').notNull(),
 title:text('title').notNull(),
 description:text('description').notNull(),
 targetCharacterId:text('target_character_id'),
 targetVersionId:text('target_version_id'),
 budget:bigint('budget',{mode:'number'}).notNull(),
 minMembers:bigint('min_members',{mode:'number'}).notNull().default(1),
 maxMembers:bigint('max_members',{mode:'number'}).notNull(),
 rulesJson:text('rules_json').notNull().default('{}'),
 startsAt:bigint('starts_at',{mode:'number'}).notNull(),
 endsAt:bigint('ends_at',{mode:'number'}).notNull(),
 status:text('status').notNull().default('scheduled'),
 created:bigint('created',{mode:'number'}).notNull(),
 sourceType:text('source_type').notNull().default('rotation'),
 definitionId:text('definition_id'),
 objectiveJson:text('objective_json').notNull().default('{}'),
 rulesVersion:bigint('rules_version',{mode:'number'}).notNull().default(1),
 scoringVersion:bigint('scoring_version',{mode:'number'}).notNull().default(1),
 publishedAt:bigint('published_at',{mode:'number'}),
 balanceVersion:text('balance_version'),tacticalAnalysisVersion:integer('tactical_analysis_version').notNull().default(1)
},t=>[
 index('idx_daily_squad_challenges_window').on(t.startsAt,t.endsAt),
 index('idx_daily_squad_challenges_status_window').on(t.status,t.startsAt,t.endsAt)
]);

export const dailySquadChallengeCosts=pgTable('daily_squad_challenge_costs',{
 challengeId:text('challenge_id').notNull(),
 characterId:text('character_id').notNull(),
 versionId:text('version_id').notNull(),
 cost:bigint('cost',{mode:'number'}).notNull()
 ,rolesSnapshot:text('roles_snapshot'),traitsSnapshot:text('traits_snapshot')
},t=>[
 primaryKey({columns:[t.challengeId,t.versionId]}),
 index('idx_daily_squad_challenge_costs_challenge').on(t.challengeId),
 index('idx_daily_squad_challenge_costs_character').on(t.challengeId,t.characterId)
]);

export const challengeDefinitions=pgTable('challenge_definitions',{
 id:text('id').primaryKey(),creatorUserId:text('creator_user_id').notNull().references(()=>users.id),sourceType:text('source_type').notNull(),status:text('status').notNull(),title:text('title').notNull(),description:text('description').notNull(),difficulty:text('difficulty').notNull(),type:text('type').notNull(),targetCharacterId:text('target_character_id'),targetVersionId:text('target_version_id'),budget:bigint('budget',{mode:'number'}).notNull(),minMembers:bigint('min_members',{mode:'number'}).notNull(),maxMembers:bigint('max_members',{mode:'number'}).notNull(),rulesJson:text('rules_json').notNull(),objectiveJson:text('objective_json').notNull(),rulesVersion:bigint('rules_version',{mode:'number'}).notNull().default(1),startsAt:bigint('starts_at',{mode:'number'}),endsAt:bigint('ends_at',{mode:'number'}),votingEndsAt:bigint('voting_ends_at',{mode:'number'}),publishedChallengeId:text('published_challenge_id').references(()=>dailySquadChallenges.id),createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[index('idx_challenge_definitions_status_window').on(t.status,t.startsAt,t.endsAt),index('idx_challenge_definitions_creator').on(t.creatorUserId,t.createdAt),index('idx_challenge_definitions_vote_close').on(t.status,t.votingEndsAt)]);
export const challengeProposalVotes=pgTable('challenge_proposal_votes',{
 definitionId:text('definition_id').notNull().references(()=>challengeDefinitions.id),userId:text('user_id').notNull().references(()=>users.id),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.definitionId,t.userId]}),index('idx_challenge_proposal_votes_user').on(t.userId)]);
export const challengePublicationAttempts=pgTable('challenge_publication_attempts',{
 id:text('id').primaryKey(),definitionId:text('definition_id').notNull().references(()=>challengeDefinitions.id),attemptedAt:bigint('attempted_at',{mode:'number'}).notNull(),outcome:text('outcome').notNull(),detail:text('detail').notNull()
},t=>[index('idx_challenge_publication_attempts_recent').on(t.attemptedAt)]);
export const challengeLifecycleAudit=pgTable('challenge_lifecycle_audit',{
 id:text('id').primaryKey(),definitionId:text('definition_id').notNull().references(()=>challengeDefinitions.id),actorUserId:text('actor_user_id').references(()=>users.id),fromStatus:text('from_status').notNull(),toStatus:text('to_status').notNull(),note:text('note').notNull(),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[index('idx_challenge_lifecycle_audit_definition').on(t.definitionId,t.createdAt)]);
export const challengeTournaments=pgTable('challenge_tournaments',{
 id:text('id').primaryKey(),title:text('title').notNull(),description:text('description').notNull(),status:text('status').notNull(),startsAt:bigint('starts_at',{mode:'number'}).notNull(),endsAt:bigint('ends_at',{mode:'number'}).notNull(),scoringVersion:bigint('scoring_version',{mode:'number'}).notNull().default(1),createdBy:text('created_by').notNull().references(()=>users.id),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[index('idx_challenge_tournaments_window').on(t.status,t.startsAt,t.endsAt)]);
export const challengeTournamentRounds=pgTable('challenge_tournament_rounds',{
 id:text('id').primaryKey(),tournamentId:text('tournament_id').notNull().references(()=>challengeTournaments.id),definitionId:text('definition_id').notNull().references(()=>challengeDefinitions.id),challengeId:text('challenge_id').references(()=>dailySquadChallenges.id),roundNumber:bigint('round_number',{mode:'number'}).notNull(),startsAt:bigint('starts_at',{mode:'number'}).notNull(),endsAt:bigint('ends_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_tournament_round_unique').on(t.tournamentId,t.roundNumber),uniqueIndex('idx_tournament_round_challenge_unique').on(t.tournamentId,t.challengeId),index('idx_tournament_rounds_window').on(t.startsAt,t.endsAt)]);
export const challengeTournamentParticipants=pgTable('challenge_tournament_participants',{
 tournamentId:text('tournament_id').notNull().references(()=>challengeTournaments.id),userId:text('user_id').notNull().references(()=>users.id),joinedAt:bigint('joined_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.tournamentId,t.userId]})]);
export const challengeTournamentResults=pgTable('challenge_tournament_results',{
 roundId:text('round_id').notNull().references(()=>challengeTournamentRounds.id),userId:text('user_id').notNull().references(()=>users.id),submissionId:text('submission_id').notNull().references(()=>squadSubmissions.id),score:bigint('score',{mode:'number'}).notNull(),scoringVersion:bigint('scoring_version',{mode:'number'}).notNull(),breakdownJson:text('breakdown_json').notNull(),rulesSnapshot:text('rules_snapshot').notNull(),squadSnapshot:text('squad_snapshot').notNull(),submittedAt:bigint('submitted_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.roundId,t.userId]}),uniqueIndex('idx_tournament_submission_unique').on(t.submissionId),index('idx_tournament_results_round_score').on(t.roundId,t.score,t.submittedAt,t.submissionId)]);

export const squadSubmissions=pgTable('squad_submissions',{
 id:text('id').primaryKey(),
 challengeId:text('challenge_id').notNull(),
 owner:text('owner').notNull(),
 name:text('name').notNull(),
 strategy:text('strategy').notNull(),
 totalCost:bigint('total_cost',{mode:'number'}).notNull(),
 lockedAt:bigint('locked_at',{mode:'number'}),
 removed:bigint('removed',{mode:'number'}).notNull().default(0),
 created:bigint('created',{mode:'number'}).notNull(),
 updated:bigint('updated',{mode:'number'}).notNull()
},t=>[
 uniqueIndex('idx_squad_submissions_challenge_owner').on(t.challengeId,t.owner),
 index('idx_squad_submissions_challenge_created').on(t.challengeId,t.created),
 index('idx_squad_submissions_owner_created').on(t.owner,t.created)
]);

export const squadSubmissionMembers=pgTable('squad_submission_members',{
 submissionId:text('submission_id').notNull(),
 position:bigint('position',{mode:'number'}).notNull(),
 characterId:text('character_id').notNull(),
 versionId:text('version_id').notNull(),
 characterNameSnapshot:text('character_name_snapshot').notNull(),
 versionNameSnapshot:text('version_name_snapshot').notNull(),
 costSnapshot:bigint('cost_snapshot',{mode:'number'}).notNull(),
 rolesSnapshot:text('roles_snapshot'),
 traitsSnapshot:text('traits_snapshot')
},t=>[
 primaryKey({columns:[t.submissionId,t.position]}),
 uniqueIndex('idx_squad_submission_members_version').on(t.submissionId,t.versionId),
 uniqueIndex('idx_squad_submission_members_character_once').on(t.submissionId,t.characterId),
 index('idx_squad_submission_members_submission').on(t.submissionId),
 index('idx_squad_submission_members_character').on(t.characterId)
]);

export const squadSubmissionVotes=pgTable('squad_submission_votes',{
 submissionId:text('submission_id').notNull(),
 user:text('user').notNull(),
 verdict:text('verdict').notNull(),
 explanation:text('explanation').notNull().default(''),
 difficulty:text('difficulty'),
 created:bigint('created',{mode:'number'}).notNull(),
 updated:bigint('updated',{mode:'number'}).notNull()
},t=>[
 primaryKey({columns:[t.submissionId,t.user]}),
 index('idx_squad_submission_votes_submission').on(t.submissionId),
 index('idx_squad_submission_votes_user').on(t.user)
]);
export const notifications=pgTable('notifications',{id:text('id').primaryKey(),user:text('user').notNull(),kind:text('kind').notNull(),message:text('message').notNull(),link:text('link').notNull(),read:bigint('read',{mode:'number'}).notNull().default(0),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_notifications_user_created').on(t.user,t.created)]);
export const reports=pgTable('reports',{id:text('id').primaryKey(),reporter:text('reporter').notNull(),subjectType:text('subject_type').notNull(),subjectId:text('subject_id').notNull(),reason:text('reason').notNull(),status:text('status').notNull().default('open'),created:bigint('created',{mode:'number'}).notNull()},t=>[index('idx_reports_status_created').on(t.status,t.created)]);
export const watchlist=pgTable('watchlist',{user:text('user').notNull(),anime:text('anime').notNull(),status:text('status').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.user,t.anime]})]);
export const tournamentVotes=pgTable('tournament_votes',{week:text('week').notNull(),match:text('match').notNull(),user:text('user').notNull(),pick:text('pick').notNull(),created:bigint('created',{mode:'number'}).notNull()},t=>[primaryKey({columns:[t.week,t.match,t.user]})]);

export const evidenceRecords=pgTable('evidence_records',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 sourceType:text('source_type').notNull(),
 series:text('series').notNull(),
 category:text('category').notNull(),
 title:text('title').notNull(),
 description:text('description').notNull(),
 episode:bigint('episode',{mode:'number'}),
 timestamp:text('timestamp'),
 chapter:bigint('chapter',{mode:'number'}),
 page:bigint('page',{mode:'number'}),
 sourceTitle:text('source_title'),
 sourceLocation:text('source_location'),
 sourceUrl:text('source_url'),
 sourceDetails:jsonb('source_details').$type<Record<string,string>>().notNull().default({}),
 continuityStatus:text('continuity_status').notNull().default('unknown'),
 sourceLanguage:text('source_language'),
 translationProvenance:text('translation_provenance'),
 versionId:text('version_id'),
 abilityId:text('ability_id'),
 submittedBy:text('submitted_by').notNull(),
 created:bigint('created',{mode:'number'}).notNull(),
 updated:bigint('updated',{mode:'number'}).notNull(),
 deleted:bigint('deleted',{mode:'number'}).notNull().default(0),
 deletedAt:bigint('deleted_at',{mode:'number'})
},t=>[index('idx_evidence_records_character').on(t.characterId),index('idx_evidence_records_character_category').on(t.characterId,t.category),index('idx_evidence_records_source_type').on(t.sourceType),index('idx_evidence_records_version').on(t.versionId),index('idx_evidence_records_version_category').on(t.versionId,t.category),index('idx_evidence_records_ability').on(t.abilityId),index('idx_evidence_records_created').on(t.created),index('idx_evidence_records_active_character_created').on(t.characterId,t.deleted,t.created)]);

export const argumentEvidenceLinks=pgTable('argument_evidence_links',{
 battle:text('battle').notNull(),
 argumentUser:text('argument_user').notNull(),
 evidenceId:text('evidence_id').notNull(),
 linkedBy:text('linked_by').notNull(),
 created:bigint('created',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.battle,t.argumentUser,t.evidenceId]}),index('idx_argument_evidence_links_battle_user').on(t.battle,t.argumentUser),index('idx_argument_evidence_links_evidence').on(t.evidenceId),index('idx_argument_evidence_links_created').on(t.created)]);

export const characterVersions=pgTable('character_versions',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 name:text('name').notNull(),
 shortName:text('short_name'),
 aliases:text('aliases').notNull().default('[]'),
 description:text('description').notNull(),
 era:text('era'),
 arc:text('arc'),
 sortOrder:bigint('sort_order',{mode:'number'}).notNull(),
 canonical:bigint('canonical',{mode:'number'}).notNull().default(1),
 sourceEndpoint:text('source_endpoint'),
 parentVersionId:text('parent_version_id'),
 created:bigint('created',{mode:'number'}).notNull()
},t=>[index('idx_character_versions_character').on(t.characterId),index('idx_character_versions_character_order').on(t.characterId,t.sortOrder),index('idx_character_versions_parent').on(t.parentVersionId)]);

export const abilities=pgTable('abilities',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 name:text('name').notNull(),
 description:text('description').notNull(),
 category:text('category').notNull(),
 created:bigint('created',{mode:'number'}).notNull()
},t=>[index('idx_abilities_character').on(t.characterId)]);

export const versionAbilities=pgTable('version_abilities',{
 versionId:text('version_id').notNull(),
 abilityId:text('ability_id').notNull(),
 status:text('status').notNull().default('available'),
 notes:text('notes').notNull().default('')
},t=>[primaryKey({columns:[t.versionId,t.abilityId]}),index('idx_version_abilities_version').on(t.versionId),index('idx_version_abilities_ability').on(t.abilityId)]);



export const versionCombatRoles=pgTable('version_combat_roles',{
 versionId:text('version_id').notNull().references(()=>characterVersions.id,{onDelete:'cascade'}),
 role:text('role').notNull(),
 priority:text('priority').notNull(),
 notes:text('notes').notNull().default('')
},t=>[primaryKey({columns:[t.versionId,t.role]}),index('idx_version_combat_roles_role').on(t.role,t.versionId),check('version_combat_roles_role_valid',sql`${t.role} IN ('dps','tank','support','healer','controller','strategist','assassin','speedster','summoner','reality_manipulator','defense')`),check('version_combat_roles_priority_valid',sql`${t.priority} IN ('primary','secondary')`)]);

export const versionStrategicTraits=pgTable('version_strategic_traits',{
 versionId:text('version_id').notNull().references(()=>characterVersions.id,{onDelete:'cascade'}),
 trait:text('trait').notNull()
},t=>[primaryKey({columns:[t.versionId,t.trait]}),index('idx_version_strategic_traits_trait').on(t.trait,t.versionId),check('version_strategic_traits_trait_valid',sql`${t.trait} IN ('healing','barrier','crowd_control','mobility','teleportation','information','buff','debuff','sealing','summoning','illusion','stealth','long_range','close_range','area_damage','single_target','adaptation','prediction','anti_regeneration')`)]);

export const users=pgTable('users',{
 id:text('id').primaryKey(),
 email:text('email'),
 emailNormalized:text('email_normalized'),
 emailVerified:bigint('email_verified',{mode:'number'}).notNull().default(0),
 profileCompleted:bigint('profile_completed',{mode:'number'}).notNull().default(0),
 created:bigint('created',{mode:'number'}).notNull(),
 updated:bigint('updated',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_users_email_normalized').on(t.emailNormalized)]);

export const authIdentities=pgTable('auth_identities',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 provider:text('provider').notNull(),
 providerUserId:text('provider_user_id').notNull(),
 providerEmail:text('provider_email'),
 credentialHash:text('credential_hash'),
 created:bigint('created',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_auth_identity_provider_subject').on(t.provider,t.providerUserId),index('idx_auth_identity_user').on(t.userId)]);

export const authSessions=pgTable('auth_sessions',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:bigint('created',{mode:'number'}).notNull(),
 expires:bigint('expires',{mode:'number'}).notNull(),
 lastUsed:bigint('last_used',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_auth_sessions_token_hash').on(t.tokenHash),index('idx_auth_sessions_user_expires').on(t.userId,t.expires)]);

export const emailVerificationTokens=pgTable('email_verification_tokens',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:bigint('created',{mode:'number'}).notNull(),
 expires:bigint('expires',{mode:'number'}).notNull(),
 used:bigint('used',{mode:'number'}).notNull().default(0)
},t=>[uniqueIndex('idx_email_verification_token_hash').on(t.tokenHash),index('idx_email_verification_user').on(t.userId,t.expires)]);

export const passwordResetTokens=pgTable('password_reset_tokens',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:bigint('created',{mode:'number'}).notNull(),
 expires:bigint('expires',{mode:'number'}).notNull(),
 used:bigint('used',{mode:'number'}).notNull().default(0)
},t=>[uniqueIndex('idx_password_reset_token_hash').on(t.tokenHash),index('idx_password_reset_user').on(t.userId,t.expires)]);

export const authOauthStates=pgTable('auth_oauth_states',{
 stateHash:text('state_hash').primaryKey(),
 pkceVerifierHash:text('pkce_verifier_hash').notNull(),
 returnTo:text('return_to').notNull(),
 created:bigint('created',{mode:'number'}).notNull(),
 expires:bigint('expires',{mode:'number'}).notNull(),
 used:bigint('used',{mode:'number'}).notNull().default(0)
},t=>[index('idx_auth_oauth_states_expires').on(t.expires)]);

export const authRateLimits=pgTable('auth_rate_limits',{
 keyHash:text('key_hash').primaryKey(),
 scope:text('scope').notNull(),
 windowStart:bigint('window_start',{mode:'number'}).notNull(),
 count:bigint('count',{mode:'number'}).notNull(),
 blockedUntil:bigint('blocked_until',{mode:'number'}).notNull().default(0)
},t=>[index('idx_auth_rate_limits_window').on(t.windowStart)]);


/** Community verdicts are frozen snapshots; all profile statistics derive from these rows. */
export const battleResults=pgTable('battle_results',{
 battleId:text('battle_id').primaryKey().references(()=>battles.id),
 fighterAId:text('fighter_a_id').notNull(),
 fighterAVersionId:text('fighter_a_version_id').notNull(),
 fighterBId:text('fighter_b_id').notNull(),
 fighterBVersionId:text('fighter_b_version_id').notNull(),
 conditionsJson:text('conditions_json').notNull(),
 outcome:text('outcome').notNull(),
 status:text('status').notNull().default('FINALIZED'),
 sourceType:text('source_type').notNull().default('COMMUNITY_VERDICT'),
 votesA:integer('votes_a').notNull(),votesB:integer('votes_b').notNull(),
 votesDraw:integer('votes_draw').notNull(),difficultyJson:text('difficulty_json').notNull(),
 scoringVersion:integer('scoring_version').notNull(),
 finalizedAt:bigint('finalized_at',{mode:'number'}).notNull(),
 finalizedBy:text('finalized_by').notNull(),
 voidedAt:bigint('voided_at',{mode:'number'}),voidReason:text('void_reason')
},t=>[index('idx_battle_results_fighter_a').on(t.fighterAId,t.status,t.finalizedAt),index('idx_battle_results_fighter_b').on(t.fighterBId,t.status,t.finalizedAt),index('idx_battle_results_version_a').on(t.fighterAVersionId,t.status),index('idx_battle_results_version_b').on(t.fighterBVersionId,t.status)]);

export const battleResultAudit=pgTable('battle_result_audit',{
 id:text('id').primaryKey(),battleId:text('battle_id').notNull().references(()=>battleResults.battleId),
 action:text('action').notNull(),actorUserId:text('actor_user_id').notNull(),
 reason:text('reason').notNull(),snapshotJson:text('snapshot_json').notNull(),
 createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[index('idx_battle_result_audit_battle').on(t.battleId,t.createdAt)]);

export const battleRematches=pgTable('battle_rematches',{
 originalBattleId:text('original_battle_id').notNull().references(()=>battles.id),
 rematchBattleId:text('rematch_battle_id').primaryKey().references(()=>battles.id),
 createdBy:text('created_by').notNull(),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[index('idx_battle_rematches_parent').on(t.originalBattleId)]);

export const battleCollections=pgTable('battle_collections',{
 id:text('id').primaryKey(),ownerUserId:text('owner_user_id').notNull().references(()=>users.id),
 title:text('title').notNull(),description:text('description').notNull().default(''),
 visibility:text('visibility').notNull().default('private'),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[index('idx_battle_collections_owner').on(t.ownerUserId,t.updatedAt)]);

export const battleCollectionItems=pgTable('battle_collection_items',{
 collectionId:text('collection_id').notNull().references(()=>battleCollections.id),
 battleId:text('battle_id').notNull().references(()=>battles.id),
 position:integer('position').notNull(),addedAt:bigint('added_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.collectionId,t.battleId]}),index('idx_battle_collection_items_position').on(t.collectionId,t.position,t.battleId)]);

/** Ineligible historical battles are explicitly excluded from retry loops. */
export const battleFinalizationSkips=pgTable('battle_finalization_skips',{
 battleId:text('battle_id').primaryKey().references(()=>battles.id,{onDelete:'cascade'}),
 reason:text('reason').notNull(),
 recordedAt:bigint('recorded_at',{mode:'number'}).notNull()
});


// Canonical media catalogue, unified user tracking, social graph, activity, badges and rank history.
export const anime=pgTable('anime',{
 id:text('id').primaryKey(),legacyKey:text('legacy_key'),titleCanonical:text('title_canonical').notNull(),
 titleEnglish:text('title_english'),titleRomaji:text('title_romaji'),titleNative:text('title_native'),
 alternativeTitles:jsonb('alternative_titles').notNull().default([]),synopsis:text('synopsis'),format:text('format'),
 releaseStatus:text('release_status'),releaseYear:integer('release_year'),startDate:text('start_date'),endDate:text('end_date'),
 episodeCount:integer('episode_count'),durationMinutes:integer('duration_minutes'),genres:jsonb('genres').notNull().default([]),
 tags:jsonb('tags').notNull().default([]),studios:jsonb('studios').notNull().default([]),coverImageUrl:text('cover_image_url'),
 bannerImageUrl:text('banner_image_url'),officialWebsite:text('official_website'),dataSource:text('data_source').notNull().default('local'),
 lastSyncedAt:bigint('last_synced_at',{mode:'number'}),metadataComplete:bigint('metadata_complete',{mode:'number'}).notNull().default(0),
 metadataLocked:bigint('metadata_locked',{mode:'number'}).notNull().default(0),searchText:text('search_text').notNull().default(''),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_anime_legacy_key').on(t.legacyKey),index('idx_anime_status_year').on(t.releaseStatus,t.releaseYear)]);

export const animeSeasons=pgTable('anime_seasons',{
 id:text('id').primaryKey(),animeId:text('anime_id').notNull().references(()=>anime.id,{onDelete:'cascade'}),
 seasonNumber:integer('season_number'),seasonLabel:text('season_label'),title:text('title').notNull(),releaseYear:integer('release_year'),
 startDate:text('start_date'),endDate:text('end_date'),episodeCount:integer('episode_count'),
 absoluteEpisodeStart:integer('absolute_episode_start'),absoluteEpisodeEnd:integer('absolute_episode_end'),
 continuity:text('continuity'),sortOrder:integer('sort_order').notNull().default(0),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[index('idx_anime_seasons_anime_order').on(t.animeId,t.sortOrder,t.id)]);

export const animeEpisodes=pgTable('anime_episodes',{
 id:text('id').primaryKey(),animeId:text('anime_id').notNull().references(()=>anime.id,{onDelete:'cascade'}),
 seasonId:text('season_id').references(()=>animeSeasons.id,{onDelete:'set null'}),episodeNumber:text('episode_number').notNull(),
 absoluteOrder:integer('absolute_order'),title:text('title'),airDate:text('air_date'),durationMinutes:integer('duration_minutes'),
 synopsis:text('synopsis'),episodeType:text('episode_type').notNull().default('standard'),canonClassification:text('canon_classification'),
 spoilerLevel:integer('spoiler_level'),dataSource:text('data_source').notNull().default('local'),
 lastSyncedAt:bigint('last_synced_at',{mode:'number'}),createdAt:bigint('created_at',{mode:'number'}).notNull(),
 updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_anime_episode_number').on(t.animeId,t.episodeNumber),index('idx_anime_episodes_anime_order').on(t.animeId,t.absoluteOrder,t.id)]);

export const manga=pgTable('manga',{
 id:text('id').primaryKey(),legacyKey:text('legacy_key'),titleCanonical:text('title_canonical').notNull(),
 titleEnglish:text('title_english'),titleRomaji:text('title_romaji'),titleNative:text('title_native'),
 alternativeTitles:jsonb('alternative_titles').notNull().default([]),author:text('author'),illustrator:text('illustrator'),
 publisher:text('publisher'),serializationMagazine:text('serialization_magazine'),publicationStatus:text('publication_status'),
 startDate:text('start_date'),endDate:text('end_date'),totalChapters:integer('total_chapters'),totalVolumes:integer('total_volumes'),
 genres:jsonb('genres').notNull().default([]),synopsis:text('synopsis'),coverImageUrl:text('cover_image_url'),
 continuity:text('continuity'),dataSource:text('data_source').notNull().default('local'),
 lastSyncedAt:bigint('last_synced_at',{mode:'number'}),metadataComplete:bigint('metadata_complete',{mode:'number'}).notNull().default(0),
 metadataLocked:bigint('metadata_locked',{mode:'number'}).notNull().default(0),searchText:text('search_text').notNull().default(''),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_manga_legacy_key').on(t.legacyKey),index('idx_manga_status').on(t.publicationStatus)]);

export const mangaChapters=pgTable('manga_chapters',{
 id:text('id').primaryKey(),mangaId:text('manga_id').notNull().references(()=>manga.id,{onDelete:'cascade'}),
 chapterNumber:text('chapter_number').notNull(),volumeNumber:text('volume_number'),title:text('title'),
 publicationDate:text('publication_date'),chapterOrder:integer('chapter_order'),continuity:text('continuity'),
 spoilerLevel:integer('spoiler_level'),dataSource:text('data_source').notNull().default('local'),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_manga_chapter_number').on(t.mangaId,t.chapterNumber),index('idx_manga_chapters_order').on(t.mangaId,t.chapterOrder,t.id)]);

export const mediaExternalIds=pgTable('media_external_ids',{
 mediaType:text('media_type').notNull(),mediaId:text('media_id').notNull(),provider:text('provider').notNull(),externalId:text('external_id').notNull(),
 canonicalUrl:text('canonical_url'),verifiedAt:bigint('verified_at',{mode:'number'}),createdAt:bigint('created_at',{mode:'number'}).notNull(),
 updatedAt:bigint('updated_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.mediaType,t.mediaId,t.provider]}),uniqueIndex('idx_media_external_identity').on(t.provider,t.mediaType,t.externalId)]);

export const mediaRelationships=pgTable('media_relationships',{
 id:text('id').primaryKey(),fromMediaType:text('from_media_type').notNull(),fromMediaId:text('from_media_id').notNull(),
 toMediaType:text('to_media_type').notNull(),toMediaId:text('to_media_id').notNull(),relationType:text('relation_type').notNull(),
 source:text('source').notNull().default('local'),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_media_relationship_identity').on(t.fromMediaType,t.fromMediaId,t.toMediaType,t.toMediaId,t.relationType),index('idx_media_relationships_from').on(t.fromMediaType,t.fromMediaId)]);

export const mediaSyncRuns=pgTable('media_sync_runs',{
 id:text('id').primaryKey(),provider:text('provider').notNull(),mode:text('mode').notNull(),status:text('status').notNull(),
 requestedBy:text('requested_by'),query:text('query'),startedAt:bigint('started_at',{mode:'number'}).notNull(),
 finishedAt:bigint('finished_at',{mode:'number'}),importedCount:integer('imported_count').notNull().default(0),
 updatedCount:integer('updated_count').notNull().default(0),skippedCount:integer('skipped_count').notNull().default(0),
 errorCount:integer('error_count').notNull().default(0),cursor:text('cursor'),detail:jsonb('detail').notNull().default({})
},t=>[index('idx_media_sync_runs_provider_started').on(t.provider,t.startedAt)]);

export const mediaSyncErrors=pgTable('media_sync_errors',{
 id:text('id').primaryKey(),runId:text('run_id').notNull().references(()=>mediaSyncRuns.id,{onDelete:'cascade'}),provider:text('provider').notNull(),
 externalId:text('external_id'),code:text('code'),message:text('message').notNull(),retryable:bigint('retryable',{mode:'number'}).notNull().default(0),
 payload:jsonb('payload'),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[index('idx_media_sync_errors_run').on(t.runId,t.createdAt)]);

export const clubMediaLinks=pgTable('club_media_links',{
 clubId:text('club_id').primaryKey(),animeId:text('anime_id').notNull().references(()=>anime.id,{onDelete:'cascade'}),
 createdAt:bigint('created_at',{mode:'number'}).notNull()
});

export const userMediaTracking=pgTable('user_media_tracking',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),mediaType:text('media_type').notNull(),
 mediaId:text('media_id').notNull(),status:text('status').notNull(),currentItemId:text('current_item_id'),currentPosition:text('current_position'),
 completedCount:integer('completed_count').notNull().default(0),startedAt:bigint('started_at',{mode:'number'}),
 completedAt:bigint('completed_at',{mode:'number'}),updatedAt:bigint('updated_at',{mode:'number'}).notNull(),
 cycle:integer('cycle').notNull().default(1),spoilerMode:text('spoiler_mode').notNull().default('progress'),
 activityVisibility:text('activity_visibility').notNull().default('private')
},t=>[primaryKey({columns:[t.userId,t.mediaType,t.mediaId]}),index('idx_user_media_tracking_user_status').on(t.userId,t.status,t.updatedAt)]);

export const userEpisodeCompletions=pgTable('user_episode_completions',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 episodeId:text('episode_id').notNull().references(()=>animeEpisodes.id,{onDelete:'cascade'}),viewingCycle:integer('viewing_cycle').notNull().default(1),
 completedAt:bigint('completed_at',{mode:'number'}).notNull(),completionSource:text('completion_source').notNull().default('manual'),
 correctionNote:text('correction_note')
},t=>[primaryKey({columns:[t.userId,t.episodeId,t.viewingCycle]}),index('idx_episode_completions_user_time').on(t.userId,t.completedAt)]);

export const userChapterCompletions=pgTable('user_chapter_completions',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 chapterId:text('chapter_id').notNull().references(()=>mangaChapters.id,{onDelete:'cascade'}),readingCycle:integer('reading_cycle').notNull().default(1),
 completedAt:bigint('completed_at',{mode:'number'}).notNull(),completionSource:text('completion_source').notNull().default('manual'),
 correctionNote:text('correction_note')
},t=>[primaryKey({columns:[t.userId,t.chapterId,t.readingCycle]}),index('idx_chapter_completions_user_time').on(t.userId,t.completedAt)]);

export const userMediaHistory=pgTable('user_media_history',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 mediaType:text('media_type').notNull(),mediaId:text('media_id').notNull(),eventType:text('event_type').notNull(),
 previousValue:jsonb('previous_value'),newValue:jsonb('new_value'),source:text('source').notNull().default('manual'),
 visibility:text('visibility').notNull().default('private'),createdAt:bigint('created_at',{mode:'number'}).notNull(),dedupeKey:text('dedupe_key')
},t=>[uniqueIndex('idx_user_media_history_dedupe').on(t.userId,t.dedupeKey),index('idx_user_media_history_user_time').on(t.userId,t.createdAt)]);

export const userFollows=pgTable('user_follows',{
 followerUserId:text('follower_user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 followedUserId:text('followed_user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.followerUserId,t.followedUserId]}),index('idx_user_follows_followed').on(t.followedUserId,t.createdAt)]);

export const userBlocks=pgTable('user_blocks',{
 blockerUserId:text('blocker_user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 blockedUserId:text('blocked_user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[primaryKey({columns:[t.blockerUserId,t.blockedUserId]})]);

export const userActivityPreferences=pgTable('user_activity_preferences',{
 userId:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),profileVisibility:text('profile_visibility').notNull().default('public'),
 publishBattles:bigint('publish_battles',{mode:'number'}).notNull().default(1),publishSquads:bigint('publish_squads',{mode:'number'}).notNull().default(1),
 publishEvidence:bigint('publish_evidence',{mode:'number'}).notNull().default(1),publishDiscussions:bigint('publish_discussions',{mode:'number'}).notNull().default(1),
 publishTracking:bigint('publish_tracking',{mode:'number'}).notNull().default(0),updatedAt:bigint('updated_at',{mode:'number'}).notNull()
});

export const userActivityEvents=pgTable('user_activity_events',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),eventType:text('event_type').notNull(),
 subjectType:text('subject_type').notNull(),subjectId:text('subject_id').notNull(),mediaType:text('media_type'),mediaId:text('media_id'),
 spoilerPosition:text('spoiler_position'),visibility:text('visibility').notNull().default('public'),metadata:jsonb('metadata').notNull().default({}),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),dedupeKey:text('dedupe_key').notNull()
},t=>[uniqueIndex('idx_user_activity_event_dedupe').on(t.userId,t.dedupeKey),index('idx_user_activity_events_user_time').on(t.userId,t.createdAt),index('idx_user_activity_events_feed').on(t.visibility,t.createdAt)]);

export const profileBadges=pgTable('profile_badges',{
 id:text('id').primaryKey(),name:text('name').notNull(),description:text('description').notNull(),category:text('category').notNull(),
 icon:text('icon').notNull(),criteriaVersion:integer('criteria_version').notNull().default(1),active:bigint('active',{mode:'number'}).notNull().default(1),
 createdAt:bigint('created_at',{mode:'number'}).notNull()
});

export const userBadges=pgTable('user_badges',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),badgeId:text('badge_id').notNull().references(()=>profileBadges.id,{onDelete:'cascade'}),
 earnedAt:bigint('earned_at',{mode:'number'}).notNull(),sourceType:text('source_type').notNull(),sourceId:text('source_id').notNull(),
 revokedAt:bigint('revoked_at',{mode:'number'}),revokeReason:text('revoke_reason')
},t=>[primaryKey({columns:[t.userId,t.badgeId]}),index('idx_user_badges_user_time').on(t.userId,t.earnedAt)]);

export const reputationEvents=pgTable('reputation_events',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),eventType:text('event_type').notNull(),
 points:integer('points').notNull(),sourceType:text('source_type').notNull(),sourceId:text('source_id').notNull(),
 weightVersion:integer('weight_version').notNull().default(1),createdAt:bigint('created_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_reputation_event_source').on(t.userId,t.eventType,t.sourceType,t.sourceId),index('idx_reputation_events_user_time').on(t.userId,t.createdAt)]);

export const userRankHistory=pgTable('user_rank_history',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),rankId:text('rank_id').notNull(),
 points:integer('points').notNull(),rankVersion:integer('rank_version').notNull().default(1),achievedAt:bigint('achieved_at',{mode:'number'}).notNull()
},t=>[uniqueIndex('idx_user_rank_history_once').on(t.userId,t.rankId,t.rankVersion),index('idx_user_rank_history_user_time').on(t.userId,t.achievedAt)]);
