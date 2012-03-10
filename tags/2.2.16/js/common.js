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
/*global $: true, $$: true, $v: true, $f: true*/
/*global chrome: true*/

Object.prototype.merge = function (src) { // Merge obj from src
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            this[prop] = src[prop];
        }
    }
    return this;
};

Element.prototype.mouseClick = function () {
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    this.dispatchEvent(e);
}

function $(id) {                // Id selector
    return document.getElementById(id);
}

function $$() {                 // CSS-like selector
    return document.querySelectorAll.apply(document, arguments);
}

$v = {type: {}};                        // Global values set
$f = {};                                // Global functions set

$v.debug = true;                // Global debug symbol
// $v.debug = false;

$v.type.regexp = 0;
$v.type.glob = 1;
$v.type.manual = $v.type.block = 2;
$v.type.hdr = 3;

$f.dbg = function (msg) {
    if ($v.debug === true) {
        chrome.extension.getBackgroundPage().console.log('DBG>', msg);
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

$f.iNotif = function (innerHTML) {
    $('layerNotif_disp').innerHTML = innerHTML;
    $('layerNotif').className = 'active';
};

$f.notif = function (innerHTML) { // Green
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#6f6';
};

$f.warn = function (innerHTML) { // Yellow
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#ff6';
};

$f.err = function (innerHTML) { // Orange
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#f60';
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
     * `file' can also be of type File
     */
    // file: filename (in user's download dir); content: string

    var link = document.createElement('a'); // Tmp link
    link.href = 'data:text/x-download;charset=utf-8,' + content;
    link.download = file;
    link.mouseClick();          // Simulate mouse click to download
}