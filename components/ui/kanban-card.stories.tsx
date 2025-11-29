import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { KanbanCard } from './kanban-card';

// 랜덤 프로필 이미지 데이터
const randomProfiles = [
  { name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=12' },
  { name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=45' },
  { name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?img=33' },
  { name: 'Alex Kim', avatar: 'https://i.pravatar.cc/150?img=8' },
  { name: 'Sarah Lee', avatar: 'https://i.pravatar.cc/150?img=25' },
  { name: 'Designer', avatar: 'https://i.pravatar.cc/150?img=15' },
  { name: 'Writer One', avatar: 'https://i.pravatar.cc/150?img=28' },
  { name: 'Writer Two', avatar: 'https://i.pravatar.cc/150?img=47' },
  { name: 'Admin', avatar: 'https://i.pravatar.cc/150?img=60' },
  { name: 'Manager', avatar: 'https://i.pravatar.cc/150?img=31' },
  { name: 'Dev One', avatar: 'https://i.pravatar.cc/150?img=11' },
  { name: 'Dev Two', avatar: 'https://i.pravatar.cc/150?img=52' },
  { name: 'Designer One', avatar: 'https://i.pravatar.cc/150?img=36' },
  { name: 'Designer Two', avatar: 'https://i.pravatar.cc/150?img=44' },
  { name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?img=19' },
  { name: 'Emily Park', avatar: 'https://i.pravatar.cc/150?img=27' },
];

const meta = {
  title: 'UI/KanbanCard',
  component: KanbanCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '카드 제목',
    },
    description: {
      control: 'text',
      description: '카드 설명',
    },
    badges: {
      control: 'object',
      description: '카드 배지 목록',
    },
    assignees: {
      control: 'object',
      description: '할당된 사용자 목록',
    },
    attachments: {
      control: 'number',
      description: '첨부파일 개수',
    },
    comments: {
      control: 'number',
      description: '댓글 개수',
    },
  },
} satisfies Meta<typeof KanbanCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Hosting Mobile Apps',
    description: 'Task management has never looked more streamlined—and beautiful.',
    badges: [
      { label: 'High', variant: 'default' },
      { label: 'Mobile', variant: 'secondary' },
    ],
    assignees: [randomProfiles[0], randomProfiles[1], randomProfiles[2]],
    attachments: 1,
    comments: 10,
  },
};

export const WithImage: Story = {
  args: {
    title: 'Test Checkout Process',
    description: 'Test the new checkout automation wireframes with the recruiters',
    badges: [
      { label: 'Wireframe', variant: 'default' },
    ],
    image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=400&h=300&fit=crop',
    assignees: [randomProfiles[3], randomProfiles[4]],
    attachments: 1,
    comments: 10,
  },
};

export const DesignSystem: Story = {
  args: {
    title: 'Carnesia Mobile App',
    description: 'One-stop authentic shop for Beauty, Makeup, Skin Care & Accessories',
    badges: [
      { label: 'Design System', variant: 'warning' },
    ],
    assignees: [randomProfiles[5]],
    attachments: 2,
    comments: 19,
  },
};

export const Copywriting: Story = {
  args: {
    title: 'Copy Onboarding Screens',
    description: 'It uses a limited palette with color accents, atmospheric hero image',
    badges: [
      { label: 'Copywriting', variant: 'default' },
    ],
    assignees: [randomProfiles[6], randomProfiles[7]],
    attachments: 2,
    comments: 15,
  },
};

export const Moodboard: Story = {
  args: {
    title: 'Admin Dashboard',
    description: 'This convenient shortcut for manage tasks some server information',
    badges: [
      { label: 'Moodboard', variant: 'secondary' },
    ],
    assignees: [randomProfiles[8], randomProfiles[9], randomProfiles[14]],
    attachments: 5,
    comments: 32,
  },
};

