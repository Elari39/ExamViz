import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { isValidElement } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  content: string;
  enableMath?: boolean;
  inline?: boolean;
}

const looksLikeLatex = (text: string): boolean => {
  return (
    /\$\$[\s\S]+?\$\$/.test(text) ||
    /\$(?:\\.|[^$])+\$/.test(text) ||
    /\\\((?:\\.|[^\\])+\\\)/.test(text) ||
    /\\\[(?:\\.|[^\\])+\\\]/.test(text) ||
    /\\begin\{[^}]+\}[\s\S]+?\\end\{[^}]+\}/.test(text)
  );
};

export default function MarkdownContent({ content, enableMath, inline = false }: Props) {
  const shouldEnableMath = enableMath ?? looksLikeLatex(content);
  const Wrapper = inline ? 'span' : 'div';

  return (
    <Wrapper className={inline ? undefined : 'space-y-2'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, ...(shouldEnableMath ? [remarkMath] : [])]}
        rehypePlugins={shouldEnableMath ? [rehypeKatex] : []}
        components={{
          p: ({ children }) =>
            inline ? <span className="m-0 break-words">{children}</span> : <p className="m-0 break-words">{children}</p>,
          ul: ({ children }) =>
            inline ? <span className="m-0 inline-flex flex-col space-y-1">{children}</span> : <ul className="m-0 list-disc pl-6 space-y-1">{children}</ul>,
          ol: ({ children }) =>
            inline ? <span className="m-0 inline-flex flex-col space-y-1">{children}</span> : <ol className="m-0 list-decimal pl-6 space-y-1">{children}</ol>,
          li: ({ children }) =>
            inline ? <span className="break-words">{children}</span> : <li className="break-words">{children}</li>,
          blockquote: ({ children }) =>
            inline ? (
              <span className="m-0 border-l-4 border-gray-200 pl-3 text-gray-600">{children}</span>
            ) : (
            <blockquote className="m-0 border-l-4 border-gray-200 pl-3 text-gray-600">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 underline break-words" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          pre: ({ children }) => {
            const childArray = Array.isArray(children) ? children : [children];
            const codeChild = childArray.find((child) => isValidElement(child));

            if (!codeChild || !isValidElement(codeChild)) {
              return <pre className="m-0 rounded-lg bg-gray-50 p-3 overflow-x-auto">{children}</pre>;
            }

            const codeProps = codeChild.props as { className?: string; children?: unknown };
            const match = /language-([^\s]+)/.exec(codeProps.className || '');
            const language = match?.[1];
            const rawChildren = codeProps.children;
            const text = (Array.isArray(rawChildren) ? rawChildren.join('') : String(rawChildren ?? '')).replace(
              /\n$/,
              '',
            );

            return (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <SyntaxHighlighter
                  language={language}
                  style={oneLight}
                  customStyle={{ margin: 0, padding: '12px', fontSize: '13px' }}
                >
                  {text}
                </SyntaxHighlighter>
              </div>
            );
          },
          code: ({ children, className }) => (
            <code className={`rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] break-words ${className ?? ''}`}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Wrapper>
  );
}
