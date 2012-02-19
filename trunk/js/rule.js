/**
 * Rule list obj
 */

/*jslint plusplus: false, undef: false */
/*global localStorage: true */

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
        ruleListTable.insertRow(-1).innerHTML =
            '<td><input type="checkbox" /></td>' +
            '<td></td><td></td><td></td><td></td>';

        this.update(i);
    }

    this.updateBuiltin();
    this.chg = this.isNew = false;
}

RuleList.prototype.add = function () {
    this.data.push({
        name: 'Untitled',
        match: {str: ''},
        sub: {str: ''},
        repl: {str: ''}
    });

    ruleEdit_sel.selectedIndex = 0;

    this.sel = this.data.length - 1;
    ruleListTable.insertRow(-1).innerHTML =
        '<td><input type="checkbox" /></td>' +
        '<td></td><td></td><td></td><td></td>';

    this.isNew = true;
    this.edit();
};

RuleList.prototype.del = function () {
    if (typeof this.sel === 'undefined') {
        return;
    }

    this.data.splice(this.sel, 1);
    this.refresh();
    ruleListTable.deleteRow(this.sel + 1);

    this.sel = undefined;
};

RuleList.prototype.edit = function () {
    if (typeof this.sel === 'undefined') {
        return;
    }

    this.update(this.sel);

    layerBack.style.display = "block";
    layerFront.style.display = "block";
    scroll(0, 0);

    try {                       // A better way?
        tmp = ruleEdit.children;
        for (var i = 0; i < tmp.length; i++) {
            tmp[i].removeAttribute('title');
        }
    } catch (e) {}
};

RuleList.prototype.update = function (idx) { // idx can also be an obj
    var rule, row;
    if (typeof idx === 'object') {
        rule = idx;
        row = ruleListTable.getElementsByTagName('tr')[
            this.sel + 1].children;
    } else {
        if (this.data.length === 0) {
            return;
        }

        rule = this.data[idx];
        row = ruleListTable.getElementsByTagName('tr')[
            parseInt(idx, 10) + 1].children;
    }

    row[0].children[0].checked = rule.enabled;
    row[1].innerText = ruleEdit_name.value = rule.name;
    row[2].innerText = ruleEdit_matchstr.value = rule.match.str;
    row[3].innerText = ruleEdit_substr.value = rule.sub.str;
    row[4].innerText = ruleEdit_repl.value = rule.repl.str;

    ruleEdit_matchstr.disabled = TYPE_MANUAL ===
        (ruleEdit_matchtype.selectedIndex = rule.match.type);
    if (typeof rule.match.modi !== 'undefined') {
        ruleEdit_matchcase.checked = rule.match.modi;
    }

    ruleEdit_substr.disabled = TYPE_BLOCK ===
        (ruleEdit_subtype.selectedIndex = rule.sub.type);
    if (typeof rule.sub.modi !== 'undefined') {
        ruleEdit_subcase.checked = rule.sub.modi;
    }
    if (typeof rule.sub.modg !== 'undefined') {
        ruleEdit_subglob.checked = rule.sub.modg;
    }
    if (typeof rule.repl.decode !== 'undefined' && rule.repl.decode) {
        ruleEdit_replDecode.checked = true;
    }

    this.onChgMatchType();
    this.onChgSubType();
};

RuleList.prototype.onSel = function (e) {
    var elem, isChk;

    // Decolor all cells
    tmp = ruleListTable.getElementsByClassName("sel-td");
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
        if (typeof this.sel === 'undefined') {
            return;
        }

        elem =
            ruleListTable.getElementsByTagName('tr')[this.sel + 1];
    }

    if (isChk) {
        this.data[this.sel].enabled ^= true; // Toggle the bool value
        this.refresh();
        return;
    }

    // Color the selected cell
    for (var i = 0; i < elem.cells.length; i++) {
        elem.cells[i].className = "sel-td";
    }
};

RuleList.prototype.updateBuiltin = function (e) { // Update builtin
    this.builtin = [];

    for (var i = 0; i < this.builtinRule.length; i++) {
        tmp = document.createElement('option');
        tmp.text = this.builtinRule[i].name;
        ruleEdit_sel.add(tmp, null);
        this.builtin.push(this.builtinRule[i]);
    }
};

