'use strict';

$(document).ready(function(){
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
        return;
      }
      $info.html('');
      $.each(info[id], function (i, message) {
        $info.prepend('<pre>' + message + '</pre>');
      });
    });
  });
});
