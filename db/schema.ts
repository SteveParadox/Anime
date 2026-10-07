import {sqliteTable,text,integer,primaryKey,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const battles=sqliteTable('battles',{id:text('id').primaryKey(),owner:text('owner').notNull(),payload:text('payload').notNull(),created:integer('created').notNull()});
export const votes=sqliteTable('votes',{battle:text('battle').notNull(),user:text('user').notNull(),side:text('side').notNull(),difficulty:text('difficulty'),reason:text('reason').notNull(),evidence:text('evidence').notNull(),created:integer('created').notNull()},t=>[primaryKey({columns:[t.battle,t.user]})]);
export const argumentEvidence=sqliteTable('argument_evidence',{id:text('id').primaryKey(),battle:text('battle').notNull(),argumentUser:text('argument_user').notNull(),contributor:text('contributor').notNull(),reference:text('reference').notNull(),context:text('context').notNull().default(''),created:integer('created').notNull()},t=>[index('idx_argument_evidence_battle_user').on(t.battle,t.argumentUser),index('idx_argument_evidence_created').on(t.created)]);
export const progress=sqliteTable('progress',{user:text('user').notNull(),club:text('club').notNull(),episode:integer('episode').notNull()},t=>[primaryKey({columns:[t.user,t.club]})]);
export const posts=sqliteTable('posts',{id:text('id').primaryKey(),user:text('user').notNull(),club:text('club').notNull(),episode:integer('episode').notNull(),body:text('body').notNull(),edited:integer('edited').notNull().default(0),deleted:integer('deleted').notNull().default(0),created:integer('created').notNull()},t=>[index('idx_posts_club_episode').on(t.club,t.episode)]);
export const squads=sqliteTable('squads',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),members:text('members').notNull(),strategy:text('strategy').notNull(),challenge:text('challenge').notNull(),created:integer('created').notNull()},t=>[index('idx_squads_owner').on(t.owner)]);
export const profiles=sqliteTable('profiles',{user:text('user').primaryKey(),handle:text('handle').notNull(),displayName:text('display_name').notNull(),avatarUrl:text('avatar_url'),bio:text('bio').notNull().default(''),favoriteAnime:text('favorite_anime').notNull().default('[]'),favoriteCharacters:text('favorite_characters').notNull().default('[]'),created:integer('created').notNull(),updated:integer('updated').notNull()},t=>[uniqueIndex('idx_profiles_handle').on(t.handle)]);
export const comments=sqliteTable('comments',{id:text('id').primaryKey(),battle:text('battle').notNull(),argumentUser:text('argument_user').notNull(),user:text('user').notNull(),body:text('body').notNull(),created:integer('created').notNull()},t=>[index('idx_comments_argument').on(t.battle,t.argumentUser)]);
export const reactions=sqliteTable('reactions',{subjectType:text('subject_type').notNull(),subjectId:text('subject_id').notNull(),user:text('user').notNull(),reaction:text('reaction').notNull(),created:integer('created').notNull()},t=>[primaryKey({columns:[t.subjectType,t.subjectId,t.user]})]);
export const squadChallenges=sqliteTable('squad_challenges',{id:text('id').primaryKey(),challenger:text('challenger').notNull(),challengerSquad:text('challenger_squad').notNull(),opponentSquad:text('opponent_squad').notNull(),rules:text('rules').notNull(),status:text('status').notNull().default('open'),created:integer('created').notNull()},t=>[index('idx_challenges_created').on(t.created)]);
export const challengeVotes=sqliteTable('challenge_votes',{challenge:text('challenge').notNull(),user:text('user').notNull(),side:text('side').notNull(),created:integer('created').notNull()},t=>[primaryKey({columns:[t.challenge,t.user]})]);
export const notifications=sqliteTable('notifications',{id:text('id').primaryKey(),user:text('user').notNull(),kind:text('kind').notNull(),message:text('message').notNull(),link:text('link').notNull(),read:integer('read').notNull().default(0),created:integer('created').notNull()},t=>[index('idx_notifications_user_created').on(t.user,t.created)]);
export const reports=sqliteTable('reports',{id:text('id').primaryKey(),reporter:text('reporter').notNull(),subjectType:text('subject_type').notNull(),subjectId:text('subject_id').notNull(),reason:text('reason').notNull(),status:text('status').notNull().default('open'),created:integer('created').notNull()},t=>[index('idx_reports_status_created').on(t.status,t.created)]);
export const watchlist=sqliteTable('watchlist',{user:text('user').notNull(),anime:text('anime').notNull(),status:text('status').notNull(),created:integer('created').notNull()},t=>[primaryKey({columns:[t.user,t.anime]})]);
export const tournamentVotes=sqliteTable('tournament_votes',{week:text('week').notNull(),match:text('match').notNull(),user:text('user').notNull(),pick:text('pick').notNull(),created:integer('created').notNull()},t=>[primaryKey({columns:[t.week,t.match,t.user]})]);

export const evidenceRecords=sqliteTable('evidence_records',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 sourceType:text('source_type').notNull(),
 series:text('series').notNull(),
 category:text('category').notNull(),
 title:text('title').notNull(),
 description:text('description').notNull(),
 episode:integer('episode'),
 timestamp:text('timestamp'),
 chapter:integer('chapter'),
 page:integer('page'),
 versionId:text('version_id'),
 abilityId:text('ability_id'),
 submittedBy:text('submitted_by').notNull(),
 created:integer('created').notNull(),
 updated:integer('updated').notNull(),
 deleted:integer('deleted').notNull().default(0),
 deletedAt:integer('deleted_at')
},t=>[index('idx_evidence_records_character').on(t.characterId),index('idx_evidence_records_character_category').on(t.characterId,t.category),index('idx_evidence_records_source_type').on(t.sourceType),index('idx_evidence_records_version').on(t.versionId),index('idx_evidence_records_version_category').on(t.versionId,t.category),index('idx_evidence_records_ability').on(t.abilityId),index('idx_evidence_records_created').on(t.created),index('idx_evidence_records_active_character_created').on(t.characterId,t.deleted,t.created)]);