RuleList.prototype.selBuiltin = function (e) { // Built-in rules
    if (ruleEdit_sel.selectedIndex === 0) {
        this.update(this.sel); // Restore the current rule
    } else {
        this.update(
            this.builtin[
                parseInt(ruleEdit_sel.selectedIndex, 10) - 1]);
    }
};

RuleList.prototype.onChgMatchType = function () {
    tmp = ruleEdit_matchstr.disabled = ruleEdit_matchcase.disabled =
        ruleEdit_matchtype.selectedIndex === TYPE_MANUAL;
    if (tmp === true) {
        ruleEdit_matchstr.value = 'MANUAL';
    } else if (ruleEdit_matchstr.value === 'MANUAL') {
        ruleEdit_matchstr.value = '';
    }
};

RuleList.prototype.onChgSubType = function () {
    tmp = ruleEdit_substr.disabled = ruleEdit_subcase.disabled =
        ruleEdit_subglob.disabled =
        ruleEdit_repl.disabled = ruleEdit_replDecode.disabled =
        ruleEdit_subtype.selectedIndex === TYPE_BLOCK;
    if (tmp === true) {
        ruleEdit_substr.value = 'BLOCK';
        ruleEdit_repl.value = 'N/A';
    } else {
        if (ruleEdit_substr.value === 'BLOCK') {
            ruleEdit_substr.value = '';
        }
        if (ruleEdit_repl.value === 'N/A') {
            ruleEdit_repl.value = '';
        }
    }
};

RuleList.prototype.save = function () {
    if (ruleEdit_name.value === '' ||
        ruleEdit_matchstr.value === '' ||
        ruleEdit_substr.value === '') {return;}

    this.data[this.sel].name = ruleEdit_name.value;
    this.data[this.sel].match = {
        str: ruleEdit_matchstr.value,
        type: ruleEdit_matchtype.selectedIndex,
        modi: ruleEdit_matchcase.checked
    };
    this.data[this.sel].sub = {
        str: ruleEdit_substr.value,
        type: ruleEdit_subtype.selectedIndex,
        modi: ruleEdit_subcase.checked,
        modg: ruleEdit_subglob.checked
    };
    this.data[this.sel].repl = {
        str: ruleEdit_repl.value,
        decode: ruleEdit_replDecode.checked
    };

    try {
        this.refresh();
    } catch (e) {
        err(lang.notif['EXP-ERR']);
        return;
    }

    layerFront.style.display = "none";
    layerBack.style.display = "none";
    this.update(this.sel);
    this.chg = this.isNew = false;
};

RuleList.prototype.discard = function () {
    this.chg = false;

    if (this.isNew) {
        this.del();
        this.isNew = false;
    }

    layerFront.style.display = "none";
    layerBack.style.display = "none";
};

RuleList.prototype.test = function () {
    var url, sub, repl, decode, result,
    matchArr, unmatchArr, innerHTML;

    if (ruleEdit_test.value === '' ||
        ! verifyUrl(ruleEdit_test.value)) {return;}

    if (ruleEdit_matchtype.selectedIndex !== TYPE_MANUAL) {
        tmp = str2re({
            str: ruleEdit_matchstr.value,
            type: ruleEdit_matchtype.selectedIndex,
            modi: ruleEdit_matchcase.checked
        });
        if (! tmp.test(ruleEdit_test.value)) {
            err(lang.notif['TEST-NOTMATCH']);
            return;
        }
    }

    if (ruleEdit_subtype.selectedIndex === TYPE_BLOCK) {
        notif(lang.notif['TEST-BLOCK']);
        return;
    }

    url = ruleEdit_test.value;  // The test URL
    sub = str2re({              // Substitute pattern
        str: ruleEdit_substr.value,
        type: ruleEdit_subtype.selectedIndex,
        modi: ruleEdit_subcase.checked,
        modg: ruleEdit_subglob.checked
    });
    repl = ruleEdit_repl.value; // Replacement
    decode = ruleEdit_replDecode.checked; // Whether decode
    result = getRedirUrl(url, {           // Replace result
        sub: sub,
        repl: repl,
        decode: decode
    });

    if (! verifyUrl(result)) {  // Verify the result
        return;
    }

    // Colorizing the original URL
    tmp = getRedirUrl(url, { // Replace result
        sub: sub,
        repl: '\f$&\v',
        decode: decode
    });
    innerHTML = '<pre>' +
        tmp.split('').join('<wbr>').replace(
            '\f', '<span style="color:red">'
        ).replace('\v', '</span>') + '</pre>';

    // The arrow
    innerHTML += '<div style=' +
        '"color:magenta;-webkit-transform:rotate(90deg)">=></div>';

    // Colorizing the final URL
    tmp = getRedirUrl(url, { // Replace result
        sub: sub,
        repl: '\f' + repl + '\v',
        decode: decode
    });
    innerHTML += '<pre>' +
        tmp.split('').join('<wbr>').replace(
            '\f', '<span style="color:red">'
        ).replace('\v', '</span>') + '</pre>';

    // Output
    notif(innerHTML);
};

