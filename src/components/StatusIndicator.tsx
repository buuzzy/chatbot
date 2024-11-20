import React from 'react'

interface StatusIndicatorProps {
  status: 'loading' | 'error' | 'network-error'
  message?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, message }) => {
  const indicators = {
    'loading': {
      icon: (
        <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse"></div>
      ),
      text: '正在思考中...'
    },
    'error': {
      icon: (
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: message || '发生错误，请重试'
    },
    'network-error': {
      icon: (
        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      text: '网络连接异常，请检查网络'
    }
  }

  const { icon, text } = indicators[status]

  return (
    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  )
} 