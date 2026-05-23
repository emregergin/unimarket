-- Seed Turkish university domain allow-list (extend as needed)
insert into public.university_domains (domain, university_name, city) values
  ('boun.edu.tr',      'Boğaziçi Üniversitesi',           'İstanbul'),
  ('metu.edu.tr',      'Orta Doğu Teknik Üniversitesi',   'Ankara'),
  ('itu.edu.tr',       'İstanbul Teknik Üniversitesi',    'İstanbul'),
  ('bilkent.edu.tr',   'Bilkent Üniversitesi',            'Ankara'),
  ('ku.edu.tr',        'Koç Üniversitesi',                'İstanbul'),
  ('sabanciuniv.edu',  'Sabancı Üniversitesi',            'İstanbul'),
  ('hacettepe.edu.tr', 'Hacettepe Üniversitesi',          'Ankara'),
  ('ankara.edu.tr',    'Ankara Üniversitesi',             'Ankara'),
  ('istanbul.edu.tr',  'İstanbul Üniversitesi',           'İstanbul'),
  ('yildiz.edu.tr',    'Yıldız Teknik Üniversitesi',      'İstanbul'),
  ('ege.edu.tr',       'Ege Üniversitesi',                'İzmir'),
  ('deu.edu.tr',       'Dokuz Eylül Üniversitesi',        'İzmir')
on conflict (domain) do nothing;
