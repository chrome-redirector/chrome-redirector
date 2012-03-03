/**
 * Prompt obj
 */

/*jslint plusplus: false */
/*global $: true, $$: true, $v: true, $f: true, tmp: true,
  document: true*/

Prompt = function (id, list, code) {  // Prompt obj
    this.init(id, list, code);
};

Prompt.prototype.update = function (id, list, code) {
    var prompt, html = document.createElement('ul'), dom, hrefs;
    var txt = id + 'str';
    var onClick = function () {
        var text, index;
        text = this.getElementsByTagName('span')[0].innerText;
        index = $(txt).selectionStart + text.length;
        $(txt).value =
            $(txt).value.substring(0, $(txt).selectionStart) +
            text +
            $(txt).value.substring($(txt).selectionStart);
        $(txt).selectionStart = $(txt).selectionEnd = index;

        if (typeof code !== 'undefined') {
            code();
        }

        $(txt).click();
    };

    if (typeof list === 'string') {
        list = this.data[list];
    }

    for (i = 0; i < list.length; i++) {
        dom = document.createElement('li');
        dom.innerHTML = '<a>' +
            '<span>' + list[i].msg + '</span>' +
            '<span>&nbsp;' + list[i].desc + '</span>' +
            '</a>';
        html.appendChild(dom);
    }

    hrefs = html.getElementsByTagName('a');
    for (i = 0; i < hrefs.length; i++) {
        hrefs[i].onclick = onClick;
    }

    if ($$('#' + id + 'prompt ul').length === 0) {
        return html;            // Called from init
    } else {
        $$('#' + id + 'prompt ul')[0].innerHTML = '';
        $$('#' + id + 'prompt ul')[0].appendChild(html);
    }
};

Prompt.prototype.init = function (id, list, code) {
    var txt = id + 'str';

    var node = document.createElement('div');
    node.id = id + 'prompt';
    node.className = 'prompt';
    node.onmouseover = function () {
        this.hovered = true;
        var links = $$('#' + node.id + ' a');
        for (var i = 0; i < links.length; i++) {
            links[i].className="";
        }
    };
    node.onmouseout = function () {
        this.hovered = false;
    }
    node.appendChild(this.update(id, list, code));
    $(id).insertBefore(node, $(txt));

    $(txt).onfocus = function () {
        $(node.id).style.display='inline';
    }
    $(txt).onblur = function () {
        if ($(node.id).hovered !== true) {
            $(node.id).style.display='none';
        }
    }

    $(txt).onclick = function (e) {
        var maxNum = Math.floor((this.offsetWidth - 5) / 9),
        num = this.selectionStart;
        num = num > maxNum ? maxNum : num;

        $(node.id).style.marginLeft = num * 9 + 5 + 'px';
    }

    $(txt).onkeydown = function (e) {
        var maxNum = Math.floor((this.offsetWidth - 5) / 9),
        num = this.selectionStart;
        num = num > maxNum ? maxNum : num;

        switch (e.keyCode) {
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
            var links = $$('#' + node.id + ' a');
            if (this.selectedIndex === undefined) {
                this.selectedIndex = links.length;
            }
            if (--this.selectedIndex < 0) {
                this.selectedIndex = links.length - 1;
            }
            for (i = 0; i < links.length; i++) {
                if (i === this.selectedIndex) {
                    links[i].className = 'selected';
                } else {
                    links[i].className = '';
                }
            }
            e.preventDefault(); // Prevent cursor moving to beginning
            break;
        case 40:                // Down
            var links = $$('#' + node.id + ' a');
            if (this.selectedIndex === undefined) {
                this.selectedIndex = -1;
            }
            if (++this.selectedIndex >= links.length) {
                this.selectedIndex = 0;
            }
            for (i = 0; i < links.length; i++) {
                if (i === this.selectedIndex) {
                    links[i].className = 'selected';
                } else {
                    links[i].className = '';
                }
            }
            e.preventDefault(); // Prevent cursor moving to end
            break;
        case 33:                // PgUp
            var links = $$('#' + node.id + ' a');
            this.selectedIndex = 0;
            for (i = 0; i < links.length; i++) {
                if (i === this.selectedIndex) {
                    links[i].className = 'selected';
                } else {
                    links[i].className = '';
                }
            }
            e.preventDefault(); // Prevent scrolling up
            break;
        case 34:                // PgDn
            var links = $$('#' + node.id + ' a');
            this.selectedIndex = links.length - 1;
            for (i = 0; i < links.length; i++) {
                if (i === this.selectedIndex) {
                    links[i].className = 'selected';
                } else {
                    links[i].className = '';
                }
            }
            e.preventDefault(); // Prevent scrolling down
            break;
        case 27:                // Esc
            $(node.id).style.display = 'none';
            return;
            break;
        case 9:                 // Tab
            $(node.id).style.display = 'inline';
            e.preventDefault(); // Prevent jumping to next tabIndex
            return;
            break;
        case 16:                // Shift
        case 17:                // Ctrl
        case 18:                // Alt
        case 19:                // Pause
        case 20:                // CapsLk
        case 45:                // Insert
        case 46:                // Delete
        case 91:                // Win-left
        case 92:                // Win-right
        case 112:               // F1
        case 113:               // F2
        case 114:               // F3
        case 115:               // F4
        case 116:               // F5
        case 117:               // F6
        case 118:               // F7
        case 119:               // F8
        case 120:               // F9
        case 121:               // F10
        case 122:               // F11
        case 123:               // F12
        case 144:               // NmLk
        case 145:               // ScrLk
            //Other keys with no input
            break;
        default:                // Other key
            num++;
        }

        $(node.id).style.marginLeft = num * 9 + 5 + 'px';
    }
}

