/* Background script.

   Copyright (C) 2010-2012.

   This file is part of Redirector.

   Redirector is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Redirector is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Redirector.  If not, see <http://www.gnu.org/licenses/>.

   From Cyril Feng. */

/*jslint browser: true, onevar: false, plusplus: false*/
/*global $: true, $$: true, $v: true, $f: true, $i18n: true*/
/*global chrome: true, localStorage: true, RuleList: true, Pref: true*/

var onBeforeRequestListener = function (details) {
    if ($v.redirected.hasOwnProperty(details.requestId)) {
        return;
    }

    for (var i = 0; i < $v.ruleAuto.length; i++) {
        if ($v.ruleAuto[i].match.test(details.url)) { // Match
            if ($v.ruleAuto[i].sub === null) {        // To block
                return {cancel: true};
            } else {            // To redirect
                $v.redirected[details.requestId] = true;

                return {redirectUrl:
                        $f.getRedirUrl(details.url, $v.ruleAuto[i])};
            }
        }
    }
};

var onBeforeSendHeadersListener = function (details) {
    for (var i = 0; i < $v.ruleReqHdr.length; i++) {
        var currentRule = $v.ruleReqHdr[i];
        if (currentRule.match.test(details.url)) { // match this URL
            var currentHeaders = [];
            for (var j = 0; j < details.requestHeaders.length; j++) {
                currentHeaders.push(details.requestHeaders[j].name);
            }

            for (var j = 0; j < currentRule.sub.length; j++) {
                var idx;
                if ((idx = currentHeaders.indexOf(
                    currentRule.sub[j])) !== -1) { // Exists
                    details.requestHeaders[idx].value =
                        currentRule.repl[j];
                } else if ((idx = currentHeaders.indexOf(
                    currentRule.sub[j].replace(/^-/, '')
                )) !== -1) { // To del
                    details.requestHeaders.splice(idx, 1);
                } else {    // To create
                    if ((/^(?!-)/).test(currentRule.sub[j])) {
                        // Do not create headers with name `-...'
                        details.requestHeaders.push({
                            name: currentRule.sub[j],
                            value: currentRule.repl[j]
                        });
                    }
                }
            }

            return {requestHeaders: details.requestHeaders};
        }
    }
};

var onHeadersReceivedListener = function (details) {
    for (var i = 0; i < $v.ruleRespHdr.length; i++) {
        var currentRule = $v.ruleRespHdr[i];
        if (currentRule.match.test(details.url)) { // match this URL
            var currentHeaders = [];
            for (var j = 0; j < details.responseHeaders.length; j++) {
                currentHeaders.push(details.responseHeaders[j].name);
            }

            for (var j = 0; j < currentRule.sub.length; j++) {
                var idx;
                if ((idx = currentHeaders.indexOf(
                    currentRule.sub[j])) !== -1) { // Exists
                    details.responseHeaders[idx].value =
                        currentRule.repl[j];
                } else if ((idx = currentHeaders.indexOf(
                    currentRule.sub[j].replace(/^-/, '')
                )) !== -1) { // To del
                    details.responseHeaders.splice(idx, 1);
                } else {    // To create
                    if ((/^(?!-)/).test(currentRule.sub[j])) {
                        // Do not create headers with name `-...'
                        details.responseHeaders.push({
                            name: currentRule.sub[j],
                            value: currentRule.repl[j]
                        });
                    }
                }
            }

            return {responseHeaders: details.responseHeaders};
        }
    }
};

var loadPref = function () {           // Load preferences data
    $v.prefData = (new Pref()).data; // All preferences data

    if ($v.prefData.proto.all) {      // All protocols enabled
        $v.validUrl = ['<all_urls>']; // Matches all protocols
    } else {
        $v.validUrl = [];
        if ($v.prefData.proto.http) { // http:// enabled
            $v.validUrl.push('http://*/*');
        }
        if ($v.prefData.proto.https) { // https:// enabled
            $v.validUrl.push('https://*/*');
        }
        if ($v.prefData.proto.ftp) { // ftp:// enabled
            $v.validUrl.push('ftp://*/*');
        }
        if ($v.prefData.proto.file) { // file:// enabled
            $v.validUrl.push('file://*');
        }
    }
};

