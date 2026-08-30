H5PEditor.PlaceWordsShowWhen = (function ($) {
  'use strict';

  function asArray(value) {
    return Array.isArray(value) ? value : [value];
  }

  function unwrapValue(value) {
    if (value && typeof value === 'object') {
      if (Object.prototype.hasOwnProperty.call(value, 'value')) {
        return value.value;
      }
      if (Object.prototype.hasOwnProperty.call(value, 'params')) {
        return value.params;
      }
      if (Object.prototype.hasOwnProperty.call(value, 'raw')) {
        return value.raw;
      }
    }
    return value;
  }

  function valueMatches(value, equals) {
    return asArray(equals).indexOf(unwrapValue(value)) !== -1;
  }

  function SelectHandler(field, equals) {
    this.satisfied = function () {
      return valueMatches(field.value, equals);
    };
  }

  function LibraryHandler(field, equals) {
    this.satisfied = function () {
      var value;
      if (field && field.currentLibrary !== undefined && field.params && field.params.library) {
        value = field.currentLibrary.split(' ')[0];
      }
      return valueMatches(value, equals);
    };
  }

  function BooleanHandler(field, equals) {
    this.satisfied = function () {
      return unwrapValue(field.value) === equals;
    };
  }

  function findFieldDeep(root, fieldName) {
    var seen = [];

    function seenBefore(obj) {
      for (var i = 0; i < seen.length; i++) {
        if (seen[i] === obj) {
          return true;
        }
      }
      seen.push(obj);
      return false;
    }

    function walk(obj, depth) {
      var keys;
      var key;
      var result;

      if (!obj || typeof obj !== 'object' || depth > 7 || seenBefore(obj)) {
        return undefined;
      }

      if (obj.field && obj.field.name === fieldName) {
        return obj;
      }

      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          result = walk(obj[i], depth + 1);
          if (result) {
            return result;
          }
        }
        return undefined;
      }

      keys = ['children', 'fields', 'items', 'instances', 'fieldInstances', 'widgets'];
      for (var j = 0; j < keys.length; j++) {
        key = keys[j];
        if (obj[key]) {
          result = walk(obj[key], depth + 1);
          if (result) {
            return result;
          }
        }
      }

      return undefined;
    }

    return walk(root, 0);
  }

  function DeepFieldHandler(parent, fieldName, equals) {
    this.satisfied = function () {
      var field = findFieldDeep(parent, fieldName);
      if (!field) {
        return false;
      }
      return valueMatches(field.value, equals);
    };
  }

  function createFieldHandler(field, equals) {
    if (!field || !field.field) {
      return undefined;
    }
    if (field.field.type === 'library') {
      return new LibraryHandler(field, equals);
    }
    if (field.field.type === 'select') {
      return new SelectHandler(field, equals);
    }
    if (field.field.type === 'boolean') {
      return new BooleanHandler(field, equals);
    }
    return undefined;
  }

  // Reads the current value straight from the live params object whenever it is
  // available there. Child widgets (including ones wrapped in another widget,
  // such as a select inside showWhen) write their value into the shared params,
  // so this stays correct even when a cached field.value would be stale.
  function getLiveValue(parent, targetField, fieldName) {
    if (parent && parent.params && Object.prototype.hasOwnProperty.call(parent.params, fieldName)) {
      return parent.params[fieldName];
    }
    if (targetField && targetField.value !== undefined) {
      return targetField.value;
    }
    var deep = findFieldDeep(parent, fieldName);
    return deep ? deep.value : undefined;
  }

  function LiveHandler(parent, targetField, fieldName, equals) {
    this.satisfied = function () {
      return valueMatches(getLiveValue(parent, targetField, fieldName), equals);
    };
  }

  function RuleHandler(type, hasRules) {
    var TYPE_AND = 'and';
    var TYPE_OR = 'or';
    var handlers = [];

    type = type || TYPE_OR;

    this.add = function (handler) {
      if (handler) {
        handlers.push(handler);
      }
    };

    this.rulesSatisfied = function () {
      var i;
      var ruleHit;

      if (!handlers.length) {
        return !hasRules;
      }

      for (i = 0; i < handlers.length; i++) {
        ruleHit = handlers[i].satisfied();

        if (ruleHit && type === TYPE_OR) {
          return true;
        }
        if (type === TYPE_AND && !ruleHit) {
          return false;
        }
      }

      return type === TYPE_AND;
    };
  }

  function createWrappedField(parent, field, params, setValue, wrapper) {
    var widgetName = (field.showWhen && field.showWhen.widget) || field.type;
    var Widget = H5PEditor.widgets[widgetName] || H5PEditor.widgets[field.type];
    var fieldInstance;

    if (!Widget) {
      throw new Error('Missing H5P editor widget: ' + widgetName);
    }

    fieldInstance = new Widget(parent, field, params, setValue);
    fieldInstance.appendTo(wrapper);
    return fieldInstance;
  }

  function ShowWhen(parent, field, params, setValue) {
    var self = this;
    var config = field.showWhen || {};
    var hasRules = !!(config.rules && config.rules.length);
    var $wrapper = $('<div>', {
      'class': 'field h5p-editor-widget-show-when'
    });
    var ruleHandler = new RuleHandler(config.type, hasRules);
    var fieldInstance;
    var showing = !hasRules;
    var eventNamespace = '.placeWordsShowWhen' + Math.floor(Math.random() * 1000000000);
    var $eventRoot;

    self.field = field;
    self.passReadies = true;
    self.value = params;

    fieldInstance = createWrappedField(parent, field, params, setValue, $wrapper);

    // Optional: number the list items as "1. <entity>", "2. <entity>", ...
    var renumberItems = null;
    if (config.numberItems && fieldInstance && typeof fieldInstance.getEntity === 'function') {
      renumberItems = function () {
        var entity;
        try {
          entity = fieldInstance.getEntity() || '';
        }
        catch (entityErr) {
          entity = '';
        }

        var $list = $wrapper.find('ul.h5p-ul').first();
        if (!$list.length) {
          return;
        }

        var counter = 0;
        $list.children('li.h5p-li').each(function () {
          var $item = $(this);
          if ($item.hasClass('placeholder')) {
            return;
          }
          counter++;

          var $label = $item.children('.list-item-title-bar').children('.h5peditor-label').first();
          if (!$label.length) {
            $label = $item.find('.h5peditor-label').first();
          }
          if ($label.length) {
            $label.text(counter + '. ' + entity);
          }
        });
      };

      if (typeof fieldInstance.on === 'function') {
        fieldInstance.on('addedItem', function () { window.setTimeout(renumberItems, 0); });
        fieldInstance.on('removedItem', function () { window.setTimeout(renumberItems, 0); });
        fieldInstance.on('movedItem', function () { window.setTimeout(renumberItems, 0); });
      }
    }

    function setVisible(visible) {
      showing = !!visible;
      if (config.detach) {
        if (showing && self.$container && !$wrapper.parent().length) {
          $wrapper.appendTo(self.$container);
        }
        else if (!showing) {
          $wrapper.detach();
        }
      }
      else {
        $wrapper.toggleClass('hidden', !showing);
      }
    }

    function updateVisibility() {
      var visible = ruleHandler.rulesSatisfied();
      setVisible(visible);
      if (config.nullWhenHidden && !visible) {
        setValue(self.field, undefined);
      }
      if (visible && renumberItems) {
        renumberItems();
      }
    }

    if (hasRules) {
      for (var i = 0; i < config.rules.length; i++) {
        (function (rule) {
          var targetField;
          var handler;

          if (H5PEditor.findField) {
            try {
              targetField = H5PEditor.findField(rule.field, parent);
            }
            catch (err) {
              targetField = undefined;
            }
          }

          handler = new LiveHandler(parent, targetField, rule.field, rule.equals);

          ruleHandler.add(handler);

          if (H5PEditor.followField) {
            try {
              H5PEditor.followField(parent, rule.field, updateVisibility);
            }
            catch (err2) {
              // The delegated DOM listener below is the fallback.
            }
          }
        })(config.rules[i]);
      }
    }

    if (typeof fieldInstance.change === 'function') {
      self.change = function (callback) {
        fieldInstance.change(callback);
      };
    }

    self.appendTo = function ($container) {
      self.$container = $container;

      if (!config.detach) {
        $wrapper.appendTo($container);
      }
      else if (showing) {
        $wrapper.appendTo($container);
      }

      $eventRoot = $container.closest('.h5peditor, .h5p-editor, form');
      if (!$eventRoot.length) {
        $eventRoot = $(document);
      }
      $eventRoot.on('change' + eventNamespace + ' keyup' + eventNamespace, 'select,input,textarea', updateVisibility);

      updateVisibility();
      window.setTimeout(updateVisibility, 0);
      window.setTimeout(updateVisibility, 100);
    };

    self.validate = function () {
      if (!showing) {
        return true;
      }
      return fieldInstance && typeof fieldInstance.validate === 'function' ? fieldInstance.validate() : true;
    };

    self.remove = function () {
      if ($eventRoot) {
        $eventRoot.off(eventNamespace);
      }
      if (fieldInstance && typeof fieldInstance.remove === 'function') {
        fieldInstance.remove();
      }
      $wrapper.remove();
    };
  }

  return ShowWhen;
})(H5PEditor.$);

H5PEditor.widgets.showWhen = H5PEditor.PlaceWordsShowWhen;
