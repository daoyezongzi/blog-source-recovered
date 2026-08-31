'use strict';

const crypto = require('crypto');

// These hashes match the exact, version-pinned files emitted by Icarus.
// Keep the map in source so a CDN response change fails closed in the browser.
const RESOURCE_INTEGRITY = Object.freeze({
    'https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js': 'sha384-tsQFqpEReu7ZLhBV2VZlAu7zcOV+rXbYlF2cqB8txI/8aZajjp4Bqd+V6D5IgvKT',
    'https://cdn.jsdelivr.net/npm/moment@2.22.2/min/moment-with-locales.min.js': 'sha384-0j3MH3s6Go6CqfnwqD5o9X0rsnCBzHbtWOkedEKuj3CdvEHbssxdHCx1SqwtSh4v',
    'https://cdn.jsdelivr.net/npm/clipboard@2.0.4/dist/clipboard.min.js': 'sha384-8CYhPwYlLELodlcQV713V9ZikA3DlCVaXFDpjHfP8Z36gpddf/Vrt47XmKDsCttu',
    'https://use.fontawesome.com/releases/v6.0.0/css/all.css': 'sha384-3B6NwesSXE7YJlcLI9RpRqGf2p/EgVH8BgoKTaUrmKNDkHPStTQ3EyoYjCGXaOTS',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/default.css': 'sha384-4Y0nObtF3CbKnh+lpzmAVdAMtQXl+ganWiiv73RcGVdRdfVIya8Cao1C8ZsVRRDz',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/atom-one-light.css': 'sha384-w6Ujm1VWa9HYFqGc89oAPn/DWDi2gUamjNrq9DRvEYm2X3ClItg9Y9xs1ViVo5b5'
});

function escapeAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function isApprovedInlineScript(attributes, body) {
    if (/\btype\s*=\s*["']application\/ld\+json["']/i.test(attributes)) {
        return false;
    }

    const normalized = body.trim();
    return normalized.startsWith('moment.locale(')
        || normalized.startsWith('var IcarusThemeSettings =')
        || (normalized.startsWith('document.addEventListener') && normalized.includes('loadInsight('));
}

function addResourceIntegrity(html) {
    return html.replace(/<(script|link)\b([^>]*?)\b(src|href)=(['"])([^'"]+)\4([^>]*)>/gi,
        function(tag, element, before, attribute, quote, url, after) {
            const integrity = RESOURCE_INTEGRITY[url];
            if (!integrity || /\bintegrity\s*=/i.test(tag)) {
                return tag;
            }
            const crossorigin = element.toLowerCase() === 'script' || element.toLowerCase() === 'link'
                ? ' crossorigin="anonymous"'
                : '';
            return tag.slice(0, -1) + ' integrity="' + integrity + '"' + crossorigin + '>';
        });
}

function neutralizeDangerousUrls(html) {
    return html.replace(/\b((?:href|src)\s*=\s*)(["'])\s*(?:javascript|vbscript):[^"']*\2/gi, '$1$2#$2');
}

function addContentSecurityPolicy(html) {
    if (/<meta\b[^>]*http-equiv=["']Content-Security-Policy["']/i.test(html)) {
        return html;
    }

    const scriptHashes = [];
    const inlineScriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = inlineScriptPattern.exec(html)) !== null) {
        const attributes = match[1];
        const body = match[2];
        if (!/\bsrc\s*=/i.test(attributes) && isApprovedInlineScript(attributes, body)) {
            const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
            scriptHashes.push("'sha256-" + hash + "'");
        }
    }

    const policy = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "script-src 'self' https://cdn.jsdelivr.net " + Array.from(new Set(scriptHashes)).join(' '),
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://use.fontawesome.com https://fonts.googleapis.com",
        "font-src 'self' data: https://use.fontawesome.com https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "media-src 'self' https:",
        "connect-src 'self'",
        "frame-src 'self'",
        "manifest-src 'self'",
        "worker-src 'self'",
        'upgrade-insecure-requests'
    ].join('; ');
    const meta = '<meta http-equiv="Content-Security-Policy" content="' + escapeAttribute(policy) + '">';
    return html.replace(/<head([^>]*)>/i, '<head$1>' + meta);
}

hexo.extend.injector.register('head_begin', '<link rel="preload" as="image" href="/img/bg-main.png" type="image/png" fetchpriority="high">');
hexo.extend.injector.register('head_begin', '<script src="/js/page-transition-init.js"></script>');

hexo.extend.injector.register('head_end', '<link rel="stylesheet" href="/css/custom.css">');
hexo.extend.injector.register('head_end', '<script src="/js/tab-navigation.js" defer></script>');

hexo.extend.injector.register('body_end', '<script src="/js/page-transition.js" defer></script>');
hexo.extend.injector.register('body_end', '<script src="/js/category-tree.js" defer></script>');
hexo.extend.injector.register('body_end', '<script src="/js/site-info-widget.js" defer></script>');
hexo.extend.injector.register('body_end', '<script src="/js/left-sidebar-sticky.js" defer></script>');

// Hexo executes this filter after all injectors, so every generated HTML page
// receives the same CSP and SRI treatment without changing the theme package.
hexo.extend.filter.register('after_render:html', function(html) {
    return addContentSecurityPolicy(addResourceIntegrity(neutralizeDangerousUrls(html)));
});
