# Jira Lite - Issue Tracking Web Application

A Next.js-based issue tracking and project management application with team collaboration features.

**Built by Litmers for VibeCoding participation.**

## 🚀 Live Deployment

**This application is deployed on Vercel:** [https://jiralite-iota.vercel.app/](https://jiralite-iota.vercel.app/)

Try it out with the test accounts provided on the login page!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun
- Supabase project with configured database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Application Structure

### Authentication Pages

#### Login Page (`/` and `/login`)

- **Location**: `app/page.tsx`, `app/(auth)/login/page.tsx`
- **Features**:
  - Email/password authentication
  - Test account quick-fill buttons with different roles:
    - Owner: john@vietvibe.com (1q1q1q1q)
    - Admin: sarah@vietvibe.com (1q1q1q1q)
    - Member: alex@vietvibe.com (1q1q1q1q)
  - Error handling and loading states
  - Redirect to dashboard on success
  - Link to signup page
- **Access**: Public

#### Signup Page (`/signup`)

- **Location**: `app/(auth)/signup/page.tsx`
- **Features**:
  - User registration with email, password, and name
  - Password validation
  - Auto-login after successful signup
  - Link to login page
- **Access**: Public

### Dashboard Pages

#### Teams List (`/teams`)

- **Location**: `app/(dashboard)/teams/page.tsx`
- **Features**:
  - Display all teams where user is a member
  - Shows team role (Owner/Admin/Member)
  - Team statistics (member count, project count)
  - Create new team modal
  - Navigate to individual team pages
- **Access**: Authenticated users only
- **Permissions**: All team members can view

#### Team Dashboard (`/teams/[teamId]`)

- **Location**: `app/(dashboard)/teams/[teamId]/page.tsx`
- **Features**:
  - Team overview with member list
  - Member management:
    - Invite new members (Owner/Admin only)
    - Remove members (Owner/Admin only)
    - Change member roles (Owner only)
  - Project list with quick navigation
  - Create new project modal (All members)
  - Activity log with pagination:
    - Member additions/removals
    - Role changes
    - Project creation/deletion
    - Team updates
  - Navigation to team settings
- **Access**: Team members only
- **Permissions**:
  - View: All members
  - Invite/Remove members: Owner, Admin
  - Change roles: Owner only
  - Create projects: All members

#### Team Settings (`/teams/[teamId]/settings`)

- **Location**: `app/(dashboard)/teams/[teamId]/settings/page.tsx`
- **Features**:
  - Team information display
  - Edit team name (Owner/Admin only)
  - Team statistics (created date, member count, project count)
  - Danger zone:
    - Leave team (Admin/Member only)
    - Delete team (Owner only with confirmation)
- **Access**: Team members only
- **Permissions**:
  - View: All members
  - Edit team name: Owner, Admin
  - Leave team: Admin, Member
  - Delete team: Owner only

#### Projects Redirect (`/projects`)

- **Location**: `app/(dashboard)/projects/page.tsx`
- **Features**:
  - Automatic redirect to oldest non-deleted project
  - Falls back to teams page if no projects found
  - Redirects to login if not authenticated
- **Access**: Authenticated users only
- **Purpose**: Entry point for project management

#### Project Kanban Board (`/projects/[projectId]`)

- **Location**: `app/(dashboard)/projects/[projectId]/page.tsx`
- **Features**:
  - Kanban board with drag-and-drop functionality
  - Issue columns: Backlog, Todo, In Progress, Done
  - Create new issues with:
    - Title and description
    - Priority (Low/Medium/High)
    - Assignee selection
    - Label assignment
  - Issue management:
    - Drag between columns to update status
    - Click to view/edit issue details
    - Delete issues
    - Update assignee, priority, title, description
  - Label management:
    - Create custom labels with colors
    - Assign multiple labels per issue
  - Real-time issue filtering and sorting
- **Access**: Team members only (via project's team)
- **Permissions**:
  - View issues: All team members
  - Create/Edit/Delete issues: All team members
  - Manage labels: All team members

### Dashboard Layout

#### Main Layout (`/dashboard/*`)

- **Location**: `app/(dashboard)/layout.tsx`
- **Features**:
  - Top navigation bar with:
    - Application logo/title
    - User profile display
    - Logout button
  - Sidebar navigation:
    - Teams link
    - Projects link
  - Responsive design
  - Authentication check and redirect
- **Access**: Authenticated users only

## Data Models

### Users

- `id`: UUID (primary key)
- `email`: String (unique)
- `name`: String
- `profile_image`: String (nullable)
- `created_at`: Timestamp

### Teams

- `id`: UUID (primary key)
- `name`: String
- `owner_id`: UUID (foreign key to users)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `deleted_at`: Timestamp (nullable, soft delete)

### Team Members

- `id`: UUID (primary key)
- `team_id`: UUID (foreign key to teams)
- `user_id`: UUID (foreign key to users)
- `role`: Enum (OWNER, ADMIN, MEMBER)
- `joined_at`: Timestamp

### Projects

- `id`: UUID (primary key)
- `team_id`: UUID (foreign key to teams)
- `name`: String
- `description`: String (nullable)
- `owner_id`: UUID (foreign key to users)
- `is_archived`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `deleted_at`: Timestamp (nullable, soft delete)

### Issues

- `id`: UUID (primary key)
- `project_id`: UUID (foreign key to projects)
- `title`: String
- `description`: String (nullable)
- `status`: String (BACKLOG, TODO, IN_PROGRESS, DONE)
- `priority`: String (LOW, MEDIUM, HIGH)
- `assignee_user_id`: UUID (foreign key to users, nullable)
- `creator_id`: UUID (foreign key to users)
- `position`: Number (for ordering)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `deleted_at`: Timestamp (nullable, soft delete)

### Labels

- `id`: UUID (primary key)
- `project_id`: UUID (foreign key to projects)
- `name`: String
- `color`: String (hex color code)
- `created_at`: Timestamp

### Team Activity Logs

- `id`: UUID (primary key)
- `team_id`: UUID (foreign key to teams)
- `user_id`: UUID (foreign key to users)
- `action_type`: String (MEMBER_ADDED, MEMBER_REMOVED, ROLE_CHANGED, etc.)
- `details`: JSONB
- `created_at`: Timestamp

## Access Control & Security

### Team-Based Access Control

All resources (projects, issues) are protected through team membership verification:

1. **Team Access**: Users must be team members to access team resources
2. **Project Access**: Verified through project's team membership
3. **Issue Access**: Verified through issue's project's team membership

### Role-Based Permissions

#### OWNER

- All Admin permissions
- Delete team
- Change member roles
- Transfer ownership

#### ADMIN

- All Member permissions
- Invite members
- Remove members
- Update team settings
- Delete projects
- Leave team

#### MEMBER

- View team resources
- Create projects
- Create/edit/delete issues
- Leave team

### Error Responses

- **404 NOT_FOUND**: User is not a team member (security through obscurity)
- **403 FORBIDDEN**: User lacks required permissions for the action
- **401 UNAUTHORIZED**: User is not authenticated

## API Structure

### Authentication API (`/lib/api/auth.ts`)

- `getCurrentUserId()`: Get current user ID from session
- Sign in/out handled by Supabase Auth

### Teams API (`/lib/api/teams.ts`)

- `getUserTeams(userId)`: Get all teams for user
- `createTeam(name, ownerId)`: Create new team
- `getTeamById(teamId, userId)`: Get team details
- `updateTeam(teamId, name, userId)`: Update team name
- `deleteTeam(teamId, userId)`: Soft delete team
- `verifyTeamMembership(teamId, userId)`: Helper for access control

### Team Members API (`/lib/api/teamMembers.ts`)

- `getTeamMembers(teamId, userId)`: Get all team members
- `addMembersToTeam(teamId, userIds, inviterId)`: Invite members
- `removeMemberFromTeam(teamId, memberId, removerId)`: Remove member
- `updateMemberRole(teamId, memberId, newRole, updaterId)`: Update role
- `leaveTeam(teamId, userId)`: Leave team
- `getUserRole(teamId, userId)`: Get user's role in team

### Projects API (`/lib/api/projects.ts`)

- `getTeamProjects(teamId, userId)`: Get all projects for team
- `createProject(teamId, name, description, ownerId)`: Create project
- `getProjectById(projectId, userId)`: Get project details
- `updateProject(projectId, name, description, userId)`: Update project
- `deleteProject(projectId, userId)`: Soft delete project
- `toggleProjectArchive(projectId, isArchived, userId)`: Archive/unarchive

### Issues API (`/lib/api/issues.ts`)

- `getProjectIssues(projectId, userId)`: Get all issues for project
- `getIssueById(issueId, userId)`: Get issue details
- `updateIssueStatus(issueId, status, userId)`: Update issue status
- `updateIssueField(issueId, field, value, userId)`: Update any issue field
- `deleteIssue(issueId, userId)`: Soft delete issue

### Team Activity API (`/lib/api/teamActivity.ts`)

- `getTeamActivityLogs(teamId, limit, offset)`: Get paginated activity logs
- `logTeamActivity(teamId, userId, actionType, details)`: Create activity log

## Key Features

### Soft Delete Pattern

All deletable entities (teams, projects, issues) use soft delete with `deleted_at` timestamp instead of hard delete, allowing for potential recovery and maintaining referential integrity.

### Activity Logging

Team activities are automatically logged for:

- Member management (add, remove, role changes)
- Project lifecycle (create, delete, archive)
- Team updates

### Pagination

Activity logs support cursor-based pagination with configurable limit and offset.

### Real-time Updates

Changes to issues (status, assignee, etc.) reflect immediately in the UI using optimistic updates and state management.

## Development

### Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── login/
│   └── signup/
├── (dashboard)/         # Protected dashboard pages
│   ├── layout.tsx       # Dashboard layout with nav
│   ├── teams/
│   │   ├── page.tsx     # Teams list
│   │   └── [teamId]/
│   │       ├── page.tsx      # Team dashboard
│   │       └── settings/
│   └── projects/
│       ├── page.tsx          # Redirect to oldest project
│       └── [projectId]/
│           └── page.tsx      # Kanban board
├── page.tsx             # Login page (home)
components/
├── ui/                  # Reusable UI components
lib/
├── api/                 # API functions
├── supabaseClient.ts    # Supabase client setup
└── database.types.ts    # Generated TypeScript types
```

### Code Conventions

- Use TypeScript for type safety
- Async/await for asynchronous operations
- Error handling with try/catch blocks
- Access control verification in all API functions
- Soft delete pattern for data persistence

## License

This project is licensed under the MIT License.
