'use strict';

hexo.extend.injector.register('head_begin', `<link rel="preload" as="image" href="/img/bg-main.png" type="image/png" fetchpriority="high">`);
hexo.extend.injector.register('head_begin', `<script>(function(){try{if(sessionStorage.getItem('page_transition_entering')==='1'){document.documentElement.classList.add('page-transition-entering');window.setTimeout(function(){document.documentElement.classList.remove('page-transition-entering');try{sessionStorage.removeItem('page_transition_entering');}catch(_e){}},2000);}}catch(_e){}})();<\/script>`);

hexo.extend.injector.register('head_end', `<link rel="stylesheet" href="/css/custom.css">`);
hexo.extend.injector.register('head_end', `<script>(function(){function switchTab(){if(!location.hash){return;}const id='#'+CSS.escape(location.hash.substring(1));const tab=document.querySelector('.tabs a[href=\"'+id+'\"]');if(!tab){return;}const tabMenuContainer=tab.parentElement.parentElement;Array.from(tabMenuContainer.children).forEach(menu=>menu.classList.remove('is-active'));Array.from(tabMenuContainer.querySelectorAll('a')).map(menu=>document.getElementById(menu.getAttribute("href").substring(1))).forEach(content=>content.classList.add('is-hidden'));tab.parentElement.classList.add('is-active');const activeTab=document.querySelector(id);if(activeTab){activeTab.classList.remove('is-hidden');}}switchTab();window.addEventListener('hashchange', switchTab, false);}());<\/script>`);

hexo.extend.injector.register('body_end', `<script src="/js/page-transition.js" defer></script>`);
hexo.extend.injector.register('body_end', `<script src="/js/category-tree.js" defer></script>`);
hexo.extend.injector.register('body_end', `<script src="/js/share-sites.js" defer></script>`);
hexo.extend.injector.register('body_end', `<script src="/js/site-info-widget.js" defer></script>`);
