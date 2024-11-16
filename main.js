(function () {
    'use strict';

    fetch('file://F:\\onedrive\\翻译插件\\Replacements.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const Replacements = data;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });


    const IMGreplace = Replacements[3].images

    function replaceImageSource() {
        const path = window.location.pathname;
        if (IMGreplace[path]) {
            const imgConfig = IMGreplace[path];

            for (const altValue in imgConfig) {
                const images = document.querySelectorAll(`img[alt="${altValue}"]`);
                const replacements = imgConfig[altValue];

                images.forEach((img, index) => {
                    if (replacements[index + 1]) {
                        img.src = replacements[index + 1];
                    }
                });
            }
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 预编译所有替换规则
    const compiledReplacements = Replacements.map(replacement => {
        const partialPatterns = Object.keys(replacement.partial || {}).flatMap(key => {
            if (replacement.type === 'url' || replacement.type === 'element') {
                return Object.keys(replacement.partial[key]).map(subKey => ({
                    regex: new RegExp(escapeRegExp(subKey), 'g'),
                    value: replacement.partial[key][subKey],
                    matchType: "partial",
                    context: key
                }));
            } else {
                return {
                    regex: new RegExp(escapeRegExp(key), 'g'),
                    value: replacement.partial[key],
                    matchType: "partial"
                };
            }
        });
        const fullPatterns = Object.keys(replacement.full || {}).flatMap(key => {
            if (replacement.type === 'url' || replacement.type === 'element') {
                return Object.keys(replacement.full[key]).map(subKey => ({
                    regex: new RegExp(escapeRegExp(subKey)),
                    value: replacement.full[key][subKey],
                    matchType: "full",
                    context: key
                }));
            } else {
                return {
                    regex: new RegExp(escapeRegExp(key)),
                    value: replacement.full[key],
                    matchType: "full"
                };
            }
        });
        return { ...replacement, patterns: [...partialPatterns, ...fullPatterns] };
    });

    function getReplacementsForURL() {
        const path = window.location.pathname;
        return compiledReplacements.filter(replacement =>
            replacement.type === "global" ||
            (replacement.type === "url" && replacement.patterns.some(pattern => pattern.context === path))
        );
    }

    function getReplacementsForElement(element) {
        const dataAttributes = Array.from(element.attributes).map(attr => attr.name);
        return compiledReplacements.filter(replacement =>
            replacement.type === "global" ||
            (replacement.type === "element" && replacement.patterns.some(pattern => dataAttributes.includes(pattern.context)))
        );
    }

    function ReplaceText(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let currentNode = walker.nextNode();
        const urlReplacements = getReplacementsForURL();

        while (currentNode) {
            const elementReplacements = getReplacementsForElement(currentNode.parentElement);
            const allReplacements = [...urlReplacements, ...elementReplacements];

            let text = currentNode.nodeValue;
            allReplacements.forEach(({ patterns }) => {
                patterns.forEach(({ regex, value, matchType, context }) => {
                    if (context && window.location.pathname !== context && !currentNode.parentElement.hasAttribute(context)) return;
                    if (matchType === "partial") {
                        text = text.replace(regex, value);
                    } else if (matchType === "full" && text === regex.source) {
                        text = value;
                    }
                });
            });
            if (text !== currentNode.nodeValue) {
                currentNode.nodeValue = text;
            }
            currentNode = walker.nextNode();
        }
    }

    function ReplaceTitle() {
        let title = document.title;
        const urlReplacements = getReplacementsForURL();

        urlReplacements.forEach(({ patterns }) => {
            patterns.forEach(({ regex, value, matchType, context }) => {
                if (context && window.location.pathname !== context) return;
                if (matchType === "partial") {
                    title = title.replace(regex, value);
                } else if (matchType === "full" && title === regex.source) {
                    title = value;
                }
            });
        });
        document.title = title;
    }

    function changeFont() {
        if (!document.querySelector('#customFontStyle')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'customFontStyle';
            document.head.appendChild(styleElement);
            styleElement.textContent = `
                body,label,.character-detail__visual-catch,.font-style-italic,.catch-text  {
                    font-family: Misans,YakuHanJP,Roboto,Zen Kaku Gothic New,sans-serif,微软雅黑 !important;
                }
                .mainstory-part1-section[data-v-dbd344ea],.font-weight-regular {
                    font-family: 思源宋体,Noto Serif JP,serif !important;
                }
            `;
        }
    }

    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            ReplaceText(document.body);
            ReplaceTitle();
            replaceImageSource();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function loadMiSansFont() {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        link.href = 'https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/Normal/MiSans-Medium.min.css';

        document.head.appendChild(link);
    }

    function loadSongFont() {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        link.href = 'https://www.unpkg.com/font-online/fonts/SourceHanSans/SourceHanSans-Normal.otf';

        document.head.appendChild(link);
    }

    loadMiSansFont();
    loadSongFont();
    ReplaceText(document.body);
    ReplaceTitle();
    changeFont();
    observeDOMChanges();
    replaceImageSource();
})();