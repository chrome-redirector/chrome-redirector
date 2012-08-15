'use strict';
window.redirector_utils_js = {
  debug: true,                  // Debug mode switch
  all_types: [
    'fast_matching', 'redirect', 'request_header',
    'response_header', 'error_handling', 'online'
  ]
};

/**
 * Assertion
 */
var assertError;
if (window.redirector_utils_js.debug === true) {
  assertError = function (expression, error) {
    if (!expression) {
      throw 'REDIRECTOR_ASSERTION_FAILED:\n' + error.stack;
    }
  };
} else {
  assertError = function () {};
}

/**
 * Get its fallback if value is undefined or null
 */
function fallback(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

/**
 * Extended mode (x mode) for RE2 RegExp
 * Remove whitespace, comments and linefeed in RE2 RegExp string
 */
function simplifyRe2RegexpString(regexp_string) {
  return regexp_string.replace(/(#.*$|\s*|\n)/gm, '');
}

/**
 * Translate wildcard to XRegExp string
 */
function wildcardToRegexpString(wildcard) {
  return XRegExp.escape(
    wildcard
      .replace(/\\\\/g, '\0x0')   // \\ => \0x0
      .replace(/\\\*/g, '\0x1')   // \* => \0x1
      .replace(/\\\?/g, '\0x2')   // \? => \0x2
      .replace(/\?/g, '\0x3')      // ? => \0x3
      .replace(/\*/g, '\0x4')     // *  => \0x4
  )
    .replace(/\0x0/g, '\\\\')     // \0x0 => \\
    .replace(/\0x1/g, '\\*')      // \0x1 => \*
    .replace(/\0x2/g, '\\?')      // \0x2 => \v
    .replace(/\0x3/g, '.')        // \0x3 => .
    .replace(/\0x4/g, '.*');      // \0x4 => .*
}

/**
 * Construct XRegExp from wildcard
 */
function wildcardToRegexp(wildcard, modifiers) {
  return regexpStringToRegexp(wildcardToRegexpString(wildcard), modifiers);
}

/**
 * Construct XRegExp from XRegExp string
 */
function regexpStringToRegexp(regexp_string, modifiers) {
  if (modifiers === undefined) {
    modifiers = [];
  }
  return new XRegExp(regexp_string, modifiers.join('') + 'x');
}

/**
 * Read text from file (file is a window.File)
 * text is set as the parameter of the callback function
 */
function readTextFromFile(file, callback) {
  var reader = new FileReader();
  reader.onload = function (event) {
    callback(event.target.result);
  };
  reader.readAsText(file);
}

/**
 * Save text to local file
 * keys:
 *   text - the content to save
 *   filename (optional) - default filename
 */
function saveTextToFile(properties) {
  var options = {
    url: 'data:text/plain;charset=utf-8,' + properties.text,
    saveAs: true
  };
  if (properties.filename !== undefined) {
    options.filename = properties.filename;
  }
  chrome.downloads.download(options);
}

/**
 * Get internationalization text
 */
function _(messagename) {
  return chrome.i18n.getMessage(messagename.replace(/^\s*|\s*$/g, ''));
}

/**
 * Open options page
 */
function openOptionsPage (query) {
  var background_page = chrome.extension.getBackgroundPage();
  chrome.extension.getViews({type: 'tab'}).forEach(function (view) {
    if (view !== background_page) {
      view.close();
    }
  });
  chrome.tabs.create({
    url: chrome.extension.getURL('pages/options.html' + fallback(query, ''))
  });
};

/**
 * Sync data to remote server
 */
function syncData(alarm) {
  if (alarm !== undefined && alarm.name !== 'auto_sync') {
    return;
  }
  chrome.storage.sync.get('sync_timestamp', function (items) {
    var remote_timestamp = fallback(items.sync_timestamp, 0);
    chrome.storage.local.get('sync_timestamp', function (items) {
      var local_timestamp = fallback(items.sync_timestamp, 0);
      var current_timestamp = (new Date()).getTime();
      if (current_timestamp < local_timestamp) {
        alert('Something has gone wrong with your clock!');
        return;
      }
      if (local_timestamp >= remote_timestamp) {
        chrome.storage.local.get(null, function (items) {
          items.sync_timestamp = current_timestamp;
          delete items.online_cache; // Avoid syncing cache
          chrome.storage.sync.set(items, function () {
            if (chrome.extension.lastError !== undefined) {
              console.log('Sync data to remote server failed: ' +
                          chrome.extension.lastError);
            }
          });
          chrome.storage.local.set({sync_timestamp: current_timestamp});
        });
      } else {
        chrome.storage.sync.set({
          sync_timestamp: current_timestamp
        }, function () {
          if (chrome.extension.lastError !== undefined) {
            console.log('Sync data from remote server failed: ' +
                        chrome.extension.lastError);
            return;
          }
          chrome.storage.sync.get(null, function (items) {
            chrome.storage.local.set(items, function () {
              if (chrome.extension.lastError !== undefined) {
                console.log('Sync data from remote server failed: ' +
                            chrome.extension.lastError);
              }
            });
          });
        });
      }
    });
  });
}

var UrlUtil = (function () {
  var UrlUtil = {
    // Object for validating URLs
    Validator: function () {
      this.input = document.createElement('input');
      this.input.type = 'url';
      // Restrict the pattern for web request
      this.input.pattern = '^(https?|ftp|file)://.*';
    },
    // Object for splitting/assembling URLs
    Parser: function () {
      this.a = document.createElement('a');
    }
  };

  UrlUtil.Validator.prototype = {
    /**
     * Return the validity of a URL
     */
    validate: function (url) {
      var i = this.input;
      if (typeof url !== 'string') {
        i.setCustomValidity('Not string');
        return false;
      } else if (url === '') {
        i.setCustomValidity('Blank value');
        return false;
      }
      i.value = url;
      i.checkValidity();
      return i.validity.valid;
    },
    /* Most of the following validator functions
       only do basic boundary/character checks
    */
    validateHostContains: function (host) {
      return !/[\/\?#]/.test(host);
    },
    validateHostEquals: function (host) {
      return !/[\/\?#]/.test(host) &&
        this.validate('http://' + host);
    },
    validateHostPrefix: function (host) {
      return !/[\/\?#]/.test(host);
    },
    validateHostSuffix: function (host) {
      return !/[\/\?#]/.test(host);
    },
    validatePathContains: function (path) {
      return !/[\?#]/.test(path);
    },
    validatePathEquals: function (path) {
      return /^\/[^\?#]*$/.test(path) &&
        this.validate('http://a.co' + path);
    },
    validatePathPrefix: function (path) {
      return /^\/[^\?#]*$/.test(path);
    },
    validatePathSuffix: function (path) {
      return !/[\?#]/.test(path);
    },
    validateQueryContains: function (query) {
      return !/#/.test(query);
    },
    validateQueryEquals: function (query) {
      return /^\?[^#]*$/.test(query) &&
        this.validate('http://a.co/c' + query);
    },
    validateQueryPrefix: function (query) {
      return /^\?[^#]*$/.test(query);
    },
    validateQuerySuffix: function (query) {
      return !/#/.test(query);
    },
    validateUrlContains: function (url) {
      return true;
    },
    validateUrlEquals: function (url) {
      return this.validate(url);
    },
    validateUrlPrefix: function (url) {
      return url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0 ||
        url.indexOf('ftp://') >= 0 || url.indexOf('file://') >= 0 ||
        'http://'.indexOf(url) >= 0 || 'https://'.indexOf(url) >= 0 ||
        'ftp://'.indexOf(url) >= 0 || 'file://'.indexOf(url) >= 0;
    },
    validateUrlSuffix: function (url) {
      return true;
    },
    validateScheme: function (scheme) {
      return /^(https?|ftp|file)$/i.test(scheme);
    },
    /**
     * Get descriptive message
     */
    getErrorMessage: function () {
      var i = this.input.validity;
      var output = [];
      for (var key in i) {
        if (!i.hasOwnProperty(key)) {
          continue;
        }
        if (i[key]) {
          if (key === 'customError') {
            output.push(this.input.validationMessage);
          } else if (key !== 'valid') {
            output.push(key);
          }
        }
      }
      return output.join('\n');
    }
  };

  UrlUtil.Parser.prototype = {
    /**
     * Parse a URL
     */
    /* Validate the URL before parsing! */
    parse: function (url) {
      this.a.href = url;
      this.refresh(true);
    },
    refresh: function (force) {
      var i = this.a;
      /* Defined according to chrome extension declarative API */
      this.host = i.hostname;
      this.path = i.pathname;
      this.query = i.search;
      this.url = i.href;
      this.scheme = i.protocol.replace(/:$/, '');
      this.port = i.port;
    },
    setHost: function (host) {
      this.a.hostname = host;
      this.refresh();
    },
    setPath: function (path) {
      this.a.pathname = path;
      this.refresh();
    },
    setQuery: function (query) {
      this.a.search = query;
      this.refresh();
    },
    setUrl: function (url) {
      this.parse(url);
    },
    setScheme: function (scheme) {
      this.a.protocol = scheme + ':';
      this.refresh();
    },
    setPort: function (port) {
      this.port = port;
      this.refresh();
    }
  };

  return UrlUtil;
})();
