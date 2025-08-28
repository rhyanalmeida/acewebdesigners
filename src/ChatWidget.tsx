import React, { useEffect } from 'react';

interface ChatWidgetProps {
  isVisible: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible }) => {
  useEffect(() => {
    const chatWidgetScript = document.getElementById('chat-widget-script');
    
    if (chatWidgetScript) {
      if (isVisible) {
        // Show the chat widget script
        chatWidgetScript.style.display = 'block';
        // Re-execute the script if it was previously hidden
        if (chatWidgetScript.src) {
          const newScript = document.createElement('script');
          newScript.src = chatWidgetScript.src;
          newScript.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
          newScript.setAttribute('data-widget-id', '68b05184b832cc81a974be46');
          document.head.appendChild(newScript);
        }
      } else {
        // Hide the chat widget script
        chatWidgetScript.style.display = 'none';
        // Remove any chat widget elements that might have been created
        const chatWidgets = document.querySelectorAll('[data-widget-id="68b05184b832cc81a974be46"]');
        chatWidgets.forEach(widget => widget.remove());
      }
    }
  }, [isVisible]);

  // This component doesn't render anything visible - it just manages the script visibility
  return null;
};

export default ChatWidget;
