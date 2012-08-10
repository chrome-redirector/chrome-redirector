'use strict';
/* Debug mode */
window.redirector_helper_js = {
  debug: true
};

/**
 * Assertion
 */
function assertError(expression, error) {
  if (window.redirector_helper_js.debug && !expression) {
    throw 'REDIRECTOR_ASSERTION_FAILED:\n' + error.stack;
  }
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
  return regexpStringToXegexp(wildcardToRegexpString(wildcard), modifiers);
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
  chrome.extension.getViews().forEach(function (view) {
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
    var timestamp = items.sync_timestamp;
    var now = (new Date()).getTime();
    if (timestamp === undefined || timestamp < now) {
      chrome.storage.local.get(null, function (items) {
        items.sync_timestamp = now;
        chrome.storage.sync.set(items, function () {
          if (chrome.extension.lastError !== undefined) {
            console.log('Sync data to remote server failed: ' +
                  chrome.extension.lastError);
          }
        });
      });
    } else {
      chrome.storage.sync.get(null, function (items) {
        chrome.storage.local.set(items, function () {
          if (chrome.extension.lastError !== undefined) {
            console.log('Sync data from remote server failed: ' +
                  chrome.extension.lastError);
          }
        });
      });
    }
  });
}
