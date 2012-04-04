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
    if ($v.treated[details.requestId] !== undefined) {
        return;
    }

    for (var i = 0, n = $v.ruleAuto.length; i < n; i++) {
        var rule = $v.ruleAuto[i];
        if ((rule.content === undefined ||
             rule.content.indexOf(details.type) !== -1) &&
            rule.match.test(details.url)) { // Match
            if (rule.sub === null) {        // To block
                return {cancel: true};
            } else {            // To redirect
                $v.treated[details.requestId] = true;
                return {redirectUrl: $f.getRedirUrl(details.url, rule)};
            }
        }
    }
};

var onBeforeSendHeadersListener = function (details) {
    for (var i = 0, n = $v.ruleReqHdr.length; i < n; i++) {
        var rule = $v.ruleReqHdr[i];

        if ((rule.content === undefined ||
             rule.content.indexOf(details.type) !== -1) &&
            rule.match.test(details.url)
           ) {                  // match this URL
            var currentHeaders = [];
            details.requestHeaders.forEach(function (header) {
                currentHeaders.push(header.name);
            });

            for (var j = 0; j < rule.sub.length; j++) {
                var idx;
                if ((idx = currentHeaders.indexOf(rule.sub[j])) !== -1) {
                    // Exists
                    details.requestHeaders[idx].value = rule.repl[j];
                } else if ((idx = currentHeaders.indexOf(
                    rule.sub[j].replace(/^-/, ''))) !== -1) { // To del
                    details.requestHeaders.splice(idx, 1);
                } else {        // To create
                    if ((/^(?!-)/).test(rule.sub[j])) {
                        // Do not create headers with name `-...'
                        details.requestHeaders.push({
                            name: rule.sub[j], value: rule.repl[j]
                        });
                    }
                }
            }

            $v.treated[details.requestId] = true;
            return {requestHeaders: details.requestHeaders};
        }
    }
};

var onHeadersReceivedListener = function (details) {
    for (var i = 0, n = $v.ruleRespHdr.length; i < n; i++) {
        var rule = $v.ruleRespHdr[i];

        if ((rule.content === undefined ||
             rule.content.indexOf(details.type) !== -1) &&
            rule.match.test(details.url)
           ) {                  // match this URL
            var currentHeaders = [];
            details.responseHeaders.forEach(function (header) {
                currentHeaders.push(header.name);
            });

            for (var j = 0; j < rule.sub.length; j++) {
                var idx;
                if ((idx = currentHeaders.indexOf(rule.sub[j])) !== -1) {
                    // Exists
                    details.responseHeaders[idx].value = rule.repl[j];
                } else if ((idx = currentHeaders.indexOf(
                    rule.sub[j].replace(/^-/, ''))) !== -1) { // To del
                    details.responseHeaders.splice(idx, 1);
                } else {        // To create
                    if ((/^(?!-)/).test(rule.sub[j])) {
                        // Do not create headers with name `-...'
                        details.responseHeaders.push({
                            name: rule.sub[j], value: rule.repl[j]
                        });
                    }
                }
            }

            $v.treated[details.requestId] = true;
            return {responseHeaders: details.responseHeaders};
        }
    }
};

