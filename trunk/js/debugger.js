/* Debugger obj.

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
/*global $: true, $$: true, $v: true, $f: true*/
/*global chrome: true, Debugger: true*/

Debugger = function () {
    this.timeStamp = [];
    this.quiet = false;
    this.trackRedir = this.trackHdr = true;
};

Debugger.prototype.start = function () { // Start debugging
    var url = $('dbg_url').value;
    if (url.length === 0) {
        return;
    }

    chrome.tabs.create(
        {url: url, active: false, pinned: true},
        this.prepare.bind(this)
    );

    $('dbg_unfold').hidden = false;
    $('dbg_fold').hidden = true;
};

Debugger.prototype.stop = function () { // Stop and cleanup
    // No need to detach, just remove the debugging tab
    try {
        chrome.tabs.remove(this.tabId);
    } catch (e) {}

    // Attach clean listeners
    $v.ext_bg.onInit();
};

Debugger.prototype.disp = function (details) {
    var prompt;
    if (! this.timeStamp.hasOwnProperty(details.requestId)) {
        this.timeStamp[details.requestId] = details.timeStamp;

        var list = document.createElement('dl');
        list.id = 'req_' + details.requestId;
        $('dbg_info').appendChild(list);
        $('dbg_info').appendChild(document.createElement('hr'));

        prompt = (new Date()).toLocaleTimeString() +
            ' #' + details.requestId;
    } else {
        prompt = '+' +
            (details.timeStamp - this.timeStamp[details.requestId]) +
            ' ms';
    }

    var title = document.createElement('dt');
    title.innerHTML =
        '<span style="color:darkGreen">[' + prompt + '] </span>';

    var data = document.createElement('dd');
    data.innerHTML = details.data;

    $('req_' + details.requestId).appendChild(title);
    $('req_' + details.requestId).appendChild(data);
};

Debugger.prototype.prepare = function (tab) {
    // WARN: Error in onBeforeRequest is not captured!!!
    this.tabId = tab.id;

    // Attach debug listeners
    $v.ext_bg.chrome.webRequest.onErrorOccurred.addListener(
        (function (details) {
            if (this.quiet === false) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + $i18n('DBG_ERR') + '</summary>' +
                        'URL: ' + details.url + '<br />' +
                        details.error +
                        (details.fromCache ?
                         '<br />' + i18n('DBG_CACHE') : ''
                        ) + '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id}
    );

    $v.ext_bg.chrome.webRequest.onBeforeRequest.addListener(
        (function (details) {
            var result = $v.ext_bg.onBeforeRequestListener(details);

            var sum, det;
            if (typeof result === 'undefined') {
                sum = $i18n('DBG_NO_REDIR');
                det = 'URL: ' + details.url;
            } else {
                sum = $i18n('DBG_REDIR');
                det = $i18n('DBG_SRC_URL') + ': ' + details.url + '<br >' +
                    $i18n('DBG_DEST_URL') + ': ' + result.redirectUrl;
            }

            if (this.trackRedir === true &&
                (typeof result !== 'undefined' ||
                 this.quiet === false)) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + sum + '</summary>' +
                        det + '</details>'
                });
            }

            return result;
        }).bind(this),
        {urls: $v.ext_bg.$v.validUrl, tabId: tab.id}, ['blocking']
    );

    $v.ext_bg.chrome.webRequest.onBeforeSendHeaders.addListener(
        (function (details) {
            var srcHdr = '';
            for (var i = 0; i < details.requestHeaders.length; i++) {
                var hdr = details.requestHeaders[i];

                srcHdr += '<details>' +
                    '<summary>' + hdr.name + '</summary>' +
                    hdr.value + '</details>';
            }

            var result = $v.ext_bg.onBeforeSendHeadersListener(details);

            var sum, det;
            if (typeof result === 'undefined') {
                sum = $i18n('DBG_NO_MODHDR');
                det = 'URL: ' + details.url;
            } else {
                var destHdr = '';
                for (var i = 0; i < result.requestHeaders.length; i++) {
                    var hdr = result.requestHeaders[i];

                    destHdr += '<details>' +
                        '<summary>' + hdr.name + '</summary>' +
                        hdr.value + '</details>';
                }

                sum = $i18n('DBG_MODHDR');
                det = 'URL: ' + details.url + '<br />' +
                    $i18n('DBG_SRC_HDR') + ': ' + srcHdr + '<br />' +
                    $i18n('DBG_DEST_HDR') + ': ' + destHdr;
            }

            if (this.trackHdr === true &&
                (typeof result !== 'undefined' ||
                 this.quiet === false)) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + sum + '</summary>' +
                        det + '</details>'
                });
            }

            return result;
        }).bind(this),
        {urls: $v.ext_bg.$v.validUrl, tabId: tab.id},
        ['blocking', 'requestHeaders']
    );

    $v.ext_bg.chrome.webRequest.onBeforeRedirect.addListener(
        (function (details) {
            if (this.trackRedir === true) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + $i18n('DBG_REDIRED') + '</summary>' +
                        $i18n('DBG_SRC_URL') + ': ' + details.url + '<br />' +
                        $i18n('DBG_DEST_URL') + ': ' + details.redirectUrl +
                        (details.fromCache ?
                         '<br />' + $i18n('DBG_CACHE') : ''
                        ) + '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id}
    );

    $v.ext_bg.chrome.webRequest.onCompleted.addListener(
        (function (details) {
            if (this.quiet === false) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + $i18n('DBG_COMPLETE') + '</summary>' +
                        details.url +
                        (details.fromCache ?
                         '<br />' + $i18n('DBG_CACHE') : ''
                        ) + '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id}
        // No extraInfoSpec, ignore server initiated redirections
    );
};

Debugger.prototype.openDetails = function (isOpen) {
    var det = $$('#dbg_info details');

    for (var i = 0; i < det.length; i++) {
        det[i].open = isOpen;
    }
};