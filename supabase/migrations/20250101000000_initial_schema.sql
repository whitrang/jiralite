-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for Google OAuth users
  name VARCHAR(50) NOT NULL,
  profile_image TEXT,
  auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 2. PASSWORD RESET TOKENS TABLE
-- =============================================
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TEAMS TABLE
-- =============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 4. TEAM MEMBERS TABLE
-- =============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- =============================================
-- 5. TEAM INVITES TABLE
-- =============================================
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. TEAM ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE team_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. PROJECTS TABLE
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT description_length CHECK (char_length(description) <= 2000)
);

-- =============================================
-- 8. PROJECT FAVORITES TABLE
-- =============================================
CREATE TABLE project_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =============================================
-- 9. CUSTOM STATUSES TABLE
-- =============================================
CREATE TABLE custom_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  color VARCHAR(7),
  position INT NOT NULL,
  wip_limit INT CHECK (wip_limit >= 1 AND wip_limit <= 50 OR wip_limit IS NULL),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. LABELS TABLE
-- =============================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- =============================================
-- 11. ISSUES TABLE
-- =============================================
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'Backlog',
  priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  assignee_user_id UUID REFERENCES users(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  due_date DATE,
  position INT NOT NULL,
  ai_summary_cache TEXT,
  ai_suggestion_cache TEXT,
  ai_cache_invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT description_length CHECK (char_length(description) <= 5000)
);

-- =============================================
-- 12. ISSUE LABELS TABLE (Many-to-Many)
-- =============================================
CREATE TABLE issue_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, label_id)
);

-- =============================================
-- 13. SUBTASKS TABLE
-- =============================================
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. COMMENTS TABLE
-- =============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- =============================================
-- 15. ISSUE HISTORY TABLE
-- =============================================
CREATE TABLE issue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 16. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 17. AI RATE LIMITS TABLE
-- =============================================
CREATE TABLE ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_count INT DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_type VARCHAR(10) NOT NULL CHECK (window_type IN ('minute', 'day')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, window_type, window_start)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Teams
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_deleted_at ON teams(deleted_at);

-- Team Members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

-- Team Invites
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX idx_team_invites_status ON team_invites(status);
CREATE INDEX idx_team_invites_expires_at ON team_invites(expires_at);

-- Team Activity Logs
CREATE INDEX idx_team_activity_logs_team_id ON team_activity_logs(team_id);
CREATE INDEX idx_team_activity_logs_created_at ON team_activity_logs(created_at DESC);

-- Projects
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);

-- Project Favorites
CREATE INDEX idx_project_favorites_user_id ON project_favorites(user_id);

-- Custom Statuses
CREATE INDEX idx_custom_statuses_project_id ON custom_statuses(project_id);

-- Labels
CREATE INDEX idx_labels_project_id ON labels(project_id);

-- Issues
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_assignee_user_id ON issues(assignee_user_id);
CREATE INDEX idx_issues_creator_id ON issues(creator_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_due_date ON issues(due_date);
CREATE INDEX idx_issues_deleted_at ON issues(deleted_at);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);

-- Issue Labels
CREATE INDEX idx_issue_labels_issue_id ON issue_labels(issue_id);
CREATE INDEX idx_issue_labels_label_id ON issue_labels(label_id);

-- Subtasks
CREATE INDEX idx_subtasks_issue_id ON subtasks(issue_id);

-- Comments
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Issue History
CREATE INDEX idx_issue_history_issue_id ON issue_history(issue_id);
CREATE INDEX idx_issue_history_created_at ON issue_history(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- AI Rate Limits
CREATE INDEX idx_ai_rate_limits_user_id ON ai_rate_limits(user_id);
CREATE INDEX idx_ai_rate_limits_window ON ai_rate_limits(window_start, window_type);

-- Password Reset Tokens
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to invalidate AI cache when issue description changes
CREATE OR REPLACE FUNCTION invalidate_ai_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    NEW.ai_cache_invalidated_at = NOW();
    NEW.ai_summary_cache = NULL;
    NEW.ai_suggestion_cache = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_ai_cache_on_description_change
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_ai_cache();

-- Function to log team activities
CREATE OR REPLACE FUNCTION log_team_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for application-level logging
  -- You can extend this to auto-log certain activities
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CONSTRAINTS & VALIDATIONS
-- =============================================

-- Ensure team owner is also a team member with OWNER role
CREATE OR REPLACE FUNCTION ensure_owner_is_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'OWNER')
  ON CONFLICT (team_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_team_owner_is_member
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION ensure_owner_is_member();

-- =============================================
-- SEED DATA (Default statuses)
-- =============================================

-- Note: Default statuses (Backlog, In Progress, Done) are handled at application level
-- Custom statuses are stored in custom_statuses table

-- =============================================
-- COMMENTS
-- =============================================

-- Users table comments
COMMENT ON TABLE users IS 'User accounts with email/password or Google OAuth authentication';
COMMENT ON COLUMN users.auth_provider IS 'Authentication method: email or google';
COMMENT ON COLUMN users.password_hash IS 'Hashed password, NULL for OAuth users';

-- Teams table comments
COMMENT ON TABLE teams IS 'Teams that own projects and have members';
COMMENT ON COLUMN teams.owner_id IS 'User who created and owns the team';

-- Projects table comments
COMMENT ON TABLE projects IS 'Projects belong to teams, max 15 per team';
COMMENT ON COLUMN projects.is_archived IS 'Archived projects are read-only';

-- Issues table comments
COMMENT ON TABLE issues IS 'Issues belong to projects, max 200 per project';
COMMENT ON COLUMN issues.position IS 'Order within the same status column';
COMMENT ON COLUMN issues.ai_summary_cache IS 'Cached AI-generated summary';
COMMENT ON COLUMN issues.ai_suggestion_cache IS 'Cached AI-generated suggestions';
COMMENT ON COLUMN issues.ai_cache_invalidated_at IS 'Timestamp when cache was invalidated';

-- Notifications table comments
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.link IS 'URL to the related resource';
