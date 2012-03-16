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
/*global $: true, $$: true, $v: true, $f: true, $i18n: true*/
/*global chrome: true, Debugger: true*/

Debugger = function () {
    this.timeStamp = [];
    this.quiet = this.testSpeed = false;
    this.trackRedir = this.trackReqHdr = this.trackRespHdr = true;
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

Debugger.prototype.setColor = function (text, textC, bgC) {
    // Set font/bg color: textC: text color; bgC: bg color
    var style = '';
    if (typeof textC !== 'undefined' && textC.length > 0) {
        style += 'color:' + textC + ';';
    }

    if (typeof bgC !== 'undefined' && bgC.length > 0) {
        style += 'background-color:' + bgC + ';';
    }

    if (style === '') {
        return text;
    } else {
        return '<span style="' + style + '">' + text + '</span>';
    }
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
            (
                details.timeStamp - this.timeStamp[details.requestId]
            ).toFixed(3) +
            ' ms';
    }

    var title = document.createElement('dt');
    title.innerHTML = this.setColor('[' + prompt + ']', 'darkGreen');

    var data = document.createElement('dd');
    data.innerHTML = details.data;

    $('req_' + details.requestId).appendChild(title);
    $('req_' + details.requestId).appendChild(data);
};

Debugger.prototype.timer = function (testee, para) {
    var time1 = (new Date()).getTime();
    for (var i = 0; i < 1000000; i++) {
        testee.apply(document, para);
    }
    var time2 = (new Date()).getTime();

    var elapse = ' (' + ((time2 - time1) / 1000).toFixed(3) + ' &mu;s)';

    return [
        this.setColor(elapse, 'red'), testee.apply(document, para)
    ];
};

