/**
 * Background
 */

/*jslint plusplus: false */
/*global $: true, $$: true, $v: true, $f: true, tmp: true,
  chrome: true, RuleList: true, Pref: true*/

$f.loadPref = function () {           // Load preferences data
    $v.prefData = (new Pref()).data; // All preferences data

    if ($v.prefData.proto.all) {      // All protocols enabled
        $v.validUrl = ['<all_urls>']; // Matches all protocols
    } else {
        $v.validUrl = [];
        if ($v.prefData.proto.http) { // http:// enabled
            $v.validUrl.push('http://*/*');
        }
        if ($v.prefData.proto.https) { // https:// enabled
            $v.validUrl.push('https://*/*');
        }
        if ($v.prefData.proto.ftp) { // ftp:// enabled
            $v.validUrl.push('ftp://*/*');
        }
        if ($v.prefData.proto.file) { // file:// enabled
            $v.validUrl.push('file://*');
        }
    }
};

$f.updateContext = function () {      // Update the context menu
    var parentLink, parentPage, idx;

    function newTab(info, tab) { // Open a new tab
        chrome.tabs.create({
            url: $f.getRedirUrl(
                info.linkUrl,
                $v.ruleManual[info.menuItemId - newTab.idx - 1]
            )
        });
    }

    function inTab(info, tab) { // Reload current tab
        chrome.tabs.update(tab.id, {
            url: $f.getRedirUrl(
                info.pageUrl,
                $v.ruleManual[info.menuItemId - inTab.idx - 1]
            )
        });
    }

    chrome.contextMenus.removeAll(); // Remove previous created menus

    if ($v.ruleManual.length > 0) { // No manual rule
        if ($v.prefData.context.link) { // Links' context menu enabled
            parentLink = chrome.contextMenus.create({ // Parent entry
                title: 'Open link with rule',
                contexts: ['link']
            });

            for (var i = 0; i < $v.ruleManual.length; i++) { // Sub
                newTab.idx = parentLink;
                chrome.contextMenus.create({
                    title: $v.ruleManual[i].name,
                    contexts: ['link'],
                    parentId: parentLink,
                    onclick: newTab
                });
            }
        }

        if ($v.prefData.context.page) { // Pages' context menu enabled
            parentPage = chrome.contextMenus.create({ // Parent entry
                title: 'Reload page with rule'
            });

            for (var i = 0; i < $v.ruleManual.length; i++) { // Sub
                inTab.idx = parentPage;
                chrome.contextMenus.create({
                    title: $v.ruleManual[i].name,
                    parentId: parentPage,
                    onclick: inTab
                });
            }
        }
    }

    chrome.contextMenus.create({ // Open options page
        title: 'Options...',
        contexts: ['link', 'page'],
        onclick: function () {
            chrome.tabs.create({
                url: 'chrome-extension://' +
                    chrome.i18n.getMessage('@@extension_id') +
                    '/html/options.html'
            });
        }
    });
};

