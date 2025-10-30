import React from 'react';
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
  emptyText
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
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
        </div>
        <div className={matchesStyles.chatContainer}>
          <div className={matchesStyles.messagesContainer}>
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