var updateContext = function () {      // Update the context menu
    var onClick = function (info, tab) {
        var rule = $v.ruleManual[
            info.menuItemId - info.parentMenuItemId - 1
        ];

        if (info.hasOwnProperty('srcUrl')) {
            chrome.tabs.create({
                url: $f.getRedirUrl(info.srcUrl, rule)
            });
        } else if (info.hasOwnProperty('linkUrl')) {
            chrome.tabs.create({
                url: $f.getRedirUrl(info.linkUrl, rule)
            });
        } else {
            chrome.tabs.update(tab.id, {
                url: $f.getRedirUrl(info.pageUrl, rule)
            });
        }
    };

    chrome.contextMenus.removeAll(); // Remove previous menus

    if ($v.status === true && $v.ruleManual.length > 0) {
        if ($v.prefData.context.link) { // Links' context menu enabled
            var parentLink = chrome.contextMenus.create({ // Parent
                title: $i18n('CONTEXT_NEW_TAB'),
                contexts: ['link', 'image']
            });

            for (var i = 0; i < $v.ruleManual.length; i++) { // Sub
                chrome.contextMenus.create({
                    title: $v.ruleManual[i].name,
                    contexts: ['link', 'image'],
                    parentId: parentLink,
                    onclick: onClick
                });
            }
        }

        if ($v.prefData.context.page) { // Pages' context menu enabled
            var parentPage = chrome.contextMenus.create({ // Parent
                title: $i18n('CONTEXT_RELOAD_TAB'),
                contexts: ['page', 'frame']
            });

            for (var i = 0; i < $v.ruleManual.length; i++) { // Sub
                chrome.contextMenus.create({
                    title: $v.ruleManual[i].name,
                    contexts: ['page', 'frame'],
                    parentId: parentPage,
                    onclick: onClick
                });
            }
        }
    }

    var title = $v.status === true ?
        $i18n('CONTEXT_STATUS_ENABLED') :
        $i18n('CONTEXT_STATUS_DISABLED');
    chrome.contextMenus.create({ // Open options page
        type: 'checkbox',
        title: title,
        checked: $v.status,
        contexts: ['all'],
        onclick: function (info) {
            $v.status = info.checked;
            localStorage.STATUS = JSON.stringify($v.status);
            updateContext();
            init();
        }
    });

    chrome.contextMenus.create({ // Open options page
        title: $i18n('CONTEXT_OPTIONS'),
        contexts: ['all'],
        onclick: function () {
            chrome.tabs.create({
                url: 'chrome-extension://' +
                    $i18n('@@extension_id') +
                    '/html/options.html'
            });
        }
    });
};

