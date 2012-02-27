/**
 * Rule list obj
 */

/*jslint plusplus: false */
/*global $: true, document: true, window: true, localStorage: true,
  tmp: true,
  lang: true, ruleList: true, ext_bg: true,
  TYPE_REGEXP: true, TYPE_GLOB: true, TYPE_MANUAL: true,
  TYPE_BLOCK: true,
  err: true, notif: true, warn: true,
  xhrJson: true, verifyUrl: true, str2re: true, getRedirUrl: true */

function RuleList(init) {
    try {
        this.data = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        this.data = [];
    }

    if (init !== undefined) {
        return;
    }

    for (var i = 0; i < this.data.length; i++) {
        $('ruleListTable').insertRow(-1).innerHTML =
            '<td><input type="checkbox" /></td>' +
            '<td></td><td></td><td></td><td></td>';

        this.update(i);
    }

    this.loadBuiltin();
    this.chg = this.isNew = false;
}

RuleList.prototype.add = function () {
    this.data.push({
        name: 'Untitled',
        match: {str: ''},
        sub: {str: ''},
        repl: {str: ''}
    });

    $('ruleEdit_sel').selectedIndex = 0;

    this.sel = this.data.length - 1;
    $('ruleListTable').insertRow(-1).innerHTML =
        '<td><input type="checkbox" /></td>' +
        '<td></td><td></td><td></td><td></td>';

    this.isNew = true;
    this.edit();
};

RuleList.prototype.del = function () {
    if (! this.hasOwnProperty('sel')) {
        return;
    }

    this.data.splice(this.sel, 1);
    this.refresh();
    $('ruleListTable').deleteRow(this.sel + 1);

    this.sel = undefined;
};

RuleList.prototype.edit = function () {
    if (! this.hasOwnProperty('sel')) {
        return;
    }

    this.update(this.sel);

    $('layerBack').style.display = "block";
    $('layerFront').style.display = "block";
//    scroll(0, 0);
};

// Make multiple updates according to idx (rule obj or rule num)
RuleList.prototype.update = function (idx) {
    var rule, row;
    if (typeof idx === 'object') { // idx may be a rule obj specified
        rule = idx;
        row = $('ruleListTable').getElementsByTagName('tr')[
            this.sel + 1].children;
    } else {
        if (this.data.length === 0) {
            return;
        }

        rule = this.data[idx];
        row = $('ruleListTable').getElementsByTagName('tr')[
            parseInt(idx, 10) + 1].children;
    }

    row[0].children[0].checked = rule.enabled;
    row[1].innerText = $('ruleEdit_name').value = rule.name;
    row[2].innerText = $('ruleEdit_matchstr').value = rule.match.str;
    row[3].innerText = $('ruleEdit_substr').value = rule.sub.str;
    row[4].innerText = $('ruleEdit_repl').value = rule.repl.str;

    $('ruleEdit_matchstr').disabled = TYPE_MANUAL ===
        ($('ruleEdit_matchtype').selectedIndex = rule.match.type);
    if (rule.match.hasOwnProperty('modi')) {
        $('ruleEdit_matchcase').checked = rule.match.modi;
    }

    $('ruleEdit_substr').disabled = TYPE_BLOCK ===
        ($('ruleEdit_subtype').selectedIndex = rule.sub.type);
    if (rule.sub.hasOwnProperty('modi')) {
        $('ruleEdit_subcase').checked = rule.sub.modi;
    }
    if (rule.sub.hasOwnProperty('modg')) {
        $('ruleEdit_subglob').checked = rule.sub.modg;
    }
    if (rule.repl.hasOwnProperty('decode') && rule.repl.decode) {
        $('ruleEdit_replDecode').checked = true;
    }

    this.onChgMatchType();
    this.onChgSubType();
};

