'use strict';

$(document).ready(function(){
  /* Global namespace*/
  window.redirector_options_js = {
    urlValidator: new UrlUtil.Validator(),
    urlParser: new UrlUtil.Parser()
  };
  /* The navigation tabs */
  var tab_index = $('#nav-tabs>ul>li').length - 1;
  $('#nav-tabs').tabs();
  /* Initialize dialogs */
  initDialogs();
  /* Initialize buttons */
  initButtons();
  /* Initialize datalists (autocomplete) */
  initDatalist();
  /* Initialize misc */
  initMisc();
  /* Load rules */
  loadRules();
  /* Init Settings tab */
  initSettings();
  /* Init Help tab */
  initHelp();
});

/* Create selectable & sortable list string (helper)
 */
function wrapListItem(item) {
  var pattern = '<li><span class="rule-handle ui-icon ui-icon-script"></span>\
\0x0</li>';
  return pattern.replace('\0x0', item);
}

/**
 * All dialog initialization matters
 */
function initDialogs() {
  /* Dialog on rule creation */
  $('#rule-creator').dialog({autoOpen: false, modal: true, buttons: [
    {
      text: 'Next',
      click: function () {
        $(this).dialog('close');
        var type = $('#rule-creator [type="radio"][name="type"]:checked')
          .data('type');
        var rule = {
          enabled: true,
          type: type,
          name: (new Date()).toISOString()
        };
        switch (type) {
        case 'fast_matching': case 'redirect':
        case 'request_header': case 'response_header':
        case 'error_handling':
          rule.conditions = [];
          rule.actions = [];
          break;
        case 'online':
          rule.url = '';
          break;
        default:
          assertError(false, new Error());
        }
        var $rule_editor = $('#rule-editor');
        $rule_editor.data({
          rule: rule,
          rule_index: -1
        });
        $rule_editor.dialog('open');
      }
    },
    {
      text: 'Cancel',
      click: function () {$(this).dialog('close');}
    }
  ]});
  /* Dialog on action creation */
  $('#action-creator').dialog({autoOpen: false, modal: true, buttons: [
    {
      text: 'Next',
      click: function () {
        var type = $('[name="type"]:checked', $(this)).data('type');
        if (type === 'redirect') {
          var actions = $(this).data('actions');
          try {
            actions.forEach(function (action) {
              switch (action.type) {
              case 'redirect_cancel': case 'redirect_to':
              case 'redirect_to_transparent': case 'redirect_to_empty':
                throw new Error(action.type +
                                ' conflicts with existing actions');
              default:
                break;
              }
            });
          } catch (x) {
            alertDialog(x.message);
            return;
          }
        }
        $(this).dialog('close');
        $('#action-editor-' + type).dialog('open');
      }
    },
    {
      text: 'Cancel',
      click: function () {$(this).dialog('close');}
    }
  ]});
  /* Editor dialogs */
  /**
   * Save the editing rule
   */
  function saveRule($dialog) {
    var rule = $dialog.data('rule');
    var type = rule.type;
    delete rule.type;
    rule.enabled = $('#rule-editor [name="rule-enabled"]:checked')
      .data('enabled');
    rule.name = $('[name="name"]', $dialog).prop('value');
    if (type === 'online') {
      rule.url = $('[name="online"]', $dialog).prop('value');
      if (!window.redirector_options_js.urlValidator.validate(rule.url)) {
        throw new Error('Please enter a valid URL');
      }
    }
    var index = $dialog.data('rule_index');
    var opt = {};
    opt[type] = [];
    chrome.storage.local.get(opt, function (items) {
      var value = items[type];
      if (index < 0) {
        value.push(rule);
      } else {
        value[index] = rule;
      }
      var result = {};
      result[type] = value;
      chrome.storage.local.set(result, function () {
        loadRules();
      });
    });
  }
  /**
   * Save the editing condition
   */
  function saveCondition($dialog) {
    var $rule_editor = $('#rule-editor');
    var rule = $rule_editor.data('rule');
    var condition = {};
    var resource_type = [];
    var index = $rule_editor.data('condition_index');
    switch ($rule_editor.data('rule').type) {
    case 'fast_matching':
      $.each([
        'hostContains', 'hostEquals', 'hostPrefix', 'hostSuffix',
        'pathContains', 'pathEquals', 'pathPrefix', 'pathSuffix',
        'queryContains', 'queryEquals', 'queryPrefix', 'querySuffix',
        'urlContains', 'urlEquals', 'urlPrefix', 'urlSuffix',
        'schemes', 'ports'
      ], function (i, name) {
        var value = $('[name="' + name + '"]', $dialog).prop('value');
        if (!value) {
          return;
        }
        var my = window.redirector_options_js;
        switch (name) {
        case 'hostContains':
          if (my.urlValidator.validateHostContains()) {
            condition.hostContains = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'hostEquals':
          if (my.urlValidator.validateHostEquals(value)) {
            condition.hostEquals = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'hostPrefix':
          if (my.urlValidator.validateHostPrefix(value)) {
            condition.hostPrefix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'hostSuffix':
          if (my.urlValidator.validateHostSuffix(value)) {
            condition.hostSuffix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'pathContains':
          if (my.urlValidator.validatePathContains(value)) {
            condition.pathContains = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'pathEquals':
          if (my.urlValidator.validatePathEquals(value)) {
            condition.pathEquals = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'pathPrefix':
          if (my.urlValidator.validatePathPrefix(value)) {
            condition.pathPrefix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'pathSuffix':
          if (my.urlValidator.validatePathSuffix(value)) {
            condition.pathSuffix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'queryContains':
          if (my.urlValidator.validateQueryContains(value)) {
            condition.queryContains = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'queryEquals':
          if (my.urlValidator.validateQueryEquals(value)) {
            condition.queryEquals = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'queryPrefix':
          if (my.urlValidator.validateQueryPrefix(value)) {
            condition.queryPrefix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'querySuffix':
          if (my.urlValidator.validateQuerySuffix(value)) {
            condition.querySuffix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'urlContains':
          if (my.urlValidator.validateUrlContains(value)) {
            condition.urlContains = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'urlEquals':
          if (my.urlValidator.validateUrlEquals(value)) {
            condition.urlEquals = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'urlPrefix':
          if (my.urlValidator.validateUrlPrefix(value)) {
            condition.urlPrefix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'urlSuffix':
          if (my.urlValidator.validateUrlSuffix(value)) {
            condition.urlSuffix = value;
          } else {
            throw new Error('Invalid ' + name + ' value');
          }
          break;
        case 'schemes':
          var schemes = value.split(/,\s*/);
          var tmp = {};
          schemes.forEach(function (scheme) {
            tmp[scheme] = true;
          });
          delete tmp[''];
          schemes = Object.keys(tmp);
          if (schemes.length === 0) {
            throw new Error('No valid input!');
          }
          schemes.forEach(function (scheme) {
            if (!my.urlValidator.validateScheme(scheme)) {
              throw new Error('Invalid ' + name + ' value');
            }
          });
          condition.schemes = schemes;
          break;
        case 'ports':
          var ports = JSON.parse('[' + value + ']');
          ports.forEach(function (port) {
            if ($.isNumeric(port) === true) {
              return;
            }
            if (port.length !== 2 ||
                !$.isNumeric(port[0]) || !$.isNumeric(port[1]) ||
                port[0] >= port[1]) {
              throw new Error('Ranges are of format [x, y] where x < y');
            }
          });
          condition.ports = ports;
          break;
        default:
          condition[name] = value;
        }
      });
      $('#condition-editor-fast_matching [type="checkbox"]:not(:first):checked')
        .each(function () {
          resource_type.push($(this).data('type'));
        });
      if (resource_type.length > 0 && resource_type.length < 8) {
        condition.resource_type = resource_type;
      }
      break;
    case 'redirect':
    case 'request_header':
    case 'response_header':
    case 'error_handling':
      condition.type = $('[type="radio"][name="type"]:checked', $dialog)
        .data('type');
      if (condition.type === 'manual') {
        // There exist some other conditions
        if (rule.conditions.length > 0 && index < 0) {
          throw new Error(
            'Manual redirection rule cannot coexist with other condition');
        }
        // Check if any inconsistent action type exists
        rule.actions.forEach(function (action) {
          var type = action.type;
          if (type !== 'redirect_regexp' && type !== 'redirect_wildcard' &&
              type !== 'redirect_to') {
            throw new Error('Only RegExp or wildcard redirection is \
allowed in manual redirection');
          }
        });
      } else {
        condition.value = $('[name="value"]', $dialog).prop('value');
        // Check for syntax errors
        if (condition.type === 'regexp') {
          regexpStringToRegexp(condition.value);
        } else {
          wildcardToRegexp(condition.value);
        }
        $('#condition-editor-normal [name="resource"]:not(:first):checked')
          .each(function () {
            resource_type.push($(this).data('type'));
          });
        if (resource_type.length > 0 && resource_type.length < 8) {
          condition.resource_type = resource_type;
        }
      }
      break;
    default:
      assertError(false, new Error());
    }
    if (Object.keys(condition).length === 0) {
      throw new Error('No input!');
    }
    var $list = $('#rule-editor-conditions');
    if (index < 0) {
      rule.conditions.push(condition);
      $list.append(wrapListItem(JSON.stringify(condition)));
    } else {
      rule.conditions[index] = condition;
      $('li:eq(' + index + ')', $list)
        .replaceWith(wrapListItem(JSON.stringify(condition)));
    }
    $rule_editor.data({condition_index: null});
  }
  /**
   * Save the editing action
   */
  function saveAction ($dialog) {
    var $rule_editor = $('#rule-editor');
    var action = {
      type: $('[type="radio"][name="type"]:checked', $dialog).data('type')
    };
    var rule = $rule_editor.data('rule');
    var index = $rule_editor.data('action_index');
    switch ($dialog.prop('id')) {
    case 'action-editor-redirect':
      // Check if inconsistent type action is to be saved
      if (rule.conditions.length > 0 && rule.conditions[0].type === 'manual') {
        if (action.type !== 'redirect_regexp' &&
            action.type !== 'redirect_wildcard' &&
            action.type !== 'redirect_to') {
          throw new Error(
            'There is no point for action of type `' + action.type +
              '\' used in manual redirection');
        }
      }
      if (rule.actions.length > 0 && index < 0) {
        switch (action.type) {
        case 'redirect_cancel': case 'redirect_to':
        case 'redirect_to_transparent': case 'redirect_to_empty':
          throw new Error('Action type `' + action.type +
                          '\' is inconsistent with other actions!');
        default:
          break;
        }
      }
      action.from = $('[name="from"]', $dialog).prop('value');
      action.to = $('[name="to"]', $dialog).prop('value');
      switch (action.type) {
      case 'redirect_regexp':
      case 'redirect_wildcard':
        if (action.from === '') {
          throw new Error('Incomplete inputs!');
        }
        // Check for syntax errors and add possible modifiers
        if (rule.type !== 'fast_matching') {
          action.modifiers = [];
          $('[name="modifier"]:checked', $dialog).each(function () {
            action.modifiers.push($(this).data('type'));
          });
          if (action.type === 'redirect_regexp') {
            regexpStringToRegexp(action.from, action.modifiers);
          } else {
            wildcardToRegexp(action.from, action.modifiers);
          }
          action.decode = $('[name="decode"]', $dialog)
            .prop('checked');
        } else {
          try {
            if (action.type === 'redirect_regexp') {
              regexpStringToRegexp(action.from);
              action.modifiers = [];
              $('[name="modifier"]:checked', $dialog).each(function () {
                action.modifiers.push($(this).data('type'));
              });
            } else {
              wildcardToRegexp(action.from);
            }
          } catch (x) {
            alertDialog(
              'There was an error: ' + x.message + "." +
                "however, since it was not reported by the RE2 engine, " +
                "you may choose to ignore this error if nothing was wrong"
            );
          }
        }
        break;
      case 'redirect_to':
        if (action.to === '' ||
            !window.redirector_options_js.urlValidator.validate(action.to)) {
          throw new Error('Incomplete inputs!');
        }
        delete action.from;
        break;
      default:
        delete action.from;
        delete action.to;
        break;
      }
      break;
    case 'action-editor-request_header':
      action.name = $('[name="name"]', $dialog).prop('value');
      if (action.name === '') {
        throw new Error('Incomplete inputs!');
      }
      if (action.type !== 'request_header_remove') {
        action.value = $('[name="value"]', $dialog).prop('value');
      }
    case 'action-editor-response_header':
      action.name = $('[name="name"]', $dialog).prop('value');
      if (action.name === '') {
        throw new Error('Incomplete inputs!');
      }
      if ($('[name="match_value"]', $dialog).prop('checked') === true) {
        action.value = $('[name="value"]', $dialog).prop('value');
      }
      break;
    default:
      assertError(false, new Error());
    }
    var $list = $('#rule-editor-actions');
    if (index < 0) {
      $rule_editor.data('rule').actions.push(action);
      $list.append(wrapListItem(JSON.stringify(action)));
    } else {
      $rule_editor.data('rule').actions[index] = action;
      $('li:eq(' + index + ')', $list)
        .replaceWith(wrapListItem(JSON.stringify(action)));
    }
    $rule_editor.data({action_index: null});
  }
  $('.editor-dialog').dialog({
    autoOpen: false, modal: true, width: 1000, height: 650, buttons: [
      {
        text: 'Save',
        click: function () {
          switch ($(this).prop('id')) {
          case 'rule-editor':
            try {
              saveRule($(this));
            } catch (x) {
              alertDialog(x.message);
              return;
            }
            break;
          case 'condition-editor-fast_matching':
          case 'condition-editor-normal':
            try {
              saveCondition($(this));
            } catch (x) {
              alertDialog(x.message);
              return;
            }
            break;
          case 'action-editor-redirect':
          case 'action-editor-request_header':
          case 'action-editor-response_header':
            try {
              saveAction($(this));
            } catch (x) {
              alertDialog(x.message);
              return;
            }
            break;
          default:
            assertError(false, new Error());
          }
          $(this).dialog('close');
        }
      },
      {
        text: 'Cancel',
        click: function () {$(this).dialog('close');}
      }
    ]
  });
  /* Dialogs open/resize => accordions resize */
  $('.editor-dialog').bind('dialogopen dialogresize', function () {
    $('#' + $(this).prop('id') + '>.accordion').accordion('resize');
  });
  /* Dialogs open => open the first content */
  $('.editor-dialog').bind('dialogopen', function () {
    $('.accordion', $(this)).accordion('activate', 0);
  });
  /* Rule editor open binding */
  $('#rule-editor').bind('dialogopen', function () {
    var rule = $(this).data('rule');
    $('[data-enabled="' + rule.enabled + '"]', $(this))
      .prop({checked: true})
      .button('refresh');
    $('[name="name"]', $(this)).prop('value', rule.name);
    if (rule.type === 'online') {
      $('#rule-editor>.local-rule').hide();
      $('#rule-editor>.online-rule').show();
      $('#rule-editor [name="online"]').prop({value: rule.url});
      return;
    }
    $('#rule-editor>.local-rule').show();
    $('#rule-editor>.online-rule').hide();
    $('#rule-editor-conditions').html('');
    $.each(rule.conditions, function (i, condition) {
      $('#rule-editor-conditions')
        .append(wrapListItem(JSON.stringify(condition)));
    });
    $('#rule-editor-actions').html('');
    $.each(rule.actions, function (i, action) {
      $('#rule-editor-actions')
        .append(wrapListItem(JSON.stringify(action)));
    });
  });
  /* Fast matching condition editor open binding */
  $('#condition-editor-fast_matching').bind('dialogopen', function () {
    var $rule_editor = $('#rule-editor');
    var index = $rule_editor.data('condition_index');
    var condition = index < 0 ? [] :
      $rule_editor.data('rule').conditions[index];
    var $dialog = $(this);
    $.each([
      'hostContains', 'hostEquals', 'hostPrefix', 'hostSuffix',
      'pathContains', 'pathEquals', 'pathPrefix', 'pathSuffix',
      'queryContains', 'queryEquals', 'queryPrefix', 'querySuffix',
      'urlContains', 'urlEquals', 'urlPrefix', 'urlSuffix',
      'schemes', 'ports'
    ], function (i, name) {
      var value = condition[name];
      if (value === undefined) {
        value = '';
      } else if (name === 'schemes' || name === 'ports') {
        value = JSON.stringify(value).slice(1, -1).replace(/"/g, '');
      }
      $('[name="' + name + '"]', $dialog).prop('value', value);
    });
    var resource_type = condition.resource_type;
    var resource_type_all = false;
    if (resource_type === undefined) {
      resource_type_all = true;
    }
    $('[type="checkbox"][name="resource"]', $(this)).each(function () {
      var checked = resource_type_all ||
        resource_type.indexOf($(this).data('type')) >= 0;
      $(this).prop('checked', checked).button('refresh');
    });
  });
  /* Normal condition editor open binding */
  $('#condition-editor-normal').bind('dialogopen', function () {
    var $rule_editor = $('#rule-editor');
    var rule = $rule_editor.data('rule');
    // No point for manual redirection rule to change headers
    $('[data-type="manual"]', $(this))
      .prop('disabled', rule.type !== 'redirect').button('refresh');
    // Manual redirection rules cannot select resource
    var index = $rule_editor.data('condition_index');
    var condition = index < 0 ? {type: 'regexp'} : rule.conditions[index];
    if (condition.type === 'manual' || rule.type === 'error_handling') {
      $('[name="resource"]', $(this)).prop('disabled', true).button('refresh');
    }
    $('[data-type="' + condition.type + '"]', $(this))
      .prop('checked', true).button('refresh');
    $('[name="value"]', $(this)).prop('value', condition.value);
    var resource_type = condition.resource_type;
    var resource_type_all = false;
    if (resource_type === undefined) {
      resource_type_all = true;
    }
    $('[type="checkbox"][name="resource"]', $(this)).each(function () {
      var checked = resource_type_all ||
        resource_type.indexOf($(this).data('type')) >= 0;
      $(this).prop('checked', checked).button('refresh');
    });
  });
  // Resource enable/disable switcher
  $('#condition-editor-normal [data-type]').click(function () {
    // Ignore rules of type error_handling
    if ($rule_editor.data('rule').type === 'error_handling') {
      return;
    }
    var disabled = $(this).data('type') === 'manual';
    $('#condition-editor-normal [name="resource"]')
      .prop('disabled', disabled).button('refresh');
  });
  /* Redirect action editor open binding */
  $('#action-editor-redirect').bind('dialogopen', function () {
    var $rule_editor = $('#rule-editor');
    var rule = $rule_editor.data('rule');
    if (rule.type === 'fast_matching') {
      $('[name="modifier"]', $(this)).button('disable');
      $('[name="decode"]', $(this)).button('disable');
    } else {
      $('[name="modifier"]', $(this)).button('enable');
      $('[name="decode"]', $(this)).button('enable');
    }
    var index = $rule_editor.data('action_index');
    var action = index < 0 ? {type: 'regexp'} :
    rule.actions[$rule_editor.data('action_index')];
    $('[data-type="' + action.type + '"]', $(this))
      .prop('checked', true).button('refresh');
    $('[name="from"]', $(this)).prop('value', action.from);
    $('[name="to"]', $(this)).prop('value', action.to);
  });
  /* Request/Response header action editor open binding */
  $('#action-editor-request_header, #action-editor-response_header')
    .bind('dialogopen', function () {
      var $rule_editor = $('#rule-editor');
      var rule = $rule_editor.data('rule');
      var index = $rule_editor.data('action_index');
      var action = index < 0 ? {} :
      rule.actions[$rule_editor.data('action_index')];
      if (action.type === undefined) {
        action.type = $(this).prop('id') === 'action-editor-request_header' ?
          'request_header_set' : 'response_header_add';
      }
      $('[data-type="' + action.type + '"]', $(this))
        .prop('checked', true).button('refresh');
      $('[name="name"]', $(this)).prop('value', action.name);
      $('[name="value"]', $(this)).prop('value', action.value);
      $('[name="match_value"]', $(this))
        .prop('disabled', action.type === 'response_header_add')
        .button('refresh');
      $('[name="match_value"]', $(this))
        .prop('checked', action.value !== undefined).button('refresh');
    });
  // Match value switcher
  $('#action-editor-response_header [data-type]').click(function () {
    var disabled = $(this).data('type') === 'response_header_add';
    $('[name="match_value"]', $('#action-editor-response_header'))
      .prop('disabled', disabled).button('refresh');
  });
}

/**
 * Create buttons & button-sets
 */
function initButtons() {
  /* Buttons */
  $('.button-set').buttonset();
  /* New rule */
  $('#nav-tab-rules button[name="new"]').click(function () {
    $('#rule-creator').dialog('open');
  });
  /* Edit rule */
  function editRule () {
    var $rule = $('#rule-list .ui-selected');
    var type = $rule.data('type');
    var index = $rule.index();
    if (index < 0) {
      return;
    }
    var offset = $('#rule-list [data-type="' + type + '"]:first').index();
    index -= offset;
    chrome.storage.local.get(type, function (items) {
      var rule = items[type][index];
      rule.type = type;
      var $dialog = $('#rule-editor');
      $dialog.data({rule: rule, rule_index: index});
      $dialog.dialog('open');
    });
  }
  $('#nav-tab-rules button[name="edit"]').click(editRule);
  $('#rule-list').on('dblclick', 'li', function () {
    $(this).addClass('ui-selected');
    editRule();
  });
  // <Enter> => edit
  $(document).bind('keydown', 'return i', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      editRule();
      return false;
    }
    return true;
  });
  /* Remove rule */
  function removeRule () {
    var $rule = $('#rule-list .ui-selected');
    var type = $rule.data('type');
    var index = $rule.index();
    if (index < 0) {
      return;
    }
    var offset = $('#rule-list [data-type="' + type + '"]:first').index();
    index -= offset;
    chrome.storage.local.get(type, function (items) {
      var rules = items[type];
      confirmDialog(
        'Do you really want to remove: ' + rules[index].name + '?',
        function (confirmed) {
          if (confirmed !== true) {
            return;
          }
          rules.splice(index, 1);
          var obj = {};
          obj[type] = rules;
          chrome.storage.local.set(obj, function () {
            loadRules();
          });
        });
    });
  }
  $('#nav-tab-rules button[name="remove"]').click(removeRule);
  // x => remove
  $(document).bind('keydown', 'ctrl+d x del backspace', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      removeRule();
      return false;
    }
    return true;
  });
  /* Adjust rule priority */
  function adjustRulePriority(command) {
    var $rule = $('#rule-list .ui-selected');
    var type = $rule.data('type');
    var index = $rule.index();
    if (index < 0) {
      return;
    }
    var offset = $('#rule-list [data-type="' + type + '"]:first').index();
    index -= offset;
    var target = command === 'up' ? index - 1 : index + 1;
    chrome.storage.local.get(type, function (items) {
      var rules = items[type];
      if (target < 0 || target >= rules.length) {
        return;
      }
      var tmp = rules.splice(index, 1);
      rules.splice(target, 0, tmp[0]);
      var obj = {};
      obj[type] = rules;
      chrome.storage.local.set(obj);
      if (command === 'up') {
        $rule.insertBefore($rule.prev());
      } else {
        $rule.insertAfter($rule.next());
      }
    });
  }
  // j => move down
  $(document).bind('keydown', 'ctrl+n j', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      adjustRulePriority('down');
      return false;
    }
    return true;
  });
  // k => move up
  $(document).bind('keydown', 'ctrl+p k', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      adjustRulePriority('up');
      return false;
    }
    return true;
  });
  // tab => select next rule
  $(document).bind('keydown', 'tab', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      var $rule = $('#rule-list .ui-selected');
      var $next = $rule.next();
      if ($next.length > 0 && $next.is('li')) {
        $rule.removeClass('ui-selected');
        $next.addClass('ui-selected');
      }
      return false;
    }
    return true;
  });
  // shift-tab => select prev rule
  $(document).bind('keydown', 'shift+tab', function () {
    if ($('.ui-dialog:visible').length <= 0 &&
        $('#nav-tab-rules').is(':visible')) {
      var $rule = $('#rule-list .ui-selected');
      var $prev = $rule.prev();
      if ($prev.length > 0 && $prev.is('li')) {
        $rule.removeClass('ui-selected');
        $prev.addClass('ui-selected');
      }
      return false;
    }
    return true;
  });
  /* Import rule */
  $('#nav-tab-rules input[type="file"][name="import"]').change(function () {
    var type;
    $.each($(this).prop('files'), function (i, file) {
      readTextFromFile(file, function (text) {
        var data;
        try {
          data = JSON.parse(text);
          // TODO: Judge file type, be able to read in Redirector-2.2 format
        } catch (x) {
          alertDialog('Failed to import rule: ' + x.message);
          return;
        }
        for (type in data) {
          var rule = data[type];
          var opt = {};
          opt[type] = [];
          chrome.storage.local.get(opt, function (items) {
            var value = items[type];
            value.push(rule[0]);
            var result = {};
            result[type] = value;
            chrome.storage.local.set(result, function () {
              loadRules();
            });
          });
        }
      });
    });
    // Clear the file input
    $(this).prop('value', '');
  });
  /* Export rule */
  $('#nav-tab-rules button[name="export"]').click(function () {
    var $rule = $('#rule-list .ui-selected');
    var type = $rule.data('type');
    var index = $rule.index();
    if (index < 0) {
      return;
    }
    var offset = $('#rule-list [data-type="' + type + '"]:first').index();
    index -= offset;
    chrome.storage.local.get(type, function (items) {
      var rule = items[type][index];
      var data = {};
      data[type] = [rule];
      saveTextToFile({
        text: JSON.stringify(data),
        filename: '[' + rule.name + ']' + (new Date()).toISOString() + '.json'
      });
    });
  });

  /* New condition */
  $('#rule-editor [name="new-condition"]').click(function () {
    var $rule_editor = $('#rule-editor');
    $rule_editor.data({condition_index: -1});
    var rule = $rule_editor.data('rule');
    switch (rule.type) {
    case 'fast_matching':
      $('#condition-editor-fast_matching').dialog('open');
      break;
    case 'redirect':
    case 'error_handling':
      try {
        rule.conditions.forEach(function (condition) {
          if (condition.type === 'manual') {
            throw new Error(
              'Manual redirection rule cannot coexist with other condition');
          }
        });
      } catch (x) {
        alertDialog(x.message);
        return;
      }
      $('#condition-editor-normal').dialog('open');
      break;
    case 'request_header': case 'response_header':
      $('#condition-editor-normal').dialog('open');
      break;
    default:
      $rule_editor.data({condition_index: null});
      assertError(false, new Error());
    }
  });
  /* Edit condition */
  function editCondition() {
    var $rule_editor = $('#rule-editor');
    var index = $('#rule-editor-conditions li')
      .index($('#rule-editor-conditions .ui-selected'));
    if (index < 0) {
      return;
    }
    $rule_editor.data({condition_index: index});
    switch ($rule_editor.data('rule').type) {
    case 'fast_matching':
      $('#condition-editor-fast_matching').dialog('open');
      break;
    case 'redirect': case 'request_header': case 'response_header':
    case 'error_handling':
      $('#condition-editor-normal').dialog('open');
      break;
    default:
      $rule_editor.data({condition_index: null});
      assertError(false, new Error());
    }
  }
  $('#rule-editor [name="edit-condition"]').click(editCondition);
  $('#rule-editor').on('dblclick', 'li', function () {
    $(this).addClass('ui-selected');
    // Try edit condition
    editCondition();
  });
  $(document).bind('keydown', 'return i', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      editCondition();
      return false;
    }
    return true;
  });
  /* Remove condition */
  function removeCondition () {
    var $selected = $('#rule-editor-conditions .ui-selected');
    var index = $('#rule-editor-conditions li').index($selected);
    if (index >= 0) {
      confirmDialog(
        'Do you really want to remove: ' + $selected.text() + '?',
        function (confirmed) {
          if (confirmed !== true) {
            return;
          }
          $('#rule-editor').data('rule').conditions.splice(index, 1);
          $selected.remove();
        });
    }
  }
  $('#rule-editor [name="remove-condition"]').click(removeCondition);
  $(document).bind('keydown', 'ctrl+d x del backspace', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      removeCondition();
      return false;
    }
    return true;
  });
  /* Relative key-bindings (also works for actions) */
  // j => move down
  $(document).bind('keydown', 'ctrl+n j', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      var $elem = $('#rule-editor .ui-selected');
      if ($elem.next().length > 0) {
        $elem.insertAfter($elem.next());
      }
      return false;
    }
    return true;
  });
  // k => move up
  $(document).bind('keydown', 'ctrl+p k', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      var $elem = $('#rule-editor .ui-selected');
      if ($elem.prev().length > 0) {
        $elem.insertBefore($elem.prev());
      }
      return false;
    }
    return true;
  });
  // tab => select next condition/action
  $(document).bind('keydown', 'tab', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      var $elem = $('#rule-editor .ui-selected');
      if ($elem.next().length > 0) {
        $elem.removeClass('ui-selected');
        $elem.next().addClass('ui-selected');
      }
      return false;
    }
    return true;
  });
  // shift-tab => select next condition/action
  $(document).bind('keydown', 'shift+tab', function () {
    if ($('#rule-editor').is(':visible') === true &&
        $('.ui-dialog:visible').length === 1) {
      var $elem = $('#rule-editor .ui-selected');
      if ($elem.prev().length > 0) {
        $elem.removeClass('ui-selected');
        $elem.prev().addClass('ui-selected');
      }
      return false;
    }
    return true;
  });
  /* Resource type chooser */
  $('#condition-editor-fast_matching, #condition-editor-normal')
    .each(function () {
      var $dialog = $(this);
      $('[type="checkbox"][name="resource"][data-type="all"]', $dialog)
        .click(function () {
          var checked = $(this).prop('checked');
          $('[type="checkbox"]', $dialog).each(function () {
            $(this).prop('checked', checked).button('refresh');
          });
        });
      $('[type="checkbox"][name="resource"][data-type!="all"]', $dialog)
        .click(function () {
          $('[type="checkbox"][data-type="all"]', $dialog)
            .prop('checked', false).button('refresh');
        });
    });
  /* New action */
  $('#rule-editor [name="new-action"]').click(function () {
    var $rule_editor = $('#rule-editor');
    var rule = $rule_editor.data('rule');
    $rule_editor.data({action_index: -1});
    switch (rule.type) {
    case 'fast_matching':
      var $dialog = $('#action-creator').data({actions: rule.actions});
      $dialog.dialog('open');
      break;
    case 'redirect': case 'error_handling':
      try {
        rule.actions.forEach(function (action) {
          if (action.type === 'manual') {
            throw new Error(
              'Manual redirection rule cannot coexist with other condition');
          }
        });
      } catch (x) {
        alertDialog(x.message);
      }
      $('#action-editor-redirect').dialog('open');
      break;
    case 'request_header':
      $('#action-editor-request_header').dialog('open');
      break;
    case 'response_header':
      $('#action-editor-response_header').dialog('open');
      break;
    default:
      $rule_editor.data({action_index: null});
      assertError(false, new Error());
    }
  });
  /* Edit action */
  function editAction () {
    var index = $('#rule-editor-actions li')
      .index($('#rule-editor-actions .ui-selected'));
    if (index < 0) {
      return;
    }
    var $rule_editor = $('#rule-editor');
    $rule_editor.data({action_index: index});
    var rule = $rule_editor.data('rule');
    var type = rule.type;
    switch (type) {
    case 'fast_matching':
      type = rule.actions.type;
      /* No break here */
    case 'redirect': case 'error_handling':
      $('#action-editor-redirect').dialog('open');
      break;
    case 'request_header':
      $('#action-editor-request_header').dialog('open');
      break;
    case 'response_header':
      $('#action-editor-response_header').dialog('open');
      break;
    default:
      assertError(false, new Error());
    }
    $rule_editor.data({action_index: index});
  }
  $('#rule-editor [name="edit-action"]').click(editAction);
  $('#rule-editor').on('dblclick', 'li', function () {
    $(this).addClass('ui-selected');
    // Try edit action
    editAction();
  });
  $(document).bind('keydown', 'return', function () {
    if ($('#rule-editor').is(':visible') === true) {
      editAction();
    }
  });
  /* Remove action */
  function removeAction () {
    var $selected = $('#rule-editor-actions .ui-selected');
    var index = $('#rule-editor-actions li').index($selected);
    if (index >= 0) {
      confirmDialog(
        'Do you really want to remove: ' + $selected.text() + '?',
        function (confirmed) {
          if (confirmed !== true) {
            return;
          }
          $('#rule-editor').data('rule').actions.splice(index, 1);
          $selected.remove();
        });
    }
  }
  $('#rule-editor [name="remove-action"]').click(removeAction);
  $(document).bind('keydown', 'x', function () {
    if ($('#rule-editor').is(':visible') === true) {
      removeAction();
    }
  });
  /* Test rule */
  $('#rule-editor [name="test-rule"]').click(function () {
    var namespace = window.redirector_options_js;
    var url = $(this).prev().prop('value');
    if (!namespace.urlValidator.validate(url)) {
      alertDialog('Please enter a valid URL');
      return;
    }
    var rule = $('#rule-editor').data('rule');
    var test_log = [];
    function testMatchFastMatching (rule, url) {
      namespace.urlParser.parse(url);
      for (var i = 0; i < rule.conditions.length; i++) {
        var condition = rule.conditions[i];
        var matched = true;
        outmost_fast_matching_condition_test:
        for (var key in condition) {
          var value = condition[key];
          switch (key) {
          case 'hostContains':
            if (namespace.urlParser.host.indexOf(value) < 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'hostEquals':
            if (namespace.urlParser.host !== value) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'hostPrefix':
            if (namespace.urlParser.host.indexOf(value) !== 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'hostSuffix':
            if (namespace.urlParser.host.lastIndexOf(value) !==
                namespace.urlParser.host.length - value.length) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'pathContains':
            if (namespace.urlParser.path.indexOf(value) < 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'pathEquals':
            if (namespace.urlParser.path !== value) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'pathPrefix':
            if (namespace.urlParser.path.indexOf(value) !== 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'pathSuffix':
            if (namespace.urlParser.path.lastIndexOf(value) !==
                namespace.urlParser.path.length - value.length) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'queryContains':
            if (namespace.urlParser.query.indexOf(value) < 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'queryEquals':
            if (namespace.urlParser.query !== value) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'queryPrefix':
            if (namespace.urlParser.query.indexOf(value) !== 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'querySuffix':
            if (namespace.urlParser.query.lastIndexOf(value) !==
                namespace.urlParser.query.length - value.length) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'urlContains':
            if (namespace.urlParser.url.indexOf(value) < 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'urlEquals':
            if (namespace.urlParser.url !== value) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'urlPrefix':
            if (namespace.urlParser.url.indexOf(value) !== 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'urlSuffix':
            if (namespace.urlParser.url.lastIndexOf(value) !==
                namespace.urlParser.url.length - value.length) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'schemes':
            if (value.indexOf(namespace.urlParser.scheme) < 0) {
              matched = false;
              break outmost_fast_matching_condition_test;
            }
            break;
          case 'ports':
            matched = false;
            for (var j = 0; i < value.length; i++) {
              var port = value[i];
              if ($.isNumeric(port) === true) {
                if (namespace.urlParser.port === port) {
                  matched = true;
                  break outmost_fast_matching_condition_test;
                }
              } else if (namespace.urlParser.port >= port[0] &&
                         namespace.urlParser.port <= port[1]) {
                matched = true;
                break outmost_fast_matching_condition_test;
              }
              break;
            }
          }
        }
        if (matched === true) {
          return true;
        }
      }
      return matched;
    }
    if (rule.type === 'fast_matching') {
      if (testMatchFastMatching(rule, url) === true) {
        test_log.push('Rule matches');
      }
    } else {
      for (var i = 0; i < rule.conditions.length; i++) {
        var condition = rule.conditions[i];
        if (condition.type === 'manual') {
          test_log.push('This rule will be executed only when ' +
                        'it\'s selected in manual redirection');
          break;
        }
        if (condition.type === 'regexp') {
          if (regexpStringToRegexp(condition.value,
                                   condition.modifiers).test(url)) {
            test_log.push('Matched condition: ' + JSON.stringify(condition));
            break;
          }
        } else {
          if (wildcardToRegexp(condition.value,
                                   condition.modifiers).test(url)) {
            test_log.push('Matched condition: ' + JSON.stringify(condition));
            break;
          }
        }
      }
    }
    if (test_log.length === 0) {
      alertDialog('Rule not match');
      return;
    }
    for (var i = 0; i < rule.actions.length; i++) {
      var action = rule.actions[i];
      switch (action.type) {
      case 'redirect_regexp':
        url = url.replace(
          regexpStringToRegexp(action.from, action.modifiers),
          action.to
        );
        if (action.decode === true) {
          url = decodeURIComponent(url);
        }
        test_log.push('Redirect to: ' + url);
        break;
      case 'redirect_wildcard':
        url = url.replace(
          wildcardToRegexp(action.from, action.modifiers),
          action.to
        );
        if (action.decode === true) {
          url = decodeURIComponent(url);
        }
        test_log.push('Redirect to: ' + url);
        break;
      case 'redirect_cancel':
        test_log.push('Cancel request');
        break;
      case 'redirect_to':
        test_log.push('Redirect to: ' + action.to);
        break;
      case 'redirect_to_transparent':
        test_log.push('Redirect to: transparent image');
        break;
      case 'redirect_to_empty':
        test_log.push('Redirect to: empty document');
        break;
      case 'request_header_set':
        test_log.push('Set request header ' + action.name +
                      ' to ' + action.value);
        break;
      case 'request_header_remove':
        test_log.push('Remove request header ' + action.name);
        break;
      case 'response_header_add':
        test_log.push('Add response header ' + action.name +
                      ' with value ' + action.value);
        break;
      case 'response_header_remove':
        if (action.value === undefined) {
          test_log.push('Remove response header ' + action.name);
        } else {
          test_log.push('Remove response header ' + action.name +
                        ' with value ' + action.value);
        }
        break;
      default:
        assertError(false, new Error());
      }
    }
    if (rule.type === 'fast_matching' &&
        testMatchFastMatching(rule, url) === true) {
      alertDialog('This rule may create redirect loops!');
      return;
    }
    alertDialog(test_log.join('\n'));
  });
  /* Test condtion */
  $('#condition-editor-normal [name="test-condition"]').click(function () {
    var namespace = window.redirector_options_js;
    var $dialog = $('#condition-editor-normal');
    var url = $(this).prev().prop('value');
    if (!namespace.urlValidator.validate(url)) {
      alertDialog('Please enter a valid URL');
      return;
    }
    var type = $('[type="radio"][name="type"]:checked', $dialog).data('type');
    if (type === 'manual') {
      alertDialog('No need to test this kind of condition');
      return;
    }
    var modifiers = [];
    $('[name="modifier"]:checked', $dialog).each(function () {
      modifiers.push($(this).data('type'));
    });
    var value = $('[name="value"]', $dialog).prop('value');
    try {
      var regexp = type === 'regexp' ? regexpStringToRegexp(value, modifiers) :
        wildcardToRegexp(value, modifiers);
    } catch (x) {
      alertDialog(x.message);
      return;
    }
    alertDialog(regexp.test(url) === true ? 'Condition match' : 'Condition not match');
  });
  /* Test action */
  $('#action-editor-redirect [name="test-action"]').click(function () {
    var namespace = window.redirector_options_js;
    var $dialog = $('#action-editor-redirect');
    var url = $(this).prev().prop('value');
    if (!namespace.urlValidator.validate(url)) {
      alertDialog('Please enter a valid URL');
      return;
    }
    var type = $('[type="radio"][name="type"]:checked', $dialog).data('type');
    if (/cancel$|^redirect_to/.test(type)) {
      alertDialog('No need to test this kind of action');
      return;
    }
    var modifiers = [];
    $('[name="modifier"]:checked', $dialog).each(function () {
      modifiers.push($(this).data('type'));
    });
    var decode = $('[name="decode"]', $dialog).prop('checked');
    var from = $('[name="from"]', $dialog).prop('value');
    var to = $('[name="to"]', $dialog).prop('value');
    try {
      var regexp = type === 'redirect_regexp' ?
        regexpStringToRegexp(from, modifiers) :
        wildcardToRegexp(from, modifiers);
    } catch (x) {
      alertDialog(x.message);
      return;
    }
    var result = url.replace(regexp, to);
    if (decode === true) {
      result = decodeURIComponent(result);
    }
    alertDialog('Redirect to: ' + result);
  });
  /* Condition type selection */
  $('#condition-editor-normal [name="type"]').click(function () {
    var $value = $('#condition-editor-normal [name="value"]');
    switch ($(this).data('type')) {
    case 'regexp':
    case 'wildcard':
      $value.prop('disabled', false);
      break;
    case 'manual':
      $value.prop('disabled', true);
      break;
    default:
      assertError(false, new Error());
    }
  });
  /* Redirect action type selection */
  $('#action-editor-redirect [name="type"]').click(function () {
    var $form = $('#action-editor-redirect [name="from"]');
    var $to = $('#action-editor-redirect [name="to"]');
    switch ($(this).data('type')) {
    case 'redirect_regexp':
    case 'redirect_wildcard':
      $form.prop('disabled', false);
      $to.prop('disabled', false);
      break;
    case 'redirect_cancel':
    case 'redirect_to_transparent':
    case 'redirect_to_empty':
      $form.prop('disabled', true);
      $to.prop('disabled', true);
      break;
    case 'redirect_to':
      $form.prop('disabled', true);
      $to.prop('disabled', false);
      break;
    default:
      assertError(false, new Error());
    }
  });
  /* Request header type selection */
  $('#action-editor-request_header [name="type"]').click(function () {
    var $value = $('#action-editor-request_header [name="value"]');
    switch ($(this).data('type')) {
    case 'request_header_set':
      $value.prop('disabled', false);
      break;
    case 'request_header_remove':
      $value.prop('disabled', true);
      break;
    default:
      assertError(false, new Error());
    }
  });
  /* File choosers */
  $('input[type="file"]').each(function () {
    var $input = $(this);
    $input.next().click(function () {
      $input.click();
    });
  });
}

/**
 * jQuery UI datalists (autocomplete)
 */
function initDatalist() {
  $('#action-editor-request_header [name="name"]' + ', ' +
    '#action-editor-response_header [name="name"]')
    .combobox();
  $('#condition-editor-fast_matching [name="schemes"]')
    .bind("keydown", function(event) {
      if (event.keyCode === $.ui.keyCode.TAB &&
          $(this).data("autocomplete").menu.active) {
        event.preventDefault();
      }
    })
    .autocomplete({
      source: function(request, response) {
        var protocols = ['http', 'https', 'ftp', 'file'];
        var used = request.term.split(/,\s*/);
        var last= used.pop();
        used.forEach(function (protocol) {
          var index = protocols.indexOf(protocol);
          if (index >= 0) {
            protocols.splice(index, 1);
          }
        });
        response($.ui.autocomplete.filter(protocols, last));
      },
      focus: function() {
        return false;
      },
      select: function (event, ui) {
        var terms = this.value.split(/,\s*/);
        terms.pop();
        terms.push(ui.item.value, '');
        this.value = terms.join( ", " );
        return false;
      }
    });
}

/**
 * Other initialization matters
 */
function initMisc() {
  /* Text and textarea */
  $('form').bind('submit', function () {return false;}); // Prevent from submit
  $('input, input[type="text"], input[type="url"], textarea')
    .addClass('ui-widget ui-state-default ui-corner-all');
  /* Accordions */
  $('.accordion').accordion({
    autoHeight: false,
    change: function () {
      $(this).accordion('resize');
    }
  });
  /* Style url input and its following button */
  $('input[type="url"]').each(function () {
    if ($(this).next().is('button')) {
      $(this)
        .removeClass('ui-corner-all')
        .removeClass('ui-corner-right')
        .addClass('ui-corner-left');
      $(this).next()
        .removeClass('ui-corner-all')
        .removeClass('ui-corner-left')
        .addClass('ui-corner-right');
    }
  });
  /* Selectabla & draggable lists */
  $('#rule-list')
    .sortable({
      handle: '.rule-handle',
      axis: 'y',
      start: function (e, ui) {
        $(this).data({start_index: ui.item.index()});
      },
      stop: function (e, ui) {
        var start = $(this).data('start_index');
        var stop = ui.item.index();
        if (start === stop) {
          return;
        }
        var type = ui.item.data('type');
        if (type !== ui.item.prev().data('type') &&
            type !== ui.item.next().data('type')) {
          $(this).sortable('cancel');
          return;
        }
        var offset = $('[data-type="' + type + '"]:first', $(this)).index();
        start -= offset;
        stop -= offset;
        chrome.storage.local.get(type, function (items) {
          var rules = items[type];
          var tmp = rules.splice(start, 1);
          rules.splice(stop, 0, tmp[0]);
          var obj = {};
          obj[type] = rules;
          chrome.storage.local.set(obj);
        });
      }
    })
    .selectable({
      distance: 1,              // Allow double click
      filter: 'li',             // Avoid selecting headers
      stop: function (e, ui) {  // Prevent multiple selection
        $('.ui-selected:not(:first)', $(this)).removeClass('ui-selected');
      }
    })
    .on('click', 'li', function (e) { // Enable selection (better solution?)
      var $this = $(this);
      setTimeout(function () {
        $this.addClass('ui-selected');
      }, 1);
    });
  /* Deselect when place elsewhere than a rule is clicked */
  $('#nav-tab-rules').click(function () {
    $('#rule-list .ui-selected').removeClass('ui-selected');
  });
  /* Same for rule editor */
  $('#rule-editor').click(function () {
    $('.ui-selected', $(this)).removeClass('ui-selected');
  });
  /* Rule editor conditons/actions sort binding */
  $.each(['conditions', 'actions'], function (i, type) {
    $('#rule-editor-' + type)
      .sortable({
        handle: '.rule-handle',
        axis: 'y',
        start: function (e, ui) {
          $(this).data({start_index: ui.item.index()});
        },
        stop: function (e, ui) {
          var start = $(this).data('start_index');
          var stop = ui.item.index();
          if (start === stop) {
            return;
          }
          var array = $('#rule-editor').data('rule')[type];
          var tmp = array.splice(start, 1);
          array.splice(stop, 0, tmp[0]);
        }
      })
      .selectable({
        distance: 1,
        filter: 'li',
        stop: function (e, ui) {
          $('.ui-selected:not(:first)', $(this)).removeClass('ui-selected');
        }
      })
      .on('click', 'li', function (e) {
        var $this = $(this);
        setTimeout(function () {
          $this.addClass('ui-selected');
        }, 1);
      });
  });
  /* I18n */
  $('[data-i18n]').each(function () {
    var i18ns = $(this).data('i18n');
    if (i18ns === '') {
      return;
    }
    i18ns.split(/\s*;\s/).forEach(function (i18n) {
      if (i18n.indexOf(':') < 0) {
        var pair = i18n.split(':');
        $(this).prop(pair[0].replace(/^\s*|\s*$/), _(pair[1]));
      } else {
        $(this).text(_(i18n));
      }
    });
  });
}

/**
 * Load rules to #rule-list
 */
function loadRules(filter, callback) {
  var $list = $('#rule-list').html('');
  chrome.storage.local.get(null, function (items) {
    $.each(window.redirector_utils_js.all_types, function (i, type) {
      var rules = items[type];
      if (rules === undefined || rules.length === 0) {
        return;
      }
      if (filter instanceof Function) {
        rules = rules.filter(filter);
      }
      if (rules.length <= 0) {
        return;
      }
      $list.append('<h3>' + type + '</h3>');
      $.each(rules, function (i, rule) {
        $list.append(
          '<li data-type="' + _(type) +
            '"><span class="rule-handle ui-icon ui-icon-script"></span>' +
            rule.name + '</li>');
      });
    });
    if (callback instanceof Function) {
      callback();
    }
  });
}

/**
 * Alert dialog
 */
function alertDialog(message) {
  var html = '<div><p style="text-align:center;white-space:pre">\x00</p></div>'
    .replace('\x00', $('<div />').text(message).html().replace(/\n/g, '<br />'));
  $(html).dialog({
    modal: true,
    buttons: [{
      text: 'Close',
      click: function () {
        $(this).dialog('close');
      }
    }],
    close: function (event, ui) {
      $(this).remove();
    }
  });
}

/**
 * Confirm dialog
 */
function confirmDialog(message, callback) {
$( "#dialog:ui-dialog" ).dialog( "destroy" );
  var html = '<div><p style="text-align:center;white-space:pre">\x00</p></div>'
    .replace('\x00', $('<div />').text(message).html().replace(/\n/g, '<br />'));
  $(html).dialog({
    modal: true,
    buttons: [{
      text: 'Yes',
      click: function () {
        $(this).dialog('close');
        callback(true);
      }
    }, {
      text: 'No',
      click: function () {
        $(this).dialog('close');
        callback(false);
      }
    }],
    close: function (event, ui) {
      $(this).remove();
    }
  });
}

/* Settings */
/**
 * Initialize the Settings tab
 */
function initSettings() {
  var $settings = $('#nav-tab-settings');
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
  /* Enabled rule type */
  local.get({
    enabled_rule_types: window.redirector_utils_js.all_types
  }, function (items) {
    $.each(items.enabled_rule_types, function (i, type) {
      $('[name="rule_type"][data-type="' + type + '"]', $settings)
        .prop('checked', true).button('refresh');
    });
  });
  $('[name="rule_type"]', $settings).click(function () {
    var types = [];
    $('[name="rule_type"]:checked', $settings).each(function () {
      types.push($(this).data('type'));
    });
    local.set({enabled_rule_types: types});
  });
  /* Enabled protocols */
  local.get({enabled_protocols: [
    'http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'
  ]}, function (items) {
    $.each(items.enabled_protocols, function (i, protocol) {
      $('[name="protocol"][data-type="' + protocol + '"]', $settings)
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
  local.get({auto_sync_enabled: true}, function (items) {
    $('[name="sync"][data-enabled="' + items.auto_sync_enabled + '"]',
      $settings)
      .prop('checked', true).button('refresh');
  });
  $('[name="sync"]', $settings).click(function () {
    local.set({
      auto_sync_enabled: $(this).is(':checked') && $(this).data('enabled')
    });
  });
  $('[name="manual-sync"]', $settings).click(function () {
    syncData(undefined, alertDialog);
  });
  /* Enable debugger */
  local.get({debugger_enabled: true}, function (items) {
    $('[name="debugger"][data-enabled="' + items.debugger_enabled + '"]',
      $settings)
      .prop('checked', true).button('refresh');
  });
  $('[name="debugger"]', $settings).click(function () {
    local.set({
      debugger_enabled: $(this).is(':checked') && $(this).data('enabled')
    });
  });
  // Backup
  $('[name="backup"]', $settings).click(function () {
    chrome.storage.local.get(null, function (items) {
      saveTextToFile({
        text: JSON.stringify(items),
        filename: '[Redirector_backup]' + (new Date()).toISOString() + '.json'
      });
    });
  });
  // Restore
  $('input[type="file"][name="restore"]', $settings).change(function () {
    var file = $(this).prop('files')[0];
    readTextFromFile(file, function (text) {
      var data;
      try {
        data = JSON.parse(text);
        // TODO: Judge file type, be able to read in Redirector-2.2 format
      } catch (x) {
        alertDialog('Restore data failed: ' + x.message);
        return;
      }
      chrome.storage.local.set(data, function () {
        if (chrome.extension.lastError !== undefined) {
          alertDialog('Restore data failed: ' + chrome.extension.lastError);
        } else {
          location.reload();
        }
      });
    });
  });
}

/* Help */
/**
 * Initialize the Help tab
 */
function initHelp() {
}
