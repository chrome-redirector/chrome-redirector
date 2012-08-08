'use strict';

window.redirector_background_js = {
  rule_lists: {
    redirect: [],
    manual: [],
    request_header: [],
    response_header: []
  },
  urls_filter: ['<all_urls>'],
  redirected_requests: {}       // For recording redirected request ID
};

/* Initialize
 */
(function () {
  var namespace = window.redirector_background_js;
  chrome.storage.local.get(null, function (items) {
    /* Settings */
    namespace.urls_filter = fallback(items.urls_filter, ['<all_urls>']);
    /* Rules */
    initFastMatchingRules(items.fast_matching);
    initRedirectRules(items.redirect);
    initRequestHeaderRules(items.request_header);
    initResponseHeaderRules(items.response_header);
    initOnlineRules(items.online);
    /* Other */
    initContextMenus();
  });
})();

/**
 * Fresh install
 */
chrome.runtime.onInstalled.addListener(function() {
  // Open option pages, ...
});

/**
 * Reinitialize the related part when storage changed
 */
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace !== 'local') {
    return;
  }
  for (var key in changes) {
    if (changes.hasOwnProperty(key) === false) {
      return;
    }
    var value = changes[key].newValue;
    switch (key) {
    case 'fast_matching':
      chrome.declarativeWebRequest.onRequest.removeRules(undefined, function () {
        initFastMatchingRules(value);
      });
      break;
    case 'redirect':
      initRedirectRules(value);
      // Manual rules may change
      initContextMenus();
      break;
    case 'request_header':
      initRequestHeaderRules(value);
      break;
    case 'response_header':
      initResponseHeaderRules(value);
      break;
    case 'online':
      initOnlineRules(value);
      break;
    case 'enabled_protocols':
      window.redirector_background_js.urls_filter = value;
      break;
    case 'context_enabled':
      chrome.contextMenus.removeAll();
      if (fallback(value, true) === true) {
        initContextMenus();
      }
      break;
    default:
      console.log('Not implemented: ' + key);
      return;
    }
  }
});

/* Register redirect rules */
chrome.webRequest.onBeforeRequest.addListener(
  processRedirectRules,
  {urls: window.redirector_background_js.urls_filter},
  ['blocking']
);

/* Register request header rules */
chrome.webRequest.onBeforeSendHeaders.addListener(
  processRequestHeaderRules,
  {urls: window.redirector_background_js.urls_filter},
  ['blocking', 'requestHeaders']
);

/* Register response header rules */
chrome.webRequest.onHeadersReceived.addListener(
  processResponseHeaderRules,
  {urls: window.redirector_background_js.urls_filter},
  ['blocking', 'responseHeaders']
);

/**
 * Initialize fast matching rules
 */
