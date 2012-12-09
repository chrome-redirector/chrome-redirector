/* Rule list obj.

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
/*global $: true, $$: true, $v: true, $f: true, $i18n: true*/
/*global localStorage: true, RuleList: true*/

RuleList = function (noInit) {
    try {
        this.data = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        this.data = [];         // Default to empty
    }

    try {
        this.data.remoteRuleUrl = JSON.parse(localStorage.REMOTE);
    } catch (e) {}

    if (noInit === undefined) {   // No need to chg page
        this.init();
    }
};

RuleList.prototype.attachEventListener = function () {
    var that = this;

    [].forEach.call($$('#ruleListTable tr:not(:first-child)'), function (row) {
        row.ondblclick = function (e) { // Double click to edit
            that.edit();
            e.preventDefault();
            return false;
        };

        row.oncontextmenu = function (e) { // Context menu
            that.onSel(e);

            $('ruleContextMenu').style.marginLeft = e.pageX - 270 + 'px';
            $('ruleContextMenu').style.marginTop = e.pageY + 'px';
            $('ruleContextMenu').className = 'show';
            clearTimeout($('ruleContextMenu').timeOut);
            $('ruleContextMenu').timeOut = setTimeout(function () {
                $('ruleContextMenu').className = null;
            }, 1000);

            e.preventDefault();
            return false;
        };

        // Drag to change priority
        row.draggable = true;
        row.ondragstart = function (e) {
            that.onSel(e);
            that.dragClientY = e.pageY;
            that.dragValid = false;
            var canvas = $c('canvas');
            var img = $c('img');
            img.src = canvas.toDataURL();
            e.dataTransfer.setDragImage(img, -10, -10);
        };
        row.ondragenter = function (e) {
            if (that.dragValid !== true) {
                that.dragValid = true;
                return;
            }

            if (e.pageY > that.dragClientY) {
                that.move(1);
            } else {
                that.move(-1);
            }

            that.dragClientY = e.pageY;
        };
    });
};

RuleList.prototype.init = function () { // Initialize
    // Remove existing list
    var table = $('ruleListTable');
    var length = $$('#ruleListTable tr').length;
    for (var i = 1; i < length; i++) {
        table.deleteRow(-1);
    }

    // Construct rules list
    for (var i = 0; i < this.data.length; i++) {
        table.insertRow(-1).innerHTML =
            '<td><input type="checkbox" /></td>' +
            '<td></td><td></td><td></td><td></td>';

        this.update(i);         // Fillin data
    }
    this.attachEventListener();

    var url = this.data.remoteRuleUrl;
    $('ruleList-remote-url').value = url ? url : '';
    var num = $v.ext_bg.$v.remoteRules;
    num = num === undefined ? 0 : num.length;
    $('ruleList-remote-title').innerText = $i18n('RULELIST_REMOTE') +
        ' [' + num + ']';

    this.loadBuiltin();            // Load builtin rules
    this.chg = this.isNew = false; // No new or changed rules
    this.sel = undefined;          // No rule selected
};

RuleList.prototype.add = function () { // Add a rule
    this.data.push({                   // Default empty rule
        name: '',
        match: {str: '', type: $v.type.regexp, modi: false},
        sub: {str: '', type: $v.type.regexp, modi: false, modg: false},
        repl: {str: '', decode: false}
    });

    this.sel = this.data.length - 1; // Select the last row
    $('ruleListTable').insertRow(-1).innerHTML =
        '<td><input type="checkbox" /></td>' +
        '<td></td><td></td><td></td><td></td>';

    this.attachEventListener();
    this.isNew = true;          // It's a new rule
    this.edit();                // Edit the new rule
};

RuleList.prototype.del = function () { // Delete a rule
    if (this.sel === undefined || !confirm($i18n('RULELIST_DEL_RULE'))) {
        return;
    }

    this.data.splice(this.sel, 1);     // Delete data
    this.refresh(true);
    $('ruleListTable').deleteRow(this.sel + 1); // Delete display

    $('ruleContextMenu').className = null;

    if (this.data.length === 0) {
        this.sel = undefined;       // No rule selected
        return;
    } else if (this.data.length <= this.sel) {
        this.sel = this.data.length - 1;
    }

    this.onSel();
};

