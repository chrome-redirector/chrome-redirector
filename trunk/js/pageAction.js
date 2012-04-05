/* "Page Action".

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

var updatePageAction = function (details) {
    var tabId = details.tabId;
    if ($v.prefData.disablePageAction === true || tabId === -1) {
        return;
    }

    if (details.error !== undefined) { // Error occurrs
        if ($v.hasError === true ||    // Already marked as error
            $v.treated[details.requestId] === undefined) {
            return;
        }

        $v.hasError = true;
        setPageAction(tabId, $v.pA_error);
        $v.timerQueue[tabId] = false;
    } else {                        // Suceeded
        if ($v.hasError !== null || // Already changed
            $v.treated[details.requestId] === undefined) {
            return;
        }

        $v.hasError = false;
        setPageAction(tabId, $v.pA_success);
        $v.timerQueue[tabId] = true;
    }

    // Better solution?
    setTimeout(function () {    // Delay 0.5s to prevent override
        delete $v.timerQueue[tabId];
    }, 500);
};

var togglePageAction = function (hide) { // Apply status to all tabs
    chrome.tabs.query({}, function (tabs) {
        if ($v.prefData.disablePageAction === true ||
            typeof hide !== 'undefined') {
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

var setPageAction = function (tabId, pA) { // Set title & icon
    chrome.pageAction.setTitle({
        tabId: tabId, title: pA.title
    });

    chrome.pageAction.setIcon({
        tabId: tabId, imageData: pA.imageData
    });
};

var onCreatedListener = function (tab) { // Set Original Icon state
    if ($v.prefData.disablePageAction === true) {
        return;
    }

    if ($v.status === false) {
        setPageAction(tab.id, $v.pA_disabled);
    }

    chrome.pageAction.show(tab.id);
};

// Show hidden icon after tab update and set the correct type
var onUpdatedListener = function (tabId, changeInfo, tab) {
    if ($v.prefData.disablePageAction === true ||
        changeInfo.status === 'complete') { // Only change once
        return;
    }

    if ($v.timerQueue[tab.id] === true) {
        setPageAction(tabId, $v.pA_success);
    } else if ($v.timerQueue[tab.id] === false) {
        setPageAction(tabId, $v.pA_error);
    } else if ($v.status === true) {
        setPageAction(tabId, $v.pA_ready);
    } else {
        setPageAction(tabId, $v.pA_disabled);
    }

    $v.hasError = null;
    chrome.pageAction.show(tabId);
};

var createIcon = function (process) { // Template for creating icons
    var ctx = $c('canvas').getContext('2d');
    var img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        process(ctx);
    };
    img.src = chrome.extension.getURL('icons/icon_19.png');
};

createIcon(function (context) { // pageAction on ready
    $v.pA_ready = {
        title: $i18n('PA_READY'),
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
        title: $i18n('PA_SUCCESS'),
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
        title: $i18n('PA_ERROR'),
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
        title: $i18n('PA_DISABLED'),
        imageData: imageData
    };
});

$v.timerQueue = {};
