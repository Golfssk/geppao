# Hotfix 011 — Trip Day date arithmetic

`generate_series(date, date, interval)` yields timestamp values. The previous function subtracted a date and produced an interval, then attempted to add integer `1`, causing `operator does not exist: interval + integer`.

The replacement casts each generated value to `date` before subtraction. PostgreSQL then returns an integer day offset, which is safe for `day_number` and the Day title.