RuleList.prototype.edit = function () {
    this.update(this.sel);      // Fillin selected rule

    $('overlay').style.display = "block";
    $('layerFront').style.display = "block";
};

// Make multiple updates according to idx (rule obj or rule num)
RuleList.prototype.update = function (idx) {
    $('ruleContextMenu').className = null;

    if (typeof idx === 'object') { // idx may be a rule obj specified
        var rule = idx;
        var row = $$('#ruleListTable tr')[this.sel + 1].children;
    } else {
        if (this.data.length === 0) { // No rule
            return;
        }
        // Current rule & row
        var rule = this.data[idx];
        var row = $$('#ruleListTable tr')[parseInt(idx, 10) + 1].children;
    }

    // Fillin info
    row[0].children[0].checked = rule.enabled;
    row[1].innerText = $('ruleEdit_namestr').value = rule.name;
    row[2].innerText = $('ruleEdit_matchstr').value = rule.match.str;
    row[3].innerText = $('ruleEdit_substr').value = rule.sub.str;
    row[4].innerText = $('ruleEdit_replstr').value = rule.repl.str;

    $('ruleEdit_matchstr').disabled = $v.type.manual ===
        ($('ruleEdit_matchtype').selectedIndex = rule.match.type);
    $('ruleEdit_matchcase').checked = rule.match.modi;
    if (rule.match.content !== undefined) {
        [].forEach.call(
            $$('#ruleEdit_matchContentType input'),
            function (elem) {elem.checked = false;}
        );
        var num;
        rule.match.content.forEach(function (elem) {
            switch (elem) {
            case 'main_frame':
                num = 2;
                break;
            case 'sub_frame':
                num = 3;
                break;
            case 'stylesheet':
                num = 4;
                break;
            case 'script':
                num = 5;
                break;
            case 'image':
                num = 6;
                break;
            case 'object':
                num = 7;
                break;
            case 'xmlhttprequest':
                num = 8;
                break;
            case 'other':
                num = 9;
                break;
            }

            $$('#ruleEdit_matchContentType li:nth-child(' + num +
               ') input')[0].checked = true;
        });
    } else {
        [].forEach.call(
            $$('#ruleEdit_matchContentType input'),
            function (elem) {elem.checked = true;}
        );
    }

    // Disable substitution if substitution's type is block
    $('ruleEdit_substr').disabled = $v.type.block ===
        ($('ruleEdit_subtype').selectedIndex = rule.sub.type);
    $('ruleEdit_subcase').checked = rule.sub.modi;
    $('ruleEdit_subglob').checked = rule.sub.modg;

    $('ruleEdit_replDecode').checked = rule.repl.decode; // Decode

    this.onChgMatchType();      // Manually trigger these events
    this.onChgSubType();
};

RuleList.prototype.onSel = function (e) { // On a row selected
    $('ruleContextMenu').className = null;

    var tmp = $$('#ruleListTable .sel-td');    // All selected cells
    for (var i = 0; i < tmp.length; i++) { // Decolor all cells
        tmp[i].className = '';
    }

    // Get selected row (<tr>...</tr>)
    if (e instanceof Object) {
        var elem = e.srcElement;
        while (! /^tr$/i.test(elem.tagName)) {   // Searching for <tr>
            if (/^input$/i.test(elem.tagName)) { // Clicked the chkbox
                var isChk = true;
            } else if (/^(th|body)$/i.test(elem.tagName)) { // Outside
                if (elem !== $$('#ruleListTable th')[0]) {
                    this.sel = undefined;
                }
                return;
            }

            elem = elem.parentElement; // Outer
        }

        this.sel = elem.rowIndex - 1; // Selected index
    } else {
        if (this.sel === undefined) {
            return;
        }

        elem = $$('#ruleListTable tr')[this.sel + 1]; // Default
    }

    if (typeof isChk !== 'undefined' && isChk === true) { // Chkbox
        this.data[this.sel].enabled ^= 1; // Toggle the bool value
        this.refresh(true);
        return;
    }

    // Color the selected cell
    for (var i = 0; i < elem.cells.length; i++) {
        elem.cells[i].className = "sel-td";
    }
};

