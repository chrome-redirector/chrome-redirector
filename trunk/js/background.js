/**
 * Background
 */

/*jslint undef: false, plusplus: false */

// Backward compatible with 2.2.1
function COMPATIBLE() {
    try {
        tmp = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        return;
    }

    for (var i = 0; i < tmp.length; i++) {
        rule = tmp[i];
        if (typeof rule.repl !== 'string') {
            return;
        }

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
            break;
        case TYPE_GLOBI:
            rule.match.type = TYPE_GLOB;
            rule.match.modi = true;
        }

        switch (rule.sub.type) { // Correct sub type
        case TYPE_REGEXPI:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modi = true;
            break;
        case TYPE_REGEXPG:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modg = true;
            break;
        case TYPE_REGEXPIG:
            rule.sub.type = TYPE_REGEXP;
            rule.sub.modi = true;
            rule.sub.modg = true;
            break;
        case TYPE_GLOBI:
            rule.sub.type = TYPE_GLOB;
            rule.sub.modi = true;
            break;
        case TYPE_GLOBG:
            rule.sub.type = TYPE_GLOB;
            rule.sub.modg = true;
            break;
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

function updatePref() {
    prefData = (new Pref()).data;

    if (prefData.proto.all) {
        validUrl = ['<all_urls>'];
    } else {
        validUrl = [];
        if (prefData.proto.http) {
            validUrl.push('http://*/*');
        }
        if (prefData.proto.https) {
            validUrl.push('https://*/*');
        }
        if (prefData.proto.ftp) {
            validUrl.push('ftp://*/*');
        }
        if (prefData.proto.file) {
            validUrl.push('file://*');
        }
    }
}

function updateContext() {
    var parentLink, parentPage, idx;

    function newTab(info, tab) {
        chrome.tabs.create({
            url: getRedirUrl(
                info.linkUrl,
                ruleManual[info.menuItemId - 2]
            )
        });
    }

    function inTab(info, tab) {
        chrome.tabs.update(tab.id, {
            url: getRedirUrl(
                info.pageUrl,
                ruleManual[
                    info.menuItemId - (prefData.context.link ?
                                       3 + ruleManual.length : 2)]
            )
        });
    }

    if (ruleManual.length === 0) {
        return;
    }

    chrome.contextMenus.removeAll(); // Remove previous created menus

    if (prefData.context.link) { // Re-generate links' context menu
        parentLink = chrome.contextMenus.create({
            title: 'Open link with rule',
            contexts: ['link']
        });

        for (var i = 0; i < ruleManual.length; i++) {
            chrome.contextMenus.create({
                title: ruleManual[i].name,
                contexts: ['link'],
                parentId: parentLink,
                onclick: newTab
            });
        }
    }

    if (prefData.context.page) { // Re-generate pages' context menu
        parentPage = chrome.contextMenus.create({
            title: 'Reload page with rule'
        });

        for (var i = 0; i < ruleManual.length; i++) {
            chrome.contextMenus.create({
                title: ruleManual[i].name,
                parentId: parentPage,
                onclick: inTab
            });
        }
    }
}

function updateRule() {         // Called when data need update
    var rule;

    ruleData = (new RuleList(false)).data;

    ruleAuto = [];              // Rules for auto redir
    ruleManual = [];            // Rules for manual redir
    for (var i = 0; i < ruleData.length; i++) {
        rule = ruleData[i];   // Current rule

        // Rule must be enabled
        if (typeof rule.enabled === 'undefined' || ! rule.enabled) {
            continue;
        }

        // For a manual rule
        if (rule.match.type === TYPE_MANUAL) {
            if (rule.sub.type === TYPE_BLOCK) {
                alert(langNotif['MANUAL-BLOCK']);
                continue;
            }

            try {
                tmp = {
                    name: rule.name,
                    sub: str2re(rule.sub),
                    repl: rule.repl.str,
                    decode: rule.repl.decode
                };
            } catch (e) {
                continue;
            }

            ruleManual.push(tmp);
            continue;
        }

        // For an auto rule
        try {
            tmp = {
                match: str2re(rule.match),
                sub: str2re(rule.sub),
                repl: rule.repl.str,
                decode: rule.repl.decode
            };
        } catch (e) {
            continue;
        }

        ruleAuto.push(tmp);
    }

    updateContext();
}

langNotif = (new Lang()).notif;
updatePref();
updateRule();

// Auto redirect
chrome.webRequest.onBeforeRequest.addListener(
    function (tmp) {
        if (ruleAuto.length === 0) {
            return;
        }

        for (var i = 0; i < ruleAuto.length; i++) {
            if (ruleAuto[i].match.test(tmp.url)) { // match
                if (ruleAuto[i].sub === null) {    // To block
                    return {cancel: true};
                } else {        // To redirect
                    return {redirectUrl:
                            getRedirUrl(tmp.url, ruleAuto[i])};
                }
            }
        }
    },
    {urls: validUrl},
    ['blocking']
);

errLog = '';                    // Error log
// Error of auto redirect
chrome.webRequest.onErrorOccurred.addListener(
    function (err) {
        // Only handle errors in normal main_frame & normal tab
        if (err.frameId !== 0 || err.tabId < 0 ||
            err.type !== 'main_frame') {
            return;
        }

        // DBG(err);               // Write debug info
        errLog += JSON.stringify(err);

        /* Try reload this if page unexpectedly aborted
         * If it's aborted by user, then reloading will fail
         * Why aborted, sort of bug?
         */
        // if (err.hasOwnProperty('error') &&
        //     /abort/i.test(err.error)) {
        //     try {
        //         chrome.tabs.update(err.tabId, {url: err.url});
        //     } catch (e) {}
        // }
    },
    {urls: validUrl}
);
