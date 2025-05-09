// ==UserScript==
// @name         RightClick Drag Scroll (拖拽滚动)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  精准识别滚动容器的右键拖动滚动方案，避免li被拖动问题，支持自定义滚动区域类名 .rcs-scroll-zone
// @author       SharkBee,DeepSeek,ChatGPT
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        MOVE_THRESHOLD: 5,
        EXCLUDE_TAGS: new Set(['INPUT', 'TEXTAREA', 'SELECT', 'IFRAME']),
        TEXT_SELECT_CLASS: 'rcs-allow-select',
        DATA_ALLOW_SELECT: 'data-rcs-allow-select',
        SCROLL_CONTAINER_CLASS: 'rcs-scroll-zone'
    };

    GM_addStyle(`
        .rcs-scroll-active {
            cursor: grab !important;
            user-select: none !important;
        }
        .rcs-scroll-active.grabbing {
            cursor: grabbing !important;
        }
        .${CONFIG.TEXT_SELECT_CLASS}, [${CONFIG.DATA_ALLOW_SELECT}] {
            user-select: text !important;
        }
    `);

    class InstantRightClickScroll {
        #container = null;
        #startPos = { x: 0, y: 0 };
        #scrollPos = { x: 0, y: 0 };
        #isDragging = false;
        #hasMoved = false;

        constructor() {
            document.addEventListener('mousedown', e => this.#handleStart(e));
        }

        #shouldIgnore(target) {
            return (
                CONFIG.EXCLUDE_TAGS.has(target.tagName) ||
                target.isContentEditable ||
                !!target.closest(`.${CONFIG.TEXT_SELECT_CLASS}, [${CONFIG.DATA_ALLOW_SELECT}]`)
            );
        }

        #findScrollContainer(el) {
            // 优先寻找用户显式标记的滚动容器
            const marked = el.closest(`.${CONFIG.SCROLL_CONTAINER_CLASS}`);
            if (marked) return marked;

            // 自动检测可滚动容器（必须 overflow: auto|scroll）
            while (el && el !== document.documentElement) {
                const style = getComputedStyle(el);
                const overflow = `${style.overflow}${style.overflowY}${style.overflowX}`;
                if (
                    (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) &&
                    /(auto|scroll)/.test(overflow)
                ) {
                    return el;
                }
                el = el.parentElement;
            }

            return document.scrollingElement;
        }

        #handleStart(e) {
            if (e.button !== 2 || this.#shouldIgnore(e.target)) return;

            this.#container = this.#findScrollContainer(e.target);
            if (!this.#container) return;

            this.#startPos = { x: e.clientX, y: e.clientY };
            this.#scrollPos = {
                x: this.#container.scrollLeft,
                y: this.#container.scrollTop
            };
            this.#hasMoved = false;
            this.#isDragging = false;

            const moveHandler = e => this.#handleMove(e);
            const upHandler = e => this.#handleEnd(e, cleanUp);
            const contextMenuHandler = e => {
                if (this.#hasMoved) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            };

            const cleanUp = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                document.removeEventListener('contextmenu', contextMenuHandler);
                if (this.#isDragging) {
                    this.#container.classList.remove('rcs-scroll-active');
                }
                this.#isDragging = false;
            };

            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
            document.addEventListener('contextmenu', contextMenuHandler, true);
        }

        #handleMove(e) {
            const dx = e.clientX - this.#startPos.x;
            const dy = e.clientY - this.#startPos.y;

            if (!this.#isDragging) {
                if (Math.abs(dx) + Math.abs(dy) < CONFIG.MOVE_THRESHOLD) return;
                this.#isDragging = true;
                this.#container.classList.add('rcs-scroll-active');
                e.preventDefault();
            }

            this.#container.scrollLeft = this.#scrollPos.x - dx;
            this.#container.scrollTop = this.#scrollPos.y - dy;
            this.#hasMoved = true;
        }

        #handleEnd(e, cleanUp) {
            if (e.button === 2 && this.#hasMoved) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const tempAllow = ev => {
                    document.removeEventListener('contextmenu', tempAllow);
                    document.removeEventListener('mousedown', tempAllow);
                };
                document.addEventListener('contextmenu', tempAllow, { once: true });
                document.addEventListener('mousedown', tempAllow, { once: true });
            }
            cleanUp();
        }
    }

    new InstantRightClickScroll();
})();
