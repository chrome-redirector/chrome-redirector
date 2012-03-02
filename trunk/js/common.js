/**
 * Common data
 */

/*global $: true, $$: true, $v: true, $f: true, tmp: true,
  chrome: true, document: true, XMLHttpRequest: true */

Object.prototype.merge = function (src) { // Merge obj from src
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            this[prop] = src[prop];
        }
    }
};

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
// Beta-begin
$v.type.hdr = 3;
$f.splitVl = function (str) {
    str = str.replace(/\\\\/g, '\0');
    str = str.replace(/\\\|/g, '\f');
    str = str.split(/\s*\|\s*/);
    str = str.join('\v');
    str = str.replace(/\f/g, '\\|');
    str = str.replace(/\0/g, '\\\\');
    return str.split('\v');
};
// Beta-end

$f.dbg = function (msg) {
    if ($v.debug === true) {
        chrome.extension.getBackgroundPage().console.log('DBG>', msg);
    }
};

$f.glob2re = function (glob) {
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

    re = re.join('');
    re = re.replace(/\0/g, '\\\\'); // \0 -> \\
    re = re.replace(/\f/g, '\\*');  // \f -> \*
    re = re.replace(/\v/g, '\\?');  // \v -> \?

    return re;
};

$f.str2re = function (proto) {        // Construct compiled regexp from str
    var str, mod;
    str = proto.str;

    if (proto.hasOwnProperty('type')) {
        if (proto.type === $v.type.block) {
            return;
        }

        if (proto.type === $v.type.glob) {
            str = $f.glob2re(str);
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

$f.notif = function (innerHTML) {     // Green
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#6f6';
};

$f.warn = function (innerHTML) {      // Yellow
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#ff6';
};

$f.err = function (innerHTML) {       // Orange
    $f.iNotif(innerHTML);
    $('layerNotif').style.background = '#f60';
};

$f.xhrJson = function (file) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, false);
    xhr.send();
    return JSON.parse(xhr.responseText);
};