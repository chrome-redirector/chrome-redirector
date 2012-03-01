/**
 * Rule list obj
 */

/*jslint plusplus: false */
/*global $: true, $$: true,
  document: true, window: true, localStorage: true,
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
        this.data = [];         // Default to empty
    }

    if (init !== undefined) {   // No need to chg page
        return;
    }

    // Construct rules list
    for (var i = 0; i < this.data.length; i++) {
        $('ruleListTable').insertRow(-1).innerHTML =
            '<td><input type="checkbox" /></td>' +
            '<td></td><td></td><td></td><td></td>';

        this.update(i);         // Fillin data
    }

    this.loadBuiltin();         // Load builtin rules
    this.chg = this.isNew = false; // No new or changed rules
    this.sel = undefined;          // No rule selected
}

RuleList.prototype.add = function () { // Add a rule
    this.data.push({                   // Default empty rule
        name: 'Untitled',
        match: {str: '', type: TYPE_REGEXP, modi: false},
        sub: {str: '', type: TYPE_REGEXP, modi: false, modg: false},
        repl: {str: '', decode: false}
    });

    $('ruleEdit_sel').selectedIndex = 0; // Reset builtin selector

    this.sel = this.data.length - 1; // Select the last row
    $('ruleListTable').insertRow(-1).innerHTML =
        '<td><input type="checkbox" /></td>' +
        '<td></td><td></td><td></td><td></td>';

    this.isNew = true;          // It's a new rule
    this.edit();                // Edit the new rule
};

RuleList.prototype.del = function () { // Delete a rule
    this.data.splice(this.sel, 1); // Delete data
    this.refresh();
    $('ruleListTable').deleteRow(this.sel + 1); // Delete display

    this.sel = undefined;       // No rule selected
};

RuleList.prototype.edit = function () {
    this.update(this.sel);      // Fillin selected rule

    $('overlay').style.display = "block";
    $('layerFront').style.display = "block";
};

// Make multiple updates according to idx (rule obj or rule num)
RuleList.prototype.update = function (idx) {
    var rule, row;
    if (typeof idx === 'object') { // idx may be a rule obj specified
        rule = idx;
        row = $$('#ruleListTable tr')[this.sel + 1].children;
    } else {
        if (this.data.length === 0) { // No rule
            return;
        }
        // Current rule & row
        rule = this.data[idx];
        row = $$('#ruleListTable tr')[parseInt(idx, 10) + 1].children;
    }

    // Fillin info
    row[0].children[0].checked = rule.enabled;
    row[1].innerText = $('ruleEdit_name').value = rule.name;
    row[2].innerText = $('ruleEdit_matchstr').value = rule.match.str;
    row[3].innerText = $('ruleEdit_substr').value = rule.sub.str;
    row[4].innerText = $('ruleEdit_repl').value = rule.repl.str;

    $('ruleEdit_matchstr').disabled = TYPE_MANUAL ===
        ($('ruleEdit_matchtype').selectedIndex = rule.match.type);
    $('ruleEdit_matchcase').checked = rule.match.modi;

    // Disable substitution if substitution's type is manual
    $('ruleEdit_substr').disabled = TYPE_BLOCK ===
        ($('ruleEdit_subtype').selectedIndex = rule.sub.type);
    $('ruleEdit_subcase').checked = rule.sub.modi;
    $('ruleEdit_subglob').checked = rule.sub.modg;

    $('ruleEdit_replDecode').checked = rule.repl.decode; // Decode

    this.onChgMatchType();      // Manually trigger these events
    this.onChgSubType();
};

RuleList.prototype.onSel = function (e) { // On a row selected
    var elem, isChk;

    tmp = $$('#ruleListTable .sel-td');    // All selected cells
    for (var i = 0; i < tmp.length; i++) { // Decolor all cells
        tmp[i].className = '';
    }

    // Get selected row (<tr>...</tr>)
    if (e instanceof Object) {
        elem = e.srcElement;
        while (! /^tr$/i.test(elem.tagName)) { // Searching for <tr>
            if (/^input$/i.test(elem.tagName)) { // Clicked the chkbox
                isChk = true;
            } else if (/^(th|body)$/i.test(elem.tagName)) { // Outside
                this.sel = undefined;
                return;
            }

            elem = elem.parentElement; // Outer
        }

        this.sel = elem.rowIndex - 1; // Selected index
    } else {
        elem = $$('#ruleListTable tr')[this.sel + 1]; // Default
    }

    if (isChk) {                          // Checkbox clicked
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
        $('ruleEdit_sel').add(tmp, null); // Append to rule selector
        this.builtin.push(this.builtinRule[i]); // Append to record
    }
};

RuleList.prototype.selBuiltin = function (e) { // On click builtin rule
    if ($('ruleEdit_sel').selectedIndex === 0) {
        this.update(this.sel); // Restore the current rule
    } else {
        this.update(this.builtin[
            parseInt($('ruleEdit_sel').selectedIndex, 10) - 1]);
    }
};

RuleList.prototype.onChgMatchType = function () { // On chg match type
    // Disable several componets when select manual
    tmp = $('ruleEdit_matchstr').disabled =
        $('ruleEdit_matchcase').disabled =
        $$('#ruleEdit_subtype>option')[TYPE_BLOCK].disabled =
        $$('#ruleEdit_subtype>option')[TYPE_HDR].disabled =
        $('ruleEdit_matchtype').selectedIndex === TYPE_MANUAL;

    // Select manual -> match pattern = MANUAL;
    // Else and previous not manual, clear
    if (tmp === true) {
        $('ruleEdit_matchstr').value = 'MANUAL';

        if ($('ruleEdit_subtype').selectedIndex === TYPE_BLOCK ||
            $('ruleEdit_subtype').selectedIndex === TYPE_HDR) {
            $('ruleEdit_subtype').selectedIndex = TYPE_REGEXP;
        }
    } else if ($('ruleEdit_matchstr').value === 'MANUAL') {
        $('ruleEdit_matchstr').value = '';
    }
};

RuleList.prototype.onChgSubType = function () { // On chg sub type
    // Disable several componets when select block
    tmp = $('ruleEdit_substr').disabled =
        $('ruleEdit_subcase').disabled =
        $('ruleEdit_subglob').disabled =
        $('ruleEdit_repl').disabled =
        $('ruleEdit_replDecode').disabled =
        $('ruleEdit_subtype').selectedIndex === TYPE_BLOCK;

    // Beta-begin
    if (tmp === false) {        // Not block
        tmp = $('ruleEdit_subcase').disabled =
        $('ruleEdit_subglob').disabled =
        $('ruleEdit_replDecode').disabled =
        $('ruleEdit_subtype').selectedIndex === TYPE_HDR;

        if (tmp === true) {     // combine next if statement, this should be ommitted
            return;
        }
    }
    // Beta-end

    // Select block -> sub pattern = BLOCK;
    // Else and previous not block, clear
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
    // Return when empty
    if ($('ruleEdit_name').value === '' ||
        $('ruleEdit_matchstr').value === '' ||
        $('ruleEdit_substr').value === '') {
        return;
    }

    // Name
    this.data[this.sel].name = $('ruleEdit_name').value;
    // Match
    this.data[this.sel].match = {
        str: $('ruleEdit_matchstr').value,
        type: $('ruleEdit_matchtype').selectedIndex,
        modi: $('ruleEdit_matchcase').checked
    };
    // Substitution
    this.data[this.sel].sub = {
        str: $('ruleEdit_substr').value,
        type: $('ruleEdit_subtype').selectedIndex,
        modi: $('ruleEdit_subcase').checked,
        modg: $('ruleEdit_subglob').checked
    };
    // Replacement
    this.data[this.sel].repl = {
        str: $('ruleEdit_repl').value,
        decode: $('ruleEdit_replDecode').checked
    };

    try {                       // Save & chk
        this.refresh();
    } catch (e) {
        err(lang.i18n['EXP_ERR']);
        return;
    }

    $('layerFront').style.display = "none";
    $('overlay').style.display = "none";
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
    $('overlay').style.display = "none";
};

RuleList.prototype.test = function () { // Test the current rule
    var url, sub, repl, decode, result, innerHTML, t1, t2;

    if ($('ruleEdit_test').value === '' ||
        ! verifyUrl($('ruleEdit_test').value)) { // Chk input
        return;
    }

    if ($('ruleEdit_matchtype').selectedIndex !== TYPE_MANUAL) {
        // Chk match
        tmp = str2re({
            str: $('ruleEdit_matchstr').value,
            type: $('ruleEdit_matchtype').selectedIndex,
            modi: $('ruleEdit_matchcase').checked
        });

        if (! tmp.hasOwnProperty('global')) { // RegExp syntax error
            err(tmp.toString());
            return;
        }

        if (! tmp.test($('ruleEdit_test').value)) { // Not match
            err(lang.i18n['TEST_NOTMATCH']);
            return;
        }
    }

    if ($('ruleEdit_subtype').selectedIndex === TYPE_BLOCK) {
        // To block
        notif(lang.i18n['TEST_BLOCK']);
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
    if (this.sel + inc < 0 ||
        this.sel + inc >= this.data.length) { // Move has limit
        return;
    }

    var tmp = this.data[this.sel]; // Swap data order
    this.data[this.sel] = this.data[this.sel + inc];
    this.data[this.sel + inc] = tmp;

    this.update(this.sel);
    this.update(this.sel += inc);

    this.onSel();

    this.refresh();
};

RuleList.prototype.bak = function () { // Backup rule list
    $('ruleMgr_bak').value = JSON.stringify(this.data);

    warn(lang.i18n['RULE_BAK']);
};

RuleList.prototype.restore = function () { // Restore rule list
    // Remove leading and trailing whitespaces
    tmp = $('ruleMgr_bak').value.replace(/^\s*/, '').replace(/\s*$/, '');

    if (tmp === '') {           // No input
        err(lang.i18n['RULE_RESTORE_EMPTY']);
        return;
    }

    try {                       // Restore & chk
        this.data = JSON.parse(tmp);
    } catch (e) {
        err(lang.i18n['RULE_RESTORE_ERR']);
        return;
    }

    this.refresh();
    window.location.reload();
};
