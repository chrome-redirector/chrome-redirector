$(document).ready(function () {
  'use strict';

  /* Initialize elements */
  // Show/fold results
  $('#toggle-details').click(function () {
    $('#debug-info details').prop({open: $(this).prop('checked')});
  });
  // Clear results
  $('#clear-log').click(function () {
    $('#debug-info').html('');
  });
  // Reload
  $('#reload').click(function () {
    chrome.devtools.inspectedWindow.reload();
  });

  /* Log all requests */
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    var tab_id = chrome.devtools.inspectedWindow.tabId;
    chrome.extension.sendMessage(
      null,
      {command: 'request_data', tab_id: tab_id, url: request.request.url},
      function (extra) {
        parseRequest({request: request, extra: extra});
      });
  });
  /* Select user choosed request */
  chrome.devtools.panels.setOpenResourceHandler(function (resource) {
    $('#debug-info details').prop({open: false});
    $('#debug-info>p>details>details:contains(' + resource.url + ')')
      .parent().prop({open: true});
  });
  /* Clear log when tab navigates to a new url */
  chrome.devtools.network.onNavigated.addListener(function() {
    $('#debug-info').append('<hr />');
    // $('#debug-info').html('');
  });
  function parseRequest (obj) {
    var request = obj.request;
    var extra = obj.extra;
    if (extra === null) {
      extra = {id: 'null', type: request.response.content.mimeType};
    }
    var $info =  $('<details>')
      .append('<summary>URL</summary>')
      .append(request.request.url);
    if (extra.redirected) {
      $info.after('<br />From' + extra.from);
    }
    var $request_header = $('<details>')
      .append('<summary>Request Headers</summary>');
    request.request.headers.forEach(function (header) {
      $request_header.append(
        $('<details>')
          .append($('<summary>').text(header.name))
          .append(header.value)
      );
    });
    var $response_header = $('<details>')
      .append('<summary>Response Headers</summary>');
    request.response.headers.forEach(function (header) {
      $response_header.append(
        $('<details>')
          .append($('<summary>').text(header.name))
          .append(header.value)
      );
    });
    $('#debug-info')
      .append($('<p>').append($('<details>').append(
        $('<summary>').text( // Header line
          // Request ID
          '#' + extra.id +
            // Stated time
            ' @' + new Date(request.startedDateTime).toLocaleTimeString() +
            // Elapsed time
            ' +' + request.time + '(ms)' +
            // Type
            ' [' + extra.type + ']'
        )
      ).append($info).append($request_header).append($response_header)));
  }
});
