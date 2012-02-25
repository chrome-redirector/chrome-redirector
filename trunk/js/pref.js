/**
 * Preferences obj
 */

/*global document: true, localStorage: true, ext_bg: true */

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
        document.getElementById('pref_proto_all').checked = tmp.all;
        document.getElementById('pref_proto_http').checked = tmp.http;
        document.getElementById('pref_proto_https').checked =
            tmp.https;
        document.getElementById('pref_proto_ftp').checked = tmp.ftp;
        document.getElementById('pref_proto_file').checked = tmp.file;

        document.getElementById('pref_proto_http').disabled =
            document.getElementById('pref_proto_https').disabled =
            document.getElementById('pref_proto_ftp').disabled =
            document.getElementById('pref_proto_file').disabled =
            document.getElementById('pref_proto_all').checked;
    } catch (e) {}

    try {
        document.getElementById('pref_context_link').checked =
            this.data.context.link;
        document.getElementById('pref_context_page').checked =
            this.data.context.page;
    } catch (e) {}
}

Pref.prototype.refresh = function () {
    localStorage.PREF = JSON.stringify(this.data);
    ext_bg.loadPref();
};

Pref.prototype.onChgProto = function (proto) {
    var tmp = this.data.proto;

    if (proto === 'all') {
        document.getElementById('pref_proto_http').disabled =
            document.getElementById('pref_proto_https').disabled =
            document.getElementById('pref_proto_ftp').disabled =
            document.getElementById('pref_proto_file').disabled =
            document.getElementById('pref_proto_all').checked;
    }

    tmp[proto] =
        document.getElementById('pref_proto_' + proto).checked;

    this.refresh();
};

Pref.prototype.onChgContext = function () {
    this.data.context.link =
        document.getElementById('pref_context_link').checked;
    this.data.context.page =
        document.getElementById('pref_context_page').checked;

    this.refresh();
    ext_bg.updateContext();
};