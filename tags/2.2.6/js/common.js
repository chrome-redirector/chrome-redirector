/**
 * Common data
 */

/*global chrome: true, document: true, tmp: true, DEBUG: true,
  TYPE_REGEXP: true, TYPE_GLOB: true, TYPE_MANUAL: true,
  TYPE_BLOCK: true,
  XMLHttpRequest: true */

DEBUG = true;                   // Global debug symbol
// DEBUG = false;

TYPE_REGEXP = 0;
TYPE_GLOB = 1;
TYPE_MANUAL = TYPE_BLOCK = 2;

function DBG(msg) {
    if (DEBUG) {
        chrome.extension.getBackgroundPage().console.log('DBG>', msg);
    }
}

Object.prototype.merge = function (src) { // Merge obj from src
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            this[prop] = src[prop];
        }
    }
};

function glob2re(glob) {
    var escChar = '(){}[]^$.+*?|', re = [];

    glob = glob.replace(/\\\\/g, '\0'); // \\ -> \0
    glob = glob.replace(/\\\*/g, '\f'); // \* -> \f
    glob = glob.replace(/\\\?/g, '\v'); // \? -> \v

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

    glob = glob.replace(/\0/g, '\\\\'); // \0 -> \\
    glob = glob.replace(/\f/g, '\\*');  // \f -> \*
    glob = glob.replace(/\v/g, '\\?');  // \v -> \?

    return re.join('');
}

function str2re(proto) {        // Construct compiled regexp from str
    var str, mod;
    str = proto.str;

    if (proto.hasOwnProperty('type')) {
        if (proto.type === TYPE_BLOCK) {
            return;
        }

        if (proto.type === TYPE_GLOB) {
            str = glob2re(str);
        }
    }

    mod = '';
    if (proto.hasOwnProperty('modi') && proto.modi) {
        mod += 'i';
    }
    if (proto.hasOwnProperty('modg') && proto.modg) {
        mod += 'g';
    }

    try {
        tmp = new RegExp(str, mod);
        tmp.compile(tmp);
    } catch (e) {
        return e;
    }

    return tmp;
}

function getRedirUrl(url, rule) {
    var tmp = url.replace(rule.sub, rule.repl);
    if (rule.decode) {
        tmp = decodeURIComponent(tmp);
    }

    return tmp;
}

function iNotif(innerHTML) {
    document.getElementById('layerNotif_disp').innerHTML = innerHTML;
    document.getElementById('layerNotif').className = 'active';
}

function notif(innerHTML) {     // Green
    iNotif(innerHTML);
    document.getElementById('layerNotif').style.background = '#6f6';
}

function warn(innerHTML) {      // Yellow
    iNotif(innerHTML);
    document.getElementById('layerNotif').style.background = '#ff6';
}

function err(innerHTML) {       // Orange
    iNotif(innerHTML);
    document.getElementById('layerNotif').style.background = '#f60';
}

function xhrJson(file) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, false);
    xhr.send();
    return JSON.parse(xhr.responseText);
}