function initFastMatchingRules(rules) {
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var declarative_rules = [];
  var priority = 101;         // Priority starts from 101
  rules.forEach(function (rule) {
    if (rule.enabled !== true) {
      return;
    }
    var declarative_rule = {conditions: [], actions: []};
    rule.conditions.forEach(function (condition) {
      var resource_type = condition.resource_type;
      var obj;
      if (resource_type !== undefined) {
        delete condition.resource_type;
        obj = {
          url: condition,
          resourceType: resource_type
        };
      } else {
        obj = {url: condition};
      }
      declarative_rule.conditions.push(
        new chrome.declarativeWebRequest.RequestMatcher(obj)
      );
    });
    rule.actions.forEach(function (action) {
      switch (action.type) {
      case 'redirect_regexp': // Modifiers?
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.RedirectByRegEx({
            from: simplifyRe2RegexpString(action.from),
            to: action.to
          })
        );
        break;
      case 'redirect_wildcard':
        declarative_rule.actions.push(
          new declarativeWebRequest.RedirectByRegEx({
            from: wildcardToRegexpString(action.from),
            to: action.to
          })
        );
        break;
      case 'redirect_cancel':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.CancelRequest()
        );
        break;
      case 'redirect_to':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.RedirectRequest({
            redirectUrl: action.to
          })
        );
        break;
      case 'redirect_to_transparent':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.RedirectToTransparentImage()
        );
        break;
      case 'redirect_to_empty':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.RedirectToEmptyDocument()
        );
        break;
      case 'request_header_set':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.SetRequestHeader({
            name: action.name,
            value: action.value
          })
        );
      case 'request_header_remove':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.RemoveRequestHeader({
            name: action.name
          })
        );
        break;
      case 'response_header_add':
        declarative_rule.actions.push(
          new chrome.declarativeWebRequest.AddResponseHeader({
            name: action.name,
            value: action.value
          })
        );
      case 'response_header_remove':
        if (action.value) {     // Can value be empty?
          declarative_rule.actions.push(
            new chrome.declarativeWebRequest.RemoveResponseHeader({
              name: action.name,
              value: action.value
            })
          );
        } else {
          declarative_rule.actions.push(
            new chrome.declarativeWebRequest.RemoveResponseHeader({
              name: action.name
            })
          );
        }
        break;
      default:
        assertError(false, new Error());
      }
    });
    declarative_rule.priority = priority++; // MAX?
    declarative_rules.push(declarative_rule);
  });
  if (declarative_rules.length > 0) {
    chrome.declarativeWebRequest.onRequest.addRules(declarative_rules);
  }
}

/**
 * Initialize redirect rules
 */
function initRedirectRules(rules) {
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var redirect = [];
  var manual = [];
  rules.forEach(function (rule) {
    if (rule.enabled !== true) {
      return;
    }
    var auto_rule = {conditions: [], actions: []};
    var manual_rule = {actions: []};
    rule.conditions.forEach(function (condition) {
      var resource_type = condition.resource_type;
      var obj;
      if (resource_type !== undefined) {
        delete condition.resource_type;
        obj = {resourceType: resource_type};
      } else {
        obj = {};
      }
      switch (condition.type) {
      case 'regexp':
        obj.regexp = regexpStringToRegexp(condition.value, condition.modifiers);
        auto_rule.conditions.push(obj);
        break;
      case 'wildcard':
        obj.regexp = wildcardToRegexp(condition.value, condition.modifiers);
        auto_rule.conditions.push(obj);
        break;
      case 'manual':
        manual_rule.name = rule.name; // Name defined => is a manual rule
        break;
      default:
        assertError(false, new Error());
      }
    });
    rule.actions.forEach(function (action) {
      var rule_actions = (manual_rule.name !== undefined ?
                          manual_rule : auto_rule).actions;
      switch (action.type) {
      case 'redirect_regexp':
        rule_actions.push({
          from: regexpStringToRegexp(action.from, action.modifiers),
          to: action.to
        });
        break;
      case 'redirect_wildcard':
        rule_actions.push({
          from: wildcardToRegexp(action.from, action.modifiers),
          to: action.to
        });
        break;
      case 'redirect_cancel':
        rule_actions.push({to: null});
        break;
      case 'redirect_to':
        rule_actions.push({to: action.to});
        break;
      case 'redirect_to_transparent':
        // Redirect to png (1x1)
        rule_actions.push({
          to: 'data:image/png;base64,\
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
        });
        break;
      case 'redirect_to_empty':
        rule_actions.push({to: 'data:text/html,'});
        break;
      default:
        assertError(false, new Error());
      }
    });
    if (manual_rule.name !== undefined) {
      manual.push(manual_rule);
    } else {
      redirect.push(auto_rule);
    }
  });
  window.redirector_background_js.rule_lists.redirect = redirect;
  window.redirector_background_js.rule_lists.manual = manual;
}

/**
 * Initialize request header rules
 */
