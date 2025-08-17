@@ .. @@
 -- RLS Policies
 CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
 CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
+CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id::uuid OR auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'));
+CREATE POLICY "Admins can manage users" ON users FOR ALL USING (auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'));
 CREATE POLICY "Public events are viewable" ON events FOR SELECT USING (access_type = 'PUBLIC' OR is_active = true);
 CREATE POLICY "Admins can manage events" ON events FOR ALL USING (true);
 CREATE POLICY "Streams are viewable" ON streams FOR SELECT USING (enabled = true);
@@ .. @@
 CREATE POLICY "Active polls are viewable" ON polls FOR SELECT USING (status = 'ACTIVE');
 CREATE POLICY "Users can vote" ON poll_responses FOR INSERT WITH CHECK (true);
 CREATE POLICY "Poll responses are viewable" ON poll_responses FOR SELECT USING (true);
+CREATE POLICY "Users can only vote once per poll" ON poll_responses FOR INSERT WITH CHECK (NOT EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id));
 CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (true);
 CREATE POLICY "Users can create sessions" ON user_sessions FOR INSERT WITH CHECK (true);
 CREATE POLICY "Sessions are viewable" ON user_sessions FOR SELECT USING (true);