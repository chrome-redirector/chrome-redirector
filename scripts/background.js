'use strict';

window.redirector_background_js = {
  rule_lists: {
    redirect: [],
    manual: [],
    request_header: [],
    response_header: []
  },
  redirected_requests: {},      // For recording redirected request ID
  header_modified_requests: {}, // For recording header modified request ID
  info: {},                    // Web request log info for page action
  storage_states: {
    context_enabled: true,
    icon_enabled: true,
    enabled_protocols: ['<all_urls>'],
    enabled_rule_types: [
      'fast_matching', 'redirect', 'request_header',
      'response_header', 'online'
    ],
    manual_methods: ['link', 'page'],
    auto_sync_enabled: true
  }
};

/* Initialize
 */
(function () {
  var namespace = window.redirector_background_js;
  chrome.storage.local.get(null, function (items) {
    // Get storage state, preserving default value if it's not set
    for (var key in items) {
      namespace.storage_states[key] = items[key];
    }
    /* Rules
     */
    ['fast_matching', 'redirect', 'request_header',
     'response_header', 'online'
    ].forEach(function (type) {
      initRules(type, items[type]);
    });
    /* Other
     */
    // // Already called in initRules();
    // initContextMenus();
    initPageAction();
    initAutoSync();
    /* Event listeners
     */
    /* Fresh install (not work for 150558) */
    chrome.runtime.onInstalled.addListener(function() {
      openOptionsPage();
    });
    /* Reinitialize the related part when storage changed */
    chrome.storage.onChanged.addListener(function (changes, storage_name) {
      if (storage_name !== 'local') {
        return;
      }
      for (var key in changes) {
        if (changes.hasOwnProperty(key) === false) {
          return;
        }
        var value = changes[key].newValue;
        var old_value = changes[key].oldValue;
        namespace.storage_states[key] = value;
        switch (key) {
        case 'fast_matching': case 'redirect': case 'request_header':
        case 'response_header': case 'online':
          initRules(key, value);
          break;
        case 'enabled_protocols':
          registerWebRequestListeners();
          break;
        case 'context_enabled': case 'manual_methods':
          initContextMenus();
          break;
        case 'icon_enabled':
          initPageAction();
          break;
        case 'enabled_rule_types':
          if (old_value === undefined) {
            old_value = [];
          }
          var removed_types = old_value.filter(function (type) {
            return value.indexOf(type) < 0;
          });
          var added_types = value.filter(function (type) {
            return old_value.indexOf(type) < 0;
          });
          if (removed_types.indexOf('fast_matching') >= 0) {
            chrome.declarativeWebRequest.onRequest.removeRules();
          } else if (added_types.indexOf('fast_matching') >= 0) {
            initRules('fast_matching');
          }
          registerWebRequestListeners(value);
          break;
        case 'auto_sync_enabled':
          initAutoSync();
          break;
        default:
          console.log('Not implemented: ' + key);
          return;
        }
      }
    });
    registerWebRequestListeners();
  });
})();

/**
 * Initialize rules (wrapper for following rules initializers)
 */
function initRules(type, rules) {
  if (type === 'all') {
    ['fast_matching', 'redirect', 'request_header',
     'response_header', 'online'
    ].forEach(function (type) {
      initRules(type);
    });
    return;
  }
  if (rules === undefined) {
    chrome.storage.local.get(type, function (items) {
      for (var type in items) {
        if (items[type] !== undefined) {
          initRules(type, items[type]);
        }
      }
    });
    return;
  }
  switch (type) {
  case 'fast_matching':
    initFastMatchingRules(rules);
    break;
  case 'redirect':
    initRedirectRules(rules);
    // Manual rules may change
    initContextMenus();
    break;
  case 'request_header':
    initRequestHeaderRules(rules);
    break;
  case 'response_header':
    initResponseHeaderRules(rules);
    break;
  case 'online':
    initOnlineRules(rules);
    break;
  default:
    assertError(false, new Error());
  }
}

