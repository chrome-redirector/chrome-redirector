/**
 * Common data
 */

TYPE_REGEXP = 0;
TYPE_GLOB = 1;
TYPE_MANUAL = TYPE_BLOCK = 2;
TYPE_REGEXPI = 3;
TYPE_GLOBI = 4;
TYPE_REGEXPG = 5;
TYPE_GLOBG = 6;
TYPE_REGEXPIG = 7;
TYPE_GLOBIG = 8;

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

        if (proto.type == TYPE_GLOB || proto.type == TYPE_GLOBI ||
            proto.type == TYPE_GLOBG || proto.type == TYPE_GLOBIG)
            str = glob2re(str);
    }

    switch (proto.type) {
    case TYPE_REGEXPI: case TYPE_GLOBI:
        mod = 'i'; break;
    case TYPE_REGEXPG: case TYPE_GLOBG:
        mod = 'g'; break;
    case TYPE_REGEXPIG: case TYPE_GLOBIG:
        mod = 'ig'; break;
    default:
        mod = '';
    }

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