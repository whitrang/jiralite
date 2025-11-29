-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Check if user is a member of a team
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in team
CREATE OR REPLACE FUNCTION has_team_role(team_uuid UUID, user_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = user_uuid
    AND (
      CASE required_role
        WHEN 'OWNER' THEN role = 'OWNER'
        WHEN 'ADMIN' THEN role IN ('OWNER', 'ADMIN')
        WHEN 'MEMBER' THEN role IN ('OWNER', 'ADMIN', 'MEMBER')
        ELSE FALSE
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get team_id from project_id
CREATE OR REPLACE FUNCTION get_team_from_project(project_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT team_id FROM projects WHERE id = project_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get team_id from issue_id
CREATE OR REPLACE FUNCTION get_team_from_issue(issue_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT p.team_id
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    WHERE i.id = issue_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view other users if they share a team
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = users.id
    )
  );

-- =============================================
-- PASSWORD RESET TOKENS POLICIES
-- =============================================

-- Users can only access their own password reset tokens
CREATE POLICY "Users can view own reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reset tokens"
  ON password_reset_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reset tokens"
  ON password_reset_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- TEAMS TABLE POLICIES
-- =============================================

-- Team members can view their teams
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  USING (
    is_team_member(id, auth.uid())
    AND deleted_at IS NULL
  );

-- Any authenticated user can create a team
CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Team owners and admins can update team
CREATE POLICY "Owners and admins can update teams"
  ON teams FOR UPDATE
  USING (
    has_team_role(id, auth.uid(), 'ADMIN')
    AND deleted_at IS NULL
  );

-- Only team owners can delete (soft delete) teams
CREATE POLICY "Owners can delete teams"
  ON teams FOR UPDATE
  USING (
    has_team_role(id, auth.uid(), 'OWNER')
  );

-- =============================================
-- TEAM MEMBERS TABLE POLICIES
-- =============================================

-- Team members can view other members in their team
CREATE POLICY "Team members can view team members"
  ON team_members FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

-- Team owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON team_members FOR INSERT
  WITH CHECK (has_team_role(team_id, auth.uid(), 'ADMIN'));

-- Team owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON team_members FOR UPDATE
  USING (has_team_role(team_id, auth.uid(), 'ADMIN'));

-- Team owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON team_members FOR DELETE
  USING (has_team_role(team_id, auth.uid(), 'ADMIN'));

-- =============================================
-- TEAM INVITES TABLE POLICIES
-- =============================================

-- Team members can view invites for their team
CREATE POLICY "Team members can view invites"
  ON team_invites FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

-- Users can view invites sent to their email
CREATE POLICY "Users can view invites to their email"
  ON team_invites FOR SELECT
  USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Team owners and admins can create invites
CREATE POLICY "Owners and admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (has_team_role(team_id, auth.uid(), 'ADMIN'));

-- Team owners and admins can update invites
CREATE POLICY "Owners and admins can update invites"
  ON team_invites FOR UPDATE
  USING (has_team_role(team_id, auth.uid(), 'ADMIN'));

-- =============================================
-- TEAM ACTIVITY LOGS POLICIES
-- =============================================

-- Team members can view activity logs
CREATE POLICY "Team members can view activity logs"
  ON team_activity_logs FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
  ON team_activity_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- PROJECTS TABLE POLICIES
-- =============================================

-- Team members can view projects in their team
CREATE POLICY "Team members can view projects"
  ON projects FOR SELECT
  USING (
    is_team_member(team_id, auth.uid())
    AND deleted_at IS NULL
  );

-- Team members can create projects
CREATE POLICY "Team members can create projects"
  ON projects FOR INSERT
  WITH CHECK (is_team_member(team_id, auth.uid()));

-- Team owners, admins, and project owners can update projects
CREATE POLICY "Owners and admins can update projects"
  ON projects FOR UPDATE
  USING (
    (has_team_role(team_id, auth.uid(), 'ADMIN') OR owner_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Team owners, admins, and project owners can delete projects
CREATE POLICY "Owners and admins can delete projects"
  ON projects FOR UPDATE
  USING (
    has_team_role(team_id, auth.uid(), 'ADMIN') OR owner_id = auth.uid()
  );

-- =============================================
-- PROJECT FAVORITES POLICIES
-- =============================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON project_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON project_favorites FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_team_member(get_team_from_project(project_id), auth.uid())
  );

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON project_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- CUSTOM STATUSES POLICIES
-- =============================================

-- Team members can view custom statuses
CREATE POLICY "Team members can view custom statuses"
  ON custom_statuses FOR SELECT
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can create custom statuses
CREATE POLICY "Team members can create custom statuses"
  ON custom_statuses FOR INSERT
  WITH CHECK (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can update custom statuses
CREATE POLICY "Team members can update custom statuses"
  ON custom_statuses FOR UPDATE
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can delete custom statuses
CREATE POLICY "Team members can delete custom statuses"
  ON custom_statuses FOR DELETE
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- =============================================
-- LABELS POLICIES
-- =============================================

-- Team members can view labels
CREATE POLICY "Team members can view labels"
  ON labels FOR SELECT
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can create labels
CREATE POLICY "Team members can create labels"
  ON labels FOR INSERT
  WITH CHECK (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can update labels
CREATE POLICY "Team members can update labels"
  ON labels FOR UPDATE
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- Team members can delete labels
CREATE POLICY "Team members can delete labels"
  ON labels FOR DELETE
  USING (is_team_member(get_team_from_project(project_id), auth.uid()));

-- =============================================
-- ISSUES POLICIES
-- =============================================

-- Team members can view issues in their team's projects
CREATE POLICY "Team members can view issues"
  ON issues FOR SELECT
  USING (
    is_team_member(get_team_from_issue(id), auth.uid())
    AND deleted_at IS NULL
  );

-- Team members can create issues
CREATE POLICY "Team members can create issues"
  ON issues FOR INSERT
  WITH CHECK (
    is_team_member(get_team_from_project(project_id), auth.uid())
    AND creator_id = auth.uid()
  );

-- Team members can update issues
CREATE POLICY "Team members can update issues"
  ON issues FOR UPDATE
  USING (
    is_team_member(get_team_from_issue(id), auth.uid())
    AND deleted_at IS NULL
  );

-- Issue creators, project owners, and team admins can delete issues
CREATE POLICY "Creators and admins can delete issues"
  ON issues FOR UPDATE
  USING (
    creator_id = auth.uid()
    OR has_team_role(get_team_from_issue(id), auth.uid(), 'ADMIN')
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = issues.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- =============================================
-- ISSUE LABELS POLICIES
-- =============================================

-- Team members can view issue labels
CREATE POLICY "Team members can view issue labels"
  ON issue_labels FOR SELECT
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- Team members can add issue labels
CREATE POLICY "Team members can add issue labels"
  ON issue_labels FOR INSERT
  WITH CHECK (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- Team members can remove issue labels
CREATE POLICY "Team members can remove issue labels"
  ON issue_labels FOR DELETE
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- =============================================
-- SUBTASKS POLICIES
-- =============================================

-- Team members can view subtasks
CREATE POLICY "Team members can view subtasks"
  ON subtasks FOR SELECT
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- Team members can create subtasks
CREATE POLICY "Team members can create subtasks"
  ON subtasks FOR INSERT
  WITH CHECK (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- Team members can update subtasks
CREATE POLICY "Team members can update subtasks"
  ON subtasks FOR UPDATE
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- Team members can delete subtasks
CREATE POLICY "Team members can delete subtasks"
  ON subtasks FOR DELETE
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- =============================================
-- COMMENTS POLICIES
-- =============================================

-- Team members can view comments
CREATE POLICY "Team members can view comments"
  ON comments FOR SELECT
  USING (
    is_team_member(get_team_from_issue(issue_id), auth.uid())
    AND deleted_at IS NULL
  );

-- Team members can create comments
CREATE POLICY "Team members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    is_team_member(get_team_from_issue(issue_id), auth.uid())
    AND user_id = auth.uid()
  );

-- Comment authors can update their comments
CREATE POLICY "Authors can update comments"
  ON comments FOR UPDATE
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- Comment authors, issue creators, project owners, and team admins can delete comments
CREATE POLICY "Authors and admins can delete comments"
  ON comments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR has_team_role(get_team_from_issue(issue_id), auth.uid(), 'ADMIN')
    OR EXISTS (
      SELECT 1 FROM issues i
      WHERE i.id = comments.issue_id
      AND i.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM issues i
      JOIN projects p ON i.project_id = p.id
      WHERE i.id = comments.issue_id
      AND p.owner_id = auth.uid()
    )
  );

-- =============================================
-- ISSUE HISTORY POLICIES
-- =============================================

-- Team members can view issue history
CREATE POLICY "Team members can view issue history"
  ON issue_history FOR SELECT
  USING (is_team_member(get_team_from_issue(issue_id), auth.uid()));

-- System can insert issue history
CREATE POLICY "System can insert issue history"
  ON issue_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- AI RATE LIMITS POLICIES
-- =============================================

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON ai_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own rate limit records
CREATE POLICY "Users can create own rate limits"
  ON ai_rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate limits
CREATE POLICY "Users can update own rate limits"
  ON ai_rate_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
