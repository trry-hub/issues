import type Artplayer from 'artplayer'

type option = any
export function artplayerChaptersPlugin<T>(options: option[]) {
  return async (art: Artplayer) => {
    const {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      constructor: { utils: { setStyle, isMobile } },
      template: { $progress },
    } = art

    const segments = options || []
    let segmentElements: {
      element: HTMLDivElement
      segment: option
      hoverDiv: HTMLDivElement
    }[] = []
    let timer: number | undefined

    // 创建 tooltip 元素并添加到 DOM 中
    const tooltip = document.createElement('div')
    tooltip.className = 'segment-tooltip'
    Object.assign(tooltip.style, {
      position: 'absolute',
      display: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      color: 'white',
      padding: '5px',
      borderRadius: '5px',
      pointerEvents: 'none',
    })
    document.body.appendChild(tooltip)

    // 创建自定义 tooltip 元素
    const $customTooltip = document.createElement('div')
    Object.assign($customTooltip.style, {
      position: 'absolute',
      padding: '15px',
      backgroundColor: '#E5E1FF',
      color: 'white',
      borderRadius: '4px',
      pointerEvents: 'none',
      bottom: '18px',
      maxWidth: '60%',
      fontSize: '12px',
      lineHeight: '20px',
      zIndex: '51',
      display: 'none',
    })

    function formatTime(second: number, duration: number) {
      const date = new Date(second * 1000)
      const hours = date.getUTCHours()
      const minutes = date.getUTCMinutes()
      const seconds = date.getUTCSeconds()

      if (duration >= 3600) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
      else {
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
    }

    function truncateHeadline(headline: string) {
      const maxLength = 100
      return headline.length > maxLength ? `${headline.slice(0, maxLength)}...` : headline
    }

    function showCustomTooltip($control: HTMLDivElement, second: number, width: number) {
      const time = formatTime(second, art.duration)
      const segment = segments.find(s => second >= s.start / 1000 && second < s.end / 1000)
      if (!segment) {
        return
      }

      const truncatedHeadline = truncateHeadline(segment.headline)

      $control.innerHTML = `
        <span style="text-shadow: none; color: #68678A; margin-right: 5px;">${time}</span>
        <b style="color: ${art.option.theme}; text-shadow: none;">${truncatedHeadline}</b>
        <div style="color: #6B6A8B; text-shadow: none; margin-top: 5px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;
          overflow: hidden;
          text-overflow: ellipsis;">${segment.summary}</div>
      `

      setStyle($control, 'display', 'block')

      if (width <= $control.clientWidth / 2) {
        setStyle($control, 'left', '0')
      }
      else if (width > $progress.clientWidth - $control.clientWidth / 2) {
        setStyle($control, 'left', `${$progress.clientWidth - $control.clientWidth}px`)
      }
      else {
        setStyle($control, 'left', `${width - $control.clientWidth / 2}px`)
      }
    }

    function createSegmentElement(segment: option) {
      const segmentElement = document.createElement('div')
      Object.assign(segmentElement.style, {
        position: 'absolute',
        left: `${((segment.start / 1000) / art.duration) * 100}%`,
        width: `${((segment.end - segment.start) / 1000 / art.duration) * 100}%`,
        height: '100%',
        backgroundColor: 'white',
        zIndex: '10',
        overflow: 'hidden',
        transition: 'height 0.3s',
      })

      const hoverDiv = document.createElement('div')
      hoverDiv.style.height = '100%'
      hoverDiv.style.backgroundColor = art.option.theme || ''
      hoverDiv.style.width = '0%'

      segmentElement.appendChild(hoverDiv)
      $progress.querySelector('.art-control-progress')?.appendChild(segmentElement)

      segmentElement.addEventListener('mouseenter', () => {
        segmentElement.style.height = '10px'
      })

      segmentElement.addEventListener('mouseleave', () => {
        segmentElement.style.height = '100%'
        // hideSegmentTooltip()
      })

      return { segment, hoverDiv, element: segmentElement }
    }

    function createSegmentElements() {
      segmentElements.forEach(({ element }) => element.remove())
      segmentElements = segments.map(createSegmentElement)
    }

    function updateHoverSegments(currentTime: number) {
      segmentElements.forEach(({ segment, hoverDiv }) => {
        const start = segment.start / 1000
        const end = segment.end / 1000
        const playedPercentage = (currentTime - start) / (end - start)
        hoverDiv.style.width = currentTime >= start && currentTime < end ? `${playedPercentage * 100}%` : (currentTime >= end ? '100%' : '0%')
      })
    }

    function initializeSegments() {
      createSegmentElements()
      updateHoverSegments(art.currentTime)
    }

    art.on('ready', () => {
      initializeSegments()
      art.controls.add({
        name: 'customTooltip',
        position: 'top',
        index: 20,
        style: {},
        mounted($control) {
          $control.appendChild($customTooltip)
          art.on('setBar', (type, percentage, event) => {
            const isMobileDragging = type === 'played' && event && isMobile

            if (type === 'hover' || isMobileDragging) {
              const width = $progress.clientWidth * percentage
              const second = percentage * art.duration
              setStyle($control, 'display', 'flex')

              if (width > 0 && width < $progress.clientWidth) {
                showCustomTooltip($customTooltip, second, width)
              }
              else {
                if (!isMobile) {
                  setStyle($control, 'display', 'none')
                }
              }

              if (isMobileDragging) {
                clearTimeout(timer)
                timer = setTimeout(() => {
                  setStyle($control, 'display', 'none')
                }, 500)
              }
            }
          })

          art.on('video:timeupdate', () => {
            updateHoverSegments(art.currentTime)
          })
        },
      })
    })

    return {
      name: 'artplayerSegmentPlugin',
    }
  }
}
