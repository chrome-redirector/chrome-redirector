'use strict';

$(document).ready(function(){
  applyI18n();
  $('#accordion').accordion({fillSpace: true});
  $('.button-set').buttonset();
  /* Set messages */
  chrome.runtime.getBackgroundPage(function (global) {
    var info = global.redirector_background_js.info;
    chrome.tabs.query({active: true}, function (tabs) {
      var id = tabs[0].id;
      var $info = $('#info');
      if (info[id] === undefined) {
        $info.html('<pre>Nothing recorded</pre>');
      } else {
        $info.html('');
        $.each(info[id], function (i, message) {
          $info.prepend('<pre>' + message + '</pre>');
        });
      }
      $('#accordion').accordion('resize');
    });
  });
  $('#dismiss').click(function () {
    chrome.storage.local.set({icon_enabled: false});
    close();
  });
  $('#options').click(function () {
    openOptionsPage();
  });
});