/**
 * Initialize fast matching rules
 */
function initFastMatchingRules(rules, append) {
  var namespace = window.redirector_background_js;
  if (append === undefined) {
    // Build from scratch
    chrome.declarativeWebRequest.onRequest.removeRules(undefined, function () {
      if (namespace.storage_states.enabled_rule_types.indexOf('fast') >= 0) {
        initFastMatchingRules(rules, true);
      }
    });
    return;
  }
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
        if (action.value) {   // Can value be empty?
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
function initRedirectRules(rules, append) {
  var namespace = window.redirector_background_js;
  namespace.rule_lists.redirect = [];
  if (namespace.storage_states.enabled_rule_types.indexOf('redirect') < 0 ||
      rules === undefined || rules.length === 0) {
    return;
  }
  var redirect = [];
  var manual = [];
  if (append === true) {
    redirect = namespace.rule_lists.redirect;
    manual = namespace.rule_lists.manual;
  }
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
        // var canvas = document.createElement('canvas');
        // canvas.width = canvas.height = 1;
        // var url = canvas.toDataURL('image/png');
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
  namespace.rule_lists.redirect = redirect;
  namespace.rule_lists.manual = manual;
}

/**
 * Initialize request header rules
 */
function initRequestHeaderRules(rules, append) {
  var namespace = window.redirector_background_js;
  namespace.rule_lists.request_header = [];
  if (namespace.storage_states.enabled_rule_types.indexOf('request') < 0) {
    return;
  }
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var request_header;
  if (append === true) {
    request_header = namespace.rule_lists.request_header;
  }
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
  namespace.rule_lists.request_header = request_header;
}

/**
 * Initialize response header rules
 */
function initResponseHeaderRules(rules) {
  var namespace = window.redirector_background_js;
  namespace.rule_lists.response_header = [];
  if (namespace.storage_states.enabled_rule_types.indexOf('response') < 0) {
    return;
  }
  if (rules === undefined || rules.length === 0) {
    return;
  }
  var response_header = [];
  if (append === true) {
    response_header = namespace.rule_lists.response_header;
  }
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
  namespace.rule_lists.response_header = response_header;
}

/**
 * Initialize online rules
 */
function initOnlineRules(rules) {
  if (window.redirector_background_js.storage_states
      .enabled_rule_types.indexOf('online') < 0) {
    return;
  }
  // TODO
}

/**
 * Initialize context menu functionality (manual redirection, etc)
 */
function initContextMenus() {
  chrome.contextMenus.removeAll();
  var namespace = window.redirector_background_js;
  if (namespace.storage_states.context_enabled === false) {
    return;
  }
  var manual = namespace.rule_lists.manual;
  if (manual.length > 0) {
    /* Menu entries for manual redirection */
    /* Link manual redirection */
    if (namespace.storage_states.manual_methods.indexOf('link') >= 0) {
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
    if (namespace.storage_states.manual_methods.indexOf('page') >= 0) {
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
  }
  /* Entry: open options page */
  chrome.contextMenus.create({
    title: 'Open options page',
    contexts: ['all'],
    onclick: function () {
      openOptionsPage();
    }
  });
}

/**
 * Initialize page action
 */
function initPageAction() {
  var namespace = window.redirector_background_js;
  if (namespace.storage_states.icon_enabled === false) {
    // Disable page action on all tabs
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.pageAction.hide(tab.id);
      });
    });
    return;
  }
  var info = namespace.info;
  chrome.webRequest.onBeforeRedirect.addListener(function (details) {
    if (info[details.tabId] === undefined) {
      info[details.tabId] = [];
    }
    if (namespace.redirected_requests[details.requestId] !== undefined) {
      info[details.tabId].push(
        '#' + details.requestId + ' ' + details.url + '<br />' +
          Array(Math.ceil(Math.log(details.requestId) / Math.LN10)).join(' ') +
          '-&gt; ' + details.redirectUrl
      );
    }
  }, {urls: namespace.storage_states.enabled_protocols});
  chrome.webRequest.onErrorOccurred.addListener(function (details) {
    if (namespace.redirected_requests[details.requestId] === undefined &&
        namespace.header_modified_requests[details.requestId] === undefined) {
      return;
    }
    if (info[details.tabId] === undefined) {
      info[details.tabId] = [];
    }
    info[details.tabId].push(
      '#' + details.requestId + ' ' + details.error
    );
  }, {urls: namespace.storage_states.enabled_protocols});
  /* Set page action when tab is updated */
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (window.redirector_background_js
        .storage_states.icon_enabled === false ||
        info[tabId] === undefined) {
      return;
    }
    chrome.pageAction.setTitle({
      tabId: tabId,
      title: 'Click for web request logs'
    });
    chrome.pageAction.show(tabId);
  });
  /* Clean up the corresponding logs when a tab is removed */
  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (info[tabId] !== undefined) {
      delete info[tabId];
    }
  });
}

