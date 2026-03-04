# Supabase Realtime API: how it works and migration plan

## 1) Current state in this project

- Realtime DB updates are handled via `postgres_changes` subscriptions.
- Typing/recording events use `broadcast`, but channels are not configured as private.
- SQL has RLS for `public.*` tables (`messages`, `presence`, etc.).
- SQL does not define Realtime Authorization policies on `realtime.messages`.

So now the project mostly uses the classic model:
- DB replication (`postgres_changes`) + table RLS.
- Ad-hoc broadcast channels.

## 2) What "new Realtime API" means (Supabase)

New model focuses on secure realtime channels with explicit auth rules:

- Private channels:
  - `supabase.channel('room:...', { config: { private: true } })`
- Realtime Authorization policies on `realtime.messages`:
  - Controls who can `select`/`insert` messages into realtime channels.
- Broadcast and Presence:
  - Broadcast for custom events (`typing`, `recording`, etc.).
  - Presence for online state and user metadata in channel.

This model gives stricter control than public channels and avoids accidental data/event leakage.

## 3) Target architecture after migration

- Keep `postgres_changes` for message persistence updates (safe, simple, already working).
- Move custom realtime events (`typing`, `recording`, optional online status) to:
  - private channels
  - policies in `realtime.messages`
- Optionally migrate online status from DB table `public.presence` to channel Presence API.
  - Keep DB `presence` as fallback during transition.

## 4) SQL migration (new file or section in `sql.txt`)

### 4.1 Enable Realtime Authorization rules

Create policies on `realtime.messages` for authenticated users.

Minimal baseline:

```sql
-- allow authenticated users to subscribe/send in realtime
create policy "realtime_auth_select"
on realtime.messages
for select
to authenticated
using (true);

create policy "realtime_auth_insert"
on realtime.messages
for insert
to authenticated
with check (true);
```

Recommended stricter policy (channel prefix whitelist), example:

```sql
-- Allow only app-specific channel topics
create policy "realtime_auth_select_scoped"
on realtime.messages
for select
to authenticated
using (
  split_part(realtime.topic(), ':', 1) in ('typing', 'recording', 'presence')
);

create policy "realtime_auth_insert_scoped"
on realtime.messages
for insert
to authenticated
with check (
  split_part(realtime.topic(), ':', 1) in ('typing', 'recording', 'presence')
);
```

Notes:
- Do not keep both broad and strict variants simultaneously in production.
- Keep policy names unique in your migrations.

### 4.2 Keep existing table RLS untouched

Do not remove current policies for:
- `public.messages`
- `public.conversation_members`
- `public.presence`

They are still required for DB reads/writes and `postgres_changes`.

## 5) Frontend migration steps

## Step A: make broadcast channels private

In realtime API layer (`src/shared/api/realtime-api.ts`), migrate:

- Before:
  - `supabase.channel('typing:...')`
  - `supabase.channel('recording:...')`
- After:
  - `supabase.channel('typing:...', { config: { private: true } })`
  - `supabase.channel('recording:...', { config: { private: true } })`

Optional explicit settings:

```ts
supabase.channel(topic, {
  config: {
    private: true,
    broadcast: { ack: true, self: false },
    presence: { key: userId },
  },
})
```

## Step B: keep message updates on `postgres_changes`

No immediate change to:
- `subscribeMessages(...)`
- `subscribeConversationsGlobal(...)`

Reason: stable and already integrated with your stores.

## Step C: optional Presence API migration

If moving online-state from DB table to channel presence:
- add presence join/leave handling in realtime composable.
- keep DB presence write path as fallback for one release cycle.

## Step D: rollout with feature flag

Add env flag, for example:
- `VITE_REALTIME_PRIVATE_CHANNELS=true`

Switch by flag in `realtime-api.ts`:
- if enabled -> private channels
- else -> current behavior

This allows instant rollback without DB rollback.

## 6) Testing checklist

- Authenticated users:
  - can subscribe to typing/recording channels
  - can send typing/recording events
- Unauthenticated client:
  - cannot subscribe/send to private realtime channels
- DB subscriptions (`postgres_changes`) still deliver message insert/update.
- Multi-device test:
  - user A typing event is visible to user B
  - no event leakage to unrelated conversation tabs.

## 7) Rollback plan

- Frontend rollback:
  - disable `VITE_REALTIME_PRIVATE_CHANNELS`
- SQL rollback:
  - keep old table RLS untouched
  - if needed, drop only new `realtime.messages` policies

## 8) Recommended migration order (safe path)

1. Add `realtime.messages` policies in DB.
2. Deploy frontend with feature flag OFF.
3. Enable feature flag in staging and test with two users.
4. Enable in production for small cohort.
5. Full rollout.
6. Optionally migrate DB `presence` table usage to channel Presence later.

---

If needed, next step is implementing Step A + feature flag directly in:
- `src/shared/api/realtime-api.ts`
- `src/shared/composables/use-app-realtime.ts`
