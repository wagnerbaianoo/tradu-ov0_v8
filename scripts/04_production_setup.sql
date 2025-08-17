-- Production Setup Script for TranslateEvent V5
-- This script ensures the system is ready for production use

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_streams_event_enabled ON streams(event_id, enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_translation_channels_active ON translation_channels(event_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, left_at) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_polls_event ON polls(event_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_event ON notes(user_id, event_id);

-- Update RLS policies for production security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create production-ready RLS policies
-- Events: Admins can manage, users can view active events
DROP POLICY IF EXISTS "events_select_policy" ON events;
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (
  is_active = true OR 
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "events_insert_policy" ON events;
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "events_update_policy" ON events;
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

-- Streams: Admins can manage, users can view enabled streams
DROP POLICY IF EXISTS "streams_select_policy" ON streams;
CREATE POLICY "streams_select_policy" ON streams FOR SELECT USING (
  enabled = true OR 
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "streams_insert_policy" ON streams;
CREATE POLICY "streams_insert_policy" ON streams FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "streams_update_policy" ON streams;
CREATE POLICY "streams_update_policy" ON streams FOR UPDATE USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

-- Translation Channels: Translators can manage their own, admins can manage all
DROP POLICY IF EXISTS "translation_channels_select_policy" ON translation_channels;
CREATE POLICY "translation_channels_select_policy" ON translation_channels FOR SELECT USING (
  is_active = true OR 
  translator_id = auth.uid() OR
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "translation_channels_insert_policy" ON translation_channels;
CREATE POLICY "translation_channels_insert_policy" ON translation_channels FOR INSERT WITH CHECK (
  translator_id = auth.uid() OR
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "translation_channels_update_policy" ON translation_channels;
CREATE POLICY "translation_channels_update_policy" ON translation_channels FOR UPDATE USING (
  translator_id = auth.uid() OR
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

-- User Sessions: Users can manage their own sessions
DROP POLICY IF EXISTS "user_sessions_select_policy" ON user_sessions;
CREATE POLICY "user_sessions_select_policy" ON user_sessions FOR SELECT USING (
  user_id = auth.uid() OR
  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
);

DROP POLICY IF EXISTS "user_sessions_insert_policy" ON user_sessions;
CREATE POLICY "user_sessions_insert_policy" ON user_sessions FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "user_sessions_update_policy" ON user_sessions;
CREATE POLICY "user_sessions_update_policy" ON user_sessions FOR UPDATE USING (
  user_id = auth.uid()
);

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'degraded', 'offline')),
  response_time INTEGER,
  uptime_percentage DECIMAL(5,2),
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial system services
INSERT INTO system_health (service_name, status, response_time, uptime_percentage) VALUES
('WebRTC Gateway', 'online', 45, 99.9),
('Translation Engine', 'online', 120, 99.8),
('Audio Processing', 'online', 30, 99.95),
('Database', 'online', 15, 100.0),
('Stream Server', 'online', 80, 99.7)
ON CONFLICT DO NOTHING;

-- Create system alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('error', 'warning', 'info', 'success')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
  event_type VARCHAR(20),
  event_message TEXT,
  event_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO system_alerts (type, message, metadata)
  VALUES (event_type, event_message, event_metadata)
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update system health
CREATE OR REPLACE FUNCTION update_system_health(
  service VARCHAR(100),
  service_status VARCHAR(20),
  response_ms INTEGER DEFAULT NULL,
  uptime_pct DECIMAL(5,2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO system_health (service_name, status, response_time, uptime_percentage)
  VALUES (service, service_status, response_ms, uptime_pct)
  ON CONFLICT (service_name) DO UPDATE SET
    status = EXCLUDED.status,
    response_time = COALESCE(EXCLUDED.response_time, system_health.response_time),
    uptime_percentage = COALESCE(EXCLUDED.uptime_percentage, system_health.uptime_percentage),
    last_check = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log production setup completion
SELECT log_system_event('success', 'Sistema configurado para produção - TranslateEvent V5');

-- Display setup summary
SELECT 
  'Production Setup Complete' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
