-- Phase 18 / Batch 005
-- Direct-operator intake only. Creates PENDING Places; does not publish.

begin;
do $$
begin
  if not exists(select 1 from public.destinations where slug='pak-chong-khao-yai') then raise exception 'Batch 005 stopped: destination missing.'; end if;
  if exists(select 1 from public.places where slug in ('the-chocolate-factory-khao-yai','lamaya-khaoyai','trot-cafe-khaoyai','sai-sook-khao-yai','el-cafe-khaoyai','the-park-khaoyai') or lower(name) in ('the chocolate factory khao yai','lamaya khaoyai','trot cafe khaoyai','sai sook khao yai wildlife learning ground & local treats','el café khaoyai','the park khaoyai cafe and restaurant')) then raise exception 'Batch 005 stopped: one or more candidates already exist.'; end if;
end $$;

insert into public.places(business_id,destination_id,place_type,name,slug,address,phone,publication_status,verification_status)
select null,d.id,c.place_type,c.name,c.slug,c.address,c.phone,'pending','pending'
from public.destinations d cross join (values
 ('restaurant','The Chocolate Factory Khao Yai','the-chocolate-factory-khao-yai','352 Moo 2, Mu Si, Pak Chong, Nakhon Ratchasima 30130','092-443-8881'),
 ('restaurant','Lamaya Khaoyai','lamaya-khaoyai','369 Moo 4, Tanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima 30130',null::text),
 ('cafe','Trot Cafe Khaoyai','trot-cafe-khaoyai','333/2 Moo 12, Khanong Phra, Pak Chong, Nakhon Ratchasima 30130','088-378-2324'),
 ('attraction','Sai Sook Khao Yai Wildlife Learning Ground & Local Treats','sai-sook-khao-yai','286 Moo 4, Mu Si, Pak Chong, Nakhon Ratchasima 30130','063-242-6164'),
 ('cafe','EL Café Khaoyai','el-cafe-khaoyai','Thanon Mittraphap, Nong Nam Daeng, Pak Chong, Nakhon Ratchasima 30130',null::text),
 ('restaurant','The Park Khaoyai Cafe and Restaurant','the-park-khaoyai','789 Moo 7, Mu Si, Pak Chong, Nakhon Ratchasima 30130','096-404-6545')
) c(place_type,name,slug,address,phone) where d.slug='pak-chong-khao-yai';

