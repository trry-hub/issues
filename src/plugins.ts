export function artplayerSegmentPlugin(options) {
  return async (art) => {
    const {
      constructor: {
        utils: { setStyle, isMobile },
      },
      template: { $progress },
    } = art;
    console.log('art: ', art.options);

    const segments = options.segments || [];
    let segmentElements = [];
    let timer = null;

    // 创建 tooltip 元素并添加到 DOM 中
    const tooltip = document.createElement('div');
    tooltip.className = 'segment-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);

    // 创建一个显示时间的自定义内容
    const $customTooltip = document.createElement('div');
    $customTooltip.style.position = 'absolute';
    $customTooltip.style.padding = '15px';
    $customTooltip.style.backgroundColor = '#E5E1FF';
    $customTooltip.style.color = 'white';
    $customTooltip.style.borderRadius = '4px';
    $customTooltip.style.pointerEvents = 'none';
    $customTooltip.style.bottom = '18px';
    $customTooltip.style.maxWidth = '60%';
    $customTooltip.style.fontSize = '12px';
    $customTooltip.style.lineHeight = '20px';
    $customTooltip.style.zIndex = '51';
    $customTooltip.style.display = 'none'; // 初始时隐藏

    function showSegmentTooltip(element, segment) {
      tooltip.innerText = `Title: ${segment.title}\nIntro: ${segment.intro}`;
      tooltip.style.display = 'block';

      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    }

    function hideSegmentTooltip() {
      tooltip.style.display = 'none';
    }

    function formatTime(second, duration) {
      const date = new Date(second * 1000);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();

      if (duration >= 3600) {
        // 格式化为 HH:MM:SS
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        // 格式化为 MM:SS
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }

    function truncateHeadline(headline) {
      const maxLength = 100;
      return headline.length > maxLength ? headline.slice(0, maxLength) + '...' : headline;
    }

    function showCustomTooltip($control, second, width) {
      const time = formatTime(second, art.duration);
      const segment = segments.find((s) => second >= s.start / 1000 && second < s.end / 1000);
      if (!segment) return;

      const truncatedHeadline = truncateHeadline(segment.headline);

      $control.innerHTML = `
        <span style="text-shadow: none;color: #68678A;margin-right: 5px;">${time}</span>
        <b style="color: ${art.option.theme};text-shadow: none;">${truncatedHeadline}</b>
        <div style="color: #6B6A8B;text-shadow: none;margin-top: 5px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;
          overflow: hidden;
          text-overflow: ellipsis;">${segment.summary}</div>
      `;

      setStyle($control, 'display', 'block'); // 显示自定义提示框

      if (width <= $control.clientWidth / 2) {
        setStyle($control, 'left', 0);
      } else if (width > $progress.clientWidth - $control.clientWidth / 2) {
        setStyle($control, 'left', `${$progress.clientWidth - $control.clientWidth}px`);
      } else {
        setStyle($control, 'left', `${width - $control.clientWidth / 2}px`);
      }
    }

    function createSegmentElement(segment) {
      const segmentElement = document.createElement('div');
      segmentElement.className = 'segment';
      segmentElement.style.position = 'absolute';
      segmentElement.style.left = `${((segment.start / 1000) / art.duration) * 100}%`;
      segmentElement.style.width = `${((segment.end - segment.start) / 1000 / art.duration) * 100}%`;
      segmentElement.style.height = '100%';
      segmentElement.style.backgroundColor = 'white';
      segmentElement.style.zIndex = '10';
      segmentElement.style.overflow = 'hidden';
      segmentElement.style.transition = 'height 0.3s';

      const hoverDiv = document.createElement('div');
      hoverDiv.className = 'hover-segment';
      hoverDiv.style.height = '100%';
      hoverDiv.style.backgroundColor = art.option.theme;
      hoverDiv.style.width = '0%';

      segmentElement.appendChild(hoverDiv);
      $progress.querySelector('.art-control-progress').appendChild(segmentElement);

      segmentElement.addEventListener('mouseenter', () => {
        segmentElement.style.height = '10px';
        showSegmentTooltip(segmentElement, segment);
      });

      segmentElement.addEventListener('mouseleave', () => {
        segmentElement.style.height = '100%';
        hideSegmentTooltip();
      });

      return { segment, hoverDiv, element: segmentElement };
    }

    function createSegmentElements() {
      segmentElements.forEach(({ element }) => element.remove());
      segmentElements = segments.map(createSegmentElement);
    }

    function updateHoverSegments(currentTime) {
      segmentElements.forEach(({ segment, hoverDiv }) => {
        const start = segment.start / 1000;
        const end = segment.end / 1000;
        const playedPercentage = (currentTime - start) / (end - start);
        hoverDiv.style.width = currentTime >= start && currentTime < end ? `${playedPercentage * 100}%` : (currentTime >= end ? '100%' : '0%');
      });
    }

    function initializeSegments() {
      createSegmentElements();
      updateHoverSegments(art.currentTime);
    }

    art.on('ready', () => {
      initializeSegments();
      art.controls.add({
        name: 'customTooltip',
        position: 'top',
        index: 20,
        style: {},
        mounted($control) {
          $control.appendChild($customTooltip);
          art.on('setBar', async (type, percentage, event) => {
            const isMobileDragging = type === 'played' && event && isMobile;

            if (type === 'hover' || isMobileDragging) {
              const width = $progress.clientWidth * percentage;
              const second = percentage * art.duration;
              setStyle($control, 'display', 'flex');

              if (width > 0 && width < $progress.clientWidth) {
                showCustomTooltip($customTooltip, second, width);
              } else {
                if (!isMobile) {
                  setStyle($control, 'display', 'none');
                }
              }

              if (isMobileDragging) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                  setStyle($control, 'display', 'none');
                }, 500);
              }
            }
          });

          art.on('video:timeupdate', () => {
            updateHoverSegments(art.currentTime);
          });
        },
      });
    });

    return {
      name: 'artplayerSegmentPlugin',
    };
  };
}
