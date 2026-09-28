-- AI-Path schema (run in Supabase SQL editor)
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  level text default 'Beginner',
  xp integer default 0,
  learning_goal text default 'Learn AI and build real projects',
  created_at timestamp default now()
);
create table if not exists topics (
  id serial primary key,
  title text not null,
  icon text,
  order_index integer,
  category text
);
create table if not exists user_topic_progress (
  id serial primary key,
  user_id uuid references profiles(id),
  topic_id integer references topics(id),
  status text check (status in ('not_started','in_progress','completed')) default 'not_started',
  progress_percent integer default 0,
  updated_at timestamp default now()
);
create table if not exists activity_log (
  id serial primary key,
  user_id uuid references profiles(id),
  action text,
  icon_type text,
  created_at timestamp default now()
);
create table if not exists quizzes (
  id serial primary key,
  topic_id integer references topics(id),
  question text,
  options jsonb,
  correct_index integer
);
create table if not exists quiz_attempts (
  id serial primary key,
  user_id uuid references profiles(id),
  quiz_id integer references quizzes(id),
  is_correct boolean,
  attempted_at timestamp default now()
);
create table if not exists chat_messages (
  id serial primary key,
  user_id uuid references profiles(id),
  role text check (role in ('user','assistant')),
  content text,
  created_at timestamp default now()
);
create table if not exists study_streak (
  id serial primary key,
  user_id uuid references profiles(id),
  date date,
  studied boolean default true
);
-- seed topics
insert into topics (title, order_index, category) values
('Python Basics',1,'Python Basics'),
('Data Types',2,'Python Basics'),
('Control Flow',3,'Python Basics'),
('Functions',4,'Python Basics'),
('Data Structures',5,'Data Structures'),
('Projects',6,'Projects')
on conflict do nothing;
