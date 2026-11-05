-- Atomic bid placement.
-- Locks the item row so concurrent bids on the same item run one at a time,
-- then checks the item is live and the amount beats the current high bid.
-- Run this once in the Supabase SQL editor.
--
-- Returns true if the bid was saved, false if it was rejected
-- (item missing, item not live, or amount not higher than the current high bid).

create or replace function place_bid(
  p_item_id bigint,
  p_user_id bigint,
  p_amount numeric
) returns boolean
language plpgsql
as $$
declare
  v_start numeric;
  v_status text;
  v_high numeric;
begin
  select starting_price, status::text
    into v_start, v_status
    from items_duplicate
   where item_id = p_item_id
   for update;

  if not found then
    return false;
  end if;

  -- check this value against the status enum in your table
  if v_status <> 'live' then
    return false;
  end if;

  select coalesce(max(amount), v_start)
    into v_high
    from bids_duplicate
   where item_id = p_item_id;

  if p_amount <= v_high then
    return false;
  end if;

  insert into bids_duplicate (item_id, user_id, amount)
  values (p_item_id, p_user_id, p_amount);

  return true;
end;
$$;
