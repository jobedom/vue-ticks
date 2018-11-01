const DEFAULT_OPTIONS = {
   interval: 1000,
   immediate: false,
   once: false,
   events: false,
   running: false,
};

export default {
   install(Vue, options = {}) {
      Vue.config.optionMergeStrategies.ticks = Vue.config.optionMergeStrategies.computed;

      const showDebug = options.debug ? (...args) => console.info('[vue-ticks]', ...args) : () => {};
      const defaultOptions = Object.assign({}, DEFAULT_OPTIONS, options);

      Vue.mixin({
         data() {
            return {
               ticks: {},
            };
         },

         created() {
            const ticks = this.$options.ticks;
            for (const key in ticks) {
               const tickDefinition = Object.assign({}, defaultOptions, ticks[key]);

               const onTick = () => {
                  showDebug(`Tick '${tick.id}' ticked`);
                  const methodName = `onTick${key[0].toUpperCase() + key.substr(1)}`;
                  if (this[methodName]) this[methodName]();
                  if (tickDefinition.onTick) tickDefinition.onTick.apply(this);
                  if (tickDefinition.events) this.$emit(`tick-${key}`);
               };

               const tick = {
                  id: key,
                  definition: tickDefinition,
                  running: true,
                  stop() {
                     if (tick.running) {
                        showDebug(`Tick '${tick.id}' stopped`);
                        if (tick._unwatchInterval) {
                           tick._unwatchInterval();
                           tick._unwatchInterval = null;
                        }
                        tick.running = false;
                        const clearFn = tickDefinition.once ? window.clearTimeout : window.clearInterval;
                        if (tick._tickHandler) clearFn(tick._tickHandler);
                        tick._tickHandler = null;
                     }
                  },
                  start() {
                     showDebug(`Tick '${tick.id}' started`);
                     tick.running = true;
                     if (tickDefinition.immediate && !tickDefinition.once) onTick();
                     const setFn = tickDefinition.once ? window.setTimeout : window.setInterval;
                     const isReactiveInterval = typeof tickDefinition.interval === 'string';
                     if (isReactiveInterval) {
                        tick._unwatchInterval = this.$watch(tickDefinition.interval, (newValue, oldValue) => {
                           showDebug(`Tick '${tick.id}' interval changed from ${oldValue} to ${newValue}`);
                           if (tick.running) {
                              tick.stop();
                              tick.start();
                           }
                        });
                     }
                     const actualInterval = isReactiveInterval
                        ? this[tickDefinition.interval]
                        : tickDefinition.interval;
                     tick._tickHandler = setFn(onTick, actualInterval);
                  },
               };

               tick.start = tick.start.bind(this);

               if (tick.running) tick.start();
               Vue.set(this.ticks, key, tick);
            }
         },

         destroyed() {
            Object.values(this.ticks).forEach(tick => tick.stop());
         },
      });
   },
};
