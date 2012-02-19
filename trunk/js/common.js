/**
 * Common data
 */

/*jslint browser: true, nomen: false, undef: false, vars: false */
/*global DEBUG: true,
  TYPE_REGEXP: true, TYPE_GLOB: true, TYPE_MANUAL: true */

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
    var escChar = '\\(){}[]^$.+*?|', re = [];

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

    return re.join('');
}

function str2re(proto) {        // Construct compiled regexp from str
    var str, mod;
    str = proto.str;

    if (typeof proto.type !== 'undefined') {
        if (proto.type === TYPE_BLOCK) retrun;

        if (proto.type === TYPE_GLOB) {
            str = glob2re(str);
        }
    }

    mod = '';
    if (typeof proto.modi !== 'undefined' && proto.modi) {
        mod += 'i';
    }
    if (typeof proto.modg !== 'undefined' && proto.modg) {
        mod += 'g';
    }

    tmp = new RegExp(str, mod);
    tmp.compile(tmp);
    return tmp;
}

function getRedirUrl(url, rule) {
    var tmp = url.replace(rule.sub, rule.repl);
    if (rule.decode) {
        tmp = decodeURIComponent(tmp);
    }

    return tmp;
}

function _notif(innerHTML) {
    layerNotif_disp.innerHTML = innerHTML;
    layerNotif.className = 'active';
}

function notif(innerHTML) {
    _notif(innerHTML);
    layerNotif.style.background = '#6f6'; // Green
}

function warn(innerHTML) {
    _notif(innerHTML);
    layerNotif.style.background = '#ff6'; // Yellow
}

function err(innerHTML) {
    _notif(innerHTML);
    layerNotif.style.background = '#f60'; // Orange
}