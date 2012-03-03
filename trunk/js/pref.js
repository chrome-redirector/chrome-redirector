/**
 * Preferences obj
 */

/*global $: true, $$: true, $v: true, $f: true, tmp: true,
  Pref: true, localStorage: true*/

Pref = function () {            // Obj holds preferences data/method
    try {
        this.data = JSON.parse(localStorage.PREF);
    } catch (e) {
        this.data = {           // Default settings
            proto: {all: true},
            context: {link: true, page: true},
            prompt: true
        };
    }

    // !Backward compatible!
    if (typeof this.data.prompt === 'undefined') {
        this.data.prompt = true;
        this.refresh();
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

    try {                       // Load prompts pref to UI
        $('pref_prompt').checked = this.data.prompt;
    } catch (e) {}
};

Pref.prototype.refresh = function () { // Save & reload pref data
    localStorage.PREF = JSON.stringify(this.data);
    $v.ext_bg.$f.loadPref();
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
    $v.ext_bg.$f.updateContext();
};

Pref.prototype.onChgPrompt = function () {
    if (this.data.prompt = $('pref_prompt').checked === true) {
        $v.prompt_name = new Prompt(
            'ruleEdit_name',
            $v.ruleList.builtinPrompt,
            $v.ruleList.selBuiltin.bind($v.ruleList));
        $v.prompt_match = new Prompt('ruleEdit_match', 'regexp');
        $v.prompt_sub = new Prompt('ruleEdit_sub', 'regexp');
        $v.prompt_repl = new Prompt('ruleEdit_repl', 'repl');
        $v.prompt_test = new Prompt('ruleEdit_test', 'url');
    } else {
        delete $v.prompt_name;
        delete $v.prompt_match;
        delete $v.prompt_sub;
        delete $v.prompt_repl;
        delete $v.prompt_test;
    }

    this.refresh();
};