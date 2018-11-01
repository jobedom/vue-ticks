(function (global, factory) {
   if (typeof define === "function" && define.amd) {
      define(['exports'], factory);
   } else if (typeof exports !== "undefined") {
      factory(exports);
   } else {
      var mod = {
         exports: {}
      };
      factory(mod.exports);
      global.VueConst = mod.exports;
   }
})(this, function (exports) {
   'use strict';

   Object.defineProperty(exports, "__esModule", {
      value: true
   });
   var DEFAULT_OPTIONS = {
      interval: 1000,
      immediate: false,
      once: false,
      events: false,
      running: false
   };

   exports.default = {
      install: function install(Vue) {
         var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

         Vue.config.optionMergeStrategies.ticks = Vue.config.optionMergeStrategies.computed;

         var showDebug = options.debug ? function () {
            var _console;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
               args[_key] = arguments[_key];
            }

            return (_console = console).info.apply(_console, ['[vue-ticks]'].concat(args));
         } : function () {};
         var defaultOptions = Object.assign({}, DEFAULT_OPTIONS, options);

         Vue.mixin({
            data: function data() {
               return {
                  ticks: {}
               };
            },
            created: function created() {
               var _this = this;

               var ticks = this.$options.ticks;

               var _loop = function _loop(key) {
                  var tickDefinition = Object.assign({}, defaultOptions, ticks[key]);

                  var onTick = function onTick() {
                     showDebug('Tick \'' + tick.id + '\' ticked');
                     var methodName = 'onTick' + (key[0].toUpperCase() + key.substr(1));
                     if (_this[methodName]) _this[methodName]();
                     if (tickDefinition.onTick) tickDefinition.onTick.apply(_this);
                     if (tickDefinition.events) _this.$emit('tick-' + key);
                  };

                  var tick = {
                     id: key,
                     definition: tickDefinition,
                     running: true,
                     stop: function stop() {
                        if (tick.running) {
                           showDebug('Tick \'' + tick.id + '\' stopped');
                           if (tick._unwatchInterval) {
                              tick._unwatchInterval();
                              tick._unwatchInterval = null;
                           }
                           tick.running = false;
                           var clearFn = tickDefinition.once ? window.clearTimeout : window.clearInterval;
                           if (tick._tickHandler) clearFn(tick._tickHandler);
                           tick._tickHandler = null;
                        }
                     },
                     start: function start() {
                        showDebug('Tick \'' + tick.id + '\' started');
                        tick.running = true;
                        if (tickDefinition.immediate && !tickDefinition.once) onTick();
                        var setFn = tickDefinition.once ? window.setTimeout : window.setInterval;
                        var isReactiveInterval = typeof tickDefinition.interval === 'string';
                        if (isReactiveInterval) {
                           tick._unwatchInterval = this.$watch(tickDefinition.interval, function (newValue, oldValue) {
                              showDebug('Tick \'' + tick.id + '\' interval changed from ' + oldValue + ' to ' + newValue);
                              if (tick.running) {
                                 tick.stop();
                                 tick.start();
                              }
                           });
                        }
                        var actualInterval = isReactiveInterval ? this[tickDefinition.interval] : tickDefinition.interval;
                        tick._tickHandler = setFn(onTick, actualInterval);
                     }
                  };

                  tick.start = tick.start.bind(_this);

                  if (tick.running) tick.start();
                  Vue.set(_this.ticks, key, tick);
               };

               for (var key in ticks) {
                  _loop(key);
               }
            },
            destroyed: function destroyed() {
               Object.values(this.ticks).forEach(function (tick) {
                  return tick.stop();
               });
            }
         });
      }
   };
   module.exports = exports.default;
});