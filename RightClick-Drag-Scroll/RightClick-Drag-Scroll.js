// ==UserScript==
// @name         RightClick Drag Scroll (拖拽滚动)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  支持惯性滚动的右键拖动脚本，精准识别容器，避免误触li，支持自定义类名 .rcs-scroll-zone
// @author       SharkBee, DeepSeek, ChatGPT
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // 配置项
    const CONFIG = {
        MOVE_THRESHOLD: 5, // 判断为拖动所需的最小移动距离
        EXCLUDE_TAGS: new Set(['INPUT', 'TEXTAREA', 'SELECT', 'IFRAME']), // 忽略输入元素
        TEXT_SELECT_CLASS: 'rcs-allow-select', // 允许文本选择的类名
        DATA_ALLOW_SELECT: 'data-rcs-allow-select', // 允许文本选择的自定义属性
        SCROLL_CONTAINER_CLASS: 'rcs-scroll-zone', // 用户手动指定的滚动区域类名
        INERTIA_DECAY: 0.95, // 惯性滚动的速度衰减因子
        INERTIA_MIN_SPEED: 0.5, // 最小速度，低于此停止滚动
        INERTIA_INTERVAL: 16 // 惯性滚动帧间隔（非强制使用，保留可调）
    };

    // 样式注入
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
        // 私有属性
        #container = null; // 当前滚动容器
        #startPos = { x: 0, y: 0 }; // 鼠标起始位置
        #scrollPos = { x: 0, y: 0 }; // 滚动起始值
        #lastMoveTime = 0; // 上一次移动时间
        #lastDelta = { x: 0, y: 0 }; // 上一次移动的距离差
        #isDragging = false;
        #hasMoved = false;

        constructor() {
            document.addEventListener('mousedown', e => this.#handleStart(e));
        }

        // 判断是否应忽略此元素
        #shouldIgnore(target) {
            return (
                CONFIG.EXCLUDE_TAGS.has(target.tagName) ||
                target.isContentEditable ||
                !!target.closest(`.${CONFIG.TEXT_SELECT_CLASS}, [${CONFIG.DATA_ALLOW_SELECT}]`)
            );
        }

        // 查找滚动容器：优先使用用户指定，其次自动判断 overflow
        #findScrollContainer(el) {
            const marked = el.closest(`.${CONFIG.SCROLL_CONTAINER_CLASS}`);
            if (marked) return marked;

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

        // 鼠标按下时触发
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
            this.#lastMoveTime = Date.now();
            this.#lastDelta = { x: 0, y: 0 };

            // 注册事件
            const moveHandler = e => this.#handleMove(e);
            const upHandler = e => this.#handleEnd(e, cleanUp);
            const contextMenuHandler = e => {
                if (this.#hasMoved) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            };

            // 清理事件绑定
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

        // 鼠标移动时触发
        #handleMove(e) {
            const now = Date.now();
            const dx = e.clientX - this.#startPos.x;
            const dy = e.clientY - this.#startPos.y;

            if (!this.#isDragging) {
                if (Math.abs(dx) + Math.abs(dy) < CONFIG.MOVE_THRESHOLD) return;
                this.#isDragging = true;
                this.#container.classList.add('rcs-scroll-active');
                e.preventDefault();
            }

            // 计算滚动位置
            const newX = this.#scrollPos.x - dx;
            const newY = this.#scrollPos.y - dy;

            // 记录移动速度
            this.#lastDelta = {
                x: this.#container.scrollLeft - newX,
                y: this.#container.scrollTop - newY
            };
            this.#lastMoveTime = now;

            this.#container.scrollLeft = newX;
            this.#container.scrollTop = newY;
            this.#hasMoved = true;
        }

        // 鼠标松开时触发
        #handleEnd(e, cleanUp) {
            if (e.button === 2 && this.#hasMoved) {
                e.preventDefault();
                e.stopImmediatePropagation();

                // 启动惯性滚动
                const speed = { ...this.#lastDelta };
                let frame = () => {
                    speed.x *= CONFIG.INERTIA_DECAY;
                    speed.y *= CONFIG.INERTIA_DECAY;

                    if (Math.abs(speed.x) < CONFIG.INERTIA_MIN_SPEED && Math.abs(speed.y) < CONFIG.INERTIA_MIN_SPEED) {
                        return;
                    }

                    this.#container.scrollLeft -= speed.x;
                    this.#container.scrollTop -= speed.y;
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);

                // 阻止右键菜单闪现
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

    // 启动实例
    new InstantRightClickScroll();
})();
