-- Insert waitlist accounts with specific IDs and timestamps
INSERT INTO waitlist (id, email, created_at) VALUES
  ('cmix7u2wj0000l70431lo5lt7', 'lakshitm213@gmail.com', '2025-12-08 13:57:16.723'),
  ('cmiwbtcq20000js04t9zemoyv', 'huntilog@gmail.com', '2025-12-07 23:00:55.082'),
  ('cmit2ww8r0000lb04nzw252px', 'rujoker8@gmail.com', '2025-12-05 16:28:25.275'),
  ('cmir4otcv0000l204icwfq4ju', 'drminh2807@gmail.com', '2025-12-04 07:42:35.168'),
  ('cmipc9bp50000lb04aegancm9', 'dubeysarvesh5525@gmail.com', '2025-12-03 01:38:57.017'),
  ('cmiouxrk0000jo04ous8yqqr', 'haleduykhang@gmail.com', '2025-12-02 15:34:12.272'),
  ('cmiouaxo60000la040hj8kwat', 'nqh.quanghuynguyen@gmail.com', '2025-12-02 17:16:12.052'),
  ('cmio33fsh0000l204smhzuopz', 'admin@example.com', '2025-12-02 04:34:39.666')
ON CONFLICT (id) DO NOTHING;
