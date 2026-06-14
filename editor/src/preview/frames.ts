export const FRAMES = { mobile: 390, tablet: 768, desktop: null } as const
export type FrameKey = keyof typeof FRAMES
export const FRAME_LABELS: Record<FrameKey, string> = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
