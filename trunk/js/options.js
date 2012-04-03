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
/*global $: true, $$: true, $v: true, $f: true, $i18n: true*/
/*global chrome: true, RuleList: true, Pref: true, Debugger: true*/

// Navbar
$f.switchNav = function () {
    var selectedTags = $$('#navTags .selected');
    for (var i = 0; i < selectedTags.length; i++) {
        selectedTags[i].className = '';
    }

    try {
        $$('#navTags li:hover')[0].className = 'selected';
    } catch (e) {               // Switched by script
        switch (location.search) {
        case '?1':
            $$('#navTags li')[1].className = 'selected';
            break;
        case '?2':
            $$('#navTags li')[2].className = 'selected';
            break;
        default:
            $$('#navTags li')[0].className = 'selected';
            break;
        }
    }

    $('main-container').className = '.selected';
    $('main-container').style.margin = '0 -20px';
    $('main-container').style.opacity = 0;
};

$f.initOpt = function () {                         // Option page init
    chrome.tabs.getCurrent(function (tab) {
        $v.ext_bg.$v.optionTabId = tab.id;
    });

    $v.ext_bg = chrome.extension.getBackgroundPage(); // Bg page
    $v.pref = new Pref();         // Preferences obj
    $v.ruleList = new RuleList(); // Rules list obj
    $v.debugger = new Debugger(); // Debugger obj

    $v.pref.onChgPrompt();      // Will create prompts objs

    $f.applyI18n();             // Apply i18n messages

    // Rulelist navigation
    $$('body')[0].addEventListener('keydown', function (e) {
        if ($$('#ruleMgr:target').length === 0 ||
            $$('#overlay:hover').length > 0 ||
            $$('#navBar:hover').length > 0) {
            return;
        }

        switch (e.keyCode) {
        case 38: case 75:       // Up/k
            $v.ruleList.move(-1);
            break;
        case 40: case 74:       // Down/j
            $v.ruleList.move(1);
            break;
        case 46:                // Delete
            $v.ruleList.del();
            break;
        case 13:                // Enter
            $v.ruleList.edit();
        default:
            return;
        }

        e.preventDefault();
        return false;
    });

    // Navigation bar (work with $f.switchNav)
    var transitionEndEvent = window.TransitionEvent ?
        'transitionEnd' : 'webkitTransitionEnd';
    $('main-container').addEventListener(
        transitionEndEvent,
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
    var animationEndEvent = window.AnimationEnd ?
        'animationEnd' : 'webkitAnimationEnd'
    $('overlay').addEventListener(animationEndEvent, function (e) {
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

    switch (location.search) {
    case '?1':
        // Display the rules manager tab
        $$('#ruleMgrTag a')[0].mouseClick();
        break;
    case '?2':
        // Display the debugger tab
        $$('#dbgTag a')[0].mouseClick();
        break;
    default:
        // Display the preferences tab
        $$('#prefTag a')[0].mouseClick();
    }
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
