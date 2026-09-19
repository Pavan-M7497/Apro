-- Reference data seed.
-- PLACEHOLDER: verify against the current SFI circular before launch.
insert into age_groups (discipline, label, min_age, max_age, sort_order) values
('swimming','Group IV (under 10)',0,9,1),
('swimming','Group III (10-12)',10,12,2),
('swimming','Group II (13-14)',13,14,3),
('swimming','Group I (15-17)',15,17,4),
('swimming','Senior (18+)',18,null,5),
('diving','Group C (under 12)',0,11,1),
('diving','Group B (12-14)',12,14,2),
('diving','Group A (15-18)',15,18,3),
('diving','Senior (19+)',19,null,4),
('waterpolo','Sub-Junior (under 14)',0,13,1),
('waterpolo','Junior (14-17)',14,17,2),
('waterpolo','Senior (18+)',18,null,3)
on conflict do nothing;