// Actions when a row selected
RuleList.prototype.onSel = function (e) {
    var elem, isChk;

    // Decolor all cells
    tmp = $('ruleListTable').getElementsByClassName("sel-td");
    while (tmp.length > 0) {
        tmp[0].className = '';
    }

    // Get selected row (<tr>)
    if (e instanceof Object) {
        elem = e.srcElement;
        while (! /^tr$/i.test(elem.tagName)) {
            if (/^input$/i.test(elem.tagName)) {
                isChk = true;
            } else if (/^(th|body)$/i.test(elem.tagName)) {
                this.sel = undefined;
                return;
            }

            elem = elem.parentElement;
        }

        this.sel = elem.rowIndex - 1;
    } else {
        if (! this.hasOwnProperty('sel')) {
            return;
        }

        elem = $('ruleListTable').getElementsByTagName('tr')[
            this.sel + 1];
    }

    if (isChk) {
        this.data[this.sel].enabled ^= 1; // Toggle the bool value
        this.refresh();
        return;
    }

    // Color the selected cell
    for (var i = 0; i < elem.cells.length; i++) {
        elem.cells[i].className = "sel-td";
    }
};

RuleList.prototype.loadBuiltin = function (e) { // Load built-in rules
    try {
        this.builtinRule = xhrJson('/conf/rule.json');
    } catch (e) {
        this.builtinRule = [];
    }

    this.builtin = [];
    for (var i = 0; i < this.builtinRule.length; i++) {
        tmp = document.createElement('option');
        tmp.text = this.builtinRule[i].name;
        $('ruleEdit_sel').add(tmp, null);
        this.builtin.push(this.builtinRule[i]);
    }
};

// Actions when selected an built-in rule
RuleList.prototype.selBuiltin = function (e) {
    if ($('ruleEdit_sel').selectedIndex === 0) {
        this.update(this.sel); // Restore the current rule
    } else {
        this.update(
            this.builtin[
                parseInt($('ruleEdit_sel').selectedIndex, 10) - 1]);
    }
};

// Actions when match type changed
RuleList.prototype.onChgMatchType = function () {
    tmp = $('ruleEdit_matchstr').disabled =
        $('ruleEdit_matchcase').disabled =
        $('ruleEdit_matchtype').selectedIndex === TYPE_MANUAL;

    if (tmp === true) {
        $('ruleEdit_matchstr').value = 'MANUAL';
    } else if ($('ruleEdit_matchstr').value === 'MANUAL') {
        $('ruleEdit_matchstr').value = '';
    }
};

// Actions when sub type changed
RuleList.prototype.onChgSubType = function () {
    tmp = $('ruleEdit_substr').disabled =
        $('ruleEdit_subcase').disabled =
        $('ruleEdit_subglob').disabled =
        $('ruleEdit_repl').disabled =
        $('ruleEdit_replDecode').disabled =
        $('ruleEdit_subtype').selectedIndex === TYPE_BLOCK;

    if (tmp === true) {
        $('ruleEdit_substr').value = 'BLOCK';
        $('ruleEdit_repl').value = 'N/A';
    } else {
        if ($('ruleEdit_substr').value === 'BLOCK') {
            $('ruleEdit_substr').value = '';
        }
        if ($('ruleEdit_repl').value === 'N/A') {
            $('ruleEdit_repl').value = '';
        }
    }
};

RuleList.prototype.save = function () { // Save changes
    if ($('ruleEdit_name').value === '' ||
        $('ruleEdit_matchstr').value === '' ||
        $('ruleEdit_substr').value === '') {
        return;
    }

    this.data[this.sel].name = $('ruleEdit_name').value;
    this.data[this.sel].match = {
        str: $('ruleEdit_matchstr').value,
        type: $('ruleEdit_matchtype').selectedIndex,
        modi: $('ruleEdit_matchcase').checked
    };
    this.data[this.sel].sub = {
        str: $('ruleEdit_substr').value,
        type: $('ruleEdit_subtype').selectedIndex,
        modi: $('ruleEdit_subcase').checked,
        modg: $('ruleEdit_subglob').checked
    };
    this.data[this.sel].repl = {
        str: $('ruleEdit_repl').value,
        decode: $('ruleEdit_replDecode').checked
    };

    try {
        this.refresh();
    } catch (e) {
        err(lang.i18n['EXP-ERR']);
        return;
    }

    $('layerFront').style.display = "none";
    $('layerBack').style.display = "none";
    this.update(this.sel);
    this.chg = this.isNew = false;
};