function initRequestHeaderRules(rules) {
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var request_header = [];
  rules.forEach(function (rule) {
    if (rule.enabled !== true) {
      return;
    }
    var auto_rule = {conditions: [], actions: []};
    rule.conditions.forEach(function (condition) {
      var resource_type = condition.resource_type;
      var obj;
      if (resource_type !== undefined) {
        delete condition.resource_type;
        obj = {resourceType: resource_type};
      } else {
        obj = {};
      }
      switch (condition.type) {
      case 'regexp':
        obj.regexp = regexpStringToRegexp(condition.value, condition.modifiers);
        auto_rule.conditions.push(obj);
        break;
      case 'wildcard':
        obj.regexp = wildcardToRegexp(condition.value, condition.modifiers);
        auto_rule.conditions.push(obj);
        break;
      default:
        assertError(false, new Error());
      }
    });
    rule.actions.forEach(function (action) {
      switch (action.type) {
      case 'request_header_set':
        auto_rule.actions.push({
          type: 'set',
          name: action.name,
          value: action.value
        });
        break;
      case 'request_header_remove':
        auto_rule.actions.push({
          type: 'remove',
          name: action.name
        });
        break;
      default:
        assertError(false, new Error());
      }
    });
    request_header.push(auto_rule);
  });
  window.redirector_background_js.rule_lists.request_header = request_header;
}

/**
 * Initialize response header rules
 */
function initResponseHeaderRules(rules) {
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var response_header = [];
  rules.forEach(function (rule) {
    if (rule.enabled !== true) {
      return;
    }
    var auto_rule = {conditions: [], actions: []};
    rule.conditions.forEach(function (condition) {
      switch (condition.type) {
      case 'regexp':
        auto_rule.conditions.push(
          regexpStringToRegexp(condition.value, condition.modifiers));
        break;
      case 'wildcard':
        auto_rule.conditions.push(
          wildcardToRegexp(condition.value, condition.modifiers));
        break;
      default:
        assertError(false, new Error());
      }
    });
    rule.actions.forEach(function (action) {
      switch (action.type) {
      case 'response_header_add':
        auto_rule.actions.push({
          type: 'add',
          name: action.name,
          value: action.value
        });
        break;
      case 'response_header_remove':
        auto_rule.actions.push(
          action.value === undefined ? {
            type: 'remove',
            name: action.name
          } : {
            type: 'remove',
            name: action.name,
            value: action.value
          }
        );
        break;
      default:
        assertError(false, new Error());
      }
    });
    response_header.push(auto_rule);
  });
  window.redirector_background_js.rule_lists.response_header =
    response_header;
}

/**
 * Initialize online rules
 */
function initOnlineRules(rules) {
  // TODO
}

/**
 * Initialize context menu functionality (manual redirection, etc)
 */
function initContextMenus() {
  var manual = window.redirector_background_js.rule_lists.manual;
  if (manual.length > 0) {
    /* Menu entries for manual redirection */
    chrome.storage.local.get('manual_methods', function (items) {
      /* Link manual redirection */
      if (items.manual_methods.indexOf('link') !== -1) {
        var parent_entry = chrome.contextMenus.create({
          title: 'Open link in new tab with this rule...',
          contexts: ['link', 'image']
        });
        /* Create sub-entries */
        manual.forEach(function (rule) {
          chrome.contextMenus.create({
            title: rule.name,
            contexts: ['link', 'image'],
            parentId: parent_entry,
            onclick: function (info, tab) {
              var url;
              if (info.srcUrl !== undefined) {
                url = info.srcUrl;
              } else if (info.linkUrl !== undefined) {
                url = info.linkUrl;
              } else {
                assertError(false, new Error());
              }
              rule.actions.forEach(function (action) {
                url = url.replace(action.from, action.to);
              });
              chrome.tabs.create({url: url});
            }
          });
        });
      }
      /* Page manual redirection */
      if (items.manual_methods.indexOf('page') !== -1) {
        var parent_entry = chrome.contextMenus.create({
          title: 'Reload page with this rule...',
          contexts: ['page', 'frame']
        });
        /* Create sub-entries */
        manual.forEach(function (rule) {
          chrome.contextMenus.create({
            title: rule.name,
            contexts: ['page', 'frame'],
            parentId: parent_entry,
            onclick: function (info, tab) {
              var url;
              if (info.pageUrl !== undefined) {
                url = info.pageUrl;
              } else {
                assertError(false, new Error());
              }
              rule.actions.forEach(function (action) {
                url = url.replace(action.from, action.to);
              });
              chrome.tabs.update(tab.id, {url: url});
            }
          });
        });
      }
    });
  }
}

