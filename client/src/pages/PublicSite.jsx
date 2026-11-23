import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { applyDocumentHead } from '../seo/headManager';
import PublicPages from './PublicPages';
import { ConsentBanner, SiteFooter, SiteHeader } from './publicUI';

export default function PublicSite({ page = '/', navigate, onLogin, user, initialContent = null }) {
  const [content, setContent] = useState(
    initialContent || { faqs: [], banners: [], zones: [], settings: {} },
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let live = true;
    api('/public/content')
      .then((data) => {
        if (live && data) setContent(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyDocumentHead({
      pathname: page,
      search: window.location.search || '',
      faqs: content?.faqs,
    });
  }, [page, content?.faqs]);

  const book = (target) => (user ? navigate(target) : onLogin(target));

  return (
    <div className="public-site min-h-screen bg-white text-navy">
      <SiteHeader page={page} navigate={navigate} onLogin={onLogin} user={user} settings={content?.settings} />
      <main id="main">
        <PublicPages page={page} content={content} navigate={navigate} onLogin={onLogin} user={user} book={book} />
      </main>
      <SiteFooter navigate={navigate} onLogin={onLogin} user={user} settings={content?.settings} />
      <ConsentBanner navigate={navigate} />
    </div>
  );
}
