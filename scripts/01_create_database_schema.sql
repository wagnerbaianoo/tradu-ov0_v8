/*
  # TranslateEvent Database Schema V5
  Complete database setup for the translation event system with streaming capabilities
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN', 'TRANSLATOR')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  access_type TEXT DEFAULT 'PUBLIC' CHECK (access_type IN ('PUBLIC', 'PRIVATE', 'RESTRICTED')),
  access_code TEXT,
  is_active BOOLEAN DEFAULT false,
  max_participants INTEGER,
  libras_enabled BOOLEAN DEFAULT false,
  -- Added translation_enabled field for V5 translator panel
  translation_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  language_code TEXT NOT NULL,
  flag TEXT NOT NULL,
  stream_type TEXT DEFAULT 'AUDIO' CHECK (stream_type IN ('AUDIO', 'VIDEO', 'LIBRAS', 'TRANSLATION')),
  url TEXT NOT NULL,
  is_original BOOLEAN DEFAULT false,
  quality TEXT DEFAULT 'GOOD' CHECK (quality IN ('EXCELLENT', 'GOOD', 'FAIR')),
  enabled BOOLEAN DEFAULT true,
  -- Added input_type and flue_key for V5 streaming integration
  input_type TEXT DEFAULT 'direct' CHECK (input_type IN ('direct', 'flue')),
  flue_key TEXT,
  mode TEXT DEFAULT 'audio-only' CHECK (mode IN ('audio-only', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, language_code)
);

-- New translation_channels table for V5 translator system
CREATE TABLE IF NOT EXISTS translation_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  base_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  stream_url TEXT,
  translator_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, base_language, target_language)
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration INTEGER
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Public events are viewable" ON events FOR SELECT USING (access_type = 'PUBLIC' OR is_active = true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (true);
CREATE POLICY "Streams are viewable" ON streams FOR SELECT USING (enabled = true);
-- Added RLS policies for translation_channels
CREATE POLICY "Translation channels are viewable" ON translation_channels FOR SELECT USING (is_active = true);
CREATE POLICY "Translators can manage own channels" ON translation_channels FOR ALL USING (true);
CREATE POLICY "Active polls are viewable" ON polls FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Users can vote" ON poll_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Poll responses are viewable" ON poll_responses FOR SELECT USING (true);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (true);
CREATE POLICY "Users can create sessions" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions are viewable" ON user_sessions FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, start_time);
CREATE INDEX IF NOT EXISTS idx_events_access_code ON events(access_code);
CREATE INDEX IF NOT EXISTS idx_streams_event_id ON streams(event_id);
CREATE INDEX IF NOT EXISTS idx_streams_input_type ON streams(input_type, flue_key);
-- Added indexes for translation_channels table
CREATE INDEX IF NOT EXISTS idx_translation_channels_event_id ON translation_channels(event_id);
CREATE INDEX IF NOT EXISTS idx_translation_channels_translator ON translation_channels(translator_id);
CREATE INDEX IF NOT EXISTS idx_translation_channels_active ON translation_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_event_id ON polls(event_id, status);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_event_id ON user_sessions(event_id);
