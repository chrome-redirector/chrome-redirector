/**
 * Prompt obj
 */

/*jslint plusplus: false */
/*global $: true, $$: true, $v: true, $f: true, tmp: true,
  Prompt: true, document: true*/

Prompt = function (id, list, code) {  // Prompt obj
    this.init(id, list, code);
};

Prompt.prototype.refresh = function (id) { // Refresh prompt data
    var pos, value, frag, last, list = [];

    pos = $(id + 'str').selectionStart; // Cursor position
    value = $(id + 'str').value;        // Input text
    frag = value.substring(0, pos);     // Text before cursor
    frag = frag.replace(/\\\\/g, '\0'); // \\ => \0
    // Long escaped char => \f
    frag =
        frag.replace(/\\(\d{3}|x[a-zA-Z\d]{2}|u[a-zA-Z\d]{4})/g,
                     '\f');
    frag = frag.replace(/\\(?!b)./ig, '\f'); // Escaped char => \f
    last = value.substr(pos - 1, 1);         // Last character

    switch (id) {
    case 'ruleEdit_name':       // Prompts for name is consistent
        return;
    case 'ruleEdit_match': case 'ruleEdit_sub':
        switch ($(id + 'type').selectedIndex) { // Input type
        case $v.type.regexp:    // RegExp
            if ((/\{\d+$/).test(frag)) { // {...
                list = list.concat(
                    [{'msg': ',', 'desc': ''},
                     {'msg': '}', 'desc': ''}]
                );
            } if ((/\{\d+,\d+$/).test(frag)) { // {...,...
                list = list.concat(
                    [{'msg': '}', 'desc': ''}]
                );
            } else if ((/\[[^\]]*$/).test(frag)) { // [...
                if (last === '\[') {
                    list = list.concat([{'msg': '^', 'desc': ''}]);
                }

                list = list.concat(this.re.esc);
            } else {                          // ( or common context
                if ((/\((?!\?$)[^\)]+$/).test(frag)) { // (...
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
                case '': case '^': case '|':
                case '*': case '+': case '?': case '}':
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                    break;
                case '$': case '{': case ',':
                    break;
                default:
                    list = list.concat(this.re.qt);
                    list = list.concat(this.re.com);
                    list = list.concat(this.re.esc);
                }
            }
            break;
        case $v.type.glob:      // Globbing
            switch (last) {
            case '': case '*': case '?':
                list = [];
                break;
            default:
                list =
                    [{'msg': '*', 'desc': ''},
                     {'msg': '?', 'desc': ''}];
            }
            break;
        case $v.type.hdr:       // Http request Header
            if (id === 'ruleEdit_sub') {
                list = this.header;
            }
        }
        break;
    case 'ruleEdit_repl':
        if ($('ruleEdit_subtype').selectedIndex !== $v.type.hdr) {
            var prefix = '';
            if (last !== '$') {
                prefix = '$';
            }

            list =
                [{'msg': prefix + '`', 'desc': ''},
                 {'msg': prefix + '&', 'desc': ''},
                 {'msg': prefix + '\'', 'desc': ''}];

            // Add $n
            if ($('ruleEdit_subtype').selectedIndex === $v.type.regexp) {
                var arrParen = $('ruleEdit_substr').value.match(/\(/g);
                if (arrParen !== null) {
                    for (var i = 1; i <= arrParen.length; i++) {
                        list = list.concat([{'msg': prefix + i, 'desc': ''}]);
                    }
                }
            }
        }
        break;
    case 'ruleEdit_test':
        if ($('ruleEdit_subtype').selectedIndex !== $v.type.hdr) {
            switch (frag) {
            case '':
                list =          // URLs
                [{'msg': 'http://', 'desc': ''},
                 {'msg': 'https://', 'desc': ''},
                 {'msg': 'ftp://', 'desc': ''},
                 {'msg': 'file://', 'desc': ''}];
                break;
            case 'h':
                list =
                [{'msg': 'ttp://', 'desc': ''},
                 {'msg': 'ttps://', 'desc': ''}];
                break;
            case 'ht':
                list =
                [{'msg': 'tp://', 'desc': ''},
                 {'msg': 'tps://', 'desc': ''}];
                break;
            case 'htt':
                list =
                [{'msg': 'p://', 'desc': ''},
                 {'msg': 'ps://', 'desc': ''}];
                break;
            case 'http':
                list =
                [{'msg': '://', 'desc': ''},
                 {'msg': 's://', 'desc': ''}];
                break;
            case 'f':
                list =
                [{'msg': 'tp://', 'desc': ''},
                 {'msg': 'ile://', 'desc': ''}];
                break;
            case 'ft':
                list =
                    [{'msg': 'p://', 'desc': ''}];
                break;
            case 'fi':
                list =
                    [{'msg': 'le://', 'desc': ''}];
                break;
            case 'fil':
                list =
                    [{'msg': 'e://', 'desc': ''}];
                break;
            case 'https': case 'ftp': case 'file':
                list =
                    [{'msg': '://', 'desc': ''}];
                break;
            default:
                if ((/^\w*:$/).test(frag)) {
                    list =
                        [{'msg': '//', 'desc': ''}];
                }
            }
        }
        break;
    }

    this.update(id, list);      // Update prompt
};

Prompt.prototype.update = function (id, list, code) { // Update prompt
    // id: section id; list: prompt data; code: execute after update
    var prompt, html = document.createElement('ul'), dom, hrefs;
    var txt = id + 'str';       // Input textbox
    var onClick = function () { // Function called when clicked
        // Text to be inserted
        var text = this.getElementsByTagName('span')[0].innerText;
        // Cursor postion after insertion
        var index = $(txt).selectionStart + text.length;
        $(txt).value =          // Insert
            $(txt).value.substring(0, $(txt).selectionStart) +
            text +
            $(txt).value.substring($(txt).selectionStart);
        // Set cursor
        $(txt).selectionStart = $(txt).selectionEnd = index;

        if (typeof code !== 'undefined') { // Execute code
            code();
        }

        $(txt).onclick();       // Update cursor position
        $(txt).selectedIndex = 0; // Select the first menu entry
        return text.length;       // Used by <Enter>
    };

    for (var i = 0; i < list.length; i++) { // Built up menu
        dom = document.createElement('li');
        dom.onclick = onClick;
        dom.innerHTML = '<span>' + list[i].msg + '</span>' +
            '<span>&nbsp;' + list[i].desc + '</span>';
        html.appendChild(dom);
    }

    if ($$('#' + id + 'prompt ul').length === 0) {
        return html;            // Called from init
    } else {                    // Existing
        $$('#' + id + 'prompt')[0].innerHTML = '';
        $$('#' + id + 'prompt')[0].appendChild(html);
    }
};

Prompt.prototype.init = function (id, list, code) { // Init prompts
    var txt = id + 'str';                           // Input textbox

    var node = document.createElement('div'); // Prompt menu
    node.id = id + 'prompt';
    node.className = 'prompt';

    node.onmouseover = function () {
        this.hovered = true;
        var menu = $$('#' + node.id + ' li');
        for (var i = 0; i < menu.length; i++) {
            menu[i].className = '';
        }

        $(txt).selectedIndex = undefined;
    };

    node.onmouseout = function () {
        this.hovered = false;
    };

    node.appendChild(this.update(id, list, code));
    $(id).insertBefore(node, $(txt));

    $(txt).colorize = function () { // Highlight selected
        var menu = $$('#' + node.id + ' li');
        for (var i = 0; i < menu.length; i++) {
            if (i === this.selectedIndex) {
                menu[i].className = 'selected';
            } else {
                menu[i].className = '';
            }
        }
    };

    $(txt).onfocus = function () { // On get focused
        if ($(node.id) === null) { // Prompts disabled
            return;
        }
        $(node.id).style.display = 'inline';
        $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);

        this.selectedIndex = 0;
    };

    $(txt).onblur = function () { // On blured
        if ($(node.id) === null) { // Prompts disabled
            return;
        }

        if ($(node.id).hovered !== true) {
            $(node.id).style.display = 'none';
        }

        this.selectedIndex = undefined;
    };

    $(txt).onclick = function (e) { // On clicked
        var maxNum, num;

        if ($(node.id) === null) { // Prompts disabled
            return;
        }

        maxNum = Math.floor((this.offsetWidth - 5) / 9); // Max num
        num = this.selectionStart;                       // Real num
        num = num > maxNum ? maxNum : num;
        // Move prompts to correct position
        $(node.id).style.marginLeft = num * 9 + 5 + 'px';
        $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);

        this.colorize();
    };

    $(txt).onkeyup = function (e) { // On key released
        switch (e.keyCode) {
        case 9: case 16: case 17: case 18: case 19: case 20: case 27:
        case 33: case 34: case 38: case 40: case 45: case 46:
        case 91: case 92:
        case 112: case 113: case 114: case 115: case 116: case 117:
        case 118: case 119: case 120: case 121: case 122: case 123:
        case 144: case 145:
            // No action on those keys
            break;
        default:                // Regenerate prompts
            $v['prompt_' + id.replace('ruleEdit_', '')].refresh(id);
        }
        this.colorize();
    }

    $(txt).onkeydown = function (e) { // On key pressed down
        var maxNum, num;

        if ($(node.id) === null) { // Prompts disabled
            return;
        }

        maxNum = Math.floor((this.offsetWidth - 5) / 9);
        num = this.selectionStart;
        num = num > maxNum ? maxNum : num;

        switch (e.keyCode) {
        case 13:                // Enter
            var menu = $$('#' + node.id + ' li');
            if (this.selectedIndex !== undefined &&
                menu[this.selectedIndex] !== undefined) {
                num += menu[this.selectedIndex].onclick();
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
            if (this.selectedIndex === undefined ||
                --this.selectedIndex < 0) {
                this.selectedIndex = $$('#' + node.id + ' li').length - 1;
            }
            e.preventDefault(); // Prevent cursor moving to beginning
            break;
        case 40:                // Down
            if (this.selectedIndex === undefined ||
                ++this.selectedIndex >= $$('#' + node.id + ' li').length) {
                this.selectedIndex = 0;
            }
            e.preventDefault(); // Prevent cursor moving to end
            break;
        case 33:                // PgUp
            this.selectedIndex = 0;
            e.preventDefault(); // Prevent scrolling up
            break;
        case 34:                // PgDn
            this.selectedIndex = $$('#' + node.id + ' li').length - 1;
            e.preventDefault(); // Prevent scrolling down
            break;
        case 27:                // Esc
            $(node.id).style.display = 'none';
            this.selectedIndex = undefined;
            return;
        case 9:                 // Tab
            $(node.id).style.display = 'inline';
            this.selectedIndex = 0;
            e.preventDefault(); // Prevent jumping to next tabIndex
            return;
        case 16: case 17: case 18: case 19: case 20:
        case 45: case 46: case 91: case 92:
        case 112: case 113: case 114: case 115: case 116: case 117:
        case 118: case 119: case 120: case 121: case 122: case 123:
        case 144: case 145:     // Other keys with no input
            break;
        default:                // Other key
            num++;
        }

        $(node.id).style.marginLeft = num * 9 + 5 + 'px';
        this.colorize();
    }
};

Prompt.prototype.re = {         // Prompts for RegExp
    'com': [                    // Common chars
        {'msg': '.', 'desc': ''},
        {'msg': '\\', 'desc': ''},
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
        {'msg': '\\', 'desc': '\\ddd'},
        {'msg': '\\x', 'desc': '\\xdd'},
        {'msg': '\\u', 'desc': '\\udddd'}
    ],

    'qt': [                     // Quantifiers
        {'msg': '*', 'desc': ''},
        {'msg': '+', 'desc': ''},
        {'msg': '?', 'desc': ''},
        {'msg': '{', 'desc': ''}
    ]
};

Prompt.prototype.header = [     // Prompts for headers
    {'msg': 'Accept',
     'desc': 'Content-Types that are acceptable'
    },
    {'msg': 'Accept-Charset',
     'desc': 'Character sets that are acceptable'
    },
    {'msg': 'Accept-Encoding',
     'desc': 'Acceptable encodings. See HTTP compression.'
    },
    {'msg': 'Accept-Language',
     'desc': 'Acceptable languages for response'
    },
    {'msg': 'Authorization',
     'desc': 'Authentication credentials for HTTP authentication'
    },
    {'msg': 'Cache-Control',
     'desc': 'Used to specify directives that MUST be obeyed by all caching mechanisms along the request/response chain'
    },
    {'msg': 'Connection',
     'desc': 'What type of connection the user-agent would prefer'
    },
    {'msg': 'Cookie',
     'desc': 'an HTTP cookie previously sent by the server with Set-Cookie'
    },
    {'msg': 'Content-Length',
     'desc': 'The length of the request body in octets (8-bit bytes)'
    },
    {'msg': 'Content-MD5',
     'desc': 'A Base64-encoded binary MD5 sum of the content of the request body'
    },
    {'msg': 'Content-Type',
     'desc': 'The mime type of the body of the request (used with POST and PUT requests)'
    },
    {'msg': 'Date',
     'desc': 'The date and time that the message was sent'
    },
    {'msg': 'Expect',
     'desc': 'Indicates that particular server behaviors are required by the client'
    },
    {'msg': 'From',
     'desc': 'The email address of the user making the request'
    },
    {'msg': 'Host',
     'desc': 'The domain name of the server (for virtual hosting)'
    },
    {'msg': 'If-Match',
     'desc': 'Only perform the action if the client supplied entity matches the same entity on the server.'
    },
    {'msg': 'If-Modified-Since',
     'desc': 'Allows a 304 Not Modified to be returned if content is unchanged'
    },
    {'msg': 'If-None-Match',
     'desc': 'Allows a 304 Not Modified to be returned if content is unchanged, see HTTP ETag'
    },
    {'msg': 'If-Range',
     'desc': 'If the entity is unchanged, send me the part(s) that I am missing; otherwise, send me the entire new entity'
    },
    {'msg': 'If-Unmodified-Since',
     'desc': 'Only send the response if the entity has not been modified since a specific time.'
    },
    {'msg': 'Max-Forwards',
     'desc': 'Limit the number of times the message can be forwarded through proxies or gateways.'
    },
    {'msg': 'Pragma',
     'desc': 'Implementation-specific headers that may have various effects anywhere along the request-response chain.'
    },
    {'msg': 'Proxy-Authorization',
     'desc': 'Authorization credentials for connecting to a proxy.'
    },
    {'msg': 'Range',
     'desc': 'Request only part of an entity. Bytes are numbered from 0.'
    },
    {'msg': 'Referer',
     'desc': 'This is the address of the previous web page from which a link to the currently requested page was followed.'
    },
    {'msg': 'TE',
     'desc': 'The transfer encodings the user agent is willing to accept.'
    },
    {'msg': 'Upgrade',
     'desc': 'Ask the server to upgrade to another protocol.'
    },
    {'msg': 'User-Agent',
     'desc': 'The user agent string of the user agent'
    },
    {'msg': 'Via',
     'desc': 'Informs the server of proxies through which the request was sent.'
    },
    {'msg': 'Warning',
     'desc': 'A general warning about possible problems with the entity body.'
    }
];
