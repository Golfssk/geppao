-- Publish three source-backed launch stories requested for the GepPao editorial pilot.
-- Facts were checked on 2026-09-27; each story names its authoritative source and uncertainty.
begin;

insert into public.articles(
  destination_id,title,slug,excerpt,body_markdown,category,tags,reading_minutes,
  is_featured,commercial_type,publication_status,published_at,seo_title,seo_description
) values
(
  (select id from public.destinations where slug='pak-chong-khao-yai'),
  'อัปเดตเขาใหญ่ปลายปี 2026: เวลาเข้าอุทยาน การเดินทาง และข้อควรรู้',
  'khao-yai-visitor-update-late-2026',
  'สรุปข้อมูลที่ตรวจสอบจากเว็บไซต์อุทยานแห่งชาติเขาใหญ่ ณ 27 กันยายน 2026 ก่อนจัดทริปช่วงปลายปี',
  'อัปเดต ณ 27 กันยายน 2026 — เว็บไซต์อุทยานแห่งชาติเขาใหญ่ระบุว่าเปิดทุกวันเวลา 06.00–18.00 น. ผู้เดินทางควรตรวจสภาพอากาศ สถานะสิ่งอำนวยความสะดวก กิจกรรม และประกาศล่าสุดอีกครั้งก่อนออกเดินทาง เพราะข้อมูลภายในอุทยานอาจเปลี่ยนตามฤดูกาลหรือสถานการณ์หน้างาน.

ถ้าเดินทางจากกรุงเทพฯ รถส่วนตัวเป็นทางเลือกที่สะดวกที่สุด เพราะภายในอุทยานไม่มีบริการขนส่งสาธารณะสำหรับเดินทางระหว่างจุดท่องเที่ยว ผู้ใช้รถสามารถเข้าทางด่านปากช่อง จังหวัดนครราชสีมา หรือด่านเนินหอม จังหวัดปราจีนบุรี และต้องชำระค่าบริการทั้งบุคคลและยานพาหนะที่จุดจำหน่ายบัตร.

สิ่งที่อุทยานระบุว่าไม่อนุญาตให้นำเข้า ได้แก่ สัตว์เลี้ยง ภาชนะโฟม เครื่องดื่มแอลกอฮอล์ และของมีคม ผู้เดินทางควรนำขยะกลับ ไม่ส่งเสียงดัง ไม่ให้อาหารสัตว์ และไม่ใช้โดรนหากไม่ได้รับอนุญาต.

หากพบช้างบนถนน ให้หยุดรถห่างอย่างน้อย 30 เมตร ไม่บีบแตร ไม่ใช้แฟลช และติดเครื่องยนต์ไว้เพื่อให้เคลื่อนรถได้เมื่อจำเป็น คำแนะนำนี้เป็นข้อมูลด้านความปลอดภัยจากอุทยาน ไม่ใช่การรับประกันว่าสภาพหน้างานจะเหมือนเดิมทุกวัน.

แหล่งข้อมูลที่ตรวจสอบ: https://khaoyainationalpark.com/en/plan-your-visit',
  'travel_advice',array['เขาใหญ่','อัปเดต 2026','อุทยานแห่งชาติ','เตรียมตัวเดินทาง'],4,
  true,'organic','published',now(),
  'อัปเดตเที่ยวเขาใหญ่ปลายปี 2026 | GepPao',
  'เวลาเข้าอุทยาน การเดินทาง ข้อห้าม และความปลอดภัยสำหรับวางแผนเที่ยวเขาใหญ่ปลายปี 2026'
),
(
  (select id from public.destinations where slug='kanchanaburi'),
  'Thailand Earth Trail Season 4 @ Sai Yok: เตรียมทริปกาญจนบุรี 10–11 ตุลาคม 2026',
  'thailand-earth-trail-sai-yok-october-2026',
  'ปฏิทินทางการของการท่องเที่ยวแห่งประเทศไทยระบุงาน Thailand Earth Trail Season 4 @ Sai Yok วันที่ 10–11 ตุลาคม 2026',
  'การท่องเที่ยวแห่งประเทศไทยแสดงรายการ Thailand Earth Trail Season 4 @ Sai Yok เป็นอีเวนต์ที่กำลังจะมาถึงในวันที่ 10–11 ตุลาคม 2026 ที่ไทรโยค จังหวัดกาญจนบุรี.

สำหรับการวางทริป ควรแยกข้อมูลที่ยืนยันแล้วออกจากสิ่งที่ยังต้องตรวจเพิ่มเติม ขณะจัดทำบทความนี้ แหล่งข้อมูลทางการยืนยันชื่อกิจกรรม พื้นที่ และวันจัดงาน แต่รายละเอียดเส้นทางวิ่ง จุดรับอุปกรณ์ เวลาเริ่ม ค่าสมัคร และเงื่อนไขผู้เข้าร่วมควรตรวจจากหน้ากิจกรรมหรือผู้จัดอีกครั้งก่อนชำระเงินและออกเดินทาง.

หากเดินทางจากกรุงเทพฯ ควรเผื่อเวลาเดินทาง เลือกที่พักใกล้พื้นที่จัดงาน และตรวจเส้นทางกลับล่วงหน้า โดยเฉพาะเมื่อกิจกรรมครอบคลุมสองวัน อย่าใช้เวลาประมาณการในบทความนี้แทนประกาศของผู้จัด.

GepPao จะอัปเดตรายละเอียดเพิ่มเติมเมื่อมีข้อมูลทางการที่ตรวจสอบได้ และจะไม่สร้างราคา ตารางเวลา หรือพิกัดจุดปล่อยตัวขึ้นเอง.

แหล่งข้อมูลที่ตรวจสอบ: https://www.tourismthailand.org/Events-and-Festivals/thailand-earth-trail-season-4-saiyok-2',
  'event_news',array['กาญจนบุรี','ไทรโยค','Trail','ตุลาคม 2026'],3,
  false,'organic','published',now(),
  'Thailand Earth Trail @ Sai Yok 10–11 ต.ค. 2026 | GepPao',
  'ข้อมูลยืนยันเบื้องต้นและรายการที่ต้องตรวจเพิ่มก่อนเดินทางร่วม Thailand Earth Trail Season 4 ที่ไทรโยค'
),
(
  (select id from public.destinations where slug='pattaya'),
  'Tomorrowland Thailand 2026 ที่พัทยา: สิ่งที่รู้แล้วก่อนวางทริป',
  'tomorrowland-thailand-pattaya-2026-trip-update',
  'Tomorrowland Thailand จะจัดวันที่ 11–13 ธันวาคม 2026 ที่ Wisdom Valley พัทยา สรุปข้อมูลทางการและสิ่งที่ต้องตรวจซ้ำก่อนเดินทาง',
  'Tourism Authority of Thailand เผยแพร่เมื่อ 6 กุมภาพันธ์ 2026 ว่า Tomorrowland Thailand จะจัดวันที่ 11–13 ธันวาคม 2026 ที่ Wisdom Valley บริเวณเขาไม้แก้ว อำเภอบางละมุง จังหวัดชลบุรี นี่เป็นการจัด Tomorrowland แบบเต็มรูปแบบครั้งแรกในเอเชียตามประกาศดังกล่าว.

ข้อมูลทางการระบุว่าพื้นที่จัดงานมีขนาด 560 เอเคอร์ วางแผนไว้หกเวที รวม Mainstage, CORE และ FREEDOM และตั้งเป้ารองรับผู้ร่วมงานมากกว่า 50,000 คนต่อวันตลอดสามวัน จำนวนดังกล่าวเป็นเป้าหมายของผู้จัด ไม่ใช่จำนวนผู้เข้าร่วมที่ยืนยันแล้ว.

งานในประเทศไทยจะไม่มี DreamVille camping แต่ประกาศระบุว่ามีแพ็กเกจที่พักพร้อมรถรับส่ง ผู้เดินทางจึงควรตรวจสถานะบัตร แพ็กเกจโรงแรม จุดขึ้นรถ และเงื่อนไขเข้าออกงานจาก Tomorrowland โดยตรงอีกครั้ง เพราะรอบจำหน่ายที่ประกาศไว้ก่อนหน้านี้อาจเปลี่ยนหรือจำหน่ายหมดแล้ว.

ถ้าจะพักในพัทยา ควรวางแผนเส้นทางไป Wisdom Valley แยกจากการเดินทางริมทะเล และเผื่อเวลาสำหรับการจราจรของงานขนาดใหญ่ GepPao จะยังไม่ประมาณราคาบัตร ค่าโรงแรม หรือเวลา Shuttle จนกว่าจะมีข้อมูลที่ตรวจสอบได้.

แหล่งข้อมูลที่ตรวจสอบ: https://www.tourismthailand.org/Articles/tomorrowland-en',
  'event_news',array['พัทยา','Tomorrowland','ธันวาคม 2026','Music Festival'],5,
  false,'organic','published',now(),
  'Tomorrowland Thailand 2026 พัทยา: ข้อมูลวางทริป | GepPao',
  'วันจัดงาน สถานที่ รูปแบบที่พัก และสิ่งที่ต้องตรวจซ้ำก่อนเดินทางไป Tomorrowland Thailand 2026 ที่พัทยา'
)
on conflict(slug) do update set
  destination_id=excluded.destination_id,
  title=excluded.title,
  excerpt=excluded.excerpt,
  body_markdown=excluded.body_markdown,
  category=excluded.category,
  tags=excluded.tags,
  reading_minutes=excluded.reading_minutes,
  is_featured=excluded.is_featured,
  commercial_type=excluded.commercial_type,
  publication_status='published',
  published_at=coalesce(articles.published_at,now()),
  seo_title=excluded.seo_title,
  seo_description=excluded.seo_description,
  updated_at=now()
returning id,slug,publication_status;

commit;
