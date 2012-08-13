(function () {
  'use strict';

  if (chrome.webRequest !== undefined) {
    /* In background page */
    var namespace = window.redirector_background_js;
    namespace.request_log = {};
    var request_log = namespace.request_log;
    /* Record every manipulated request here */
    chrome.webRequest.onSendHeaders.addListener(function (details) {
      if (namespace.storage_states.debugger_enabled !== true) {
        return;
      }
      var request_log = namespace.request_log;
      if (request_log[details.tabId] === undefined) {
        request_log[details.tabId] = {};
      }
      var tab = request_log[details.tabId];
      if (tab[details.url] === undefined) {
        tab[details.url] = {};
      }
      var log = tab[details.url];
      log.id = details.requestId;
      log.type = details.type;
      log.redirected = namespace.redirected_requests[
        details.requestId] !== undefined;
      log.header_modified = namespace.header_modified_requests[
        details.requestId] != undefined;
    }, {urls: ["<all_urls>"]});
    /* Record every redirection here */
    chrome.webRequest.onBeforeRedirect.addListener(function (details) {
      if (namespace.storage_states.debugger_enabled !== true) {
        return;
      }
      var tab = request_log[details.tabId] = {};
      tab[details.redirectUrl] = {
        id: details.requestId,
        from: details.url
      };
    }, {urls: ["<all_urls>"]});
    /* Remove request log when the corresponding tab will never be available */
    chrome.tabs.onRemoved.addListener(function (tabId) {
      if (namespace.storage_states.debugger_enabled !== true) {
        return;
      }
      delete namespace.request_log[tabId];
    });
    /* Response to debugger's request */
    chrome.extension.onMessage.addListener(function (
      message, sender, sendResponse) {
      switch (message.command) {
      case 'request_data':
        if (message.url !== undefined && message.tab_id !== undefined) {
          if (request_log[message.tab_id] === undefined) {
            console.log(message.url);
            sendResponse();
          } else {
            sendResponse(request_log[message.tab_id][message.url]);
          }
        }
        break;
      case 'debugger_enabled':
        sendResponse(namespace.storage_states.debugger_enabled);
        break;
      default:
        assertError(false, new Error());
      }
      return true;
    });
  } else {
    /* In devtools */
    // Check if debugger is enabled
    chrome.extension.sendMessage(
      null, {command: 'debugger_enabled'}, function (response) {
        if (response === true) {
          // Create panel to show debug info
          chrome.devtools.panels.create(
            "Redirector", "icons/icon_32.png", "pages/debugger.html");
        }
      });
  }
})();
