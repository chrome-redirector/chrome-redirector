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
/*global chrome: true, RuleList: true, Pref: true, Debugger: true*/

// Navbar
$f.switchNav = function (tag) {
    $('prefTag').className = $('ruleMgrTag').className =
        $('dbgTag').className = $('docTag').className = '';
    $(tag).className = 'selected';

    $('main-container').className = '.selected';
    $('main-container').style.margin = '0 -20px';
    $('main-container').style.opacity = 0;
};

$f.initOpt = function () {                         // Option page init
    $v.ext_bg = chrome.extension.getBackgroundPage(); // Bg page
    $v.pref = new Pref();         // Preferences obj
    $v.ruleList = new RuleList(); // Rules list obj
    $v.debugger = new Debugger(); // Debugger obj

    $v.pref.onChgPrompt();      // Will create prompts objs

    $f.applyI18n('i18nT');      // Apply i18n messages
    $f.applyI18n('i18nP');

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

    // Display the first tab
    $$('#prefTag a')[0].mouseClick();
};

$f.verifyUrl = function (url) { // Verify a URL (Not strict enough)
    if (! /^(https?|ftp|file):\/\//i.test(url)) { // Left out protocol
        $f.err($i18n('TEST_INVALID_PROTO'));
        return false;
    }

    if (/\s/i.test(url)) {      // Contains whitespaces
        $f.err($i18n('TEST_INVALID_CHAR'));
        return false;
    }

    return true;                // Is a valid URL
};
