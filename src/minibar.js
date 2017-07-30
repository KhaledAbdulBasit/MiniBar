/*!
 * MiniBar 0.2.1
 * http://mobius.ovh/
 *
 * Released under the MIT license
 */
(function(root) {

    "use strict";

    var win = window,
        doc = document,
        body = doc.body,

        // Dimension terms
        trackPos = { x: "left" , y: "top" },
        trackSize = { x: "width" , y: "height" },
        scrollPos = { x: "scrollLeft" , y: "scrollTop" },
        scrollSize = { x: "scrollWidth" , y: "scrollHeight" },
        mAxis = { x: "pageX" , y: "pageY" };

    /**
     * Default configuration properties
     * @type {Object}
     */
    var config = {
        barType: "default",
        minBarSize: 10,
        alwaysShowBars: false,
        horizontalMouseScroll: false,

        scrollX: true,
        scrollY: true,

        navButtons: false,
        scrollAmount: 10,

        containerClass: "mb-container",
        contentClass: "mb-content",
        trackClass: "mb-track",
        barClass: "mb-bar",
        visibleClass: "mb-visible",
        progressClass: "mb-progress",
        hoverClass: "mb-hover",
        scrollingClass: "mb-scrolling",
        textareaClass: "mb-textarea",
        wrapperClass: "mb-wrapper",
        navClass: "mb-nav",
        buttonClass: "mb-button",
        buttonsClass: "mb-buttons",
        increaseClass: "mb-increase",
        decreaseClass: "mb-decrease",
    };

    /**
     * Object.assign polyfill
     * @param  {Object} target
     * @param  {Object} args
     * @return {Object}
     */
    var extend = function(r, t) {
        for (var e = Object(r), n = 1; n < arguments.length; n++) {
            var a = arguments[n];
            if (null != a)
                for (var o in a) Object.prototype.hasOwnProperty.call(a, o) && (e[o] = a[o])
        }
        return e
    };

    /**
     * Add event listener to target
     * @param  {Object} el
     * @param  {String} e
     * @param  {Function} fn
     */
    var on = function(el, e, fn) {
        el.addEventListener(e, fn, false);
    };

    /**
     * Remove event listener from target
     * @param  {Object} el
     * @param  {String} e
     * @param  {Function} fn
     */
    var off = function(el, e, fn) {
        el.removeEventListener(e, fn);
    };

    /**
     * Iterator helper
     * @param  {(Array|Object)}   arr Any object, array or array-like collection.
     * @param  {Function} f   The callback function
     * @param  {Object}   s      Change the value of this
     * @return {Void}
     */
    var each = function(arr, fn, s) {
        if ("[object Object]" === Object.prototype.toString.call(arr)) {
            for (var d in arr) {
                if (Object.prototype.hasOwnProperty.call(arr, d)) {
                    fn.call(s, d, arr[d]);
                }
            }
        } else {
            for (var e = 0, f = arr.length; e < f; e++) {
                fn.call(s, e, arr[e]);
            }
        }
    };

    /**
     * Mass assign style properties
     * @param  {Object} t
     * @param  {(String|Object)} e
     * @param  {String|Object}
     */
    var style = function(t, e) {
        var i = t && t.style,
            n = "[object Object]" === Object.prototype.toString.call(e);
        if (i) {
            if (!e) return win.getComputedStyle(t);
            n && each(e, function(t, e) {
                t in i || (t = "-webkit-" + t), i[t] = e + ("string" == typeof e ? "" : "opacity" === t ? "" : "px")
            })
        }
    };

    /**
     * Get an element's DOMRect relative to the document instead of the viewport.
     * @param  {Object} t   HTMLElement
     * @param  {Boolean} e  Include margins
     * @return {Object}     Formatted DOMRect copy
     */
    var rect = function(e) {
        var t = win,
            o = e.getBoundingClientRect(),
            b = doc.documentElement || body.parentNode || body,
            d = (void 0 !== t.pageXOffset) ? t.pageXOffset : b.scrollLeft,
            n = (void 0 !== t.pageYOffset) ? t.pageYOffset : b.scrollTop;
        return {
            x: o.left + d,
            y: o.top + n,
            height: Math.round(o.height),
            width: Math.round(o.width)
        }
    };

    /**
     * Returns a function, that, as long as it continues to be invoked, will not be triggered.
     * @param  {Function} fn
     * @param  {Number} wait
     * @param  {Boolean} now
     * @return {Function}
     */
    function debounce(n, t, u) {
        var e;
        return function() {
            var i = this,
                o = arguments,
                a = u && !e;
            clearTimeout(e), e = setTimeout(function() {
                e = null, u || n.apply(i, o)
            }, t), a && n.apply(i, o)
        }
    }

    /**
     * requestAnimationFrame shim
     */
    var raf=win.requestAnimationFrame||function(){
        var e=0;return win.webkitRequestAnimationFrame||win.mozRequestAnimationFrame||function(n){var t,i=(new Date).getTime();return t=Math.max(0,16-(i-e)),e=i+t,setTimeout(function(){n(i+t)},t)}
    }();

    /**
     * Get native scrollbar width
     * @return {Number} Scrollbar width
     */
    var getScrollBarWidth = function() {
        var t = 0,
            e = doc.createElement("div");
        return e.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;", doc.body.appendChild(e), t = e.offsetWidth - e.clientWidth, doc.body.removeChild(e), t
    };

    /**
     * classList shim
     * @type {Object}
     */
    var classList = {
        contains: function(s, a) {
            if (s) return s.classList ? s.classList.contains(a) : !!s.className && !!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"))
        },
        add: function(s, a) {
            classList.contains(s, a) || (s.classList ? s.classList.add(a) : s.className = s.className.trim() + " " + a)
        },
        remove: function(s, a) {
            classList.contains(s, a) && (s.classList ? s.classList.remove(a) : s.className = s.className.replace(new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"), " "))
        },
        toggle: function(s, a, c) {
            var i = this.contains(s, a) ? !0 !== c && "remove" : !1 !== c && "add";
            i && this[i](s, a)
        }
    };

    /**
     * Main Library
     * @param {(String|Object)} content CSS3 selector string or node reference
     * @param {Object} options          User defined options
     */
    var MiniBar = function(container, options) {
        this.container = typeof container === "string" ? doc.querySelector(container) : container;

        this.config = config;

        // User options
        if ( options ) {
            this.config = extend({}, config, options);
        } else if ( win.MiniBarOptions ) {
            this.config = extend({}, config, win.MiniBarOptions);
        }

        this.css = win.getComputedStyle(this.container);

        this.size = getScrollBarWidth();
        this.textarea = this.container.nodeName.toLowerCase() === "textarea";

        this.bars = { x: {}, y: {} };
        this.tracks = { x: {}, y: {} };

        // Events
        this.events = {};

        // Bind events
        each(["update", "scroll", "mouseenter", "mousedown", "mousemove", "mouseup", "mousewheel"], function(i, evt) {
            this.events[evt] = this[evt].bind(this);
        }, this);

        // Debounce win resize
        this.events.debounce = debounce(this.events.update, 50);

        this.init();
    };

    var proto = MiniBar.prototype;

    /**
     * Init instance
     * @return {Void}
     */
    proto.init = function() {
        var mb = this, o = mb.config;

        if ( !mb.initialised ) {

            // We need a seperate wrapper for the textarea that we can pad
            // otherwise the text will be up against the container edges
            if ( mb.textarea ) {
                mb.content = mb.container;
                mb.container = doc.createElement("div");
                classList.add(mb.container, o.textareaClass);

                mb.wrapper = doc.createElement("div");
                classList.add(mb.wrapper, o.wrapperClass);
                mb.container.appendChild(mb.wrapper);

                mb.content.parentNode.insertBefore(mb.container, mb.content);

                // Update the bar on input
                mb.content.addEventListener("input", function(e) {
                    mb.update();
                });

            } else {
                mb.content = doc.createElement("div");

                // Move all nodes to the the new content node
                while(mb.container.firstChild) {
                    mb.content.appendChild(mb.container.firstChild);
                }
            }

            classList.add(mb.container, o.containerClass);

            classList.add(mb.content, o.contentClass);

            if (o.alwaysShowBars) {
                classList.add(mb.container, o.visibleClass);
            }

            // Set the tracks and bars and append them to the container
            each(mb.tracks, function (axis, track) {
                mb.bars[axis].node = doc.createElement("div");
                track.node = doc.createElement("div");

                // IE10 can't do multiple args
                classList.add(track.node, o.trackClass);
                classList.add(track.node, o.trackClass + "-" + axis);

                classList.add(mb.bars[axis].node, o.barClass);
                track.node.appendChild(mb.bars[axis].node);

                // Add nav buttons
                if ( o.navButtons ) {
                    var dec = doc.createElement("button"),
                            inc = doc.createElement("button"),
                            wrap = doc.createElement("div"),
                            amount = o.scrollAmount;

                    dec.className = o.buttonClass + " " + o.decreaseClass;
                    inc.className = o.buttonClass + " " + o.increaseClass;
                    wrap.className = o.buttonsClass + " " + o.buttonsClass + "-" + axis;

                    wrap.appendChild(dec);
                    wrap.appendChild(track.node);
                    wrap.appendChild(inc);

                    mb.container.appendChild(wrap);

                    classList.add(mb.container, o.navClass);

                    // Mousedown on buttons
                    on(wrap, "mousedown", function(e) {
                        var el = e.target;

                        cancelAnimationFrame(mb.frame);

                        if ( el === inc || el === dec ) {

                            var scroll = mb.content[scrollPos[axis]];

                            var move = function(c) {
                                switch (mb.content[scrollPos[axis]] = scroll, el) {
                                    case dec:
                                        scroll -= amount;
                                        break;
                                    case inc:
                                        scroll += amount
                                }
                                mb.frame = raf(move)
                            };

                            move();
                        }

                    });

                    // Mouseup on buttons
                    on(wrap, "mouseup", function(e) {
                        var c = e.target,
                            m = 5 * amount;
                        cancelAnimationFrame(mb.frame), c !== inc && c !== dec || mb.scrollBy(c === dec ? -m : m, axis)
                    });

                } else {
                    mb.container.appendChild(track.node);
                }

                if ( o.barType === "progress" ) {
                    classList.add(track.node, o.progressClass);

                    on(track.node, "mousedown", mb.events.mousedown);
                } else {
                    on(mb.bars[axis].node, "mousedown", mb.events.mousedown);
                }

                on(track.node, "mouseenter", function(e) {
                    classList.add(mb.container, o.hoverClass + "-" + axis);
                });
                on(track.node, "mouseleave", function(e) {
                    if ( !mb.down ) {
                        classList.remove(mb.container, o.hoverClass + "-" + axis);
                    }
                });
            });

            // Append the content
            if ( mb.textarea ) {
                mb.wrapper.appendChild(mb.content);
            } else {
                mb.container.appendChild(mb.content);
            }

            if ( mb.css.position === "static" ) {
                mb.manualPosition = true;
                mb.container.style.position = "relative";
            }

            mb.update();

            on(mb.content, "scroll", mb.events.scroll);
            on(mb.container, "mouseenter", mb.events.mouseenter);

            if ( o.horizontalMouseScroll ) {
                on(mb.content, "wheel", mb.events.mousewheel);
            }

            on(win, "resize", mb.events.debounce);

            on(doc, 'DOMContentLoaded', mb.events.update);
            on(win, 'load', mb.events.update);

            mb.initialised = true;
        }
    };

    /**
     * Scroll callback
    * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.scroll = function(e) {
        this.updateScrollBars();
    };

    /**
     * Scroll content by amount
     * @param  {Number}     amount   Number of pixels to scroll
     * @param  {String}     axis     Scroll axis
     * @param  {Number}     duration Duration of scroll animation in ms
     * @param  {Function}   easing   Easing function
     * @return {Void}
     */
    proto.scrollBy = function(amount, axis, duration, easing) {

        axis = axis || "y";

        // No animation
        if ( duration === 0 ) {
            this.content[scrollPos[axis]] += amount;
            return;
        }

        // Duration of scroll
        if ( duration === undefined ) {
            duration = 250;
        }

        // Easing function
        easing = easing || function (t, b, c, d) {
            t /= d;
            return -c * t*(t-2) + b;
        };

        var t = this, start = Date.now(), position = t.content[scrollPos[axis]];

        // Scroll function
        var scroll = function() {
            var now = Date.now(), ct = now - start;

            // Cancel after allotted interval
            if ( ct > duration ) {
                cancelAnimationFrame(t.frame);
                return;
            }

            // Scroll the content
            t.content[scrollPos[axis]] = easing(ct, position, amount, duration);

            // requestAnimationFrame
            t.frame = raf(scroll);
        };

        scroll();
    };

    /**
     * Mousewheel callback
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mousewheel = function(e) {
        e.preventDefault();

        this.scrollBy(e.deltaY * 100, "x");
    };

    /**
     * Mouseenter callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mouseenter = function(e) {
        this.updateScrollBars();
    };

    /**
     * Mousedown callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mousedown = function(e) {
        e.preventDefault();

        this.down = true;

        var mb = this, o = mb.config,
                type = o.barType === "progress" ? "tracks" : "bars",
                axis = e.target === mb[type].x.node ? "x" : "y";

        mb.currentAxis = axis;

        // Lets do all the nasty reflow-triggering stuff now
        // otherwise it'll be a shit-show during mousemove
        mb.update();

        // Keep the tracks visible during drag
        classList.add(mb.container, o.visibleClass);
        classList.add(mb.container, o.scrollingClass + "-" + axis);

        // Save data for use during mousemove
        if ( o.barType === "progress" ) {

            mb.origin = {
                x: e.pageX - mb.tracks[axis].x,
                y: e.pageY - mb.tracks[axis].y
            };

            mb.mousemove(e);

        } else {
            mb.origin = {
                x: e.pageX - mb.bars[axis].x,
                y: e.pageY - mb.bars[axis].y
            };
        }

        // Attach the mousemove and mouseup listeners now
        // instead of permanently having them on
        on(doc, "mousemove", mb.events.mousemove);
        on(doc, "mouseup", mb.events.mouseup);
    };

    /**
     * Mousemove callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mousemove = function(e) {
        e.preventDefault();

        var mb = this, o = this.origin, axis = this.currentAxis,
            track = mb.tracks[axis],
            ts = track[trackSize[axis]],
            offset, ratio, scroll;

        if ( mb.config.barType === "progress" ) {
            offset = e[mAxis[axis]] - track[axis];
            ratio = offset / ts;
            scroll = ratio * (mb.content[scrollSize[axis]] -  mb.rect[trackSize[axis]]);
        } else {
            offset = e[mAxis[axis]] - o[axis] - track[axis];
            ratio = offset / ts;
            scroll = ratio * mb[scrollSize[axis]];
        }

        // Update scroll position
        raf(function () {
            mb.content[scrollPos[axis]] = scroll;
        });
    };

    /**
     * Mouseup callack
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.mouseup = function(e) {
        var mb = this, o = mb.config, evts = mb.events;

        classList.toggle(mb.container, o.visibleClass, o.alwaysShowBars);
        classList.remove(mb.container, o.scrollingClass + "-" + mb.currentAxis);

        if ( !classList.contains(e.target, o.barClass) ) {
            classList.remove(mb.container, o.hoverClass + "-x");
            classList.remove(mb.container, o.hoverClass + "-y");
        }

        mb.origin = {};
        mb.currentAxis = null;
        mb.down = false;

        off(doc, "mousemove", evts.mousemove);
        off(doc, "mouseup", evts.mouseup);
    };

    /**
     * Update cached values and recalculate sizes / positions
     * @param  {Object} e Event interface
     * @return {Void}
     */
    proto.update = function() {
        var mb = this, o = mb.config, ct = mb.content;

        // Cache the dimensions
        mb.rect = rect(mb.container);

        mb.scrollTop = ct.scrollTop;
        mb.scrollLeft = ct.scrollLeft;
        mb.scrollHeight = ct.scrollHeight;
        mb.scrollWidth = ct.scrollWidth;

        // Do we need horizontal scrolling?
        var sx = mb.scrollWidth > mb.rect.width && !mb.textarea;

        // Do we need vertical scrolling?
        var sy = mb.scrollHeight > mb.rect.height;

        classList.toggle(mb.container, "mb-scroll-x", sx && o.scrollX);
        classList.toggle(mb.container, "mb-scroll-y", sy && o.scrollY);

        // Style the content
        style(ct, {
            overflowX: sx ? "auto" : "",
            overflowY: sy ? "auto" : "",
            marginBottom: sx ? -mb.size : "",
            paddingBottom: sx ? mb.size : "",
            marginRight: sy ? -mb.size : "",
            paddingRight: sy ? mb.size : ""
        });

        mb.scrollX = sx;
        mb.scrollY = sy;

        each(mb.tracks, function (i, track) {
            extend(track, rect(track.node));
            extend(mb.bars[i], rect(mb.bars[i].node));
        });

        // Update scrollbars
        mb.updateScrollBars();

        mb.wrapperPadding = 0;

        if ( mb.textarea ) {
            var css = style(mb.wrapper);

            mb.wrapperPadding = parseInt(css.paddingTop, 10) + parseInt(css.paddingBottom, 10);

            // Only scroll to bottom if the cursor is at the end of the content and we're not dragging
            if ( !mb.down && mb.content.selectionStart >= mb.content.value.length ) {
                mb.content.scrollTop = mb.scrollHeight + 1000;
            }
        }
    };

    /**
     * Update a scrollbar's size and position
     * @param  {String} axis
     * @return {Void}
     */
    proto.updateScrollBar = function(axis) {

        var mb = this, css = {},
            ts = trackSize,
            ss = scrollSize,
            o = mb.config,

            // Width or height of track
            tsize = mb.tracks[axis][ts[axis]],

            // Width or height of content
            cs = mb.rect[ts[axis]] - mb.wrapperPadding,

            // We need a live value, not cached
            so = mb.content[scrollPos[axis]],

            br = tsize / mb[ss[axis]],
            sr = so / (mb[ss[axis]] - cs);

        if ( o.barType === "progress" ) {
            // Only need to set the size of a progress bar
            css[ts[axis]] = Math.floor(tsize * sr);
        } else {
            // Set the scrollbar size
            css[ts[axis]] = Math.max(Math.floor(br * cs), o.minBarSize);

            // Set the scrollbar position
            css[trackPos[axis]] = Math.floor((tsize - css[ts[axis]]) * sr);
        }

        raf(function () {
            style(mb.bars[axis].node, css);
        });
    };

    /**
     * Update all scrollbars
     * @return {Void}
     */
    proto.updateScrollBars = function() {
        each(this.bars, function(i, v) {
            this.updateScrollBar(i);
        }, this);
    };

    /**
     * Destroy instance
     * @return {Void}
     */
    proto.destroy = function() {
        var mb = this, o = mb.config, ct = mb.container;

        if ( mb.initialised ) {

            // Remove the event listeners
            off(ct, "mouseenter", mb.events.mouseenter);
            off(win, "resize", mb.events.debounce);

            // Remove the main classes from the container
            classList.remove(ct, o.visibleClass);
            classList.remove(ct, o.containerClass);
            classList.remove(ct, o.navClass);

            // Remove the tracks and / or buttons
            each(mb.tracks, function(i, track) {
                ct.removeChild( o.navButtons ? track.node.parentNode : track.node);
                classList.remove(ct, "mb-scroll-" + i);
            });

            // Move the nodes back to their original container
            while(mb.content.firstChild) {
                ct.appendChild(mb.content.firstChild);
            }

            // Remove the content node
            ct.removeChild(mb.content);

            // Remove manual positioning
            if ( mb.manualPosition ) {
                ct.style.position = "";

                // IE returns null for empty style attribute
                if ( ct.getAttribute("style") === null || !ct.getAttribute("style").length ) {
                    ct.removeAttribute("style");
                }
            }

            // Clear node references
            mb.bars = { x: {}, y: {} };
            mb.tracks = { x: {}, y: {} };
            mb.content = null;

            mb.initialised = false;
        }
    };

    root.MiniBar = MiniBar;

}(this));