import React, { useEffect } from 'react';

interface ChatWidgetProps {
  isVisible: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      // Check if script already exists
      const existingScript = document.getElementById('chat-widget-script');
      if (!existingScript) {
        // Create and append the chat widget script using the exact HTML structure provided
        const script = document.createElement('script');
        script.id = 'chat-widget-script';
        script.src = 'https://widgets.leadconnectorhq.com/loader.js';
        script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
        script.setAttribute('data-widget-id', '68b05184b832cc81a974be46');

        // Append to document head
        document.head.appendChild(script);
      }
    } else {
      // Remove the script and any chat widget elements when not visible
      const existingScript = document.getElementById('chat-widget-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      // Remove any chat widget elements that might have been created
      const chatWidgets = document.querySelectorAll('[data-widget-id="68b05184b832cc81a974be46"]');
      chatWidgets.forEach(widget => widget.remove());
    }
  }, [isVisible]);

  // This component doesn't render anything visible - it just manages the script
  return null;
};

export default ChatWidget;
