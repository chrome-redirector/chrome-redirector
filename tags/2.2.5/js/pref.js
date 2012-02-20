/**
 * Preferences obj
 */

/*jslint undef: false */
/*global localStorage: true */

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
    if (typeof tmp.all === 'undefined') {
        tmp.all = true;
    }

    try {
        pref_proto_all.checked = tmp.all;
        pref_proto_http.checked = tmp.http;
        pref_proto_https.checked = tmp.https;
        pref_proto_ftp.checked = tmp.ftp;
        pref_proto_file.checked = tmp.file;

        pref_proto_http.disabled = pref_proto_https.disabled =
            pref_proto_ftp.disabled = pref_proto_file.disabled =
            pref_proto_all.checked;

        pref_misc_icon.checked = this.data.hideIcon;
    } catch (e) {}

    try {
        pref_context_link.checked = this.data.context.link;
        pref_context_page.checked = this.data.context.page;
    } catch (e) {}
}

Pref.prototype.refresh = function () {
    localStorage.PREF = JSON.stringify(this.data);
    ext_bg.updatePref();
};

Pref.prototype.chgProto = function (proto) {
    var tmp = this.data.proto;

    if (proto === 'all') {
        pref_proto_http.disabled = pref_proto_https.disabled =
            pref_proto_ftp.disabled = pref_proto_file.disabled =
            pref_proto_all.checked;
    }

    tmp[proto] =
        document.getElementById('pref_proto_' + proto).checked;

    this.refresh();
};

Pref.prototype.onChgContext = function () {
    this.data.context.link = pref_context_link.checked;
    this.data.context.page = pref_context_page.checked;

    this.refresh();
    ext_bg.updateContext();
};