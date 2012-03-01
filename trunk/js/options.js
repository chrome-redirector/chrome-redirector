/**
 * Interactive
 */

/*global $: true, $$: true,
  chrome: true, ext_bg: true,
  RuleList: true, ruleList: true,
  Pref: true, myPref: true,
  Lang: true, lang: true,
  err: true */

// Navbar
function switchNav(tag) {
    $('prefTag').className =
        $('ruleMgrTag').className = $('docTag').className = '';
    $(tag).className='selected';

    $('main-container').className='.selected';
    $('main-container').style.margin='0 -20px';
    $('main-container').style.opacity=0;
}

function onInit() {                                // Option page init
    ext_bg = chrome.extension.getBackgroundPage(); // Background page
    ruleList = new RuleList();                     // rules list obj
    myPref = new Pref();                           // preferences obj
    lang = new Lang();                             // i18n obj

    // Navigation bar (work with switchNav)
    $('main-container').addEventListener(
        "webkitTransitionEnd",
        function(e) {           // Fade in
            $('main-container').className='';
            $('main-container').style.margin='0 0';
            $('main-container').style.opacity=1;
        }, false);

    // Rules editor animation
    $('overlay').addEventListener('click',  function(e) {
        if (e.srcElement.id === 'overlay') {
            e.target.classList.add('shake');
        }
    }, false);
    $('overlay').addEventListener('webkitAnimationEnd', function(e) {
        e.target.classList.remove('shake');}, false);

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

    // WARNING: Failed in Chrome17stable
    $$('#prefTag a')[0].click(); // Display the first tab
}

function verifyUrl(url) {       // Verify a URL (Not strict enough)
    if (! /^(https?|ftp|file):\/\//i.test(url)) { // Left out protocol
        err(lang.i18n['URL_INVALID_PROTO']);
        return false;
    }

    if (/\s/i.test(url)) {      // Contains whitespaces
        err(lang.i18n['URL_INVALID_CHAR']);
        return false;
    }

    return true;                // Is a valid URL
}