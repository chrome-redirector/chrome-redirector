/**
 * Interactive
 */

/*global $: true, $$: true,
  chrome: true, ext_bg: true,
  RuleList: true, ruleList: true,
  Pref: true, myPref: true,
  Lang: true, lang: true,
  err: true */

function switchNavTag(e) {      // Switch navigation Bar
    var tag = e.srcElement;     // The tag clicked
    $$('#navBar .navTagSel')[0].className = "navTag"; // Decolor prev
    tag.className = "navTag navTagSel";               // Color clicked

    $$('#main .mainview-sel')[0].className = "mainview"; // Hide all

    switch (tag.id) {           // Show tag-id
    case "prefTag":
        $('pref').className = "mainview-sel";
        break;
    case "ruleMgrTag":
        $('ruleMgr').className = "mainview-sel";
        break;
    case "docTag":
        $('doc').className = "mainview-sel";
        break;
    }
}

function onInit() {                                // Option page init
    ext_bg = chrome.extension.getBackgroundPage(); // Background page
    ruleList = new RuleList();                     // rules list obj
    myPref = new Pref();                           // preferences obj
    lang = new Lang();                             // i18n obj

    // Nav bar click event
    $('navTags').addEventListener("click", switchNavTag, false);
    // Rules list click event
    $('ruleListTable').addEventListener(
        "click", ruleList.onSel.bind(ruleList), false);
    // Select builtin rule event
    $('ruleEdit_sel').addEventListener(
        "change", ruleList.selBuiltin.bind(ruleList), false);
    // Rule changed event
    $('ruleEdit').addEventListener(
        "change",
        function (e) {
            ruleList.chg = true;
        },
        false);
    // Select language event
    $('langSel').addEventListener(
        "change", lang.onSelLang.bind(lang), false);
}

function verifyUrl(url) {       // Verify a URL (Not strict enough)
    if (! /^(https?|ftp|file):\/\//i.test(url)) { // Left out protocol
        err(lang.i18n['URL-INVALID-PROTO']);
        return false;
    }

    if (/\s/i.test(url)) {      // Contains whitespaces
        err(lang.i18n['URL-INVALID-CHAR']);
        return false;
    }

    return true;                // Is a valid URL
}