Debugger.prototype.trimHdr = function (Hdr) {
    var tmp = '';
    for (var i = 0; i < Hdr.length; i++) {
        var hdr = Hdr[i];

        tmp += '<details style="margin-left:1em;">' +
            '<summary>' + hdr.name + '</summary>' +
            hdr.value + '</details>';
    }

    return '<details><summary>HDR:</summary>' +
        tmp + '</details>';
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
                        '<summary>' +
                        this.setColor($i18n('DBG_ERR'), 'red') +
                        '</summary>' +
                        'URL: ' + details.url + '<br />' +
                        this.setColor(details.error, '', 'pink') +
                        this.setColor(
                            (details.fromCache ?
                             '<br />' + $i18n('DBG_CACHE') : ''
                            ), 'red', 'lightYellow'
                        ) + '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id}
    );

    $v.ext_bg.chrome.webRequest.onBeforeRequest.addListener(
        (function (details) {
            if (this.testSpeed === true) {
                var tmp = this.timer(
                    $v.ext_bg.onBeforeRequestListener, [details]
                );
                var elapse = tmp[0], result = tmp[1];
            } else {
                var elapse = '',
                result = $v.ext_bg.onBeforeRequestListener(details);
            }

            var sum, det;
            if (typeof result === 'undefined') {
                sum = $i18n('DBG_NO_REDIR') + elapse;
                det = 'URL: ' + details.url;
            } else {
                sum = this.setColor($i18n('DBG_REDIR') + elapse, 'blue');
                det =
                    this.setColor(
                        $i18n('DBG_SRC_URL') + ': ' + details.url,
                        '', 'lightBlue'
                    ) + '<br />' +
                    this.setColor(
                        $i18n('DBG_DEST_URL') + ': ' +
                            result.redirectUrl, '', 'lightGreen'
                    );
            }

            if (this.trackRedir === true && (
                typeof result !== 'undefined' || this.quiet === false
            )) {
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
        ['blocking']
    );

    $v.ext_bg.chrome.webRequest.onBeforeSendHeaders.addListener(
        (function (details) {
            var srcHdr = this.trimHdr(details.requestHeaders);

            if (this.testSpeed === true) {
                var tmp = this.timer(
                    $v.ext_bg.onBeforeSendHeadersListener, [details]
                );
                var elapse = tmp[0], result = tmp[1];
            } else {
                var elapse = '',
                result = $v.ext_bg.onBeforeSendHeadersListener(details);
            }

            var sum, det;
            if (typeof result === 'undefined') {
                sum = $i18n('DBG_NO_MOD_REQHDR') + elapse;
                det = 'URL: ' + details.url + '<br />' + srcHdr;
            } else {
                var destHdr = this.trimHdr(result.requestHeaders);

                sum = this.setColor($i18n('DBG_MOD_REQHDR') + elapse, 'green');
                det = 'URL: ' + details.url + '<br />' +
                    this.setColor(
                        $i18n('DBG_SRC_HDR') + ': ' + srcHdr,
                        '', 'lightBlue'
                    ) +
                    this.setColor(
                        $i18n('DBG_DEST_HDR') + ': ' + destHdr,
                        '', 'lightGreen'
                    );
            }

            if (this.trackReqHdr === true &&
                (typeof result !== 'undefined' || this.quiet === false)) {
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

    $v.ext_bg.chrome.webRequest.onSendHeaders.addListener(
        (function (details) {
            if (this.quiet === false) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' +
                        this.setColor($i18n('DBG_SEND_REQHDR')) +
                        '</summary>' +
                        'URL: ' + details.url +
                        this.trimHdr(details.requestHeaders) +
                        this.setColor(
                            (details.fromCache ?
                             '<br />' + $i18n('DBG_CACHE') : ''
                            ), 'red', 'lightYellow'
                        ) +
                        '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id},
        ['requestHeaders']
    );

    $v.ext_bg.chrome.webRequest.onHeadersReceived.addListener(
        (function (details) {
            var srcHdr = this.trimHdr(details.responseHeaders);

            if (this.testSpeed === true) {
                var tmp = this.timer(
                    $v.ext_bg.onHeadersReceivedListener, [details]
                );
                var elapse = tmp[0], result = tmp[1];
            } else {
                var elapse = '',
                result = $v.ext_bg.onHeadersReceivedListener(details);
            }

            var sum, det;
            if (typeof result === 'undefined') {
                sum = $i18n('DBG_NO_MOD_RESPHDR') + elapse;
                det = 'URL: ' + details.url + '<br />' + srcHdr;
            } else {
                var destHdr = this.trimHdr(result.responseHeaders);

                sum = this.setColor($i18n('DBG_MOD_RESPHDR') + elapse, 'green');
                det = 'URL: ' + details.url + '<br />' +
                    this.setColor(
                        $i18n('DBG_SRC_HDR') + ': ' + srcHdr,
                        '', 'lightBlue'
                    ) +
                    this.setColor(
                        $i18n('DBG_DEST_HDR') + ': ' + destHdr,
                        '', 'lightGreen'
                    );
            }

            if (this.trackRespHdr === true &&
                (typeof result !== 'undefined' || this.quiet === false)) {
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
        ['blocking', 'responseHeaders']
    );

    $v.ext_bg.chrome.webRequest.onBeforeRedirect.addListener(
        (function (details) {
            if (this.trackRedir === true) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' +
                        this.setColor($i18n('DBG_REDIRED'), 'yellow') +
                        '</summary>' +
                        this.setColor(
                            $i18n('DBG_SRC_URL') + ': ' + details.url,
                            '', 'lightBlue'
                        ) + '<br />' +
                        this.setColor(
                            $i18n('DBG_DEST_URL') + ': ' +
                                details.redirectUrl, '', 'lightGreen'
                        ) +
                        this.setColor(
                            (details.fromCache ?
                             '<br />' + $i18n('DBG_CACHE') : ''
                            ), 'red', 'lightYellow'
                        ) +
                        this.trimHdr(details.responseHeaders) +
                        '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id},
        ['responseHeaders']
    );

    $v.ext_bg.chrome.webRequest.onCompleted.addListener(
        (function (details) {
            if (this.quiet === false) {
                this.disp({
                    url: details.url,
                    timeStamp: details.timeStamp,
                    requestId: details.requestId,
                    data: '<details>' +
                        '<summary>' + this.setColor(
                            $i18n('DBG_COMPLETE'), '', 'green'
                        ) + '</summary>' +
                        'URL: ' + details.url +
                        this.trimHdr(details.responseHeaders) +
                        this.setColor(
                            (details.fromCache ?
                             '<br />' + $i18n('DBG_CACHE') : ''
                            ), 'red', 'lightYellow'
                        ) +
                        '</details>'
                });
            }
        }).bind(this),
        {urls: ['<all_urls>'], tabId: tab.id},
        ['responseHeaders']
    );
};

Debugger.prototype.openDetails = function (isOpen) {
    var det = $$('#dbg_info details');

    for (var i = 0; i < det.length; i++) {
        det[i].open = isOpen;
    }
};

Debugger.prototype.export = function () {
    var date = new Date();
    var filename = 'Redirector_' +
        date.toISOString().substring(0, 10) + '_' +
        date.toLocaleTimeString() + '.dbg';

    $f.writeFile(filename, $('dbg_info').innerHTML);
};

Debugger.prototype.chkInnerHtml = function (html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Pass1: check elements shall not appear
    var insec = tmp.querySelectorAll(
        '*:not(details):not(summary):not(dl):not(dt):not(dd)' +
            ':not(span):not(br):not(hr)'
    );

    if (insec.length > 0) {
        $f.err($i18n('DBG_INSEC_FILE'));
        return false;
    }

    // Pass2: check attributes shall not appear
    // Preparation: remove id=req_xxxx
    var parag = tmp.querySelectorAll('[id^=req_]');
    var len = parag.length;
    for (var i = 0; i < len; i++) {
        tmp.removeChild(parag[i]);
    }

    var all = tmp.querySelectorAll('*');

    var length = all.length;
    for (var i = 0; i < length; i++) {
        var attrib = all[i].attributes;
        if (attrib.length > 1 ||
            attrib.length === 1 && attrib[0].name !== 'style') {
            // Shall contain no attrib or only a 'style' attrib
            $f.err($i18n('DBG_INSEC_FILE'));
            return false;
        }
    }

    return true;
};

Debugger.prototype.import = function () {
    var files = $('dbg_importFile').files;

    if (files.length === 0) {   // No input file
        $f.err($i18n('BAK_NO_INPUT_FILE'));
        return;
    } else {
        var file = files[0];
    }

    $f.readFile(file, (function (data) {
        if (this.chkInnerHtml(data) !== true) {
            return;
        }

        try {
            $('dbg_info').innerHTML = data;
        } catch (e) {
            $f.err($i18n('DBG_IMPORT_ERR'));
        }
    }).bind(this));
};