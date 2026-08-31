/* global instantsearch, algoliasearch */
// eslint-disable-next-line no-unused-vars
function loadAlgolia(config, translation) {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSafePermalink(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return '#';
    }
    try {
      const resolved = new URL(value, window.location.href);
      if ((resolved.protocol === 'http:' || resolved.protocol === 'https:')
        && resolved.origin === window.location.origin) {
        return resolved.href;
      }
    } catch (_error) {}
    return '#';
  }

  const search = instantsearch({
    indexName: config.indexName,
    searchClient: algoliasearch(config.applicationId, config.apiKey),
  });

  search.addWidgets([
    instantsearch.widgets.configure({
      attributesToSnippet: ['excerpt'],
    }),
  ]);

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#algolia-input',
      placeholder: translation.hint,
      showReset: false,
      showSubmit: false,
      showLoadingIndicator: false,
      cssClasses: {
        root: 'searchbox-input-container',
        form: 'searchbox-input-container',
        input: 'searchbox-input',
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      container: '#algolia-poweredby',
    }),
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '.searchbox-body',
      escapeHTML: true,
      cssClasses: {
        root: 'searchbox-result-container',
        emptyRoot: ['searchbox-result-item', 'disabled'],
      },
      templates: {
        empty: function (results) {
          return escapeHtml(translation.no_result) + ': ' + escapeHtml(results.query);
        },
        item: function (hit) {
          const title = escapeHtml(hit && hit.title ? hit.title : translation.untitled);
          const excerpt = escapeHtml(hit && hit.excerpt ? hit.excerpt : translation.empty_preview);
          const permalink = escapeHtml(getSafePermalink(hit && hit.permalink));
          return `<section class="searchbox-result-section">
                        <a class="searchbox-result-item" href="${permalink}">
                            <span class="searchbox-result-content">
                                <span class="searchbox-result-title">${title}</span>
                                <span class="searchbox-result-preview">${excerpt}</span>
                            </span>
                        </a>
                    </section>`;
        },
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      container: '.searchbox-footer',
      cssClasses: {
        list: 'searchbox-pagination',
        item: 'searchbox-pagination-item',
        link: 'searchbox-pagination-link',
        selectedItem: 'active',
        disabledItem: 'disabled',
      },
    }),
  );

  search.start();

  if (location.hash.trim() === '#algolia-search') {
    $('.searchbox').addClass('show');
  }

  $(document)
    .on('click', '.navbar-main .search', () => {
      $('.searchbox').toggleClass('show');
      $('.searchbox-input').focus();
    })
    .on('click', '.searchbox .searchbox-mask', () => {
      $('.searchbox').removeClass('show');
    })
    .on('click', '.searchbox-close', (event) => {
      event.preventDefault();
      $('.searchbox').removeClass('show');
    });
}
