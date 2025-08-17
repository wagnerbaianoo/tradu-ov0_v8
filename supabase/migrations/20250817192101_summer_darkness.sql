@@ .. @@
 -- Events: Admins can manage, users can view active events
 DROP POLICY IF EXISTS "events_select_policy" ON events;
 CREATE POLICY "events_select_policy" ON events FOR SELECT USING (
-  is_active = true OR 
-  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
+  (is_active = true AND access_type = 'PUBLIC') OR 
+  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN') OR
+  (access_type = 'PRIVATE' AND EXISTS (SELECT 1 FROM user_sessions WHERE event_id = events.id AND user_id = auth.uid()::text))
 );

 DROP POLICY IF EXISTS "events_insert_policy" ON events;
@@ .. @@
 -- Streams: Admins can manage, users can view enabled streams
 DROP POLICY IF EXISTS "streams_select_policy" ON streams;
 CREATE POLICY "streams_select_policy" ON streams FOR SELECT USING (
-  enabled = true OR 
-  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
+  (enabled = true AND EXISTS (SELECT 1 FROM events WHERE id = streams.event_id AND (is_active = true OR auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')))) OR
+  auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
 );

 DROP POLICY IF EXISTS "streams_insert_policy" ON streams;
@@ .. @@
 -- User Sessions: Users can manage their own sessions
 DROP POLICY IF EXISTS "user_sessions_select_policy" ON user_sessions;
 CREATE POLICY "user_sessions_select_policy" ON user_sessions FOR SELECT USING (
-  user_id = auth.uid() OR
+  user_id = auth.uid()::text OR
   auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
 );

 DROP POLICY IF EXISTS "user_sessions_insert_policy" ON user_sessions;
 CREATE POLICY "user_sessions_insert_policy" ON user_sessions FOR INSERT WITH CHECK (
-  user_id = auth.uid()
+  user_id = auth.uid()::text
 );

 DROP POLICY IF EXISTS "user_sessions_update_policy" ON user_sessions;
 CREATE POLICY "user_sessions_update_policy" ON user_sessions FOR UPDATE USING (
-  user_id = auth.uid()
+  user_id = auth.uid()::text
 );