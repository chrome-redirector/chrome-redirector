/**
 * Preferences obj
 */

/*global $: true, $$: true, localStorage: true, ext_bg: true */

function Pref() {               // Obj holds preferences data/method
    try {
        this.data = JSON.parse(localStorage.PREF);
    } catch (e) {
        this.data = {           // Default settings
            proto: {all: true},
            context: {link: true, page: true}
        };
    }

    var tmp = this.data.proto;  // Enabled protocols

    try {                       // Load protocols preferences to UI
        $('pref_proto_all').checked = tmp.all;
        $('pref_proto_http').checked = tmp.http;
        $('pref_proto_https').checked = tmp.https;
        $('pref_proto_ftp').checked = tmp.ftp;
        $('pref_proto_file').checked = tmp.file;
        // Disable other protocols if `all' is checked
        $('pref_proto_http').disabled =
            $('pref_proto_https').disabled =
            $('pref_proto_ftp').disabled =
            $('pref_proto_file').disabled =
            $('pref_proto_all').checked;
    } catch (e) {}

    try {                       // Load manual redirection pref to UI
        $('pref_context_link').checked = this.data.context.link;
        $('pref_context_page').checked = this.data.context.page;
    } catch (e) {}
}

Pref.prototype.refresh = function () { // Save & reload pref data
    localStorage.PREF = JSON.stringify(this.data);
    ext_bg.loadPref();
};

Pref.prototype.onChgProto = function (proto) { // On protocols changed
    var tmp = this.data.proto;

    if (proto === 'all') {      // Select `all' -> disable all others
        $('pref_proto_http').disabled =
            $('pref_proto_https').disabled =
            $('pref_proto_ftp').disabled =
            $('pref_proto_file').disabled =
            $('pref_proto_all').checked;
    }

    tmp[proto] = $('pref_proto_' + proto).checked; // Save the checked

    this.refresh();
};

Pref.prototype.onChgContext = function () { // On manual setting chged
    this.data.context.link = $('pref_context_link').checked;
    this.data.context.page = $('pref_context_page').checked;

    this.refresh();
    ext_bg.updateContext();
};