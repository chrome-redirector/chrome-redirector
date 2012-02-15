/**
 * Rule list obj
 */

function RuleList() {
    try {
        this.data = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        this.data = [];
    }

    for (var i in this.data) {
        ruleListTable.insertRow(-1).innerHTML =
            '<td><input type="checkbox" /></td>\
<td></td><td></td><td></td><td></td>';

        this.update(i);
    }

    this.chg = this.isNew = false;
}

RuleList.prototype.add = function() {
    this.data.push({
        name: 'Untitled', match: {str: ''}, sub: {str: ''}, repl: ''
    });

    ruleEdit_sel.selectedIndex = 0;

    this.sel = this.data.length - 1;
    ruleListTable.insertRow(-1).innerHTML =
        '<td><input type="checkbox" /></td>\
<td></td><td></td><td></td><td></td>';

    this.isNew = true;
    this.edit();
}

RuleList.prototype.del = function() {
    if (typeof this.sel == 'undefined') return;

    this.data.splice(this.sel, 1);
    this.refresh();
    ruleListTable.deleteRow(this.sel + 1);

    this.sel = undefined;
}

RuleList.prototype.edit = function() {
    if (typeof this.sel == 'undefined') return;

    this.update(this.sel);

    layerBack.style.display="block";
    layerFront.style.display="block";
    scroll(0,0);

    try {                       // A better way?
        tmp = ruleEdit.children;
        for (var i in tmp) tmp[i].removeAttribute('title');
    } catch (e) {}
}

RuleList.prototype.update = function(idx) {
    if (this.data.length == 0) return;

    var row = ruleListTable.getElementsByTagName('tr')[
        parseInt(idx) + 1].children;
    var rule = this.data[idx];

    row[0].children[0].checked = rule.enabled;
    row[1].innerText = ruleEdit_name.value = rule.name;
    row[2].innerText = ruleEdit_matchstr.value = rule.match.str;
    row[3].innerText = ruleEdit_substr.value = rule.sub.str;
    row[4].innerText = ruleEdit_repl.value = rule.repl;
    ruleEdit_matchstr.disabled = TYPE_MANUAL ==
        (ruleEdit_matchtype.selectedIndex = rule.match.type);
    ruleEdit_substr.disabled = TYPE_BLOCK ==
        (ruleEdit_subtype.selectedIndex = rule.sub.type);
}

RuleList.prototype.onSel = function(e) {
    // Decolor all cells
    var tmp = ruleListTable.getElementsByClassName("sel-td");
    while (tmp.length > 0) tmp[0].className = '';

    // Get selected row (<tr>)
    if (e instanceof Object) {
        var elem = e.srcElement;
        while (! /^tr$/i.test(elem.tagName)) {
            if (/^input$/i.test(elem.tagName)) {
                var isChk = true;
            } else if (/^(th|body)$/i.test(elem.tagName)) {
                this.sel = undefined;
                return;
            }

            elem = elem.parentElement;
        }

        this.sel = elem.rowIndex - 1;
    } else {
        if (typeof this.sel == 'undefined') return;

        var elem =
            ruleListTable.getElementsByTagName('tr')[this.sel + 1];
    }

    if (isChk) {
        this.data[this.sel].enabled ^= true;
        this.refresh();
        return;
    }

    // Color the selected cell
    for(var i in elem.cells) {
        elem.cells[i].className = "sel-td";
    }
}

RuleList.prototype.selBuiltin = function (e) { // Built-in rules
    // Todo: link decode, etc.
    var sixxs = {
        name: 'SixXS.org IPv6->IPv4 Proxy',
        match: {str: 'MANUAL', type: TYPE_MANUAL},
        sub: {str: '^[^\\.]*[^/]*'},
        repl: '$&.sixxs.org'
    };

    var gCacheText = {
        name: 'Google Cache Text-only Version',
        match: {str: '^http://webcache\\.googleusercontent\\.com/'},
        sub: {str: '$'},
        repl: '&strip=1'
    };

    switch(ruleEdit_sel.selectedIndex) {
    case 1:
        var rule = sixxs; break;
    case 2:
        var rule = gCacheText; break;
    default:
        // this.update(this.sel);
        console.log('Oops!');
        return;
    }

    // Copy rule content to edit form
    ruleEdit_name.value = rule.name;
    ruleEdit_matchstr.value = rule.match.str;
    ruleEdit_substr.value = rule.sub.str;
    ruleEdit_repl.value = rule.repl;

    ruleEdit_matchstr.disabled = TYPE_MANUAL ==
        (ruleEdit_matchtype.selectedIndex = rule.match.type);
    ruleEdit_substr.disabled = TYPE_BLOCK ==
        (ruleEdit_subtype.selectedIndex = rule.sub.type);
}

