/**
 * Common data
 */

TYPE_REGEXP = 0;
TYPE_GLOB = 1;
TYPE_MANUAL = TYPE_BLOCK = 2;

function DBG(msg) {
    chrome.extension.getBackgroundPage().console.log(msg);
}

Object.merge = function(dest, src) { // Merge obj src into dest
    for (var prop in src) {
        dest[prop] = src[prop];
    }

    return dest;
};

function str2re(proto) {        // Construct compiled regexp from str
    var str = proto.str;

    if (typeof proto.type !== 'undefined') {
        if (proto.type == TYPE_BLOCK) retrun;

        if (proto.type == TYPE_GLOB)
            str = glob2re(str);
    }

    mod='';
    if (typeof proto.modi != 'undefined' && proto.modi) mod += 'i';
    if (typeof proto.modg != 'undefined' && proto.modg) mod += 'g';

    var tmp = new RegExp(str, mod);
    tmp.compile(tmp);
    return tmp;
}

function glob2re(glob) {
    var escChar = '\\(){}[]^$.+*?|';
    var re = [];

    glob = glob.split('');
    for (var i in glob) {
        switch (glob[i]) {
        case '?':
            re.push("."); break;
        case '*':
            re.push(".*"); break;
        default:
            if (escChar.indexOf(glob[i]) >= 0)
                re.push("\\");
            re.push(glob[i]);
        }
    }

    return re.join('');
}