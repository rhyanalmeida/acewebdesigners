import React, { useEffect } from 'react';

interface ChatWidgetProps {
  isVisible: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible }) => {
  useEffect(() => {
    if (!isVisible) return;

    // Create and append the chat widget script
    const script = document.createElement('script');
    script.src = 'https://widgets.leadconnectorhq.com/loader.js';
    script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
    script.setAttribute('data-widget-id', '68b05184b832cc81a974be46');
    
    // Append to head
    document.head.appendChild(script);

    // Cleanup function to remove the script when component unmounts or becomes invisible
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Also remove any chat widget elements that might have been created
      const chatWidgets = document.querySelectorAll('[data-widget-id="68b05184b832cc81a974be46"]');
      chatWidgets.forEach(widget => widget.remove());
    };
  }, [isVisible]);

  // This component doesn't render anything visible - it just manages the script
  return null;
};

export default ChatWidget;
