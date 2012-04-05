/* Prompt obj.

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
/*global Prompt: true*/

Prompt = function (id, list, callback) {  // Prompt obj
    this.init(id, list, callback);
};

Prompt.prototype.refresh = function (id) { // Refresh prompt data
    var list = [];

    var pos = $(id + 'str').selectionStart; // Cursor position
    var value = $(id + 'str').value;        // Input text
    var frag = value.substring(0, pos);     // Text before cursor
    frag = frag.replace(/\\\\/g, '\x00'); // \\ => \0
    // Long escaped char => \f
    frag =
        frag.replace(/\\(\d{3}|x[a-zA-Z\d]{2}|u[a-zA-Z\d]{4})/g,
                     '\f');
    frag = frag.replace(/\\(?!b)\w/ig, '\f'); // Escaped char => \f
    var last = value.substr(pos - 1, 1);         // Last character

    switch (id) {
    case 'ruleEdit_name':       // Prompts for name is consistent
        return;
    case 'ruleEdit_match':
    case 'ruleEdit_sub':
        switch ($(id + 'type').selectedIndex) { // Input type
        case $v.type.regexp:    // RegExp
            if ((/\{\d+$/).test(frag)) { // {...
                list = list.concat(
                    [{'msg': ',', 'desc': ''},
                     {'msg': '}', 'desc': ''}]
                );
            } else if ((/\{\d+,\d+$/).test(frag)) { // {...,...
                list = list.concat(
                    [{'msg': '}', 'desc': ''}]
                );
            } else if ((/\[(?!\w*\[\w*)$/).test(frag)) { // [...
                if (last === '[') {
                    list = list.concat([{'msg': '^', 'desc': ''}]);
                }

                list = list.concat(this.re.esc);
            } else {                          // ( or common context
                if ((/\((?!\?$|\w*\)\w*)$/).test(frag)) { // (...
                    list = list.concat([{'msg': ')', 'desc': ''}]);
                }

                if ((/\\b$/).test(frag)) { // \b
                    list = list.concat([{'msg': '\\B', 'desc': ''}]);
                } else if ((/\\B$/).test(frag)) { // \B
                    list = list.concat([{'msg': '\\b', 'desc': ''}]);
                } else if ((/\(\?/).test(frag)) { // (?
                    list = list.concat(
                        [{'msg': ':', 'desc': ''},
                         {'msg': '!', 'desc': ''},
                         {'msg': '=', 'desc': ''}
                        ]
                    );
                }

                switch (last) { // Get data according to last char
                case '\\':      // \
                    list = list.concat(
                        [{'msg': '\\', 'desc': ''},
                         {'msg': 'W', 'desc': ''},
                         {'msg': 'd', 'desc': ''},
                         {'msg': 'D', 'desc': ''},
                         {'msg': '^', 'desc': ''},
                         {'msg': '$', 'desc': ''},
                         {'msg': '.', 'desc': ''},
                         {'msg': '*', 'desc': ''},
                         {'msg': '+', 'desc': ''},
                         {'msg': '?', 'desc': ''},
                         {'msg': '(', 'desc': ''},
                         {'msg': ')', 'desc': ''},
                         {'msg': '[', 'desc': ''},
                         {'msg': ']', 'desc': ''},
                         {'msg': '{', 'desc': ''},
                         {'msg': '}', 'desc': ''},
                         {'msg': '|', 'desc': ''},
                         {'msg': 'b', 'desc': ''},
                         {'msg': 'B', 'desc': ''},
                         {'msg': '', 'desc': '\\ddd'},
                         {'msg': 'x', 'desc': '\\xdd'},
                         {'msg': 'u', 'desc': '\\udddd'}]
                    );
                    break;
                case '(':
                    list = list.concat(
                        [{'msg': '?:', 'desc': ''},
                         {'msg': '?!', 'desc': ''},
                         {'msg': '?=', 'desc': ''}
                        ]
                    );
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                    break;
                case '':
                    list = list.concat([{'msg': '^', 'desc': ''}]);
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                    break;
                case '^':
                case '|':
                case '*':
                case '+':
                case '?':
                case '}':
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                    break;
                case '$':
                case '{':
                case ',':
                    break;
                default:
                    list = list.concat(this.re.qt);
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                }
            }
            break;
        case $v.type.glob: case $v.type.glob_smart: // Globbing
            if ($(id + 'type').selectedIndex !== $v.type.glob_smart ||
                id === 'ruleEdit_match') {
                switch (last) {
                case '*':
                case '?':
                    list = [];
                    break;
                default:
                    list =
                        [{'msg': '*', 'desc': ''},
                         {'msg': '?', 'desc': ''}];
                }
                break;          // Not typo
            }
        case $v.type.reqHdr:    // Http Request Header
            if (id !== 'ruleEdit_sub') {
                break;
            }

            switch (last) {
            case '': case '|':
                list = [{'msg': '-',
                         'desc': 'Header remover, e.g. -Referer'
                        }].concat(this.reqHdr);
                break;
            case '-':
                list = this.reqHdr;
                break;
            default:
                list = [{'msg': ' | ',
                         'desc': 'Header separator, e.g. Referer|User-Agent'
                        }];
                break;
            }
            break;
        case $v.type.respHdr:   // Http Response Header
            if (id !== 'ruleEdit_sub') {
                break;
            }

            switch (last) {
            case '': case '|':
                list = [{'msg': '-',
                         'desc': 'Header remover, e.g. -Server'
                        }].concat(this.respHdr);
                break;
            case '-':
                list = this.respHdr;
                break;
            default:
                list = [{'msg': '|',
                         'desc': 'Header separator, e.g. Content-Type|Content-Disposition'
                        }];
                break;
            }
            break;
        }
        break;
    case 'ruleEdit_repl':
        switch ($('ruleEdit_subtype').selectedIndex) {
        case $v.type.reqHdr: case $v.type.respHdr:
            if (last !== '|' && last !== '') {
                list = [{'msg': '|', 'desc': 'Value separator'}];
            }
            break;
        default:
            var prefix = '';
            if (last !== '$') {
                prefix = '$';
            }

            list =
                [{'msg': prefix + '`',
                  'desc': 'part proceeds the matched one'},
                 {'msg': prefix + '&',
                  'desc': 'matched string'},
                 {'msg': prefix + '\'',
                  'desc': 'part following the matched one'}];

            // Add $n
            if ($('ruleEdit_subtype').selectedIndex ===
                $v.type.regexp) {
                var arrParen =
                    $('ruleEdit_substr').value.match(/\(/g);
                if (arrParen !== null) {
                    for (var i = 1; i <= arrParen.length; i++) {
                        list = list.concat(
                            [{'msg': prefix + i, 'desc': ''}]
                        );
                    }
                }
            }
        }
        break;
    case 'ruleEdit_test':
        if ($('ruleEdit_subtype').selectedIndex !== $v.type.reqHdr &&
            $('ruleEdit_subtype').selectedIndex !== $v.type.respHdr &&
            frag === '') {
            list =          // URLs
            [{'msg': 'http://', 'desc': ''},
             {'msg': 'https://', 'desc': ''},
             {'msg': 'ftp://', 'desc': ''},
             {'msg': 'file://', 'desc': ''}];
        }
        break;
    }

    this.update(id, list);      // Update prompt
};

Prompt.prototype.update = function (id, list, callback) {
    // id: section id; list: prompt data; callback: callback function
    var html = $c('ul');
    var txt = $(id + 'str');    // Input textbox
    var onClick = function () { // Function called when clicked
        // Text to be inserted
        var text = this.getElementsByTagName('span')[0].innerText;
        // Cursor postion after insertion
        var idx = txt.selectionStart + text.length;
        txt.value =             // Insert
            txt.value.substring(0, txt.selectionStart) +
            text +
            txt.value.substring(txt.selectionStart);
        // Set cursor
        txt.selectionStart = txt.selectionEnd = idx;

        if (typeof callback !== 'undefined') { // Execute callback
            callback();
        }

        $(id + 'prompt').hovered = false;
        txt.onclick();          // Update cursor position
        txt.selectedIdx = 0;    // Select the first menu entry
        return text.length;     // Used by <Enter>
    };

    for (var i = 0; i < list.length; i++) { // Built up menu
        var dom = $c('li');
        dom.onclick = onClick;
        dom.innerHTML = '<span>' + list[i].msg + '</span>' +
            '<span>' + list[i].desc + '</span>';
        html.appendChild(dom);
    }

    if ($$('#' + id + 'prompt ul').length === 0) {
        return html;            // Called from init
    } else {                    // Existing
        $$('#' + id + 'prompt')[0].innerHTML = '';
        $$('#' + id + 'prompt')[0].appendChild(html);
    }
};

Prompt.prototype.init = function (id, list, callback) { // Initialize
    var txt = $(id + 'str');                        // Input textbox

    var node = $c('div');       // Prompt menu
    node.id = id + 'prompt';
    node.className = 'prompt';
    node.title = $i18n('PROMPT_TITLE');

    node.onmouseover = function () {
        this.hovered = true;
        var menu = $$('#' + node.id + ' li');
        for (var i = 0; i < menu.length; i++) {
            menu[i].className = '';
        }

        txt.selectedIdx = undefined;
    };

    node.onmouseout = function () {
        this.hovered = false;
    };

    node.adjPos = function (num) {
        var maxNum = Math.floor((txt.offsetWidth - 5) / 8);

        if (txt.value.length >= maxNum) {
            this.style.width = maxNum * 8 + 5 + 'px';
            num = 0;
        } else {
            this.style.removeProperty('width');
            num = num > maxNum ? 0 : num;
        }

        // Move prompts to correct position
        $(this.id).style.marginLeft = num * 8 + 5 + 'px';
        $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);
    }

    node.appendChild(this.update(id, list, callback));
    $(id).insertBefore(node, txt);

    txt.colorize = function () { // Highlight selected
        var menu = $$('#' + node.id + ' li');
        for (var i = 0; i < menu.length; i++) {
            if (i === this.selectedIdx) {
                menu[i].className = 'selected';
            } else {
                menu[i].className = '';
            }
        }
    };

    txt.onfocus = function () {    // On get focused
        if ($(node.id) === null) { // Prompts disabled
            return;
        }
        $(node.id).style.display = 'inline';
        $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);

        this.selectedIdx = 0;
    };

    txt.onblur = function () {     // On blured
        if ($(node.id) === null) { // Prompts disabled
            return;
        }

        if ($(node.id).hovered !== true) {
            $(node.id).style.display = 'none';
        }

        this.selectedIdx = undefined;
    };

    txt.onclick = function (e) {   // On clicked
        if ($(node.id) === null) {  // Prompts disabled
            return;
        }

        node.adjPos(this.selectionStart);
        this.colorize();
    };

    txt.onkeyup = function (e) { // On key released
        $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);
        this.colorize();
    };

    txt.onkeydown = function (e) { // On key pressed down
        if ($(node.id) === null) { // Prompts disabled
            return;
        }

        var num = this.selectionStart;

        switch (e.keyCode) {
        case 13:                // Enter
            var menu = $$('#' + node.id + ' li');
            if (typeof this.selectedIdx !== 'undefined' &&
                menu[this.selectedIdx] !== undefined) {
                var tmp = menu[this.selectedIdx].onclick();
                if (id !== 'ruleEdit_name') {
                    num += tmp;
                }
            }
            e.preventDefault(); // Prevent submitting the form
            break;
        case 37:                // Left
        case 8:                 // Backspace
            if (this.selectionStart !== 0) {
                num--;
            }
            break;
        case 39:                // Right
            if (this.selectionStart !== this.value.length) {
                num++;
            }
            break;
        case 35:                // End
            num = this.value.length;
            break;
        case 36:                // Home
            num = 0;
            break;
        case 38:                // Up
            if (this.selectedIdx === undefined ||
                --this.selectedIdx < 0) {
                this.selectedIdx =
                    $$('#' + node.id + ' li').length - 1;
            }
            e.preventDefault(); // Prevent cursor moving to beginning
            break;
        case 40:                // Down
            if (this.selectedIdx === undefined ||
                ++this.selectedIdx >=
                $$('#' + node.id + ' li').length) {
                this.selectedIdx = 0;
            }
            e.preventDefault(); // Prevent cursor moving to end
            break;
        case 33:                // PgUp
            this.selectedIdx = 0;
            e.preventDefault(); // Prevent scrolling up
            break;
        case 34:                // PgDn
            this.selectedIdx = $$('#' + node.id + ' li').length - 1;
            e.preventDefault(); // Prevent scrolling down
            break;
        case 27:                // Esc
            $(node.id).style.display = 'none';
            this.selectedIdx = undefined;
            return;
        case 9:                 // Tab
            $(node.id).style.display = 'inline';
            this.selectedIdx = 0;
            e.preventDefault(); // Prevent jumping to next tabIndex
            return;
        }

        node.adjPos(num);
        this.colorize();
    };

    txt.onkeypress = function (e) { // On key pressed (printable keys)
        if ($(node.id) === null) {  // Prompts disabled
            return;
        }

        node.adjPos(this.selectionStart + 1);
        this.colorize();
    };
};

Prompt.prototype.re = {         // Prompts for RegExp
    'com': [                    // Common chars
        {'msg': '.', 'desc': ''},
        {'msg': '\\', 'desc': ''}
    ],

    'esc': [                    // Escape sequences
        {'msg': '\\w', 'desc': ''},
        {'msg': '\\W', 'desc': ''},
        {'msg': '\\d', 'desc': ''},
        {'msg': '\\D', 'desc': ''},
        {'msg': '\\^', 'desc': ''},
        {'msg': '\\$', 'desc': ''},
        {'msg': '\\.', 'desc': ''},
        {'msg': '\\*', 'desc': ''},
        {'msg': '\\+', 'desc': ''},
        {'msg': '\\?', 'desc': ''},
        {'msg': '\\(', 'desc': ''},
        {'msg': '\\)', 'desc': ''},
        {'msg': '\\[', 'desc': ''},
        {'msg': '\\]', 'desc': ''},
        {'msg': '\\{', 'desc': ''},
        {'msg': '\\}', 'desc': ''},
        {'msg': '\\|', 'desc': ''},
        {'msg': '\\b', 'desc': ''},
        {'msg': '\\B', 'desc': ''},
        {'msg': '\\', 'desc': '\\ddd, ascii in oct'},
        {'msg': '\\x', 'desc': '\\xdd, ascii in hex'},
        {'msg': '\\u', 'desc': '\\udddd, unicode'}
    ],

    'qt': [                     // Quantifiers
        {'msg': '*', 'desc': ''},
        {'msg': '+', 'desc': ''},
        {'msg': '?', 'desc': ''},
        {'msg': '{', 'desc': ''}
    ]
};

Prompt.prototype.reqHdr = [     // Prompts for request headers
    {'msg': 'Accept',
     'desc': 'Acceptable Content-Types'
    },
    {'msg': 'Accept-Charset',
     'desc': 'Acceptable Character sets '
    },
    {'msg': 'Accept-Encoding',
     'desc': 'Acceptable encodings'
    },
    {'msg': 'Accept-Language',
     'desc': 'Acceptable languages for response'
    },
    {'msg': 'Cookie',
     'desc': 'HTTP cookie previously sent by the server with Set-Cookie'
    },
    {'msg': 'Content-MD5',
     'desc': 'Base64-encoded binary MD5 sum of the content of the request body'
    },
    {'msg': 'Content-Type',
     'desc': 'Mime type of the body of the request'
    },
    {'msg': 'Date',
     'desc': 'Date and time the message was sent'
    },
    {'msg': 'Expect',
     'desc': 'Particular server behaviors required by the client'
    },
    {'msg': 'From',
     'desc': 'Email address of the user making the request'
    },
    {'msg': 'If-Match',
     'desc': 'Only perform the action if the client supplied entity matches the same entity on the server'
    },
    {'msg': 'If-Unmodified-Since',
     'desc': 'Only send the response if the entity has not been modified since a specific time'
    },
    {'msg': 'Max-Forwards',
     'desc': 'Number of times the message can be forwarded through proxies or gateways'
    },
    {'msg': 'Range',
     'desc': 'Request only part of an entity'
    },
    {'msg': 'Referer',
     'desc': 'Address of the previous web page from which a link to the currently requested page was followed'
    },
    {'msg': 'TE',
     'desc': 'Transfer encodings the user agent is willing to accept'
    },
    {'msg': 'Upgrade',
     'desc': 'Ask the server to upgrade to another protocol'
    },
    {'msg': 'User-Agent',
     'desc': 'User agent string'
    },
    {'msg': 'Via',
     'desc': 'Through which the request was sent'
    },
    {'msg': 'Warning',
     'desc': 'Possible problems with the entity body'
    }
];

Prompt.prototype.respHdr = [    // Prompts for response headers
    {'msg': 'Accept-Ranges',
     'desc': 'Partial content range types this server supports'
    },
    {'msg': 'Age',
     'desc': 'Age the object has been in a proxy cache in seconds'
    },
    {'msg': 'Allow',
     'desc': 'Valid actions for a specified resource'
    },
    {'msg': 'Cache-Control',
     'desc': 'Whether cache this object'
    },
    {'msg': 'Connection',
     'desc': 'Options that are desired for the connection'
    },
    {'msg': 'Content-Encoding',
     'desc': 'Type of encoding used on the data'
    },
    {'msg': 'Content-Language',
     'desc': 'Language the content is in'
    },
    {'msg': 'Content-Length',
     'desc': 'Length of the response body in octets'
    },
    {'msg': 'Content-Location',
     'desc': 'Alternate location for the returned data'
    },
    {'msg': 'Content-MD5',
     'desc': 'Base64-encoded binary MD5 sum of the content of the response'
    },
    {'msg': 'Content-Disposition',
     'desc': 'An opportunity to raise a "File Download" dialogue box for a known MIME type'
    },
    {'msg': 'Content-Range',
     'desc': 'Where in a full body message this partial message belongs'
    },
    {'msg': 'Content-Type',
     'desc': 'Mime type of this content'
    },
    {'msg': 'Date',
     'desc': 'Date and time the message was sent'
    },
    {'msg': 'ETag',
     'desc': 'Identifier for a specific version of a resource'
    },
    {'msg': 'Expires',
     'desc': 'Date/time after which the response is considered stale'
    },
    {'msg': 'Last-Modified',
     'desc': 'Last modified date for the requested object'
    },
    {'msg': 'Link',
     'desc': 'Express a typed relationship with another resource'
    },
    {'msg': 'Location',
     'desc': 'Used in redirection, or when a new resource has been created'
    },
    {'msg': 'P3P',
     'desc': 'Set P3P policy'
    },
    {'msg': 'Pragma',
     'desc': 'Implementation-specific headers that may have various effects anywhere along the request-response chain'
    },
    {'msg': 'Proxy-Authenticate',
     'desc': 'Request authentication to access the proxy'
    },
    {'msg': 'Refresh',
     'desc': 'Used in redirection, or when a new resource has been created'
    },
    {'msg': 'Retry-After',
     'desc': 'If an entity is temporarily unavailable'
    },
    {'msg': 'Server',
     'desc': 'Name for the server'
    },
    {'msg': 'Set-Cookie',
     'desc': 'HTTP cookie'
    },
    {'msg': 'Strict-Transport-Security',
     'desc': 'How long to cache the HTTPS only policy and whether this applies to subdomains'
    },
    {'msg': 'Trailer',
     'desc': 'Indicates that the given set of header fields is present in the trailer of a message encoded with chunked transfer-coding'
    },
    {'msg': 'Transfer-Encoding',
     'desc': 'Form of encoding used to safely transfer the entity to the user'
    },
    {'msg': 'Vary',
     'desc': 'How to match future request headers'
    },
    {'msg': 'Via',
     'desc': 'Through which the response was sent'
    },
    {'msg': 'Warning',
     'desc': 'Possible problems with the entity body'
    },
    {'msg': 'WWW-Authenticate',
     'desc': 'Authentication scheme that should be used to access the requested entity'
    }
];
