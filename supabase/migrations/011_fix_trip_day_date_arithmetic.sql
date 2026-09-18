-- Hotfix: generate_series returns timestamp values; cast to date before adding the day number.
begin;
create or replace function public.create_trip_with_days(trip_title text,trip_start_date date default null,trip_end_date date default null,trip_travelers integer default 1,trip_budget_total numeric default null,trip_preferences jsonb default '{}'::jsonb,trip_status text default 'draft') returns uuid language plpgsql security definer set search_path=public as $$declare new_trip_id uuid;first_date date;last_date date;begin
  if auth.uid() is null then raise exception 'Authentication required';end if;
  if nullif(trim(trip_title),'') is null then raise exception 'Trip title required';end if;
  if trip_travelers is null or trip_travelers<1 then raise exception 'Travelers must be positive';end if;
  if trip_budget_total is not null and trip_budget_total<0 then raise exception 'Budget cannot be negative';end if;
  first_date:=coalesce(trip_start_date,current_date);last_date:=coalesce(trip_end_date,first_date);
  if last_date<first_date then raise exception 'End date must not be before start date';end if;
  insert into trips(owner_user_id,title,start_date,end_date,travelers,budget_total,preferences,status) values(auth.uid(),trim(trip_title),trip_start_date,trip_end_date,trip_travelers,trip_budget_total,coalesce(trip_preferences,'{}'::jsonb),trip_status) returning id into new_trip_id;
  insert into trip_days(trip_id,day_number,service_date,title)
  select new_trip_id,(g.d::date-first_date)+1,g.d::date,'Day '||((g.d::date-first_date)+1)::text
  from generate_series(first_date,last_date,'1 day'::interval) as g(d);
  return new_trip_id;
end$$;
revoke all on function public.create_trip_with_days(text,date,date,integer,numeric,jsonb,text) from public;
grant execute on function public.create_trip_with_days(text,date,date,integer,numeric,jsonb,text) to authenticated;
commit;
