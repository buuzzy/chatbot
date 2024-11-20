import React from 'react'

interface MarkdownContentProps {
  content: string
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const formatText = (text: string) => {
    const lines = text.split('\n')
    const formattedLines = []
    let inCodeBlock = false
    let codeContent = ''
    let key = 0

    for (const line of lines) {
      // 处理标题
      if (line.startsWith('#')) {
        const match = line.match(/^#+/)
        if (match) {
          const level = match[0].length
          const title = line.replace(/^#+\s/, '')
          formattedLines.push(
            <h1 
              key={key++}
              className={`font-bold ${
                level === 1 ? 'text-xl mt-6 mb-3 text-blue-600 dark:text-blue-400' :
                level === 2 ? 'text-lg mt-4 mb-2 text-gray-800 dark:text-gray-200' :
                'text-base mt-3 mb-1 text-gray-700 dark:text-gray-300'
              }`}
            >
              {title}
            </h1>
          )
        }
        continue
      }

      // 处理代码块
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeContent = ''
        } else {
          formattedLines.push(
            <pre key={key++} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm">
              <code>{codeContent.trim()}</code>
            </pre>
          )
          inCodeBlock = false
        }
        continue
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      // 处理列表
      if (line.match(/^[*-]\s/)) {
        formattedLines.push(
          <li key={key++} className="ml-4 my-1.5 list-disc text-gray-700 dark:text-gray-300">
            {line.replace(/^[*-]\s/, '')}
          </li>
        )
        continue
      }

      // 处理数字列表
      if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^\d+/)
        if (match) {
          formattedLines.push(
            <div key={key++} className="flex gap-2 my-1.5">
              <span className="text-blue-500 dark:text-blue-400 font-medium min-w-[1.5rem]">{match[0]}.</span>
              <span className="text-gray-700 dark:text-gray-300">{line.replace(/^\d+\.\s/, '')}</span>
            </div>
          )
        }
        continue
      }

      // 处理行内代码
      if (line.includes('`')) {
        const parts = line.split('`')
        formattedLines.push(
          <p key={key++} className="my-2 text-gray-700 dark:text-gray-300">
            {parts.map((part, j) => 
              j % 2 === 0 ? 
                part : 
                <code key={j} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm">{part}</code>
            )}
          </p>
        )
        continue
      }

      // 普通文本
      if (line.trim()) {
        formattedLines.push(
          <p key={key++} className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            {line}
          </p>
        )
      }
    }

    return formattedLines
  }

  return (
    <div className="markdown-content space-y-1 text-base">
      {formatText(content)}
    </div>
  )
} 