export const argumentEvidenceLinks=sqliteTable('argument_evidence_links',{
 battle:text('battle').notNull(),
 argumentUser:text('argument_user').notNull(),
 evidenceId:text('evidence_id').notNull(),
 linkedBy:text('linked_by').notNull(),
 created:integer('created').notNull()
},t=>[primaryKey({columns:[t.battle,t.argumentUser,t.evidenceId]}),index('idx_argument_evidence_links_battle_user').on(t.battle,t.argumentUser),index('idx_argument_evidence_links_evidence').on(t.evidenceId),index('idx_argument_evidence_links_created').on(t.created)]);

export const characterVersions=sqliteTable('character_versions',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 name:text('name').notNull(),
 shortName:text('short_name'),
 aliases:text('aliases').notNull().default('[]'),
 description:text('description').notNull(),
 era:text('era'),
 arc:text('arc'),
 sortOrder:integer('sort_order').notNull(),
 canonical:integer('canonical').notNull().default(1),
 sourceEndpoint:text('source_endpoint'),
 parentVersionId:text('parent_version_id'),
 created:integer('created').notNull()
},t=>[index('idx_character_versions_character').on(t.characterId),index('idx_character_versions_character_order').on(t.characterId,t.sortOrder),index('idx_character_versions_parent').on(t.parentVersionId)]);

export const abilities=sqliteTable('abilities',{
 id:text('id').primaryKey(),
 characterId:text('character_id').notNull(),
 name:text('name').notNull(),
 description:text('description').notNull(),
 category:text('category').notNull(),
 created:integer('created').notNull()
},t=>[index('idx_abilities_character').on(t.characterId)]);

export const versionAbilities=sqliteTable('version_abilities',{
 versionId:text('version_id').notNull(),
 abilityId:text('ability_id').notNull(),
 status:text('status').notNull().default('available'),
 notes:text('notes').notNull().default('')
},t=>[primaryKey({columns:[t.versionId,t.abilityId]}),index('idx_version_abilities_version').on(t.versionId),index('idx_version_abilities_ability').on(t.abilityId)]);


export const users=sqliteTable('users',{
 id:text('id').primaryKey(),
 email:text('email'),
 emailNormalized:text('email_normalized'),
 emailVerified:integer('email_verified').notNull().default(0),
 profileCompleted:integer('profile_completed').notNull().default(0),
 created:integer('created').notNull(),
 updated:integer('updated').notNull()
},t=>[uniqueIndex('idx_users_email_normalized').on(t.emailNormalized)]);

export const authIdentities=sqliteTable('auth_identities',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 provider:text('provider').notNull(),
 providerUserId:text('provider_user_id').notNull(),
 providerEmail:text('provider_email'),
 credentialHash:text('credential_hash'),
 created:integer('created').notNull()
},t=>[uniqueIndex('idx_auth_identity_provider_subject').on(t.provider,t.providerUserId),index('idx_auth_identity_user').on(t.userId)]);

export const authSessions=sqliteTable('auth_sessions',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:integer('created').notNull(),
 expires:integer('expires').notNull(),
 lastUsed:integer('last_used').notNull()
},t=>[uniqueIndex('idx_auth_sessions_token_hash').on(t.tokenHash),index('idx_auth_sessions_user_expires').on(t.userId,t.expires)]);

export const emailVerificationTokens=sqliteTable('email_verification_tokens',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:integer('created').notNull(),
 expires:integer('expires').notNull(),
 used:integer('used').notNull().default(0)
},t=>[uniqueIndex('idx_email_verification_token_hash').on(t.tokenHash),index('idx_email_verification_user').on(t.userId,t.expires)]);

export const passwordResetTokens=sqliteTable('password_reset_tokens',{
 id:text('id').primaryKey(),
 userId:text('user_id').notNull(),
 tokenHash:text('token_hash').notNull(),
 created:integer('created').notNull(),
 expires:integer('expires').notNull(),
 used:integer('used').notNull().default(0)
},t=>[uniqueIndex('idx_password_reset_token_hash').on(t.tokenHash),index('idx_password_reset_user').on(t.userId,t.expires)]);

export const authOauthStates=sqliteTable('auth_oauth_states',{
 stateHash:text('state_hash').primaryKey(),
 pkceVerifierHash:text('pkce_verifier_hash').notNull(),
 returnTo:text('return_to').notNull(),
 created:integer('created').notNull(),
 expires:integer('expires').notNull(),
 used:integer('used').notNull().default(0)
},t=>[index('idx_auth_oauth_states_expires').on(t.expires)]);

export const authRateLimits=sqliteTable('auth_rate_limits',{
 keyHash:text('key_hash').primaryKey(),
 scope:text('scope').notNull(),
 windowStart:integer('window_start').notNull(),
 count:integer('count').notNull(),
 blockedUntil:integer('blocked_until').notNull().default(0)
},t=>[index('idx_auth_rate_limits_window').on(t.windowStart)]);
