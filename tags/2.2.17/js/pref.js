/* Preferences obj.

   Copyright (C) 2010-2012.

   This file is part of Redirector.

   Redirector is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Redirector is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Redirector.  If not, see <http://www.gnu.org/licenses/>.

   From Cyril Feng. */

/*jslint browser: true, onevar: false, plusplus: false*/
/*global $: true, $$: true, $v: true, $f: true*/
/*global localStorage: true, Pref: true, Prompt: true*/

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

    // !Backward compatible, remove later!
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
    $v.ext_bg.loadPref();
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
    $v.ext_bg.onInit();
};

Pref.prototype.onChgContext = function () { // On manual setting chged
    this.data.context.link = $('pref_context_link').checked;
    this.data.context.page = $('pref_context_page').checked;

    this.refresh();
    $v.ext_bg.updateContext();
};

Pref.prototype.onChgPrompt = function () {
    if ((this.data.prompt = $('pref_prompt').checked) === true) {
        $v.prompt_name = new Prompt(
            'ruleEdit_name',
            $v.ruleList.builtinPrompt,
            $v.ruleList.selBuiltin.bind($v.ruleList));
        $v.prompt_match = new Prompt('ruleEdit_match', []);
        $v.prompt_sub = new Prompt('ruleEdit_sub', []);
        $v.prompt_repl = new Prompt('ruleEdit_repl', []);
        $v.prompt_test = new Prompt('ruleEdit_test', []);
    } else {
        try {
            $('ruleEdit_name').removeChild($('ruleEdit_nameprompt'));
            delete $v.prompt_name;
            $('ruleEdit_match').removeChild($('ruleEdit_matchprompt'));
            delete $v.prompt_match;
            $('ruleEdit_sub').removeChild($('ruleEdit_subprompt'));
            delete $v.prompt_sub;
            $('ruleEdit_repl').removeChild($('ruleEdit_replprompt'));
            delete $v.prompt_repl;
            $('ruleEdit_test').removeChild($('ruleEdit_testprompt'));
            delete $v.prompt_test;
        } catch (e) {}
    }

    this.refresh();
};