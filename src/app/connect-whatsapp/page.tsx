"use client";

import { useEffect, useState } from "react";

// Add this to avoid TypeScript errors with the FB object
declare global {
  interface Window {
    FB: any;
  }
}

export default function WhatsAppConnect() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // If SDK is already loaded, just set ready
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    // Load Facebook SDK
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      window.FB.init({
        appId: "1131096539900892", // Your App ID
        autoLogAppEvents: true,
        xfbml: true,
        version: "v19.0",
      });
      setSdkReady(true);
    };
    
    document.body.appendChild(script);
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) return;
    
    window.FB.login(
      function (response: any) {
        if (response.authResponse) {
          console.log("Success! Code:", response.authResponse.code);
          alert("Success! You can now close this and check your Meta Dashboard to see if the number is connected.");
        } else {
          console.log("User cancelled login or did not fully authorize.");
          alert("Connection cancelled.");
        }
      },
      {
        config_id: "985431437334719", // Your Configuration ID
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding", // This triggers the Coexistence flow for existing apps
          sessionInfoVersion: "3",
        },
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connect WhatsApp Business App
        </h1>
        <p className="text-gray-600 mb-8">
          Click below to link your existing WhatsApp Business app number to the API without losing your chat history.
        </p>
        
        <button 
          onClick={launchWhatsAppSignup}
          disabled={!sdkReady}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors"
        >
          {sdkReady ? "Launch Embedded Signup" : "Loading Facebook SDK..."}
        </button>
      </div>
    </div>
  );
}