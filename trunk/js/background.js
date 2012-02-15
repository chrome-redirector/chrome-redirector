/**
 * Background
 */

// Backward compatible with 2.2.1
function COMPATIBLE() {
    try {
        var tmp = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        return;
    }

    for (var i in tmp) {
        rule = tmp[i];
        if (typeof rule.repl != 'string') return; // str for 2.2.1

        TYPE_REGEXPI = 3;
        TYPE_GLOBI = 4;
        TYPE_REGEXPG = 5;
        TYPE_GLOBG = 6;
        TYPE_REGEXPIG = 7;
        TYPE_GLOBIG = 8;

        switch (rule.match.type) { // Correct match type
        case TYPE_REGEXPI:
            rule.match.type = TYPE_REGEXP;
            rule.match.modi = true;
        case TYPE_GLOBI:
            rule.match.type = TYPE_GLOB;
            rule.match.modi = true;
        }

        switch (rule.sub.type) { // Correct sub type
        case TYPE_REGEXPI:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modi = true;
        case TYPE_REGEXPG:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modg = true;
        case TYPE_REGEXPIG:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modi = true;
            rule.sub.modg = true;
        case TYPE_GLOBI:
            rule.sub.type = TYPE_GLOB;
            rule.sub.modi = true;
        case TYPE_GLOBG:
            rule.sub.type = TYPE_GLOB;
            rule.sub.modg = true;
        case TYPE_GLOBIG:
            rule.sub.type = TYPE_GLOB;
            rule.sub.modi = true;
            rule.sub.modg = true;
        }

        rule.repl = {str: rule.repl, decode: false}; // Correct repl
    }

    localStorage.RULELIST = JSON.stringify(tmp); // Save
}
COMPATIBLE();

langNotif = (new Lang()).notif;
updatePref();
updateRule();

// Auto redirect
chrome.webRequest.onBeforeRequest.addListener(
    function(tmp) {
        if (ruleAuto.length == 0) return; // return if no rules

        for (var i in ruleAuto) {
            if (ruleAuto[i].match.test(tmp.url)) { // match
                if (ruleAuto[i].sub === null) {    // To block
                    return {cancel: true};
                } else {        // To redirect
                    var tgt = tmp.url.replace(
                        ruleAuto[i].sub, ruleAuto[i].repl);
                    if (ruleAuto.decode)
                        tgt = decodeURIComponent(tgt);

                    return {redirectUrl: tgt};
                }
            }
        }
    },
    {urls: validUrl},
    ['blocking']
);

// Manual redirect
chrome.pageAction.onClicked.addListener(function(tab) {
    if (ruleManual.length == 0) return;

    var tmp = tab.url.replace(ruleManual[0].sub, ruleManual[0].repl);
    if (ruleManual.decode) tmp = decodeURIComponent(tmp);

    chrome.tabs.update(tab.id, {
        url: tmp
    });
});

// Show icon in omnibar
if (typeof prefData.hideIcon == 'undefined' || ! prefData.hideIcon) {
    chrome.tabs.onCreated.addListener(showIcon);
    chrome.tabs.onUpdated.addListener(showIcon);
}

function showIcon(t) {
    if (typeof prefData.hideIcon != 'undefined' && prefData.hideIcon)
        return;

    if (typeof t == 'number')
        chrome.pageAction.show(t);
    else
        chrome.pageAction.show(t.id);
}

function updatePref() {
    prefData = (new _Pref()).data;

    if (prefData.proto.all) {
        validUrl = ['<all_urls>'];
    } else {
        validUrl = [];
        if (prefData.proto.http) validUrl.push('http://*/*');
        if (prefData.proto.https) validUrl.push('https://*/*');
        if (prefData.proto.ftp) validUrl.push('ftp://*/*');
        if (prefData.proto.file) validUrl.push('file://*');
    }
}

function updateRule() {         // Called when data need update
    try {                       // Load prototype of rules
        var ruleData = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        var ruleData = [];
    }

    ruleAuto = [];              // Rules for auto redir
    ruleManual = [];            // Rules for manual redir
    for (var i in ruleData) {
        var rule=ruleData[i];   // Current rule

        // Rule must be enabled
        if (typeof rule.enabled === 'undefined' || ! rule.enabled)
            continue;

        // For a manual rule
        if (rule.match.type == TYPE_MANUAL) {
            if (rule.sub.type == TYPE_BLOCK) {
                alert(langNotif['MANUAL-BLOCK']);
                continue;
            }

            if (ruleManual.length == 0) {
                try {
                    var tmp = {
                        sub: str2re(rule.sub),
                        repl: rule.repl.str,
                        decode: rule.repl.decode};
                } catch (e) {
                    continue;
                }

                ruleManual = [tmp];
            } else {
                alert(langNotif['MULTI-MANUAL']);
            }

            continue;
        }

        // For an auto rule
        try {
            var tmp={
                match: str2re(rule.match),
                sub: str2re(rule.sub),
                repl: rule.repl.str,
                decode: rule.repl.decode};
        } catch (e) {
            continue;
        }

        ruleAuto.push(tmp);
    }
}