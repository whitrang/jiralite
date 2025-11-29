import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from './spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'The size of the spinner',
    },
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'white', 'primary', 'success', 'danger'],
      description: 'The color variant of the spinner',
    },
    label: {
      control: 'text',
      description: 'Optional label text displayed next to the spinner',
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Loading...',
  },
};

export const SmallWithLabel: Story = {
  args: {
    size: 'sm',
    label: 'Please wait',
  },
};

export const LargeWithLabel: Story = {
  args: {
    size: 'lg',
    variant: 'primary',
    label: 'Loading data...',
  },
};

export const OnDarkBackground: Story = {
  args: {
    variant: 'white',
    size: 'lg',
    label: 'Loading...',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner size="sm" />
      <Spinner size="default" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner variant="default" />
      <Spinner variant="secondary" />
      <Spinner variant="primary" />
      <Spinner variant="success" />
      <Spinner variant="danger" />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:bg-gray-400">
      <Spinner size="sm" variant="white" />
      Loading...
    </button>
  ),
};

export const Centered: Story = {
  render: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <Spinner size="xl" variant="primary" label="Loading application..." />
    </div>
  ),
};