RuleList.prototype.loadBuiltin = function (e) { // Load built-in rules
    try {
        this.builtinRule = JSON.parse($f.readFile('/conf/rule.json'));
    } catch (e) {
        this.builtinRule = [];
    }

    this.builtin = [];
    this.builtinPrompt = [];
    for (var i = 0; i < this.builtinRule.length; i++) {
        this.builtin.push(this.builtinRule[i]); // Append to record
        this.builtinPrompt.push({
            msg: this.builtinRule[i].name,
            desc: ''
        });
    }
};

RuleList.prototype.selBuiltin = function (e) { // On choose builtin
    var links = $$('#ruleEdit_nameprompt li');
    var hovered =
        $$('#ruleEdit_nameprompt li:hover,' +
           '#ruleEdit_nameprompt li.selected')[0];

    for (var i = 0; i < links.length; i++) {
        if (links[i] === hovered) {
            this.update(this.builtin[i]);
            return;
        }
    }
};

RuleList.prototype.onChgMatchType = function () { // On chg match type
    // Disable several componets when select manual
    var tmp = $('ruleEdit_matchstr').disabled =
        $('ruleEdit_matchcase').disabled =
        $('ruleEdit_matchContent').disabled =
        $$('#ruleEdit_subtype>option')[$v.type.block].disabled =
        $$('#ruleEdit_subtype>option')[$v.type.reqHdr].disabled =
        $$('#ruleEdit_subtype>option')[$v.type.respHdr].disabled =
        $('ruleEdit_matchtype').selectedIndex === $v.type.manual;

    // Select manual -> match pattern = MANUAL;
    // Else and previous not manual, clear
    if (tmp === true) {
        $('ruleEdit_matchstr').value = 'MANUAL';
        $('ruleEdit_matchContentType').style.display = 'none';

        if ($('ruleEdit_subtype').selectedIndex === $v.type.block ||
            $('ruleEdit_subtype').selectedIndex === $v.type.reqHdr ||
            $('ruleEdit_subtype').selectedIndex === $v.type.respHdr) {
            $('ruleEdit_subtype').selectedIndex = $v.type.regexp;
        }
    } else {
        if ($('ruleEdit_matchstr').value === 'MANUAL') {
            $('ruleEdit_matchstr').value = '';
        }

        if (typeof $v.prompt_match !== 'undefined' &&
            $v.pref.data.prompt === true) {
            $v.prompt_match.refresh('ruleEdit_match');
        }
    }
};

RuleList.prototype.onChgSubType = function () { // On chg sub type
    // Disable several componets when select block
    var tmp = $('ruleEdit_substr').disabled =
        $('ruleEdit_subcase').disabled =
        $('ruleEdit_subglob').disabled =
        $('ruleEdit_replstr').disabled =
        $('ruleEdit_replDecode').disabled =
        $('ruleEdit_subtype').selectedIndex === $v.type.block;

    // Select block -> sub pattern = BLOCK;
    // Else and previous not block, clear
    if (tmp === true) {
        $('ruleEdit_substr').value = 'BLOCK';
        $('ruleEdit_replstr').value = 'N/A';
    } else {
        $('ruleEdit_subcase').disabled =
            $('ruleEdit_subglob').disabled =
            $('ruleEdit_replDecode').disabled =
            ($('ruleEdit_subtype').selectedIndex === $v.type.reqHdr ||
             $('ruleEdit_subtype').selectedIndex === $v.type.respHdr);

        if ($('ruleEdit_substr').value === 'BLOCK') {
            $('ruleEdit_substr').value = '';
        }
        if ($('ruleEdit_replstr').value === 'N/A') {
            $('ruleEdit_replstr').value = '';
        }
    }

    if (typeof $v.prompt_sub !== 'undefined' &&
        $v.pref.data.prompt === true) {
        $v.prompt_sub.refresh('ruleEdit_sub');
    }
};

