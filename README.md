## 📦 RightClick Drag Scroll

一个零延迟触发、精准控制右键菜单和页面拖拽滚动的用户脚本。支持所有网页，完美解决中大型页面浏览、拖动难题。

~> 🚀 一键安装：[点击这里](https://www.tampermonkey.net/script_installation.php#url=https://raw.githubusercontent.com/SharkBee80/RightClick-Drag-Scroll/refs/heads/main/RightClick-Drag-Scroll.js)（需安装 [Tampermonkey](https://www.tampermonkey.net/) 插件）~

---

### 🧩 功能特性

* 🖱️ **右键拖拽页面**：无需按中键，仅用鼠标右键即可滚动页面；
* ⚡ **零延迟触发**：不需长按或等待，瞬间拖动；
* 🎯 **精确容器识别**：智能判断滚动容器，避免 `<li>` 等标签被直接拖动；
* 🧠 **智能忽略输入区域**：不干扰输入框、按钮等控件；
* 🛠️ **支持自定义类名识别**（`.rcs-scroll-zone`）；
* 📱 **适配任意设备与分辨率**。

---

### 🔧 使用方式

1. 安装浏览器插件 [Tampermonkey](https://www.tampermonkey.net/)；
2. 复制本脚本内容 [Raw 链接](https://raw.githubusercontent.com/SharkBee80/RightClick-Drag-Scroll/refs/heads/main/RightClick-Drag-Scroll.js)；
3. 在Tampermonkey插件添加新脚本；
4. 粘贴脚本并保存；

---

### 💡 进阶用法

你可以为页面中的特定区域添加滚动支持：

```html
<div class="rcs-scroll-zone" style="overflow: auto; height: 300px;">
  <ul>
    <li>条目 1</li>
    <li>条目 2</li>
    ...
  </ul>
</div>
```

> 添加 `.rcs-scroll-zone` 类名，可以强制识别该区域为滚动容器。

---

### 🧪 兼容性测试

✅ Chrome
✅ Firefox
✅ Edge
✅ Brave
✅ Tampermonkey v4.18+

---

### 🧑‍💻 作者 / Author

本脚本由 \[SharkBee] 编写。欢迎 Fork 和改进！

---

### 📜 License

MIT License - 你可以自由使用、修改和分发。