var loadPref = function () {         // Load preferences data
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

            $v.ruleManual.forEach(function (rule) { // Sub entry
                chrome.contextMenus.create({
                    title: rule.name,
                    contexts: ['link', 'image'],
                    parentId: parentLink,
                    onclick: onClick
                });
            });
        }

        if ($v.prefData.context.page) { // Pages' context menu enabled
            var parentPage = chrome.contextMenus.create({ // Parent
                title: $i18n('CONTEXT_RELOAD_TAB'),
                contexts: ['page', 'frame']
            });

            $v.ruleManual.forEach(function (rule) { // Sub entry
                chrome.contextMenus.create({
                    title: rule.name,
                    contexts: ['page', 'frame'],
                    parentId: parentPage,
                    onclick: onClick
                });
            });
        }
    }

    var title = $v.status === true ?
        $i18n('CONTEXT_STATUS_ENABLED') :
        $i18n('CONTEXT_STATUS_DISABLED');
    chrome.contextMenus.create({ // Enable/Disable
        type: 'checkbox',
        title: title,
        checked: $v.status,
        contexts: ['all'],
        onclick: function (info) {
            $v.status = info.checked;
            localStorage.STATUS = JSON.stringify($v.status);
            updateContext();
            onInit();
        }
    });

    chrome.contextMenus.create({ // Import a rule
        title: $i18n('CONTEXT_IMPORT'),
        contexts: ['link'],
        onclick: function (info) {
            var tmpList = new RuleList(true);
            if (tmpList.restore(true, info.linkUrl) === true) {
                $f.openOptions('?1');
            }
        }
    });

    chrome.contextMenus.create({ // Open options page
        title: $i18n('CONTEXT_OPTIONS'),
        contexts: ['all'],
        onclick: function () {
            $f.openOptions();
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
        $v.ruleRespHdr = [];    // Rules for http request header
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
                    content: rule.match.content,
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
                    content: rule.match.content,
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
                content: rule.match.content,
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

var onRemoved = function (tabId) {
    switch (tabId) {
    case $v.optionTabId:
        chrome.tabs.remove($v.debugeeTabId);
        break;
    case $v.debugeeTabId:
        var page = chrome.extension.getExtensionTabs()[0];
        page.$('dbg_stop').hidden = true;
        page.$('dbg_start').hidden = false;
        break;
    default:
        return;
    }

    onInit();

    chrome.tabs.onRemoved.removeListener(onRemoved);
};

var updatePageAction = function (details) {
    if ($v.prefData.disablePageAction === true || details.tabId === -1) {
        return;
    }

    if (details.error !== undefined) { // Error occurrs
        if ($v.hasError === true ||    // Already marked as error
            $v.treated[details.requestId] === undefined) {
            return;
        }
    } else {                        // Suceeded
        if ($v.hasError !== null || // Already changed
            $v.treated[details.requestId] === undefined) {
            return;
        }
    }

    chrome.webNavigation.getFrame(
        {tabId: details.tabId, frameId: details.frameId},
        function (info) {
            if (info === null) { // tabId/frameId is invalid
                return;
            }

            if (details.error !== undefined) {
                $v.hasError = true;
                setPageAction(details.tabId, $v.pA_error);
                // BUGGY
                $v.iconStatus[details.tabId] = false;
            } else {
                $v.hasError = false;
                setPageAction(details.tabId, $v.pA_success);
                // BUGGY
                // $v.iconStatus[details.tabId] = true;
            }
        }
    );
};

var togglePageAction = function () {
    chrome.tabs.query({}, function (tabs) {
        if ($v.prefData.disablePageAction === true) {
            tabs.forEach(function (tab) {
                chrome.pageAction.hide(tab.id);
            });

            return;
        }

        var pA;
        if ($v.status === false) {
            pA = $v.pA_disabled;
        } else {
            pA = $v.pA_ready;
        }

        tabs.forEach(function (tab) {
            setPageAction(tab.id, pA);
            chrome.pageAction.show(tab.id);
        });
    });
};

var setPageAction = function (tabId, pA) {
    chrome.pageAction.setTitle({
        tabId: tabId, title: pA.title
    });

    chrome.pageAction.setIcon({
        tabId: tabId, imageData: pA.imageData
    });
};

var onInit = function (debug) {
    try {                       // Enabled or disabled
        $v.status = JSON.parse(localStorage.STATUS);
    } catch (e) {
        $v.status = true;
        localStorage.STATUS = JSON.stringify(true);
    }

    loadPref();                 // Load preferences data
    loadRule();                 // Load rule list

    $v.treated = {};
    $v.iconStatus = {};

    var createIcon = function (process) {
        var ctx = document.createElement('canvas').getContext('2d');
        var img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            process(ctx);
        };
        img.src = chrome.extension.getURL('icons/icon_19.png');
    };

    createIcon(function (context) { // pageAction on ready
        $v.pA_ready = {
            title: 'Redirector is ready',
            imageData: context.getImageData(0, 0, 19, 19)
        };
    });

    createIcon(function (context) { // pageAction on success
        context.strokeStyle = "#008800";
        context.lineWidth = 2;
        context.moveTo(1.5, 11.5);
        context.lineTo(5.5, 17.5);
        context.lineTo(17.5, 5.5);
        context.stroke();

        $v.pA_success = {
            title: 'Redirector works without any error',
            imageData: context.getImageData(0, 0, 19, 19)
        };
    });

    createIcon(function (context) { // pageAction on error
        context.strokeStyle = "#ff0000";
        context.lineWidth = 2;
        context.moveTo(1.5, 5.5);
        context.lineTo(17.5, 17.5);
        context.moveTo(1.5, 17.5);
        context.lineTo(17.5, 5.5);
        context.stroke();

        $v.pA_error = {
            title: 'Redirector encountered at least a error',
            imageData: context.getImageData(0, 0, 19, 19)
        };
    });

    createIcon(function (context) { // pageAction on disabled
        var imageData = context.getImageData(0, 0, 19, 19);
        var data = imageData.data;
        for (var i = 0, n = data.length; i < n; i += 4) {
            var gs = 0.2126 * data[i] +
                0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            data[i] = data[i + 1] = data[i + 2] = gs;
        }

        $v.pA_disabled = {
            title: 'Redirector is disabled',
            imageData: imageData
        };
    });

    togglePageAction();

    // Remove event listeners if already attached
    [[chrome.webRequest.onBeforeRequest, onBeforeRequestListener],
     [chrome.webRequest.onBeforeSendHeaders, onBeforeSendHeadersListener],
     [chrome.webRequest.onHeadersReceived, onHeadersReceivedListener],
     [chrome.webRequest.onErrorOccurred, updatePageAction],
     [chrome.webRequest.onCompleted, updatePageAction]
    ].forEach(function (i) {
        if (i[0].hasListener(i[1])) {
            i[0].removeListener(i[1]);
        }
    });

    chrome.tabs.onCreated.addListener(function (tab) { // Original state
        if ($v.prefData.disablePageAction === true) {
            return;
        }

        if ($v.status === false) {
            setPageAction(tab.id, $v.pA_disabled);
        } else {
            setPageAction(tab.id, $v.pA_ready);
        }

        chrome.pageAction.show(tab.id);
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if ($v.prefData.disablePageAction === true) {
            return;
        }

        // BUGGY
        if ($v.iconStatus[tab.id] === false) {
            setPageAction(tabId, $v.pA_error);
        }//  else if ($v.iconStatus[tab.id] === true) {
        //     setPageAction(tabId, $v.pA_success);
        // }

        $v.hasError = null;
        chrome.pageAction.show(tabId);
    });

    if ($v.status === true && typeof debug === 'undefined') {
        // Automatic redirection
        chrome.webRequest.onBeforeRequest.addListener(
            onBeforeRequestListener, {urls: $v.validUrl}, ['blocking']
        );
        // Modify request headers
        chrome.webRequest.onBeforeSendHeaders.addListener(
            onBeforeSendHeadersListener,
            {urls: $v.validUrl},
            ['blocking', 'requestHeaders']
        );
        // Modify response headers
        chrome.webRequest.onHeadersReceived.addListener(
            onHeadersReceivedListener,
            {urls: $v.validUrl},
            ['blocking', 'responseHeaders']
        );
        // Show error icon
        chrome.webRequest.onErrorOccurred.addListener(
            updatePageAction, {urls: $v.validUrl});
        // Show success icon
        chrome.webRequest.onCompleted.addListener(
            updatePageAction, {urls: $v.validUrl});
    }
};

onInit();                       // Initialize

try {                           // First install
    JSON.parse(localStorage.VERSION);
} catch (e) {
    localStorage.VERSION =
        JSON.stringify(chrome.app.getDetails().version);
    $f.openOptions();
}
