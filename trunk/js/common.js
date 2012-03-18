/* Common data.

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
/*global chrome: true*/

Element.prototype.mouseClick = function () {
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    this.dispatchEvent(e);
}

$ = function (id) {                // Id selector
    return document.getElementById(id);
};

$$ = function () {                 // CSS-like selector
    return document.querySelectorAll.apply(document, arguments);
};

$i18n = function (msg) {
    return chrome.i18n.getMessage(msg);
};

$v = {type: {}};                        // Global values set
$f = {};                                // Global functions set

$v.type.regexp = 0;
$v.type.glob = 1;
$v.type.manual = $v.type.block = 2;
$v.type.reqHdr = 3;
$v.type.respHdr = 4;

$f.applyI18n = function () {
    var elem = $$('[i18n]');    // All elements need to be mod

    for (var i = 0; i < elem.length; i++) {
        var attr = elem[i].getAttribute('i18n').split(";");
        for (var j = 0; j < attr.length; j++) {
            var keyVal = attr[j].split(":"); // Key-value pair
            if (typeof keyVal[1] === 'undefined') {
                keyVal[1] = keyVal[0];
                keyVal[0] = 'textContent';
            }

            elem[i][keyVal[0]] = $i18n(keyVal[1]);
        }
    }
};

$f.splitVl = function (str) {
    str = str.replace(/\\\\/g, '\x00');
    str = str.replace(/\\\|/g, '\f');
    str = str.split(/\s*\|\s*/);
    str = str.join('\v');
    str = str.replace(/\f/g, '\\|');
    str = str.replace(/\0/g, '\\\\');
    return str.split('\v');
};

$f.glob2re = function (glob) {
    var escChar = '(){}[]^$.+*?|', re = [];

    glob = glob.replace(/\\\\/g, '\x00'); // \\ -> \0
    glob = glob.replace(/\\\*/g, '\f');   // \* -> \f
    glob = glob.replace(/\\\?/g, '\v');   // \? -> \v

    glob = glob.split('');
    for (var i = 0; i < glob.length; i++) {
        switch (glob[i]) {
        case '?':
            re.push(".");
            break;
        case '*':
            re.push(".*");
            break;
        default:
            if (escChar.indexOf(glob[i]) >= 0) {
                re.push("\\");
            }
            re.push(glob[i]);
        }
    }

    re = re.join('');
    re = re.replace(/\0/g, '\\\\'); // \0 -> \\
    re = re.replace(/\f/g, '\\*');  // \f -> \*
    re = re.replace(/\v/g, '\\?');  // \v -> \?

    return re;
};

$f.str2re = function (proto) {  // Construct compiled regexp from str
    var str = proto.str;

    if (proto.hasOwnProperty('type')) {
        if (proto.type === $v.type.block) {
            return;
        }

        if (proto.type === $v.type.glob) {
            str = $f.glob2re(str);
        }
    }

    var mod = '';
    if (proto.hasOwnProperty('modi') && proto.modi) {
        mod += 'i';
    }
    if (proto.hasOwnProperty('modg') && proto.modg) {
        mod += 'g';
    }

    try {
        var tmp = new RegExp(str, mod);
        tmp.compile(tmp);
    } catch (e) {
        return e;
    }

    return tmp;
};

$f.getRedirUrl = function (url, rule) {
    var tmp = url.replace(rule.sub, rule.repl);
    if (rule.decode) {
        tmp = decodeURIComponent(tmp);
    }

    return tmp;
};

$f.iNotif = function (innerHTML, color) {
    if (typeof $v.ext_bg !== 'undefined') {
        $('layerNotif_disp').innerHTML = innerHTML;
        $('layerNotif').className = 'active';
        $('layerNotif').style.background = color;
    } else {
        alert(JSON.stringify(innerHTML));
    }
};

$f.notif = function (innerHTML) { // Green
    $f.iNotif(innerHTML, '#6f6');
};

$f.warn = function (innerHTML) { // Yellow
    $f.iNotif(innerHTML, '#ff6');
};

$f.err = function (innerHTML) { // Orange
    $f.iNotif(innerHTML, '#f60');
};

$f.openOptions = function (search) {
    var views = chrome.extension.getViews();
    for (var i = 0; i < views.length; i++) {
        if (! (/\/html\/background.html$/).test(
            views[i].location.pathname)) {
            views[i].close();
        }
    }

    if (typeof search === 'undefined') {
        search = '';
    }

    chrome.tabs.create({
        url: chrome.extension.getURL('/html/options.html' + search)
    });
};

$f.readFile = function (file, callback) {
    if (typeof file === 'string') { // Path
        var xhr = new XMLHttpRequest();

        xhr.open('GET', file, false);
        xhr.send();

        return xhr.responseText;
    } else {                    // File Obj
        var reader = new FileReader();

        reader.onload = function (e) {
            callback(e.target.result);
        }

        reader.readAsText(file);
    }
};

$f.writeFile = function (file, content) {
    /* Add more features when WebKit support FileWriter interface of
     * HTML5 File API
     * Then `file' can also be of type File
     */
    // file: filename (in user's download dir); content: string

    var link = document.createElement('a'); // Tmp link
    link.href = 'data:text/x-download;charset=utf-8,' + content;
    link.download = file;
    link.mouseClick();          // Simulate mouse click to download
}