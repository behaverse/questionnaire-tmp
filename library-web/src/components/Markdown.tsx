import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// Legacy survey content mixes markdown (**bold**, *italic*) with raw HTML (<br>, <img>, <u>, …).
// rehypeRaw parses the embedded HTML; rehypeSanitize then strips anything unsafe (scripts,
// event handlers, javascript: URLs) while keeping benign formatting tags.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
}

const components: Components = {
  // Unwrap paragraphs so short, single-line content stays inline next to badges / fallback
  // markers; the source uses <br> for line breaks, so paragraph semantics aren't needed.
  p: ({ children }) => <>{children}</>,
  a: ({ children, href, title }) => (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <img
      src={typeof src === 'string' ? src : undefined}
      alt={alt ?? ''}
      loading="lazy"
      className="my-2 inline-block max-h-44 rounded border border-rule"
    />
  ),
}

/** Render trusted-but-messy questionnaire content (markdown + sanitized inline HTML). */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
