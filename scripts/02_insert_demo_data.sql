/*
  # Demo Data for TranslateEvent
  Insert sample event and streams for testing
*/

-- Insert demo event
INSERT INTO events (
  id,
  name,
  description,
  start_time,
  end_time,
  timezone,
  access_type,
  access_code,
  is_active,
  max_participants,
  libras_enabled
) VALUES (
  uuid_generate_v4(),
  'Tech Summit 2025 - IA & Futuro',
  'Conferência internacional sobre inteligência artificial e transformação digital',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '8 hours',
  'America/Sao_Paulo',
  'PUBLIC',
  'TECH2025',
  true,
  5000,
  true
) ON CONFLICT DO NOTHING;

-- Insert streams for the demo event
DO $$
DECLARE
    event_uuid UUID;
BEGIN
    SELECT id INTO event_uuid FROM events WHERE access_code = 'TECH2025' LIMIT 1;
    
    IF event_uuid IS NOT NULL THEN
        INSERT INTO streams (event_id, language, language_code, flag, stream_type, url, is_original, quality, enabled) VALUES
        (event_uuid, 'Português', 'pt', '🇧🇷', 'AUDIO', '/placeholder.svg?height=100&width=100', true, 'EXCELLENT', true),
        (event_uuid, 'English', 'en', '🇺🇸', 'AUDIO', '/placeholder.svg?height=100&width=100', false, 'EXCELLENT', true),
        (event_uuid, 'Español', 'es', '🇪🇸', 'AUDIO', '/placeholder.svg?height=100&width=100', false, 'GOOD', true),
        (event_uuid, 'Français', 'fr', '🇫🇷', 'AUDIO', '/placeholder.svg?height=100&width=100', false, 'GOOD', true),
        (event_uuid, 'Libras', 'libras', '🤟', 'LIBRAS', '/placeholder.svg?height=200&width=200', false, 'EXCELLENT', true)
        ON CONFLICT (event_id, language_code) DO NOTHING;
        
        -- Insert demo poll
        INSERT INTO polls (event_id, question, options, status) VALUES
        (event_uuid, 'Qual tecnologia terá maior impacto nos próximos 5 anos?', 
         ARRAY['Inteligência Artificial', 'Realidade Virtual/Aumentada', 'Blockchain/Web3', 'Computação Quântica', 'IoT e Edge Computing'],
         'ACTIVE')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
