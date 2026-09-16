-- ============================================================
-- 文山真人大富翁：示範資料（不是實際活動／店家／會員資料）
-- 正式環境若不需要展示，請勿執行本檔。
-- 示範會員：WENSHAN001 / PIN 2026
-- ============================================================
INSERT INTO events VALUES ('evt-demo-autumn','2026 文山秋日探索季（示範）','沿著景美溪、木柵街區與貓空茶山完成 5 格任務。','2026-09-01','2026-11-30','published','/wenshan-map.png','每個關卡每位會員限領一次點數；獎品數量有限。',1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z');
INSERT INTO shops VALUES
('shop-demo-tea','evt-demo-autumn','山城茶屋（示範店家）','茶飲','台北市文山區指南路三段 00 號（示範）','02-0000-0001','認識在地製茶，也可以坐下來看山景。','24.968','121.589','週二至週日 10:00–18:00',20,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('shop-demo-book','evt-demo-autumn','景美小書房（示範店家）','書店','台北市文山區景文街 00 號（示範）','02-0000-0002','以地方故事與親子閱讀為主題的獨立書店。','24.992','121.541','每日 11:00–20:00',10,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('shop-demo-snack','evt-demo-autumn','木柵老味點心（示範店家）','餐飲','台北市文山區木柵路三段 00 號（示範）','02-0000-0003','以米食與季節食材製作的小點。','24.989','121.570','週一至週六 09:00–17:00',15,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z');
INSERT INTO challenges VALUES
('challenge-demo-river','evt-demo-autumn',NULL,'景美溪畔觀察站（示範）','生態','找一處安全的河岸觀察點，認識景美溪的水岸環境。','下雨後河水變混濁，最可能是哪一種現象？','泥沙沖刷','RIVER26',80,1,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('challenge-demo-oldshop','evt-demo-autumn','shop-demo-snack','木柵老店尋味（示範）','文化','走訪街區店家，從飲食認識地方生活。','請向店員索取通關碼。','木柵好味','MUZHA26',50,2,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('challenge-demo-tea','evt-demo-autumn','shop-demo-tea','貓空茶香小教室（示範）','產業','觀察茶葉外型與香氣，認識文山包種茶。','文山包種茶主要屬於哪一類茶？','部分發酵茶','TEA2026',100,3,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('challenge-demo-books','evt-demo-autumn','shop-demo-book','地方故事書架（示範）','閱讀','找到一本提到文山地景的書。','請向店員索取通關碼。','閱讀文山','BOOK26',60,4,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('challenge-demo-gondola','evt-demo-autumn',NULL,'纜車視角找山形（示範）','地理','在安全位置觀察盆地與山稜。','纜車上升時，城市景觀會如何改變？','視野變廣','GONDOLA26',90,5,1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z');
INSERT INTO announcements VALUES
('notice-demo-weather','evt-demo-autumn','午後山區可能降雨（示範公告）','前往貓空請攜帶雨具，雷雨時暫停戶外關卡。','warning','2026-09-12T09:00:00+08:00',1,1,'2026-08-01T00:00:00.000Z','2026-09-12T09:00:00.000Z'),
('notice-demo-weekend','evt-demo-autumn','週末加碼 20 點（示範公告）','本週六完成任一合作店家關卡，可獲得額外點數。','info','2026-09-10T09:00:00+08:00',1,1,'2026-08-01T00:00:00.000Z','2026-09-10T09:00:00.000Z');
INSERT INTO prizes VALUES
('prize-demo-sticker','evt-demo-autumn','文山路線貼紙組（示範獎品）','五款街區地標防水貼紙。',300,50,NULL,'請至活動服務台出示核銷碼。',1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('prize-demo-bag','evt-demo-autumn','溪畔散步帆布袋（示範獎品）','適合一日散步的輕量帆布袋。',800,20,NULL,'請至活動服務台出示核銷碼。',1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z'),
('prize-demo-cup','evt-demo-autumn','貓空限定茶杯（示範獎品）','活動限定色釉茶杯。',1500,8,NULL,'需於活動結束前完成核銷。',1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z');
INSERT INTO members VALUES ('member-demo-wen','WENSHAN001','陳小文（示範會員）','0900-000-001','demo@example.com','demo:2026',1280,'active',1,1,'2026-08-01T00:00:00.000Z','2026-09-01T00:00:00.000Z');
INSERT INTO checkins VALUES
('checkin-demo-river','member-demo-wen','challenge-demo-river',80,'2026-09-07T10:00:00+08:00'),
('checkin-demo-oldshop','member-demo-wen','challenge-demo-oldshop',50,'2026-09-08T14:00:00+08:00');
INSERT INTO point_transactions VALUES
('pts-demo-initial','member-demo-wen',1150,'示範起始點數','adjustment','demo-seed','2026-09-01T09:00:00+08:00'),
('pts-demo-river','member-demo-wen',80,'完成關卡：景美溪畔觀察站（示範）','challenge','challenge-demo-river','2026-09-07T10:00:00+08:00'),
('pts-demo-oldshop','member-demo-wen',50,'完成關卡：木柵老店尋味（示範）','challenge','challenge-demo-oldshop','2026-09-08T14:00:00+08:00');
INSERT INTO redemptions VALUES ('redeem-demo-001','member-demo-wen','prize-demo-sticker',300,'WS-DEMO-2601','pending','2026-09-14T10:20:00+08:00',NULL,NULL,'示範核銷單');
PRAGMA optimize;
