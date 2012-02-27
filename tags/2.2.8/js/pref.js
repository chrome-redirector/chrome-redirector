/**
 * Preferences obj
 */

/*global $: true, localStorage: true, ext_bg: true */

function Pref() {
    try {
        this.data = JSON.parse(localStorage.PREF);
    } catch (e) {
        this.data = {
            proto: {all: true},
            context: {link: true, page: true}
        };
    }

    var tmp = this.data.proto;
    if (tmp.hasOwnProperty('all')) {
        tmp.all = true;
    }

    try {
        $('pref_proto_all').checked = tmp.all;
        $('pref_proto_http').checked = tmp.http;
        $('pref_proto_https').checked = tmp.https;
        $('pref_proto_ftp').checked = tmp.ftp;
        $('pref_proto_file').checked = tmp.file;

        $('pref_proto_http').disabled =
            $('pref_proto_https').disabled =
            $('pref_proto_ftp').disabled =
            $('pref_proto_file').disabled =
            $('pref_proto_all').checked;
    } catch (e) {}

    try {
        $('pref_context_link').checked = this.data.context.link;
        $('pref_context_page').checked = this.data.context.page;
    } catch (e) {}
}

Pref.prototype.refresh = function () {
    localStorage.PREF = JSON.stringify(this.data);
    ext_bg.loadPref();
};

Pref.prototype.onChgProto = function (proto) {
    var tmp = this.data.proto;

    if (proto === 'all') {
        $('pref_proto_http').disabled =
            $('pref_proto_https').disabled =
            $('pref_proto_ftp').disabled =
            $('pref_proto_file').disabled =
            $('pref_proto_all').checked;
    }

    tmp[proto] =
        $('pref_proto_' + proto).checked;

    this.refresh();
};

Pref.prototype.onChgContext = function () {
    this.data.context.link = $('pref_context_link').checked;
    this.data.context.page = $('pref_context_page').checked;

    this.refresh();
    ext_bg.updateContext();
};