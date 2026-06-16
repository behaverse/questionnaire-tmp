import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

/** Render a content string as INLINE markdown + sanitized HTML.
 *  - rehype-raw parses inline HTML (e.g. <br />); rehype-sanitize strips
 *    script/style/event handlers (community content is untrusted).
 *  - Paragraphs are unwrapped so the output stays inline inside headings/labels. */
export function RichText({ children }: { children: string }) {
  return (
    <Markdown
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{ p: ({ children }) => <>{children}</> }}
    >
      {children}
    </Markdown>
  )
}
