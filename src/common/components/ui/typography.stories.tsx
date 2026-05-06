import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyLead,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "./typography"

const meta = {
  title: "UI/Typography",
  tags: ["autodocs"],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <TypographyH1>Taskfolio workspace</TypographyH1>
        <TypographyLead>
          A focused task management surface for planning lists, tracking progress, and keeping daily work visible.
        </TypographyLead>
      </div>
      <TypographyH2>Today&apos;s priorities</TypographyH2>
      <TypographyH3>Review active lists</TypographyH3>
      <TypographyP>
        Typography primitives keep repeated text patterns consistent without hiding the underlying semantic HTML.
      </TypographyP>
      <TypographyMuted>
        Muted copy is useful for helper text, descriptions, captions, and secondary dashboard metadata.
      </TypographyMuted>
      <TypographySmall>Updated just now</TypographySmall>
    </div>
  ),
}

export const Article: Story = {
  render: () => (
    <article className="max-w-2xl space-y-5">
      <TypographyH2>Design notes</TypographyH2>
      <TypographyP>
        Use display typography for major page moments and smaller, tighter text inside dense workflow surfaces.
      </TypographyP>
      <TypographyP>
        Body copy should keep a readable line height and enough contrast against the current theme background.
      </TypographyP>
      <TypographyMuted>
        Keep long labels wrapped and predictable so cards, dialogs, and sidebars do not shift unexpectedly.
      </TypographyMuted>
    </article>
  ),
}