$f.loadRule = function (data) { // Called when rule list needs update
    var dry = false, ruleData, rule;

    if (typeof data !== 'undefined') {
        dry = true;             // Dry run
    } else {
        data = (new RuleList(false)).data; // All rules list data
    }

    if (dry !== true) {
        $v.ruleAuto = [];       // Rules for auto redir
        $v.ruleManual = [];     // Rules for manual redir
        $v.ruleHdr = [];        // Rules for http request header
    }
    for (var i = 0; i < data.length; i++) {
        rule = data[i];     // Current rule

        // Rule must be enabled
        if (dry === false &&
            (! rule.hasOwnProperty('enabled') || ! rule.enabled)) {
            continue;
        }

        // For a manual rule
        if (rule.match.type === $v.type.manual) {
            try {
                tmp = {         // Tmp manual rule, to be chked
                    name: rule.name,
                    sub: $f.str2re(rule.sub),
                    repl: rule.repl.str,
                    decode: rule.repl.decode
                };
                // RegExp syntax error
                if (! tmp.sub.hasOwnProperty('global')) {
                    return tmp.sub.toString();
                }
            } catch (e) {
                continue;
            }

            if (dry !== true) {
                $v.ruleManual.push(tmp); // Formally add to manual rule
                continue;
            }
        }

        // Beta-begin
        // For a header rule
        if (rule.sub.type === $v.type.hdr) {
            try {
                tmp = {
                    match: $f.str2re(rule.match),
                    sub: $f.splitVl(rule.sub.str),
                    repl: $f.splitVl(rule.repl.str)
                };
                // Check match to see if RegExp syntax error
                if (! tmp.match.hasOwnProperty('global')) {
                    return tmp.match.toString();
                }
                // Check if sub and repl are of the same size
                if (tmp.sub.length !== tmp.repl.length) {
                    return 'Substitution and Replacement mismatch!';
                }
            } catch (e) {
                continue;
            }

            if (dry !== true) {
                $v.ruleHdr.push(tmp);
                continue;
            }
        }
        // Beta-end

        // For an auto rule
        try {
            tmp = {             // Tmp auto rule, to be chked
                match: $f.str2re(rule.match),
                sub: $f.str2re(rule.sub),
                repl: rule.repl.str,
                decode: rule.repl.decode
            };
            // Check match/sub to see if RegExp syntax error
            if (! tmp.match.hasOwnProperty('global')) {
                return tmp.match.toString();
            }
            if (! tmp.sub.hasOwnProperty('global')) {
                return tmp.sub.toString();
            }
        } catch (e) {
            continue;
        }

        if (dry !== true) {
            $v.ruleAuto.push(tmp); // Formally add to auto rule
        }
    }

    $f.updateContext();            // Now referesh context menu
};

$f.loadPref();                     // Load preferences data
$f.loadRule();                     // Load rule list

chrome.webRequest.onBeforeRequest.addListener( // Auto redirect
    function (tmp) {
        if ($v.ruleAuto.length === 0) { // No auto rule
            return;
        }

        for (var i = 0; i < $v.ruleAuto.length; i++) {
            if ($v.ruleAuto[i].match.test(tmp.url)) { // match this URL
                if ($v.ruleAuto[i].sub === null) {    // To block
                    return {cancel: true};
                } else {        // To redirect
                    return {redirectUrl:
                            $f.getRedirUrl(tmp.url, $v.ruleAuto[i])};
                }
            }
        }
    },
    {urls: $v.validUrl},
    ['blocking']
);

// errLog = '';                    // Error log
// // Error of auto redirect
// chrome.webRequest.onErrorOccurred.addListener(
//     function (err) {
//         // Only handle errors in normal main_frame & normal tab
//         if (err.frameId !== 0 || err.tabId < 0 ||
//             err.type !== 'main_frame') {
//             return;
//         }

//         // $f.dbg(err);               // Write debug info
//         errLog += JSON.stringify(err);
//     },
//     {urls: $v.validUrl}
// );

// Beta-begin
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (tmp) {
        var flt, idx, addArr;

        flt = function (arr) {
            arr.filter(function (t) {
                return (/^\+/).test(t);
            });
        };

        for (var i = 0; i < $v.ruleHdr.length; i++) {
            if ($v.ruleHdr[i].match.test(tmp.url)) { // match this URL
                for (var j = 0; j < tmp.requestHeaders.length; j++) {
                    if ((idx = $v.ruleHdr[i].sub.indexOf(
                        tmp.requestHeaders[j].name)) !== -1) {
                        // Modify header
                        tmp.requestHeaders[j].value =
                            $v.ruleHdr[i].repl[idx];
                    } else if ((idx = $v.ruleHdr[i].sub.indexOf(
                        '-' + tmp.requestHeaders[j].name)) !== -1) {
                        // Delete header
                        tmp.requestHeaders.splice(j, 1);
                    }
                }

                // Add headers
                addArr = flt($v.ruleHdr[i].sub);
                for (var k = 0; k < addArr.length; k++) {
                    tmp.requestHeaders.push({
                        name: addArr[k].replace('+', ''),
                        value: $v.ruleHdr[i].repl[
                            $v.ruleHdr[i].sub.indexOf(addArr[k])]
                    });
                }

                // console.log(tmp.requestHeaders);
                return {requestHeaders: tmp.requestHeaders};
            }
        }
    },
    {urls: $v.validUrl},
    ["blocking", "requestHeaders"]
);
// Beta-end