import React from 'react';

function TestPixel() {
  const testPageView = () => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
      console.log('✅ PageView event sent');
    } else {
      console.error('❌ Facebook Pixel not loaded');
    }
  };

  const testContact = () => {
    if (window.fbq) {
      window.fbq('track', 'Contact');
      console.log('✅ Contact event sent');
    } else {
      console.error('❌ Facebook Pixel not loaded');
    }
  };

  const testLead = () => {
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Test Lead',
        content_category: 'Test'
      });
      console.log('✅ Lead event sent');
    } else {
      console.error('❌ Facebook Pixel not loaded');
    }
  };

  const testCompleteRegistration = () => {
    if (window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'Test Booking',
        content_category: 'Test Consultation',
        value: 0,
        currency: 'USD'
      });
      console.log('✅ CompleteRegistration event sent');
    } else {
      console.error('❌ Facebook Pixel not loaded');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Facebook Pixel Test Page</h1>
      <p>Use these buttons to manually test Facebook Pixel events. Check Events Manager for results.</p>
      
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button 
          onClick={testPageView}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test PageView Event
        </button>

        <button 
          onClick={testContact}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test Contact Event
        </button>

        <button 
          onClick={testLead}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test Lead Event
        </button>

        <button 
          onClick={testCompleteRegistration}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#42b72a',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test CompleteRegistration Event
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f2f5', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Open Facebook Events Manager</li>
          <li>Go to Test Events tab</li>
          <li>Click the test buttons above</li>
          <li>Events should appear in real-time</li>
        </ol>
      </div>
    </div>
  );
}

export default TestPixel;