export const UserflowNavigation: Story = {
  args: {
    title: 'Implement Userflow and Navigation',
    badges: [
      { label: 'Design System', variant: 'warning' },
    ],
    assignees: [randomProfiles[10], randomProfiles[11], randomProfiles[15]],
    attachments: 7,
    comments: 12,
  },
};

export const WebsiteDesign: Story = {
  args: {
    title: 'Website Design',
    description: 'typography with prominent catchy tagline instantly informing',
    badges: [
      { label: 'Low', variant: 'secondary' },
      { label: 'UI Design', variant: 'warning' },
    ],
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=300&fit=crop',
    assignees: [randomProfiles[12], randomProfiles[13]],
    attachments: 4,
    comments: 26,
  },
};

export const MinimalCard: Story = {
  args: {
    title: 'Simple Task',
    assignees: [randomProfiles[0]],
    comments: 3,
  },
};

export const NoAssignees: Story = {
  args: {
    title: 'Unassigned Task',
    description: 'This task has not been assigned to anyone yet',
    badges: [
      { label: 'Todo', variant: 'primary' },
    ],
    attachments: 2,
    comments: 5,
  },
};

export const KanbanBoard: Story = {
  render: () => (
    <div className="flex gap-6 p-8 bg-gray-50">
      <div className="flex flex-col gap-4 min-w-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">TO DO</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded">14</span>
        </div>
        <KanbanCard
          title="Hosting Mobile Apps"
          description="Task management has never looked more streamlined—and beautiful."
          badges={[
            { label: 'High', variant: 'default' },
            { label: 'Mobile', variant: 'secondary' },
          ]}
          assignees={[randomProfiles[0], randomProfiles[1], randomProfiles[2]]}
          attachments={1}
          comments={10}
        />
        <KanbanCard
          title="Carnesia Mobile App"
          description="One-stop authentic shop for Beauty, Makeup, Skin Care & Accessories"
          badges={[{ label: 'Design System', variant: 'warning' }]}
          assignees={[randomProfiles[5]]}
          attachments={2}
          comments={19}
        />
      </div>

      <div className="flex flex-col gap-4 min-w-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">IN PROGRESS</h2>
          <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-semibold rounded">8</span>
        </div>
        <KanbanCard
          title="Implement Userflow and Navigation"
          badges={[{ label: 'Design System', variant: 'warning' }]}
          assignees={[randomProfiles[10], randomProfiles[11], randomProfiles[15]]}
          attachments={7}
          comments={12}
        />
        <KanbanCard
          title="Copy Onboarding Screens"
          description="It uses a limited palette with color accents, atmospheric hero image"
          badges={[{ label: 'Copywriting', variant: 'default' }]}
          assignees={[randomProfiles[6], randomProfiles[7]]}
          attachments={2}
          comments={15}
        />
        <KanbanCard
          title="Admin Dashboard"
          description="This convenient shortcut for manage tasks some server information"
          badges={[{ label: 'Moodboard', variant: 'secondary' }]}
          assignees={[randomProfiles[8], randomProfiles[9], randomProfiles[14]]}
          attachments={5}
          comments={32}
        />
      </div>

      <div className="flex flex-col gap-4 min-w-[320px]">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">COMPLETED</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded">5</span>
        </div>
        <KanbanCard
          title="Test Checkout Process"
          description="Test the new checkout automation wireframes with the recruiters"
          badges={[{ label: 'Wireframe', variant: 'default' }]}
          image="https://images.unsplash.com/photo-1559028012-481c04fa702d?w=400&h=300&fit=crop"
          assignees={[randomProfiles[3], randomProfiles[4]]}
          attachments={1}
          comments={10}
        />
        <KanbanCard
          title="Website Design"
          description="typography with prominent catchy tagline instantly informing"
          badges={[
            { label: 'Low', variant: 'secondary' },
            { label: 'UI Design', variant: 'warning' },
          ]}
          image="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=300&fit=crop"
          assignees={[randomProfiles[12], randomProfiles[13]]}
          attachments={4}
          comments={26}
        />
      </div>
    </div>
  ),
};

