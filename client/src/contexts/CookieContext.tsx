import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieContextType {
  preferences: CookiePreferences;
  hasConsented: boolean;
  showBanner: boolean;
  updatePreferences: (prefs: Partial<CookiePreferences>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  showSettings: () => void;
  hideBanner: () => void;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true, can't be disabled
  analytics: false,
  marketing: false,
};

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const savedPrefs = localStorage.getItem('cookie-preferences');
    const consentTimestamp = localStorage.getItem('cookie-consent-timestamp');
    
    if (savedPrefs && consentTimestamp) {
      const saved = JSON.parse(savedPrefs);
      setPreferences(saved);
      setHasConsented(true);
      setShowBanner(false);
      
      // Apply analytics if consented
      if (saved.analytics) {
        enableGoogleAnalytics();
      }
    } else {
      // Show banner if no previous consent
      setShowBanner(true);
    }
  }, []);

  const updatePreferences = (prefs: Partial<CookiePreferences>) => {
    const newPrefs = { ...preferences, ...prefs, necessary: true };
    setPreferences(newPrefs);
    localStorage.setItem('cookie-preferences', JSON.stringify(newPrefs));
    localStorage.setItem('cookie-consent-timestamp', new Date().toISOString());
    setHasConsented(true);
    
    // Apply analytics based on consent
    if (newPrefs.analytics) {
      enableGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
  };

  const acceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    updatePreferences(allAccepted);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    updatePreferences(onlyNecessary);
    setShowBanner(false);
  };

  const showSettings = () => {
    setShowBanner(true);
  };

  const hideBanner = () => {
    setShowBanner(false);
  };

  return (
    <CookieContext.Provider value={{
      preferences,
      hasConsented,
      showBanner,
      updatePreferences,
      acceptAll,
      rejectAll,
      showSettings,
      hideBanner,
    }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookies() {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
}

// Google Analytics functions (ready for future implementation)
function enableGoogleAnalytics() {
  // TODO: Add Google Analytics code here when ready
  console.log('🍪 Analytics enabled');
  
  // Example for future implementation:
  // gtag('consent', 'update', {
  //   'analytics_storage': 'granted'
  // });
}

function disableGoogleAnalytics() {
  console.log('🍪 Analytics disabled');
  
  // Example for future implementation:
  // gtag('consent', 'update', {
  //   'analytics_storage': 'denied'
  // });
} 