RuleList.prototype.onChgMatchType = function() {
    if (ruleEdit_matchstr.disabled =
        ruleEdit_matchtype.selectedIndex == 2)
        ruleEdit_matchstr.value = 'MANUAL';
    else if (ruleEdit_matchstr.value == 'MANUAL')
        ruleEdit_matchstr.value = '';
}

RuleList.prototype.onChgSubType = function() {
    if (ruleEdit_substr.disabled = ruleEdit_repl.disabled =
        ruleEdit_subtype.selectedIndex == 2) {
        ruleEdit_substr.value = 'BLOCK';
        ruleEdit_repl.value = 'N/A';
    } else {
        if (ruleEdit_substr.value == 'BLOCK')
            ruleEdit_substr.value = '';
        if (ruleEdit_repl.value == 'N/A')
            ruleEdit_repl.value = '';
    }
}

RuleList.prototype.save = function() {
    if (ruleEdit_name.value == '' || ruleEdit_matchstr.value == '' ||
        ruleEdit_substr.value == '') return;

    this.data[this.sel].name = ruleEdit_name.value;
    this.data[this.sel].match = {
        str: ruleEdit_matchstr.value,
        type: ruleEdit_matchtype.selectedIndex}; // Prob
    this.data[this.sel].sub = {
        str: ruleEdit_substr.value,
        type: ruleEdit_subtype.selectedIndex}; // Prob
    this.data[this.sel].repl = ruleEdit_repl.value;

    try {
        this.refresh();
    } catch (e) {
        alert(lang.notif['EXP-ERR']);
        return;
    }

    layerFront.style.display="none";
    layerBack.style.display="none";
    this.update(this.sel);
    this.chg = this.isNew = false;
}

RuleList.prototype.restore = function() {
    if (this.chg)
        if (! confirm(lang.notif['CONFIRM-DISCARD'])) return;

    this.chg = false;

    if (this.isNew) {
        this.del();
        this.isNew = false;
    }

    layerFront.style.display="none";
    layerBack.style.display="none";
}

RuleList.prototype.test = function() {
    if (ruleEdit_test.value == '') return;

    if (ruleEdit_matchtype.selectedIndex != TYPE_MANUAL) {
        var tmp = str2re({
            str: ruleEdit_matchstr.value,
            type: ruleEdit_matchtype.selectedIndex});
        if (! tmp.test(ruleEdit_test.value)) {
            alert(lang.notif['TEST-NOTMATCH']);
            return;
        }
    }

    if (ruleEdit_subtype.selectedIndex == TYPE_BLOCK) {
        alert(lang.notif['TEST-BLOCK']);
        return;
    }

    var tmp = str2re({
        str: ruleEdit_substr.value,
        type: ruleEdit_subtype.selectedIndex});
    alert(lang.notif['TEST-DEST'] +
          ruleEdit_test.value.replace(tmp, ruleEdit_repl.value));
}

RuleList.prototype.refresh = function() {
    localStorage.RULELIST = JSON.stringify(ruleList.data);
    ext_bg.updateRule();
}

RuleList.prototype.move = function(inc) {
    if (typeof this.sel == 'undefined') return;

    if (this.sel + inc < 0 ||
        this.sel + inc >= this.data.length)
        return;

    var tmp = this.data[this.sel];
    this.data[this.sel] = this.data[this.sel + inc];
    this.data[this.sel + inc] = tmp

    this.update(this.sel);
    this.update(this.sel += inc);

    this.onSel();

    this.refresh();
}

RuleList.prototype.bak = function() {
    ruleMgr_bak.value = JSON.stringify(this.data);

    alert(lang.notif['RULE-BAK']);
}

RuleList.prototype.restore = function() {
    // Remove leading and trailing whitespaces
    tmp = ruleMgr_bak.value.replace(/^\s*/, '').replace(/\s*$/, '');

    if (tmp == '') {
        alert(lang.notif['RULE-RESTORE-EMPTY']);
        return;
    }

    try {
        this.data = JSON.parse(tmp);
    } catch (e) {
        alert(lang.notif['RULE-RESTORE-ERR']);
        return;
    }

    this.refresh();
    window.location.reload();
}