RuleList.prototype.save = function () { // Save changes
    // Return when empty
    if ($('ruleEdit_namestr').value === '' ||
        $('ruleEdit_matchstr').value === '' ||
        $('ruleEdit_substr').value === '') {
        return;
    }

    // Name
    this.data[this.sel].name = $('ruleEdit_namestr').value;
    // Match
    var content = [];
    var obj = $$('#ruleEdit_matchContentType input:checked');
    outmost:
    for (var i = 0; i < obj.length; i++) {
        switch (parseInt(obj[i].id.substr(-1))) {
        case 1:
            content = undefined;
            break outmost;
        case 2:
            content.push('main_frame');
            break;
        case 3:
            content.push('sub_frame');
            break;
        case 4:
            content.push('stylesheet');
            break;
        case 5:
            content.push('script');
            break;
        case 6:
            content.push('image');
            break;
        case 7:
            content.push('object');
            break;
        case 8:
            content.push('xmlhttprequest');
            break;
        case 9:
            content.push('other');
            break;
        }
    }
    this.data[this.sel].match = {
        str: $('ruleEdit_matchstr').value,
        type: $('ruleEdit_matchtype').selectedIndex,
        modi: $('ruleEdit_matchcase').checked,
        content: content
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
        str: $('ruleEdit_replstr').value,
        decode: $('ruleEdit_replDecode').checked
    };

    if (this.refresh() !== true) {
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
        this.sel = undefined;
        this.isNew = false;
    }
    this.onSel();

    $('layerFront').style.display = "none";
    $('overlay').style.display = "none";
};

RuleList.prototype.test = function () { // Test the current rule
    if ($('ruleEdit_teststr').value === '' ||
        ! $f.verifyUrl($('ruleEdit_teststr').value)) { // Chk input
        return;
    }

    // Don't test substitution of type header
    if ($('ruleEdit_subtype').selectedIndex === $v.type.reqHdr ||
        $('ruleEdit_subtype').selectedIndex === $v.type.respHdr) {
        $f.err('Test for header manipulation is not supported yet!');
        return;
    }

    if ($('ruleEdit_matchtype').selectedIndex !== $v.type.manual) {
        // Chk match
        var tmp = $f.str2re({
            str: $('ruleEdit_matchstr').value,
            type: $('ruleEdit_matchtype').selectedIndex,
            modi: $('ruleEdit_matchcase').checked
        });

        if (! tmp.hasOwnProperty('global')) { // RegExp syntax error
            $f.err(tmp.toString());
            return;
        }

        if (! tmp.test($('ruleEdit_teststr').value)) { // Not match
            $f.err($i18n('TEST_MISMATCH'));
            return;
        }
    }

    if ($('ruleEdit_subtype').selectedIndex === $v.type.block) {
        // To block
        $f.notif($i18n('TEST_BLOCK'));
        return;
    }

    // The test URL
    var url = $('ruleEdit_teststr').value;
    var sub = $f.str2re({       // Substitute pattern
        str: $('ruleEdit_substr').value,
        type: $('ruleEdit_subtype').selectedIndex,
        modi: $('ruleEdit_subcase').checked,
        modg: $('ruleEdit_subglob').checked
    });
    if (! sub.hasOwnProperty('global')) { // RegExp syntax error
        $f.err(sub.toString());
        return;
    }

    // Replacement
    var repl = $('ruleEdit_replstr').value;
    // Whether decode
    var decode = $('ruleEdit_replDecode').checked;
    var result = $f.getRedirUrl(url, { // Replace result
        sub: sub,
        repl: repl,
        decode: decode
    });

    if (! $f.verifyUrl(result)) { // Verify the result
        return;
    }

    // Colorizing the original URL
    var tmp = $f.getRedirUrl(url, { // Mark substitute position
        sub: sub,
        repl: '\f$&\v',
        decode: decode
    });
    var innerHTML = '<pre>' +
        tmp.split('').join('<wbr>').replace( // Force wrapping
            /\f/g, '<span style="color:red">'
        ).replace(/\v/g, '</span>') + '</pre>';

    // Insert the arrow
    innerHTML += '<div style="color:blue">&darr;</div>';

    // Colorizing the final URL
    var tmp = $f.getRedirUrl(url, { // Mark replacement position
        sub: sub,
        repl: '\f' + repl + '\v',
        decode: decode
    });
    innerHTML += '<pre>' +
        tmp.split('').join('<wbr>').replace( // Force wrapping
            /\f/g, '<span style="color:red">'
        ).replace(/\v/g, '</span>') + '</pre>';

    // Output
    $f.notif(innerHTML);
};

