'use strict';

/**
 * Initialize the Settings tab
 */
function initSettings() {
  var $settings = $('#settings');
  var local = chrome.storage.local;
  /* Enable context menu */
  local.get({context_enabled: true}, function (items) {
    $('[name="context"][data-enabled="' + items.context_enabled + '"]', $settings)
      .prop('checked', true).button('refresh');
  });
  $('[name="context"]', $settings).click(function () {
    local.set({
      context_enabled: $(this).is(':checked') && $(this).data('enabled')
    });
  });
  /* Enable icon notification */
  local.get({icon_enabled: true}, function (items) {
    $('[name="icon"][data-enabled="' + items.icon_enabled + '"]', $settings)
      .prop('checked', true).button('refresh');
  });
  $('[name="icon"]', $settings).click(function () {
    local.set({
      icon_enabled: $(this).is(':checked') && $(this).data('enabled')
    });
  });
  /* Enabled protocols */
  local.get(
    {enabled_protocols: ['http', 'https', 'ftp', 'file']}, function (items) {
      $.each(items.enabled_protocols, function (i, protocol) {
        $('[data-type="' + protocol + '"]', $settings)
          .prop('checked', true).button('refresh');
      });
    });
  $('[name="protocol"]', $settings).click(function () {
    var protocols = [];
    $('[name="protocol"]:checked', $settings).each(function () {
      protocols.push($(this).data('type'));
    });
    local.set({enabled_protocols: protocols});
  });
  /* Enabled manual redirection methods */
  local.get({manual_methods: ['page', 'link']}, function (items) {
    $.each(items.manual_methods, function (i, method) {
      $('[data-type="' + method + '"]', $settings)
        .prop('checked', true).button('refresh');
    });
  });
  $('[name="manual"]', $settings).click(function () {
    var manual = [];
    $('[name="manual"]:checked', $settings).each(function () {
      manual.push($(this).data('type'));
    });
    local.set({manual_methods: manual});
  });
  /* Enable sync */
  local.get({sync_enabled: true}, function (items) {
    $('[name="sync"][data-enabled="' + items.sync_enabled + '"]', $settings)
      .prop('checked', true).button('refresh');
  });
  $('[name="sync"]', $settings).click(function () {
    local.set({
      sync_enabled: $(this).is(':checked') && $(this).data('enabled')
    });
  });
  $('[name="manual-sync"]', $settings).click(function () {
    // TODO
  });
  // Backup & Restore/Import
  $('[name="backup"]', $settings).click(function () {
    // TODO
  });
  $('[name="restore"]', $settings).click(function () {
    // TODO
  });
}
