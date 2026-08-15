"use client";

import { useEffect, useState } from "react";

const COOKIE_NOTICE_STORAGE_KEY = "hindu-saints.cookie-notice";
const COOKIE_NOTICE_VERSION = "2026-08";
const COOKIE_NOTICE_OPEN_EVENT = "hindu-saints:open-cookie-notice";

export function CookieNotice({ privacyPolicyHref }: { privacyPolicyHref: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(readStoredNoticeVersion() !== COOKIE_NOTICE_VERSION);

    function handleOpenNotice() {
      setIsVisible(true);
    }

    window.addEventListener(COOKIE_NOTICE_OPEN_EVENT, handleOpenNotice);
    return () => window.removeEventListener(COOKIE_NOTICE_OPEN_EVENT, handleOpenNotice);
  }, []);

  function dismissNotice() {
    try {
      window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, COOKIE_NOTICE_VERSION);
    } catch {
      // The notice can still be dismissed for this page view when storage is unavailable.
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside className="cookie-notice" aria-labelledby="cookie-notice-title">
      <div className="cookie-notice__content">
        <h2 id="cookie-notice-title">Cookies and privacy</h2>
        <p>
          This site uses only essential cookies and browser storage: to remember this notice and, for authorised
          editors, to keep accounts secure and preserve work in progress. We also collect cookie-free, anonymous
          aggregate data about page use, performance and technical errors. We do not use advertising or cross-site
          tracking cookies.
        </p>
        <a href={privacyPolicyHref} target="_blank" rel="noopener noreferrer">
          Read the privacy policy
        </a>
      </div>
      <button className="button button--primary cookie-notice__dismiss" onClick={dismissNotice} type="button">
        Understood
      </button>
    </aside>
  );
}

export function CookieNoticeTrigger() {
  function openNotice() {
    window.dispatchEvent(new Event(COOKIE_NOTICE_OPEN_EVENT));
  }

  return (
    <button className="site-footer__contact" onClick={openNotice} type="button">
      Cookie information
    </button>
  );
}

function readStoredNoticeVersion() {
  try {
    return window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY);
  } catch {
    return null;
  }
}
