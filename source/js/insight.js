/**
 * Insight search plugin
 * @author PPOffice { @link https://github.com/ppoffice }
 */
// eslint-disable-next-line no-unused-vars
function loadInsight(config, translation) {
  const MAX_QUERY_LENGTH = 128;
  const MAX_KEYWORDS = 10;
  const MAX_KEYWORD_LENGTH = 64;
  const $main = $('.searchbox');
  const $input = $main.find('.searchbox-input');
  const $container = $main.find('.searchbox-body');

  function section(title) {
    const element = document.createElement('section');
    element.className = 'searchbox-result-section';
    const header = document.createElement('header');
    header.textContent = typeof title === 'string' ? title : '';
    element.appendChild(header);
    return element;
  }

  function merge(ranges) {
    let last;
    const result = [];

    ranges.forEach((r) => {
      if (!last || r[0] > last[1]) {
        result.push((last = r));
      } else if (r[1] > last[1]) {
        last[1] = r[1];
      }
    });

    return result;
  }

  function appendHighlightedText(parent, text, matches, maxlen) {
    const value = typeof text === 'string' ? text : '';
    if (!Array.isArray(matches) || !matches.length || !value) {
      parent.appendChild(document.createTextNode(maxlen ? value.slice(0, maxlen) : value));
      return;
    }
    const testText = value.toLowerCase();
    const indices = matches
      .map((match) => {
        const keyword = typeof match === 'string' ? match : '';
        const index = testText.indexOf(keyword.toLowerCase());
        if (!keyword || index === -1) {
          return null;
        }
        return [index, index + keyword.length];
      })
      .filter((match) => {
        return match !== null;
      })
      .sort((a, b) => {
        return a[0] - b[0] || a[1] - b[1];
      });

    if (!indices.length) {
      parent.appendChild(document.createTextNode(maxlen ? value.slice(0, maxlen) : value));
      return;
    }

    const ranges = merge(indices);
    const firstMatch = ranges[0][0];
    const end = maxlen ? Math.min(value.length, firstMatch + maxlen) : value.length;
    let last = maxlen && maxlen < ranges[ranges.length - 1][1]
      ? firstMatch
      : 0;

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      if (range[0] >= end) {
        break;
      }
      if (range[0] > last) {
        parent.appendChild(document.createTextNode(value.slice(last, Math.min(range[0], end))));
      }
      const matchEnd = Math.min(range[1], end);
      if (matchEnd > range[0]) {
        const emphasis = document.createElement('em');
        emphasis.textContent = value.slice(range[0], matchEnd);
        parent.appendChild(emphasis);
      }
      last = Math.max(last, range[1]);
      if (last >= end) {
        break;
      }
    }

    if (last < end) {
      parent.appendChild(document.createTextNode(value.slice(last, end)));
    }
  }

  function getSafeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return '#';
    }
    try {
      const resolved = new URL(value, window.location.href);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        return '#';
      }
      return resolved.href;
    } catch (_error) {
      return '#';
    }
  }

  function getSafeContentUrl(value) {
    const resolved = getSafeUrl(value);
    if (resolved === '#') {
      return null;
    }
    try {
      const url = new URL(resolved, window.location.href);
      return url.origin === window.location.origin ? url.href : null;
    } catch (_error) {
      return null;
    }
  }

  function searchItem(icon, title, slug, preview, url, keywords) {
    const item = document.createElement('a');
    item.className = 'searchbox-result-item';
    item.href = getSafeUrl(url);

    const iconContainer = document.createElement('span');
    iconContainer.className = 'searchbox-result-icon';
    const iconElement = document.createElement('i');
    iconElement.className = 'fa fa-' + (icon === 'folder' || icon === 'tag' ? icon : 'file');
    iconContainer.appendChild(iconElement);

    const content = document.createElement('span');
    content.className = 'searchbox-result-content';
    const titleElement = document.createElement('span');
    titleElement.className = 'searchbox-result-title';
    const titleValue = title != null && title !== '' ? title : translation.untitled;
    appendHighlightedText(titleElement, String(titleValue || ''), keywords);

    if (slug) {
      const subtitle = document.createElement('span');
      subtitle.className = 'searchbox-result-title-secondary';
      subtitle.appendChild(document.createTextNode('('));
      appendHighlightedText(subtitle, String(slug), keywords);
      subtitle.appendChild(document.createTextNode(')'));
      titleElement.appendChild(subtitle);
    }

    content.appendChild(titleElement);
    if (preview) {
      const previewElement = document.createElement('span');
      previewElement.className = 'searchbox-result-preview';
      appendHighlightedText(previewElement, String(preview), keywords, 100);
      content.appendChild(previewElement);
    }

    item.appendChild(iconContainer);
    item.appendChild(content);
    return item;
  }

  function sectionFactory(keywords, type, array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    const sectionTitle = translation[type.toLowerCase()];
    const element = section(sectionTitle);
    switch (type) {
      case 'POSTS':
      case 'PAGES':
        array.forEach((item) => {
          element.appendChild(searchItem('file', item.title, null, item.text, item.link, keywords));
        });
        break;
      case 'CATEGORIES':
      case 'TAGS':
        array.forEach((item) => {
          element.appendChild(searchItem(
            type === 'CATEGORIES' ? 'folder' : 'tag',
            item.name,
            item.slug,
            null,
            item.link,
            keywords,
          ));
        });
        break;
      default:
        return null;
    }
    return element;
  }

  function parseKeywords(keywords) {
    if (typeof keywords !== 'string') {
      return [];
    }
    return keywords
      .slice(0, MAX_QUERY_LENGTH)
      .trim()
      .split(/\s+/)
      .filter((keyword) => {
        return !!keyword;
      })
      .slice(0, MAX_KEYWORDS)
      .map((keyword) => {
        return keyword.slice(0, MAX_KEYWORD_LENGTH).toLowerCase();
      });
  }

  /**
   * Judge if a given post/page/category/tag contains all of the keywords.
   * @param Object            obj     Object to be weighted
   * @param Array<String>     fields  Object's fields to find matches
   */
  function filter(keywords, obj, fields) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    const keywordArray = parseKeywords(keywords);
    const containKeywords = keywordArray.filter((keyword) => {
      const containFields = fields.filter((field) => {
        if (!Object.prototype.hasOwnProperty.call(obj, field)) {
          return false;
        }
        if (typeof obj[field] === 'string' && obj[field].toLowerCase().indexOf(keyword) > -1) {
          return true;
        }
        return false;
      });
      if (containFields.length > 0) {
        return true;
      }
      return false;
    });
    return containKeywords.length === keywordArray.length;
  }

  function filterFactory(keywords) {
    return {
      post: function (obj) {
        return filter(keywords, obj, ['title', 'text']);
      },
      page: function (obj) {
        return filter(keywords, obj, ['title', 'text']);
      },
      category: function (obj) {
        return filter(keywords, obj, ['name', 'slug']);
      },
      tag: function (obj) {
        return filter(keywords, obj, ['name', 'slug']);
      },
    };
  }

  /**
   * Calculate the weight of a matched post/page/category/tag.
   * @param Object            obj     Object to be weighted
   * @param Array<String>     fields  Object's fields to find matches
   * @param Array<Integer>    weights Weight of every field
   */
  function weight(keywords, obj, fields, weights) {
    let value = 0;
    parseKeywords(keywords).forEach((keyword) => {
      const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'img'); // Global, Multi-line, Case-insensitive
      fields.forEach((field, index) => {
        if (Object.prototype.hasOwnProperty.call(obj, field) && typeof obj[field] === 'string') {
          const matches = obj[field].match(pattern);
          value += matches ? matches.length * weights[index] : 0;
        }
      });
    });
    return value;
  }

  function weightFactory(keywords) {
    return {
      post: function (obj) {
        return weight(keywords, obj, ['title', 'text'], [3, 1]);
      },
      page: function (obj) {
        return weight(keywords, obj, ['title', 'text'], [3, 1]);
      },
      category: function (obj) {
        return weight(keywords, obj, ['name', 'slug'], [1, 1]);
      },
      tag: function (obj) {
        return weight(keywords, obj, ['name', 'slug'], [1, 1]);
      },
    };
  }

  function search(json, keywords) {
    const weights = weightFactory(keywords);
    const filters = filterFactory(keywords);
    const source = json && typeof json === 'object' ? json : {};
    const posts = Array.isArray(source.posts) ? source.posts : [];
    const pages = Array.isArray(source.pages) ? source.pages : [];
    const tags = Array.isArray(source.tags) ? source.tags : [];
    const categories = Array.isArray(source.categories) ? source.categories : [];
    return {
      posts: posts
        .filter(filters.post)
        .sort((a, b) => {
          return weights.post(b) - weights.post(a);
        })
        .slice(0, 5),
      pages: pages
        .filter(filters.page)
        .sort((a, b) => {
          return weights.page(b) - weights.page(a);
        })
        .slice(0, 5),
      categories: categories
        .filter(filters.category)
        .sort((a, b) => {
          return weights.category(b) - weights.category(a);
        })
        .slice(0, 5),
      tags: tags
        .filter(filters.tag)
        .sort((a, b) => {
          return weights.tag(b) - weights.tag(a);
        })
        .slice(0, 5),
    };
  }

  function searchResultToDOM(keywords, searchResult) {
    $container.empty();
    if (!$container[0]) return;
    for (const key in searchResult) {
      const resultSection = sectionFactory(parseKeywords(keywords), key.toUpperCase(), searchResult[key]);
      if (resultSection) {
        $container[0].appendChild(resultSection);
      }
    }
  }

  function scrollTo($item) {
    if ($item.length === 0) return;
    const wrapperHeight = $container[0].clientHeight;
    const itemTop = $item.position().top - $container.scrollTop();
    const itemBottom = $item[0].clientHeight + $item.position().top;
    if (itemBottom > wrapperHeight + $container.scrollTop()) {
      $container.scrollTop(itemBottom - $container[0].clientHeight);
    }
    if (itemTop < 0) {
      $container.scrollTop($item.position().top);
    }
  }

  function selectItemByDiff(value) {
    const $items = $.makeArray($container.find('.searchbox-result-item'));
    if (!$items.length) return;
    let prevPosition = -1;
    $items.forEach((item, index) => {
      if ($(item).hasClass('active')) {
        prevPosition = index;
      }
    });
    const nextPosition = ($items.length + prevPosition + value) % $items.length;
    $($items[prevPosition]).removeClass('active');
    $($items[nextPosition]).addClass('active');
    scrollTo($($items[nextPosition]));
  }

  function gotoLink($item) {
    if ($item && $item.length) {
      const url = getSafeUrl($item.attr('href'));
      if (url !== '#') {
        location.href = url;
      }
    }
  }

  const contentUrl = getSafeContentUrl(config && config.contentUrl);
  if (!contentUrl) {
    return;
  }

  $.getJSON(contentUrl, (json) => {
    if (location.hash.trim() === '#insight-search') {
      $main.addClass('show');
    }
    $input.on('input', function () {
      const keywords = String($(this).val() || '').slice(0, MAX_QUERY_LENGTH);
      searchResultToDOM(keywords, search(json, keywords));
    });
    $input.trigger('input');
  });

  let touch = false;
  $(document)
    .on('click focus', '.navbar-main .search', () => {
      $main.addClass('show');
      $main.find('.searchbox-input').focus();
    })
    .on('click touchend', '.searchbox-result-item', function (e) {
      if (e.type !== 'click' && !touch) {
        return;
      }
      gotoLink($(this));
      touch = false;
    })
    .on('click touchend', '.searchbox-close', (e) => {
      if (e.type !== 'click' && !touch) {
        return;
      }
      e.preventDefault();
      $('.navbar-main').css('pointer-events', 'none');
      setTimeout(() => {
        $('.navbar-main').css('pointer-events', 'auto');
      }, 400);
      $main.removeClass('show');
      touch = false;
    })
    .on('keydown', (e) => {
      if (!$main.hasClass('show')) return;
      switch (e.keyCode) {
        case 27: // ESC
          $main.removeClass('show');
          break;
        case 38: // UP
          selectItemByDiff(-1);
          break;
        case 40: // DOWN
          selectItemByDiff(1);
          break;
        case 13: // ENTER
          gotoLink($container.find('.searchbox-result-item.active').eq(0));
          break;
      }
    })
    .on('touchstart', (e) => {
      touch = true;
    })
    .on('touchmove', (e) => {
      touch = false;
    });
}
