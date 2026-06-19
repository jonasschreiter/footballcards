-- Migration: Persistent API rate limiting per user + scope

create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, scope, window_start)
);

create or replace function public.consume_api_rate_limit(
  p_user_id uuid,
  p_scope text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if auth.uid() is null or p_user_id is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized rate limit request';
  end if;

  if coalesce(length(trim(p_scope)), 0) = 0 then
    raise exception 'Rate limit scope is required';
  end if;

  if p_max_requests is null or p_max_requests <= 0 then
    raise exception 'p_max_requests must be > 0';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (user_id, scope, window_start, count, updated_at)
  values (p_user_id, p_scope, v_window_start, 1, v_now)
  on conflict (user_id, scope, window_start)
  do update
    set count = public.api_rate_limits.count + 1,
        updated_at = v_now
  returning public.api_rate_limits.count into v_count;

  delete from public.api_rate_limits
  where user_id = p_user_id
    and scope = p_scope
    and window_start < (v_window_start - make_interval(secs => p_window_seconds * 10));

  if v_count <= p_max_requests then
    return query
      select true, 0, greatest(0, p_max_requests - v_count);
    return;
  end if;

  v_retry := greatest(
    1,
    ceil(extract(epoch from ((v_window_start + make_interval(secs => p_window_seconds)) - v_now)))::integer
  );

  return query
    select false, v_retry, 0;
end;
$$;

revoke all on public.api_rate_limits from anon, authenticated;
grant execute on function public.consume_api_rate_limit(uuid, text, integer, integer) to authenticated;
