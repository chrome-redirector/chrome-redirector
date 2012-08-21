#!/usr/bin/env node
/*
 * Generate other locales from default locale and
 * their existing copies
 */

var fs = require('fs'),
    glob = require('glob');
// Settings
var dir_root = '../',
    locales = dir_root + '_locales/*/messages.json';
// Read config
var manifest = require(dir_root + 'manifest.json');
var default_locale_path = dir_root + '_locales/' +
  manifest.default_locale + '/messages.json';
var default_locale = require(default_locale_path);
// Parse locales
glob(locales, null, function (error, files) {
  if (error) {
    throw new Error('Invalid locale file(s) pattern: ' + locales);
  }
  files.forEach(function (file) {
    if (file === default_locale_path) {
      return;
    }
    var locale;
    try {
      locale = require(file);
    } catch (x) {
      locale = {};
    }
    for (var key in default_locale) {
      if (key[0] !== '$' && locale[key] === undefined) {
        locale[key] = default_locale[key];
      }
    }
    fs.writeFile(file, JSON.stringify(locale, null, 2));
  });
});