Prompt.prototype.data = {
    'regexp': [
        {
            'msg': '\\',
            'desc': ''
        },
        {
            'msg': '^',
            'desc': ''
        },
        {
            'msg': '$',
            'desc': ''
        },
        {
            'msg': '.',
            'desc': ''
        },
        {
            'msg': '*',
            'desc': ''
        },
        {
            'msg': '+',
            'desc': ''
        },
        {
            'msg': '?',
            'desc': ''
        },
        {
            'msg': '{',
            'desc': ''
        },
        {
            'msg': '}',
            'desc': ''
        },
        {
            'msg': '|',
            'desc': ''
        },
        {
            'msg': '[',
            'desc': ''
        },
        {
            'msg': '[^',
            'desc': ''
        },
        {
            'msg': ']',
            'desc': ''
        },
        {
            'msg': '(',
            'desc': ''
        },
        {
            'msg': ')',
            'desc': ''
        },
        {
            'msg': '(?:',
            'desc': ''
        },
        {
            'msg': '(?!',
            'desc': ''
        },
        {
            'msg': '(?=',
            'desc': ''
        },
        {
            'msg': '\\b',
            'desc': ''
        },
        {
            'msg': '\\B',
            'desc': ''
        },
        {
            'msg': '\\w',
            'desc': ''
        },
        {
            'msg': '\\W',
            'desc': ''
        },
        {
            'msg': '\\d',
            'desc': ''
        },
        {
            'msg': '\\D',
            'desc': ''
        },
    ],

    'wildcard': [
        {
            'msg': '*',
            'desc': ''
        },
        {
            'msg': '?',
            'desc': ''
        }
    ],

    'header': [
        {
            'msg': 'Accept',
            'desc': 'Content-Types that are acceptable'
        },
        {
            'msg': 'Accept-Charset',
            'desc': 'Character sets that are acceptable'
        },
        {
            'msg': 'Accept-Encoding',
            'desc': 'Acceptable encodings. See HTTP compression.'
        },
        {
            'msg': 'Accept-Language',
            'desc': 'Acceptable languages for response'
        },
        {
            'msg': 'Authorization',
            'desc': 'Authentication credentials for HTTP authentication'
        },
        {
            'msg': 'Cache-Control',
            'desc': 'Used to specify directives that MUST be obeyed by all caching mechanisms along the request/response chain'
        },
        {
            'msg': 'Connection',
            'desc': 'What type of connection the user-agent would prefer'
        },
        {
            'msg': 'Cookie',
            'desc': 'an HTTP cookie previously sent by the server with Set-Cookie (below)'
        },
        {
            'msg': 'Content-Length',
            'desc': 'The length of the request body in octets (8-bit bytes)'
        },
        {
            'msg': 'Content-MD5',
            'desc': 'A Base64-encoded binary MD5 sum of the content of the request body'
        },
        {
            'msg': 'Content-Type',
            'desc': 'The mime type of the body of the request (used with POST and PUT requests)'
        },
        {
            'msg': 'Date',
            'desc': 'The date and time that the message was sent'
        },
        {
            'msg': 'Expect',
            'desc': 'Indicates that particular server behaviors are required by the client'
        },
        {
            'msg': 'From',
            'desc': 'The email address of the user making the request'
        },
        {
            'msg': 'Host',
            'desc': 'The domain name of the server (for virtual hosting), mandatory since HTTP/1.1'
        },
        {
            'msg': 'If-Match',
            'desc': 'Only perform the action if the client supplied entity matches the same entity on the server. This is mainly for methods like PUT to only update a resource if it has not been modified since the user last updated it.'
        },
        {
            'msg': 'If-Modified-Since',
            'desc': 'Allows a 304 Not Modified to be returned if content is unchanged'
        },
        {
            'msg': 'If-None-Match',
            'desc': 'Allows a 304 Not Modified to be returned if content is unchanged, see HTTP ETag'
        },
        {
            'msg': 'If-Range',
            'desc': 'If the entity is unchanged, send me the part(s) that I am missing; otherwise, send me the entire new entity'
        },
        {
            'msg': 'If-Unmodified-Since',
            'desc': 'Only send the response if the entity has not been modified since a specific time.'
        },
        {
            'msg': 'Max-Forwards',
            'desc': 'Limit the number of times the message can be forwarded through proxies or gateways.'
        },
        {
            'msg': 'Pragma',
            'desc': 'Implementation-specific headers that may have various effects anywhere along the request-response chain.'
        },
        {
            'msg': 'Proxy-Authorization',
            'desc': 'Authorization credentials for connecting to a proxy.'
        },
        {
            'msg': 'Range',
            'desc': 'Request only part of an entity. Bytes are numbered from 0.'
        },
        {
            'msg': 'Referer',
            'desc': 'This is the address of the previous web page from which a link to the currently requested page was followed. (The word “referrer” is misspelled in the RFC as well as in most implementations.)'
        },
        {
            'msg': 'TE',
            'desc': 'The transfer encodings the user agent is willing to accept: the same values as for the response header Transfer-Encoding can be used, plus the "trailers" value (related to the "chunked" transfer method) to notify the server it expects to receive additional headers (the trailers) after the last, zero-sized, chunk.'
        },
        {
            'msg': 'Upgrade',
            'desc': 'Ask the server to upgrade to another protocol.'
        },
        {
            'msg': 'User-Agent',
            'desc': 'The user agent string of the user agent'
        },
        {
            'msg': 'Via',
            'desc': 'Informs the server of proxies through which the request was sent.'
        },
        {
            'msg': 'Warning',
            'desc': 'A general warning about possible problems with the entity body.'
        }
    ],

    'repl': [
        // {
        //     'msg': '',
        //     'desc': ''
        // },
    ],

    'url': [
        {
            'msg': 'http://',
            'desc': ''
        },
        {
            'msg': 'https://',
            'desc': ''
        },
        {
            'msg': 'ftp://',
            'desc': ''
        },
        {
            'msg': 'file://',
            'desc': ''
        },
    ]
};