insert into public.place_hours(place_id,day_of_week,open_time,close_time,is_closed,crosses_midnight)
select p.id,h.day_of_week,h.open_time,h.close_time,h.is_closed,h.crosses_midnight
from public.places p join (values
 ('the-chocolate-factory-khao-yai',0::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',1::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',2::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',3::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',4::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',5::smallint,'10:30:00'::time,'21:30:00'::time,false,false),('the-chocolate-factory-khao-yai',6::smallint,'10:30:00'::time,'21:30:00'::time,false,false),
 ('lamaya-khaoyai',0::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',1::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',2::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',3::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',4::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',5::smallint,'11:00:00'::time,'23:00:00'::time,false,false),('lamaya-khaoyai',6::smallint,'11:00:00'::time,'01:00:00'::time,false,true),
 ('trot-cafe-khaoyai',0::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',1::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',2::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',3::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',4::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',5::smallint,'10:00:00'::time,'19:00:00'::time,false,false),('trot-cafe-khaoyai',6::smallint,'10:00:00'::time,'19:00:00'::time,false,false),
 ('sai-sook-khao-yai',0::smallint,'09:30:00'::time,'17:00:00'::time,false,false),('sai-sook-khao-yai',1::smallint,'09:30:00'::time,'17:00:00'::time,false,false),('sai-sook-khao-yai',2::smallint,null::time,null::time,true,false),('sai-sook-khao-yai',3::smallint,'09:30:00'::time,'17:00:00'::time,false,false),('sai-sook-khao-yai',4::smallint,'09:30:00'::time,'17:00:00'::time,false,false),('sai-sook-khao-yai',5::smallint,'09:30:00'::time,'17:00:00'::time,false,false),('sai-sook-khao-yai',6::smallint,'09:30:00'::time,'17:00:00'::time,false,false),
 ('el-cafe-khaoyai',0::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',1::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',2::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',3::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',4::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',5::smallint,'08:30:00'::time,'17:30:00'::time,false,false),('el-cafe-khaoyai',6::smallint,'08:30:00'::time,'17:30:00'::time,false,false),
 ('the-park-khaoyai',0::smallint,'11:00:00'::time,'20:00:00'::time,false,false),('the-park-khaoyai',1::smallint,'11:00:00'::time,'20:00:00'::time,false,false),('the-park-khaoyai',2::smallint,null::time,null::time,true,false),('the-park-khaoyai',3::smallint,'11:00:00'::time,'20:00:00'::time,false,false),('the-park-khaoyai',4::smallint,'11:00:00'::time,'20:00:00'::time,false,false),('the-park-khaoyai',5::smallint,'11:00:00'::time,'20:00:00'::time,false,false),('the-park-khaoyai',6::smallint,'11:00:00'::time,'20:00:00'::time,false,false)
) h(slug,day_of_week,open_time,close_time,is_closed,crosses_midnight) on p.slug=h.slug;

insert into public.place_sources(place_id,source_type,source_url,source_note,checked_at,checked_by)
select p.id,s.source_type,s.source_url,s.source_note,'2026-09-19T16:35:00Z'::timestamptz,null from public.places p join (values
 ('the-chocolate-factory-khao-yai','official_website','https://thechocolatefactorythailand.com/EN/SHOP&RESTUARANT','Official branch source: address, phone, and restaurant daily 10:30–21:30.'),
 ('lamaya-khaoyai','official_website','https://www.lamayakhaoyai.com/day-experience','Official source: address and operating hours. Saturday closing after midnight is recorded with crosses_midnight.'),
 ('trot-cafe-khaoyai','official_social','https://www.facebook.com/trotcafekhaoyai/','Official operator source: address, daily 10:00–19:00, and phone.'),
 ('sai-sook-khao-yai','official_social','https://www.facebook.com/SaisookKhaoYai/posts/%E0%B8%82%E0%B8%AD%E0%B8%9A%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A1%E0%B8%B2%E0%B8%81%E0%B9%86%E0%B9%80%E0%B8%A5%E0%B8%A2%E0%B8%99%E0%B8%B0%E0%B8%84%E0%B8%B0-%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%81%E0%B8%A7%E0%B8%B0%E0%B8%A1%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%81%E0%B8%B1%E0%B8%99-%EF%B8%8F/122189233796116522/','Official operator source: address, 09:30–17:00 and Tuesday closure.'),
 ('el-cafe-khaoyai','official_social','https://www.facebook.com/elcafekhaoyai/videos/el-cafe-khaoyai-%E0%B9%80%E0%B8%AD%E0%B8%A5-%E0%B8%84%E0%B8%B2%E0%B9%80%E0%B8%9F%E0%B9%88-%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88-%E0%B8%84%E0%B8%B2%E0%B9%80%E0%B8%9F%E0%B9%88%E0%B8%A1%E0%B8%B4%E0%B8%99%E0%B8%B4%E0%B8%A1%E0%B8%AD%E0%B8%A5%E0%B8%81%E0%B8%A5%E0%B8%B2%E0%B8%87%E0%B8%AB%E0%B8%B8%E0%B8%9A%E0%B9%80%E0%B8%82%E0%B8%B2-%E0%B8%A7%E0%B8%B4%E0%B8%A7%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%9E%E0%B8%B2%E0%B9%82%E0%B8%99%E0%B8%A3%E0%B8%B2%E0%B8%A1%E0%B9%88%E0%B8%B2-/362671516399837/','Official operator source: daily 08:30–17:30. Address is retained as partial institutional location evidence and remains for Admin verification.'),
 ('el-cafe-khaoyai','institutional_hospitality','https://www.chatrium.com/lacolkhaoyai/experiences/dine','Current hospitality source: Thanon Mittraphap, Nong Nam Daeng, Pak Chong location.'),
 ('the-park-khaoyai','official_social','https://www.facebook.com/TheParkkhaoyai/','Official operator source: address, 11:00–20:00 and Tuesday closure.')
) s(slug,source_type,source_url,source_note) on p.slug=s.slug;
commit;
