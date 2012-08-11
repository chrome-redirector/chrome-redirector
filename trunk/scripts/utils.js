'use strict';
/* Debug mode */
window.redirector_helper_js = {
  debug: true
};

/**
 * Assertion
 */
var assertError;
if (window.redirector_helper_js.debug === true) {
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