/**
 * Initialize auto sync (not work for 150558)
 */
function initAutoSync() {
  // chrome.alarms.clear('auto_sync');
  // chrome.alarms.onAlarm.removeListener(syncData);
  // if (window.redirector_background_js
  //     .storage_states.auto_sync_enabled === true) {
  //   chrome.alarms.create('auto_sync', {periodInMinutes: 60});
  //   chrome.alarms.onAlarm.addListener(syncData);
  // }
}

/**
 * Register webRequest listeners
 */
function registerWebRequestListeners(types) {
  var webRequest = chrome.webRequest;
  // Remove event listeners
  [['onBeforeRequest', processRedirectRules],
   ['onBeforeSendHeaders', processRequestHeaderRules],
   ['onHeadersReceived', processResponseHeaderRules]
  ].forEach(function (t) {
    if (webRequest[t[0]].hasListener(t[1])) {
      webRequest[t[0]].removeListener(t[1]);
    }
  });
  var namespace = window.redirector_background_js.storage_states;
  /* redirect rules */
  if (types instanceof Array && types.indexOf('redirect') >= 0) {
    webRequest.onBeforeRequest.addListener(
      processRedirectRules,
      {urls: namespace.enabled_protocols},
      ['blocking']
    );
  }
  /* request header rules */
  if (types instanceof Array && types.indexOf('request_header') >= 0) {
    webRequest.onBeforeSendHeaders.addListener(
      processRequestHeaderRules,
      {urls: namespace.enabled_protocols},
      ['blocking', 'requestHeaders']
    );
  }
  /* response header rules */
  if (types instanceof Array && types.indexOf('response_header') >= 0) {
    webRequest.onHeadersReceived.addListener(
      processResponseHeaderRules,
      {urls: namespace.enabled_protocols},
      ['blocking', 'responseHeaders']
    );
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
          condition.indexOf(details.type) < 0 ||
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
  for (var i = 0; i < list.length; i++) {
    var rule = list[i];
    for (var j = 0; j < rule.conditions.length; j++) {
      var condition = rule.conditions[j];
      /* Not in the resource type list OR not matches */
      if (condition.resource_type !== undefined &&
          condition.indexOf(details.type) < 0 ||
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
          if (index < 0) {
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
      window.redirector_background_js
        .header_modified_requests[details.requestId] = true;
      return {requestHeaders: details.requestHeaders};
    }
  }
}

/**
 * Response header rules listener
 */
function processResponseHeaderRules(details) {
  var list = window.redirector_background_js.rule_lists.response_header;
  for (var i = 0; i < list.length; i++) {
    var rule = list[i];
    for (var j = 0; j < rule.conditions.length; j++) {
      var condition = rule.conditions[j];
      /* Not in the resource type list OR not matches */
      if (condition.resource_type !== undefined &&
          condition.indexOf(details.type) < 0 ||
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
      window.redirector_background_js
        .header_modified_requests[details.requestId] = true;
      return {responseHeaders: details.responseHeaders};
    }
  }
}
