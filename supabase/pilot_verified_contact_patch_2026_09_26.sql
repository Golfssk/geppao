-- GepPao Pilot: source-backed contact/policy enrichment
-- Generated 2026-09-26. Does not change publication_status or verification_status.
begin;

update public.places set phone = '+66 44 049 069', email = 'getaway@hotelmys.com',
  website_url = 'https://www.hotelmys.com/', child_friendly = true,
  accessibility_supported = true, parking_available = true
where id = '298bc11f-9516-4627-993e-452b263847eb';

update public.places set email = 'resort.khaoyai.reservation@movenpick.com',
  website_url = 'https://movenpick.accor.com/en/asia/thailand/khao-yai/resort-khao-yai.html'
where id = 'e623d774-089f-4696-bfae-d544b752b261';

update public.places set phone = '+66 81 733 8783', email = 'info@pbvalley.com',
  website_url = 'https://www.pbvalley.com/wine-tour/', reservation_required = true,
  advance_booking_hours = 72
where id = '1c545f8d-f190-4777-9440-88d2b3273bfa';

update public.places set phone = '+66 94 831 0909', email = 'marketing@granmonte.com',
  website_url = 'https://www.granmonte.com/tour.php'
where id = '53890d4e-1085-45d4-a645-b8e426c3877f';

update public.places set phone = '+66 44 756 060-6', email = 'khaoyai.artspace@gmail.com',
  website_url = 'https://www.khaoyai-artmuseum.com/'
where id = 'c3235761-9b4c-4e92-8a35-8a07db2b05fa';

update public.places set phone = '086-092-6529', email = 'khaoyai.np@gmail.com',
  website_url = 'https://www.khaoyainationalpark.com/en/plan-your-visit', pet_friendly = false
where id = 'a4e2f68a-871f-4dde-a16e-b9f1cb62bad8';

update public.places set phone = '+66 44 001 188', website_url = 'https://scenicalworld.com/'
where id = '99bb9fd6-b4f1-418b-9789-6826a2771041';

update public.places set phone = '098-886-1181', website_url = 'https://www.piromcafe.com/'
where id = '6d49c27b-f3ee-4226-bc2b-73d965e922ec';

update public.places set email = 'thebirderslodge@gmail.com',
  website_url = 'https://www.thebirderslodge.com/'
where id = 'a86a0b6c-8b01-4607-8ec1-74cf0c6b0bc6';

update public.places set phone = '+66 81 733 8783', email = 'info@pbvalley.com',
  website_url = 'https://www.pbvalley.com/restaurant/'
where id = '46d68002-e81c-44d1-a1bf-16740a5c3360';

update public.places set phone = '044-365-555', website_url = 'https://www.ribs-mannn.com/'
where id = '5d6100df-5a4c-4c86-8d01-1c9c2ec40b57';

update public.places set website_url = 'https://thechocolatefactorythailand.com/EN/SHOP&RESTUARANT'
where id = '8299e082-4d1f-45ca-8e80-a1a3c2eac3c1';

commit;