RuleList.prototype.refresh = function () {
    localStorage.RULELIST = JSON.stringify(ruleList.data);
    ext_bg.updateRule();
};

RuleList.prototype.move = function (inc) {
    if (typeof this.sel === 'undefined') {return;}

    if (this.sel + inc < 0 ||
        this.sel + inc >= this.data.length) {return;}

    var tmp = this.data[this.sel];
    this.data[this.sel] = this.data[this.sel + inc];
    this.data[this.sel + inc] = tmp;

    this.update(this.sel);
    this.update(this.sel += inc);

    this.onSel();

    this.refresh();
};

RuleList.prototype.bak = function () {
    ruleMgr_bak.value = JSON.stringify(this.data);

    warn(lang.notif['RULE-BAK']);
};

RuleList.prototype.restore = function () {
    // Remove leading and trailing whitespaces
    tmp = ruleMgr_bak.value.replace(/^\s*/, '').replace(/\s*$/, '');

    if (tmp === '') {
        err(lang.notif['RULE-RESTORE-EMPTY']);
        return;
    }

    try {
        this.data = JSON.parse(tmp);
    } catch (e) {
        err(lang.notif['RULE-RESTORE-ERR']);
        return;
    }

    this.refresh();
    window.location.reload();
};

RuleList.prototype.builtinRule = [
    // Todo: Tiny DNS Spool
    {
        name: 'SixXS.org IPv6->IPv4 Proxy',
        match: {str: 'MANUAL', type: TYPE_MANUAL},
        sub: {str: '[^\\.]+[^/]+', type: TYPE_REGEXP},
        repl: {str: '$&.sixxs.org'}
    },

    {
        name: 'Enforce Google Cache Text-only Version',
        match: {
            str: '^http://webcache\\.googleusercontent\\.com/',
            type: TYPE_REGEXP
        },
        sub: {str: '$', type: TYPE_REGEXP},
        repl: {str: '&strip=1'}
    },

    {
        name: 'http://code.google.com/* => https://code.google.com/*',
        match: {
            str: '^http://code\\.google\\.com/',
            type: TYPE_REGEXP,
            modi: true
        },
        sub: {str: '^http', type: TYPE_REGEXP},
        repl: {str: 'https'}
    },

    {
        name: 'Skip Google Redirection (Encoded or not)',
        match: {
            str: '^https?://www\\.google\\.com(\\.[a-z]+)?/url\\?sa=t',
            type: TYPE_REGEXP,
            modi: true
        },
        sub: {str: '.+?&url=.*?(http[^&]+).*', type: TYPE_REGEXP},
        repl: {str: '$1', decode: true}
    },

    {
        name: 'Skip Redirection by foo.com',
        match: {
            str: '^http://foo\\.com/\\?redirectTo=',
            type: TYPE_REGEXP,
            modi: true
        },
        sub: {
            str: '^[^\\?]+\\?redirectTo=',
            type: TYPE_REGEXP,
            modi: true
        },
        repl: {str: ''}
    },

    {
        name: '强制使用简体中文浏览zh.wikipedia.org',
        match: {
            str: 'http://zh\\.wikipedia\\.org/(?!zh-cn)',
            type: TYPE_REGEXP,
            modi: true
        },
        sub: {
            str: '(^[^\\.]+[^/]+)/[^/]*',
            type: TYPE_REGEXP,
            modi: true
        },
        repl: {str: '$1/zh-cn'}
    },

    {
        name: 'URL Alias (alias shoud be URL-like with valid TLD)',
        match : {
            str: '^http://a\\.cn/$',
            type: TYPE_REGEXP,
            modi: true
        },
        sub: {str: '.*', type: TYPE_REGEXP},
        repl: {str: 'http://this.is/quite/a/long/url'}
    }
];