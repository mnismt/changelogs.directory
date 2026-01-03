-- Mark waitlist users as test/real
-- Real users are from insert-waitlist.sql, all others are test/fake data

-- Step 1: Mark ALL existing waitlist entries as test/fake
UPDATE waitlist SET is_test = true;

-- Step 2: Mark real users (from insert-waitlist.sql)
UPDATE waitlist SET is_test = false WHERE id IN (
  'cmix7u2wj0000l70431lo5lt7',
  'cmiwbtcq20000js04t9zemoyv',
  'cmit2ww8r0000lb04nzw252px',
  'cmir4otcv0000l204icwfq4ju',
  'cmipc9bp50000lb04aegancm9',
  'cmiouxrk0000jo04ous8yqqr',
  'cmiouaxo60000la040hj8kwat',
  'cmio33fsh0000l204smhzuopz'
);

-- Verify the result
SELECT
  COUNT(*) FILTER (WHERE is_test = false) as real_users,
  COUNT(*) FILTER (WHERE is_test = true) as test_users,
  COUNT(*) as total
FROM waitlist;