RuleList.prototype.refresh = function (force) { // Refresh the list
    if (typeof force === 'undefined') {
        var tmp = $v.ext_bg.loadRule(
            [this.data[this.sel]]
        );                             // Dry run
        if (typeof tmp === 'string') { // Error occurred (Err str)
            $f.err(tmp);
            return;
        }
    }

    chrome.storage && chrome.storage.sync.set({
        RULELIST: this.data,
        REMOTE: this.data.remoteRuleUrl
    });
    localStorage.RULELIST = JSON.stringify(this.data);
    localStorage.REMOTE = JSON.stringify(this.data.remoteRuleUrl);
    if (typeof $v.ext_bg !== 'undefined') {
        $v.ext_bg.loadRule();
    } else {
        loadRule();
    }

    return true;
};

RuleList.prototype.move = function (inc) { // Change the priority
    if (this.sel === undefined ||
        this.sel + inc < 0 ||
        this.sel + inc >= this.data.length) { // Move has limit
        return false;
    }

    var tmp = this.data[this.sel]; // Swap data order
    this.data[this.sel] = this.data[this.sel + inc];
    this.data[this.sel + inc] = tmp;

    this.update(this.sel);
    this.update(this.sel += inc);

    this.onSel();

    this.refresh(true);
    return true;
};

RuleList.prototype.bak = function (single) { // Backup rule list
    if (typeof single === 'undefined') {
        var addition = 'All';
        var out = this.data;
    } else {
        if (typeof this.sel === 'undefined') {
            $f.err($i18n('BAK_NO_RULE'));
            return;
        }

        var addition = this.data[this.sel].name.replace(/\s+/g, '_');
        var out = [this.data[this.sel]];
    }

    var date = new Date();
    var filename = 'Redirector_' + addition + '_' +
        date.toLocaleString().replace(/\//g, '-').replace(/ /g, '_') +
        '.json';

    $f.writeFile(filename, JSON.stringify(out));
};

RuleList.prototype.restore = function (append, str) { // Restore rule list
    if (typeof str !== 'undefined') {
        return this.restoreData($f.readFile(str));
    } else {
        if (typeof append === 'undefined') {         // Override
            var files = $('ruleEdit_restoreFile').files;
        } else {                    // Append
            var files = $('ruleEdit_appendFile').files;
        }

        if (files.length === 0) {   // No input file
            $f.err($i18n('BAK_NO_INPUT_FILE'));
            return;
        } else {
            var file = files[0];
        }

        if (typeof append === 'undefined') {
            this.data = [];
        }

        $f.readFile(file, this.restoreData.bind(this));
    }
};

RuleList.prototype.restoreData = function (data) {
    try {
        var tmp = JSON.parse(data);

        this.data = this.data.concat(tmp);
        this.refresh(true);

        if (typeof $v.ext_bg !== 'undefined') {
            this.init();    // Re-construct table
        }
    } catch (e) {
        $f.err($i18n('BAK_RESTORE_ERR'));
        return false;
    }

    return true;
};

RuleList.prototype.updateRemoteRule = function (fromButton) {
    if (typeof fromButton !== undefined) {
        var url = $('ruleList-remote-url').value;

        if (url === undefined || !$f.verifyUrl(url)) {
            this.data.remoteRuleUrl = undefined;
        } else {
            this.data.remoteRuleUrl = url;
        }
    }

    this.refresh(true);
    setTimeout((function () {
        this.init();
    }).bind(this), 1500);
};

RuleList.prototype.removeRemoteRule = function () {
    $('ruleList-remote-url').value = '';
    this.data.remoteRuleUrl = undefined;
    this.refresh(true);
    this.init();
};