var loadRule = function (data) { // Called when rule list needs update
    var dry = false;
    if (typeof data !== 'undefined') {
        dry = true;             // Dry run
    } else {
        data = (new RuleList(false)).data; // All rules list data
    }

    if (dry !== true) {
        $v.ruleAuto = [];       // Rules for auto redir
        $v.ruleManual = [];     // Rules for manual redir
        $v.ruleReqHdr = [];     // Rules for http request header
        $v.ruleRespHdr = [];     // Rules for http request header
    }
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];     // Current rule

        // Rule must be enabled
        if (dry === false &&
            (! rule.hasOwnProperty('enabled') || ! rule.enabled)) {
            continue;
        }

        // For a manual rule
        if (rule.match.type === $v.type.manual) {
            try {
                var tmp = {     // Tmp manual rule, to be chked
                    name: rule.name,
                    sub: $f.str2re(rule.sub),
                    repl: rule.repl.str,
                    decode: rule.repl.decode
                };
                // RegExp syntax error
                if (! tmp.sub.hasOwnProperty('global')) {
                    return tmp.sub.toString();
                }
            } catch (e) {
                continue;
            }

            if (dry !== true) {
                $v.ruleManual.push(tmp); // Add to manual rule
            }
            continue;
        }

        // For a request header rule
        if (rule.sub.type === $v.type.reqHdr) {
            try {
                var tmp = {
                    match: $f.str2re(rule.match),
                    sub: $f.splitVl(rule.sub.str),
                    repl: $f.splitVl(rule.repl.str)
                };
                // Check match to see if RegExp syntax error
                if (! tmp.match.hasOwnProperty('global')) {
                    return tmp.match.toString();
                }
                // Check if sub and repl are of the same size
                if (tmp.sub.length !== tmp.repl.length) {
                    return $i18n('TEST_SUB_REPL_CONFLICT');
                }
            } catch (e) {
                continue;
            }

            if (dry !== true) {
                $v.ruleReqHdr.push(tmp);
            }
            continue;
        }

        // For a response header rule
        if (rule.sub.type === $v.type.respHdr) {
            try {
                var tmp = {
                    match: $f.str2re(rule.match),
                    sub: $f.splitVl(rule.sub.str),
                    repl: $f.splitVl(rule.repl.str)
                };
                // Check match to see if RegExp syntax error
                if (! tmp.match.hasOwnProperty('global')) {
                    return tmp.match.toString();
                }
                // Check if sub and repl are of the same size
                if (tmp.sub.length !== tmp.repl.length) {
                    return $i18n('TEST_SUB_REPL_CONFLICT');
                }
            } catch (e) {
                continue;
            }

            if (dry !== true) {
                $v.ruleRespHdr.push(tmp);
            }
            continue;
        }

        // For an auto rule
        try {
            var tmp = {             // Tmp auto rule, to be chked
                match: $f.str2re(rule.match),
                sub: $f.str2re(rule.sub),
                repl: rule.repl.str,
                decode: rule.repl.decode
            };
            // Check match/sub to see if RegExp syntax error
            if (! tmp.match.hasOwnProperty('global')) {
                return tmp.match.toString();
            }
            if (! tmp.sub.hasOwnProperty('global')) {
                return tmp.sub.toString();
            }
        } catch (e) {
            continue;
        }

        if (dry !== true) {
            $v.ruleAuto.push(tmp); // Formally add to auto rule
        }
    }

    updateContext();            // Now referesh context menu
};

var onInit = function () {
    $v.redirected = {};

    if (chrome.webRequest.onBeforeRequest.hasListener(
        onBeforeRequestListener)) {
        chrome.webRequest.onBeforeRequest.removeListener(
            onBeforeRequestListener
        );
    }

    if (chrome.webRequest.onBeforeSendHeaders.hasListener(
        onBeforeSendHeadersListener)) {
        chrome.webRequest.onBeforeSendHeaders.removeListener(
            onBeforeSendHeadersListener
        );
    }

    if (chrome.webRequest.onHeadersReceived.hasListener(
        onHeadersReceivedListener)) {
        chrome.webRequest.onHeadersReceived.removeListener(
            onHeadersReceivedListener
        );
    }

    if ($v.status === true) {
        chrome.webRequest.onBeforeRequest.addListener( // Auto redir
            onBeforeRequestListener, {urls: $v.validUrl}, ['blocking']
        );

        chrome.webRequest.onBeforeSendHeaders.addListener(
            onBeforeSendHeadersListener,
            {urls: $v.validUrl},
            ['blocking', 'requestHeaders']
        );

        chrome.webRequest.onHeadersReceived.addListener(
            onHeadersReceivedListener,
            {urls: $v.validUrl},
            ['blocking', 'responseHeaders']
        );
    }
};

try {                           // Enabled or disabled
    $v.status = JSON.parse(localStorage.STATUS);
} catch (e) {
    $v.status = true;
    localStorage.STATUS = JSON.stringify(true);
}

loadPref();                     // Load preferences data
loadRule();                     // Load rule list
onInit();                       // Initialize

try {                           // First install
    var version = JSON.parse(localStorage.VERSION);
} catch (e) {
    localStorage.VERSION =
        JSON.stringify(chrome.app.getDetails().version);
    chrome.tabs.create({
        url: 'chrome-extension://' +
            $i18n('@@extension_id') +
            '/html/options.html'
    });
}
