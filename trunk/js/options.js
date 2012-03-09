/* Interactivity.

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
/*global $: true, $$: true, $v: true, $f: true*/
/*global chrome: true, RuleList: true, Pref: true, Lang: true*/

// Navbar
$f.switchNav = function (tag) {
    $('prefTag').className =
        $('ruleMgrTag').className = $('docTag').className = '';
    $(tag).className = 'selected';

    $('main-container').className = '.selected';
    $('main-container').style.margin = '0 -20px';
    $('main-container').style.opacity = 0;
};

$f.initOpt = function () {                         // Option page init
    $v.ext_bg = chrome.extension.getBackgroundPage(); // Bg page
    $v.pref = new Pref();         // preferences obj
    $v.lang = new Lang();         // i18n obj
    $v.ruleList = new RuleList(); // rules list obj

    $v.pref.onChgPrompt();      // Will create prompts objs

    // Navigation bar (work with $f.switchNav)
    $('main-container').addEventListener(
        "webkitTransitionEnd",
        function (e) {           // Fade in
            $('main-container').className = '';
            $('main-container').style.margin = '0 0';
            $('main-container').style.opacity = 1;
        }, false);

    // Rules editor animation
    $('overlay').addEventListener('click',  function (e) {
        if (e.srcElement.id === 'overlay') {
            e.target.classList.add('shake');
        }
    }, false);
    $('overlay').addEventListener('webkitAnimationEnd', function (e) {
        e.target.classList.remove('shake');
    }, false);

    // Rules list click event
    $('ruleListTable').addEventListener(
        "click", $v.ruleList.onSel.bind($v.ruleList), false);
    // Rule changed event
    $('ruleEdit').addEventListener(
        "change",
        function (e) {
            $v.ruleList.chg = true;
        },
        false);
    // Select language event
    $('langSel').addEventListener(
        "change", $v.lang.onSelLang.bind($v.lang), false);

    // Display the first tab
    $$('#prefTag a')[0].mouseClick();
};

$f.verifyUrl = function (url) { // Verify a URL (Not strict enough)
    if (! /^(https?|ftp|file):\/\//i.test(url)) { // Left out protocol
        $f.err($v.lang.i18n.URL_INVALID_PROTO);
        return false;
    }

    if (/\s/i.test(url)) {      // Contains whitespaces
        $f.err($v.lang.i18n.URL_INVALID_CHAR);
        return false;
    }

    return true;                // Is a valid URL
};
