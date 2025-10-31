import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import matchesStyles from '../../Matches/styles.module.css';

const PreparationChatView = ({
  title,
  userPhotoUrl,
  onBack,
  isConnected,
  messages,
  messagesEndRef,
  renderMessageTime,
  newMessage,
  onChangeMessage,
  onKeyPress,
  onSend,
  inputRef,
  rightPanel,
  emptyText,
  scrollToBottomImmediate,
  onViewProfile,
  onUnmatch
}) => {
  const overlayScrollbarsRef = useRef(null);
  const scrollInstanceRef = useRef(null);

  // Expose scroll function to parent via ref
  useEffect(() => {
    if (scrollToBottomImmediate) {
      scrollToBottomImmediate.current = () => {
        // Try OverlayScrollbars first
        if (scrollInstanceRef.current) {
          const viewport = scrollInstanceRef.current.getElements().viewport;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
            return;
          }
        }
        // Fallback to scrollIntoView
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      };
    }
  }, [scrollToBottomImmediate, messagesEndRef]);

  // Scroll to bottom when messages are loaded and component is ready
  useEffect(() => {
    if (messages && messages.length > 0 && scrollInstanceRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const scrollToBottom = () => {
        const viewport = scrollInstanceRef.current?.getElements().viewport;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      };
      
      // Try multiple times to ensure it works
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
    }
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className={matchesStyles.chatHeader}>
          <button 
            className={matchesStyles.backButton}
            onClick={onBack}
            title="Back"
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          {userPhotoUrl ? (
            <img
              src={userPhotoUrl}
              alt="User"
              className={matchesStyles.chatHeaderUserPhoto}
            />
          ) : (
            <div className={matchesStyles.chatHeaderUserPhotoPlaceholder}>
              <i className="fa fa-user" />
            </div>
          )}
          <h2>{title}</h2>
          <div className={matchesStyles.connectionStatus}>
            <i className="fa fa-circle" style={{ color: isConnected ? '#4CAF50' : '#f44336' }}></i>
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
          {/* Mobile action buttons */}
          {(onViewProfile || onUnmatch) && (
            <div className={matchesStyles.mobileChatActions}>
              {onViewProfile && (
                <button
                  className={matchesStyles.mobileActionButton}
                  onClick={onViewProfile}
                  title="View Profile"
                >
                  <i className="fa fa-user"></i>
                </button>
              )}
              {onUnmatch && (
                <button
                  className={`${matchesStyles.mobileActionButton} ${matchesStyles.unmatchActionButton}`}
                  onClick={onUnmatch}
                  title="Unmatch"
                >
                  <i className="fa fa-ban"></i>
                </button>
              )}
            </div>
          )}
        </div>
        <div className={matchesStyles.chatContainer}>
          <OverlayScrollbarsComponent
            ref={overlayScrollbarsRef}
            options={{ 
              scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
              overflow: { x: 'hidden', y: 'scroll' }
            }}
            className={matchesStyles.messagesContainer}
            style={{ display: 'flex', flexDirection: 'column' }}
            onInitialized={(instance) => {
              // Store the instance for scrolling
              scrollInstanceRef.current = instance;
              
              // Immediately scroll to bottom when initialized (for initial load)
              if (messages && messages.length > 0 && messagesEndRef.current) {
                setTimeout(() => {
                  const viewport = instance.getElements().viewport;
                  if (viewport) {
                    viewport.scrollTop = viewport.scrollHeight;
                  } else if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                  }
                }, 0);
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-012)' }}>
              {(!messages || messages.length === 0) ? (
                <div className={matchesStyles.emptyMessages}>
                  <i className="fa fa-comments"></i>
                  <p>{emptyText || 'Send your first message to start the conversation!'}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`${matchesStyles.message} ${message.is_own ? matchesStyles.ownMessage : matchesStyles.otherMessage}`}
                    style={{ alignSelf: message.is_own ? 'flex-end' : 'flex-start' }}
                  >
                    <div className={matchesStyles.messageContent}>
                      <p>{message.content}</p>
                      <span className={matchesStyles.messageTime}>
                        {renderMessageTime ? renderMessageTime(message.created_at) : new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </OverlayScrollbarsComponent>
          <div className={matchesStyles.messageInput}>
            <div className={matchesStyles.inputContainer}>
              <input
                ref={inputRef}
                type="text"
                className={matchesStyles.textInput}
                placeholder="Type your message..."
                value={newMessage}
                onChange={onChangeMessage}
                onKeyPress={onKeyPress}
                disabled={!isConnected}
              />
              <button
                className={matchesStyles.sendButton}
                onClick={onSend}
                disabled={!isConnected || !newMessage || !newMessage.trim()}
                type="button"
              >
                <i className="fa fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {rightPanel}
    </div>
  );
};

export default PreparationChatView;


