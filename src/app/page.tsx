'use client'

import { useChat } from '@/hooks/useChat'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ChatInput } from '@/components/chat/ChatInput'
import { useState, useEffect } from 'react'
import { Message } from '@/types/chat'

export default function Home() {
  const {
    user,
    chats,
    currentChatId,
    setCurrentChatId,
    currentModel,
    setCurrentModel,
    isLoading,
    isLoadingChats,
    error,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
    handleStopGeneration,
    handleLogout,
  } = useChat()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [setupDone, setSetupDone] = useState(false)

  // Auto-setup: trigger table creation on first load (per session)
  useEffect(() => {
    if (user && !setupDone) {
      if (sessionStorage.getItem('supabase_setup_done')) {
        setSetupDone(true)
        return
      }
      fetch('/api/setup')
        .then(res => res.json())
        .then(data => {
          console.log('Setup:', data.message)
          setSetupDone(true)
          sessionStorage.setItem('supabase_setup_done', '1')
        })
        .catch(err => console.error('Setup failed:', err))
    }
  }, [user, setupDone])

  const currentChat = chats.find(chat => chat.id === currentChatId)
  const messages: Message[] = currentChat?.messages || []

  return (
    <main style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: mobileMenuOpen ? 'fixed' : undefined,
          inset: mobileMenuOpen ? '0 auto 0 0' : undefined,
          width: '260px',
          flexShrink: 0,
          zIndex: 50,
          transform: mobileMenuOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.2s ease',
        }}
        className={`hidden md:block ${mobileMenuOpen ? '!block' : ''}`}
      >
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={(id) => {
            setCurrentChatId(id)
            setMobileMenuOpen(false)
          }}
          onNewChat={() => {
            handleNewChat()
            setMobileMenuOpen(false)
          }}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          isLoading={isLoadingChats}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header
          style={{
            height: '52px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            background: 'var(--color-bg-secondary)',
            flexShrink: 0,
          }}
          className="md:hidden"
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              cursor: 'pointer',
              padding: '4px',
              marginRight: '8px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span
            style={{
              fontWeight: 600,
              fontSize: '15px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentChat?.title || 'Chatbot'}
          </span>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', height: '100%' }}>
            <ChatWindow messages={messages} isLoading={isLoading} error={error} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <ChatInput
            onSend={(content) => {
              if (!currentChatId) {
                handleNewChat()
                setTimeout(() => handleSendMessage(content), 100)
              } else {
                handleSendMessage(content)
              }
            }}
            onStop={handleStopGeneration}
            isLoading={isLoading}
            currentModel={currentModel}
            onModelChange={setCurrentModel}
          />
        </div>
      </div>
    </main>
  )
}