/**
 * Redirect rules listener
 * Redirect the request if any conditions meets.
 * Multiple actions are allowed in case they're of type
 * redirect_regexp or redirect_wildcard
 */
function processRedirectRules(details) {
  if (window.redirector_background_js
      .redirected_requests[details.requestId] !== undefined) {
    return {};
  }
  var list = window.redirector_background_js.rule_lists.redirect;
  var redirectUrl = '';
  outmost:
  for (var i = 0; i < list.length; i++) {
    var rule = list[i];
    for (var j = 0; j < rule.conditions.length; j++) {
      var condition = rule.conditions[j];
      /* Not in the resource type list OR not matches */
      if (condition.resource_type !== undefined &&
          condition.indexOf(details.type) === -1 ||
          !condition.regexp.test(details.url)) {
        continue;
      }
      for (var k = 0; k < rule.actions.length; k++) {
        var action = rule.actions[k];
        /* Cancel request */
        if (action.to === null) {
          return {cancel: true};
        }
        /* Directly redirect */
        if (action.from === undefined) {
          return {redirectUrl: rule.actions.to};
        }
        redirectUrl = details.url.replace(action.from, action.to);
      }
      break outmost;
    }
  }
  if (redirectUrl) {
    window.redirector_background_js
      .redirected_requests[details.requestId] = true;
    return {redirectUrl: redirectUrl};
  }
  return {};
}

/**
 * Request header rules listener
 */
function processRequestHeaderRules(details) {
  var list = window.redirector_background_js.rule_lists.request_header;
  outmost:
  for (var i = 0; i < list.length; i++) {
    var rule = list[i];
    for (var j = 0; j < rule.conditions.length; j++) {
      var condition = rule.conditions[j];
      /* Not in the resource type list OR not matches */
      if (condition.resource_type !== undefined &&
          condition.indexOf(details.type) === -1 ||
          !condition.regexp.test(details.url)) {
        continue;
      }
      var header_names = [];
      details.requestHeaders.forEach(function (header) {
        header_names.push(header.name);
      });
      for (var k = 0; k < rule.actions.length; k++) {
        var action = rule.actions[k];
        var index = header_names.indexOf(action.name);
        switch (action.type) {
        case 'set':
          if (index === -1) {
            details.requestHeaders.push({
              name: action.name, value: action.value
            });
          } else {
            details.requestHeaders[index].value = action.value;
          }
          break;
        case 'remove':
          if (index !== -1) {
            details.requestHeaders.splice(index, 1);
          }
          break;
        default:
          assertError(false, new Error());
        }
      }
      return {requestHeaders: details.requestHeaders};
    }
  }
}

/**
 * Response header rules listener
 */
function processResponseHeaderRules(details) {
  var list = window.redirector_background_js.rule_lists.response_header;
  outmost:
  for (var i = 0; i < list.length; i++) {
    var rule = list[i];
    for (var j = 0; j < rule.conditions.length; j++) {
      var condition = rule.conditions[j];
      /* Not in the resource type list OR not matches */
      if (condition.resource_type !== undefined &&
          condition.indexOf(details.type) === -1 ||
          !condition.regexp.test(details.url)) {
        continue;
      }
      var header_names = [];
      details.responseHeaders.forEach(function (header) {
        header_names.push(header.name);
      });
      for (var k = 0; k < rule.actions.length; k++) {
        var action = rule.actions[k];
        switch (action.type) {
        case 'set':
          details.responseHeaders.push({
            name: action.name, value: action.value
          });
          break;
        case 'remove':
          var index = header_names.indexOf(action.name);
          if (index !== -1) {
            details.responseHeaders.splice(index, 1);
          }
          break;
        default:
          assertError(false, new Error());
        }
      }
      return {responseHeaders: details.responseHeaders};
    }
  }
}
