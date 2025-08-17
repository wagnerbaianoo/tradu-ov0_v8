-- V5 Demo Data with Translation Channels and Flue.live Integration
INSERT INTO events (id, name, description, start_time, end_time, access_code, is_active, libras_enabled, translation_enabled) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tech Conference 2025 V5', 'International technology conference with live translation', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '8 hours', 'TECH2025', true, true, true),
('550e8400-e29b-41d4-a716-446655440002', 'Medical Symposium V5', 'Global medical research symposium with streaming', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 6 hours', 'MED2025', true, false, true);

-- Streams with Flue.live integration
INSERT INTO streams (id, event_id, language, language_code, flag, stream_type, url, is_original, input_type, flue_key, mode) VALUES
-- Tech Conference streams
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Português', 'pt-BR', '🇧🇷', 'AUDIO', 'https://whep.flue.live/?stream=PL001', true, 'flue', 'PL001', 'audio-only'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'English', 'en-US', '🇺🇸', 'TRANSLATION', 'https://whep.flue.live/?stream=EN001', false, 'flue', 'EN001', 'audio-only'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Español', 'es-ES', '🇪🇸', 'TRANSLATION', 'https://whep.flue.live/?stream=ES001', false, 'flue', 'ES001', 'audio-only'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Libras', 'libras', '🤟', 'LIBRAS', 'https://whep.flue.live/?stream=LB001', false, 'flue', 'LB001', 'video'),

-- Medical Symposium streams
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'English', 'en-US', '🇺🇸', 'AUDIO', 'https://whep.flue.live/?stream=MD001', true, 'flue', 'MD001', 'audio-only'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Português', 'pt-BR', '🇧🇷', 'TRANSLATION', 'https://whep.flue.live/?stream=MD002', false, 'flue', 'MD002', 'audio-only');

-- Translation channels
INSERT INTO translation_channels (id, event_id, base_language, target_language, stream_url, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'pt-BR', 'en-US', 'webrtc://translator-en-001', true),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'pt-BR', 'es-ES', 'webrtc://translator-es-001', true),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'en-US', 'pt-BR', 'webrtc://translator-pt-001', true);

-- Sample polls for V5
INSERT INTO polls (id, event_id, question, options, status) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Como você avalia a qualidade da tradução simultânea?', ARRAY['Excelente', 'Boa', 'Regular', 'Precisa melhorar'], 'ACTIVE'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Qual recurso você mais utiliza?', ARRAY['Tradução de áudio', 'Libras', 'Notas pessoais', 'Enquetes'], 'ACTIVE');
