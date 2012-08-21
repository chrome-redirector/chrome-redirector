#!/usr/bin/env node
/* Generate default locale file from HTML files, scripts and
 * existing default locale
 */

var fs = require('fs'),
    glob = require('glob'),
    jsdom = require('jsdom'),
    $ = require('jquery'),
    parser = require('uglify-js').parser;
// Settings
var dir_root = '../',
    pages = dir_root + 'pages/{options,popup,debugger}.html',
    scripts = dir_root + 'scripts/*.js';
// Read config
var manifest = require(dir_root + 'manifest.json');
var default_locale_path = dir_root + '_locales/' +
  manifest.default_locale + '/messages.json';
var locale;
try {
  locale = require(default_locale_path);
} catch (x) {
  locale = {};
}
// Parse HTML
glob(pages, null, function (error, files) {
  if (error) {
    throw new Error('Invalid HTML file(s) pattern: ' + pages);
  }
  files.forEach(function (file) {
    parseHTML(file);
  });
});
// Parse Script
glob(scripts, null, function (error, files) {
  if (error) {
    throw new Error('Invalid script file(s) pattern: ' + pages);
  }
  files.forEach(function (file) {
    parseScript(file);
  });
});
// Output
process.on('exit', function () {
  fs.writeFileSync(default_locale_path, JSON.stringify(locale, null, 2));
});

/**
 *Parse HTML files
 */
function parseHTML(file) {
  jsdom.env(file, function (error, window) {
    if (error) {
      throw new Error('Failed to parse HTML file: ' + file);
    }
    $.create(window)('[data-i18n]').each(function () {
      var $element = $(this);
      $element.data('i18n').replace(/\s*/g, '').split(';').forEach(function (pair) {
        var message_name = pair.replace(/.*:/, '');
        if (locale[message_name] || locale['$' + message_name]) {
          // This message has been translated or at least defined
          return;
        }
        var prop_name = pair.indexOf(':') < 0 ? '' : pair.replace(/:.*/, '');
        var message;
        if (prop_name) {
          message = $element.prop(prop_name);
        } else {
          message = $element.text();
          if (!message) {
            // <input>?
            message = $element.next('label,span').text();
          }
        }
        // Names of newly created entries are prefixed with $
        locale['$' + message_name] = {'message': message};
      });
    });
  });
}

/**
 * Parse script
 */
function parseScript(file) {
  fs.readFile(file, 'utf8', function (error, data) {
    if (error) {
      throw new Error('Failed to parse script: ' + file);
    }
    traverse(parser.parse(data), function (node) {
      if (node[0] === 'call' &&
          node[1][0] === 'name' && node[1][1] === '_' &&
          node[2][0][0] === 'string') {
        var message_name = node[2][0][1];
        if (locale[message_name] || locale['$' + message_name]) {
          // This message has been translated or at least defined
          return;
        }
        locale['$' + message_name] = {'message': message_name};
      }
    });
    function traverse(node, visit) {
      if (node instanceof Array) {
        visit(node);
        node.forEach(function (child) {
          traverse(child, visit);
        });
      }
    }
  });
}