RuleList.prototype.discard = function () { // Discard changes
    this.chg = false;

    if (this.isNew) {
        this.del();
        this.isNew = false;
    }

    $('layerFront').style.display = "none";
    $('layerBack').style.display = "none";
};

RuleList.prototype.test = function () { // Test the current rule
    var url, sub, repl, decode, result, innerHTML, t1, t2;

    if ($('ruleEdit_test').value === '' ||
        ! verifyUrl($('ruleEdit_test').value)) {
        return;
    }

    if ($('ruleEdit_matchtype').selectedIndex !== TYPE_MANUAL) {
        tmp = str2re({
            str: $('ruleEdit_matchstr').value,
            type: $('ruleEdit_matchtype').selectedIndex,
            modi: $('ruleEdit_matchcase').checked
        });

        if (! tmp.hasOwnProperty('global')) { // RegExp syntax error
            err(tmp.toString());
            return;
        }

        if (! tmp.test($('ruleEdit_test').value)) {
            err(lang.i18n['TEST-NOTMATCH']);
            return;
        }
    }

    if ($('ruleEdit_subtype').selectedIndex === TYPE_BLOCK) {
        notif(lang.i18n['TEST-BLOCK']);
        return;
    }

    // The test URL
    url = $('ruleEdit_test').value;
    sub = str2re({              // Substitute pattern
        str: $('ruleEdit_substr').value,
        type: $('ruleEdit_subtype').selectedIndex,
        modi: $('ruleEdit_subcase').checked,
        modg: $('ruleEdit_subglob').checked
    });
    if (! sub.hasOwnProperty('global')) { // RegExp syntax error
        err(sub.toString());
        return;
    }

    // Replacement
    repl = $('ruleEdit_repl').value;
    // Whether decode
    decode = $('ruleEdit_replDecode').checked;
    result = getRedirUrl(url, {           // Replace result
        sub: sub,
        repl: repl,
        decode: decode
    });

    if (! verifyUrl(result)) {  // Verify the result
        return;
    }

    // Colorizing the original URL
    tmp = getRedirUrl(url, {    // Mark substitute position
        sub: sub,
        repl: '\f$&\v',
        decode: decode
    });
    innerHTML = '<pre>' +
        tmp.split('').join('<wbr>').replace( // Force wrapping
            /\f/g, '<span style="color:red">'
        ).replace(/\v/g, '</span>') + '</pre>';

    // Insert the arrow
    innerHTML += '<div style="color:blue">&darr;</div>';

    // Colorizing the final URL
    tmp = getRedirUrl(url, { // Mark replacement position
        sub: sub,
        repl: '\f' + repl + '\v',
        decode: decode
    });
    innerHTML += '<pre>' +
        tmp.split('').join('<wbr>').replace( // Force wrapping
            /\f/g, '<span style="color:red">'
        ).replace(/\v/g, '</span>') + '</pre>';

    // Output
    notif(innerHTML);
};

RuleList.prototype.refresh = function () { // Refresh the rule list
    localStorage.RULELIST = JSON.stringify(ruleList.data);
    ext_bg.loadRule();
};

RuleList.prototype.move = function (inc) { // Change the priority
    if (! this.hasOwnProperty('sel')) {
        return;
    }

    if (this.sel + inc < 0 ||
        this.sel + inc >= this.data.length) {
        return;
    }

    var tmp = this.data[this.sel];
    this.data[this.sel] = this.data[this.sel + inc];
    this.data[this.sel + inc] = tmp;

    this.update(this.sel);
    this.update(this.sel += inc);

    this.onSel();

    this.refresh();
};

RuleList.prototype.bak = function () { // Backup rule list
    $('ruleMgr_bak').value = JSON.stringify(this.data);

    warn(lang.i18n['RULE-BAK']);
};

RuleList.prototype.restore = function () { // Restore rule list
    // Remove leading and trailing whitespaces
    tmp = $('ruleMgr_bak').value.replace(/^\s*/, '').replace(/\s*$/, '');

    if (tmp === '') {
        err(lang.i18n['RULE-RESTORE-EMPTY']);
        return;
    }

    try {
        this.data = JSON.parse(tmp);
    } catch (e) {
        err(lang.i18n['RULE-RESTORE-ERR']);
        return;
    }

    this.refresh();
    window.location.reload();
};
