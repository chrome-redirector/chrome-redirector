/**
 * Preferences obj
 */

function _Pref() {
    try {
        this.data = JSON.parse(localStorage._PREF);
    } catch (e) {
        this.data = {
            proto: {all: true}
        };
    }

    var tmp = this.data.proto;
    if (typeof tmp.all == 'undefined') tmp.all = true;
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
}

_Pref.prototype.refresh = function() {
    localStorage._PREF = JSON.stringify(this.data);
    ext_bg.updatePref();
}

_Pref.prototype.chgProto = function(proto) {
    var tmp = this.data.proto;

    if (proto == 'all') {
        pref_proto_http.disabled = pref_proto_https.disabled =
            pref_proto_ftp.disabled = pref_proto_file.disabled =
            pref_proto_all.checked;
    }

    tmp[proto] =
        document.getElementById('pref_proto_' + proto).checked;

    this.refresh();
}

_Pref.prototype.chgIcon = function() { // Check to hide
    if (! (this.data.hideIcon = pref_misc_icon.checked)) {
        ext_bg.chrome.tabs.onCreated.addListener(ext_bg.showIcon);
        ext_bg.chrome.tabs.onUpdated.addListener(ext_bg.showIcon);
    }

    this.refresh();
}