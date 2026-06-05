import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import { ASSETS_BASE_URL } from '@/config/constants';

function generateSlidesHtml(slides: (string | { file: string; note?: string; })[], scale: number) {
  const BASE_URL = ASSETS_BASE_URL + '/';
   return `<!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=${scale}, maximum-scale=10, user-scalable=yes" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body, html { width: 100%; height: 100%; background: #fff; overflow: hidden; touch-action: manipulation; }
      .slides-container { 
        width: 100%; 
        height: 100%; 
        overflow-x: auto; 
        scroll-snap-type: x mandatory;
        display: flex;
        -webkit-overflow-scrolling: touch;
        align-items: center;
        touch-action: pan-x pan-y pinch-zoom;
      }
      .slides-container.no-snap {
        scroll-snap-type: none;
      }
      .slide { 
        flex: 0 0 100%; 
        height: 100%; 
        min-height: 400px;
        scroll-snap-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
      }
      .slide.zoomed {
        scroll-snap-align: none;
        overflow: auto;
      }
      .video-container {
        width: 100%;
        height: 100%;
        min-height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .video-title {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        z-index: 15;
        pointer-events: none;
        max-height: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.3;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        word-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        max-width: calc(100% - 20px);
        margin: 0 auto;
      }
      .video-title.long {
        font-size: 12px;
        max-height: 50px;
        padding: 6px 10px;
        -webkit-line-clamp: 3;
        line-height: 1.2;
      }
      @media (max-width: 480px) {
        .video-title {
          font-size: 12px;
          max-height: 45px;
          padding: 6px 8px;
          top: 8px;
          left: 8px;
          right: 8px;
          -webkit-line-clamp: 2;
        }
        .video-title.long {
          font-size: 11px;
          max-height: 40px;
          padding: 5px 8px;
          -webkit-line-clamp: 2;
          line-height: 1.1;
        }
      }
      img { 
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.1s ease-out;
        position: relative;
      }
      video { 
        width: 100%; 
        min-height: 300px;
        height: auto;
        background: #000;
        transition: transform 0.1s ease-out;
        position: relative;
        z-index: 5;
      }
      video::-webkit-media-controls-overlay-enclosure {
        z-index: 10 !important;
      }
      video::-webkit-media-controls {
        z-index: 10 !important;
      }
      video::-webkit-media-controls-panel {
        z-index: 10 !important;
      }
      video::-webkit-media-controls-play-button {
        z-index: 10 !important;
      }
      video::-webkit-media-controls-timeline {
        z-index: 10 !important;
      }
      audio { width: 90%; }
      canvas { 
        max-width:100% !important; 
        height:auto !important; 
        display:block;
        transition: transform 0.1s ease-out;
        position: relative;
      }
      .slides-container::-webkit-scrollbar{height:8px}
      .slides-container::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:4px}
      .error-placeholder { color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div id="container" class="slides-container"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script>
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      const BASE_URL = '${ASSETS_BASE_URL}/';
      const slides = ${JSON.stringify(slides.map(slide => {
        if (typeof slide === 'string') {
          return { file: slide, note: undefined };
        } else if (slide && typeof slide === 'object' && slide.file) {
          let fileUrl = slide.file;
          if (typeof fileUrl === 'string' && fileUrl.match(/\.(mp4|webm|mov|m4v|mkv)$/i)) {
            if (!fileUrl.startsWith(BASE_URL)) {
              fileUrl = BASE_URL + fileUrl.replace(/^\//, '');
            }
          }
          return { file: fileUrl, note: slide.note };
        }
        return { file: slide, note: undefined };
      }))};
      const container = document.getElementById('container');      function post(obj){ try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }catch(e){} }

      function isVideo(url){ const l = (url||'').split('?')[0].toLowerCase(); return l.endsWith('.mp4') || l.endsWith('.webm') || l.endsWith('.mov') || l.endsWith('.m4v') || l.endsWith('.mkv'); }
      function isAudio(url){ const l = (url||'').split('?')[0].toLowerCase(); return l.endsWith('.mp3') || l.endsWith('.wav') || l.endsWith('.m4a') || l.endsWith('.ogg'); }
      function isPdf(url){ const l = (url||'').split('?')[0].toLowerCase(); return l.endsWith('.pdf'); }

      async function renderSlide(idx, slideData){
        const wrapper = document.createElement('div');
        wrapper.className = 'slide';
        wrapper.id = 'slide-' + idx;
        
        const url = slideData.file;
        const note = slideData.note;

        try{
          if (isPdf(url)){
            const canvas = document.createElement('canvas');
            canvas.id = 'canvas-' + idx;
            wrapper.appendChild(canvas);
            container.appendChild(wrapper);

            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1 });
            const pdfWidth = viewport.width;
            const pdfHeight = viewport.height;

            const devicePixelRatio = window.devicePixelRatio || 1;
            const availableWidth = Math.max(100, window.innerWidth);
            const availableHeight = Math.max(100, window.innerHeight);

            let fitScale = Math.min(availableWidth / pdfWidth, availableHeight / pdfHeight);
            const MAX_UPSCALE = 2.0;
            fitScale = Math.min(fitScale, MAX_UPSCALE);

            const renderScale = fitScale * devicePixelRatio;
            const renderViewport = page.getViewport({ scale: renderScale });

            canvas.width = Math.floor(renderViewport.width);
            canvas.height = Math.floor(renderViewport.height);
            canvas.style.width = Math.floor(pdfWidth * fitScale) + 'px';
            canvas.style.height = Math.floor(pdfHeight * fitScale) + 'px';

            canvas.setAttribute('data-original-width', Math.floor(pdfWidth * fitScale).toString());
            canvas.setAttribute('data-original-height', Math.floor(pdfHeight * fitScale).toString());

            await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;

          } else if (isVideo(url)){
            // Create video container for title overlay
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.src = url;
            video.controls = true;
            video.preload = 'metadata';
            video.style.width = '100%';
            video.style.minHeight = '300px';
            video.style.height = 'auto';
            video.style.position = 'relative';
            video.style.zIndex = '5';
            video.style.outline = 'none';
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('controlsList', 'nodownload');
            video.setAttribute('disablePictureInPicture', 'false');
            
            // Ensure video controls are always accessible
            video.addEventListener('loadedmetadata', function() {
              console.log('Video metadata loaded:', video.src);
              video.style.pointerEvents = 'auto';
            });
            
            // Add error handling for video loading
            video.addEventListener('error', function(e) {
              console.log('Video error:', e);
              console.log('Video src:', video.src);
            });
            
            video.addEventListener('loadstart', function() {
              console.log('Video loading started:', video.src);
            });
            
            video.addEventListener('canplay', function() {
              console.log('Video can play:', video.src);
            });
            
            videoContainer.appendChild(video);
            
            // Add title overlay if note exists
            if (note && note.trim()) {
              const titleOverlay = document.createElement('div');
              const noteText = note.trim();
              
              // Determine if title is long and apply appropriate class
              titleOverlay.className = noteText.length > 50 ? 'video-title long' : 'video-title';
              titleOverlay.textContent = noteText;
              titleOverlay.style.zIndex = '15';
              titleOverlay.style.position = 'absolute';
              titleOverlay.style.display = 'block';
              titleOverlay.style.visibility = 'visible';
              titleOverlay.style.opacity = '1';
              titleOverlay.style.pointerEvents = 'none';
              
              // For very long titles, truncate more aggressively
              if (noteText.length > 100) {
                titleOverlay.textContent = noteText.substring(0, 97) + '...';
                titleOverlay.title = noteText; // Show full text on hover if possible
              }
              
              videoContainer.appendChild(titleOverlay);
              
              // Debug log to check if title is being added
              console.log('Video title added:', noteText.length > 50 ? 'long title' : 'normal title', noteText.substring(0, 50));
              
              // Keep title fully visible - no opacity changes
              // Title will remain at full opacity (1.0) throughout the video lifecycle
            }
            
            wrapper.appendChild(videoContainer);
            container.appendChild(wrapper);

          } else if (isAudio(url)){
            const audio = document.createElement('audio');
            audio.src = url;
            audio.controls = true;
            audio.preload = 'metadata';
            wrapper.appendChild(audio);
            container.appendChild(wrapper);

          } else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'slide ' + (idx+1);
            img.setAttribute('data-original-transform', 'scale(1)');
            wrapper.appendChild(img);
            container.appendChild(wrapper);
          }
        }catch(err){
          wrapper.innerHTML = '';
          const msg = document.createElement('div');
          msg.className = 'error-placeholder';
          msg.textContent = 'Unable to load file';
          wrapper.appendChild(msg);
          container.appendChild(wrapper);
        }
      }

      function applyScaleToAllContent(scale) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=' + scale + ', maximum-scale=10, minimum-scale=0.3, user-scalable=yes');
        }
        
        const slides = container.querySelectorAll('.slide');
        slides.forEach(slide => {
          // Enable/disable scroll snap and overflow based on zoom level
          if (scale > 1) {
            slide.classList.add('zoomed');
            slide.style.overflow = 'auto';
          } else {
            slide.classList.remove('zoomed');
            slide.style.overflow = 'hidden';
          }
        });
        
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          canvas.style.transform = 'scale(' + scale + ')';
          canvas.style.transformOrigin = 'center center';
        });
        
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.style.transform = 'scale(' + scale + ')';
          img.style.transformOrigin = 'center center';
        });
        
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          video.style.transform = 'scale(' + scale + ')';
          video.style.transformOrigin = 'center center';
        });
        
        // Update container behavior based on zoom level
        if (scale > 1) {
          container.classList.add('no-snap');
        } else {
          container.classList.remove('no-snap');
        }
        
        currentScale = scale;
      }
      
      // Panning functionality

      (async function(){
        let currentScale = 1.0; // Initialize current scale
        
        for (let i=0;i<slides.length;i++){
          renderSlide(i, slides[i]);
        }

        const total = slides.length || 0;
        post({ type: 'pdfReady', total });

        let lastReported = 1;
        let isLocked = false;
        let isTouching = false;
        let isInitializing = true;
        let scrollCooldown = false;
        const SCROLL_COOLDOWN_MS = 600;
        const SCROLL_DURATION = 400;

        function getCurrentIndex(){
          return Math.round((container.scrollLeft + container.clientWidth/2) / container.clientWidth) + 1;
        }

        function findAvailableFrom(requested){
          for (let i = requested; i <= total; i++) {
            const c = container.children[i-1];
            if (c) return { node: c, page: i };
          }
          for (let i = requested - 1; i >= 1; i--) {
            const c = container.children[i-1];
            if (c) return { node: c, page: i };
          }
          if (container.children.length > 0) return { node: container.children[0], page: 1 };
          return null;
        }

        function reportPage(p){
          lastReported = p;
          post({ type: 'pageChange', page: p });
        }

        function computeLeftForNode(node){
          const nodeLeft = node.offsetLeft || 0;
          const nodeWidth = node.clientWidth || node.offsetWidth || 0;
          const left = Math.max(0, nodeLeft - Math.round((container.clientWidth - nodeWidth)/2));
          return left;
        }

        function scrollToNode(node, animate){
          if (!node) return;
          try{
            const left = computeLeftForNode(node);
            container.scrollTo({ left: left, behavior: animate ? 'smooth' : 'auto' });
          }catch(e){
            const left = node.offsetLeft;
            container.scrollLeft = left;
          }
        }

        function pauseAllVideos(exceptNode){
          try{
            const vids = container.querySelectorAll('video');
            vids.forEach(v => {
              if (exceptNode && exceptNode.contains && exceptNode.contains(v)) return;
              try { v.pause(); } catch(e){}
            });
          }catch(e){}
        }

        function navigateToPage(targetPage, animate = true) {
          if (isLocked || scrollCooldown) return;
          
          const found = findAvailableFrom(targetPage);
          if (found && found.page !== lastReported) {
            scrollCooldown = true;
            setTimeout(() => { scrollCooldown = false; }, SCROLL_COOLDOWN_MS);
            
            pauseAllVideos(found.node);
            isLocked = true;
            scrollToNode(found.node, animate);
            setTimeout(() => { 
              reportPage(found.page); 
              isLocked = false; 
            }, animate ? (SCROLL_DURATION + 30) : 60);
          }
        }

        function navigateBy(dir) {
          const targetPage = lastReported + dir;
          if (targetPage >= 1 && targetPage <= total) {
            navigateToPage(targetPage, true);
          }
        }

        let scrollTimeout = null;
        container.addEventListener('scroll', function(){
          if (scrollTimeout) clearTimeout(scrollTimeout);
          if (isLocked || scrollCooldown || isTouching || isInitializing || currentScale > 1) return;
          
          scrollTimeout = setTimeout(() => {
            const currentIndex = getCurrentIndex();
            if (currentIndex !== lastReported) {
              navigateToPage(currentIndex, false);
            }
          }, 150);
        }, { passive: true });

        let wheelCooldown = false;
        container.addEventListener('wheel', function(e){
          e.preventDefault();
          if (isLocked || wheelCooldown || scrollCooldown) return;
          
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if (Math.abs(delta) < 10) return;
          
          const dir = delta > 0 ? 1 : -1;
          wheelCooldown = true;
          scrollCooldown = true;
          
          navigateBy(dir);
          
          setTimeout(() => { 
            wheelCooldown = false; 
          }, SCROLL_COOLDOWN_MS);
          
          setTimeout(() => { 
            scrollCooldown = false; 
          }, SCROLL_COOLDOWN_MS);
        }, { passive: false });

        let touchStartX = 0;
        let touchStartTime = 0;
        const SWIPE_THRESHOLD = 60;
        
        container.addEventListener('touchstart', function(e){
          isTouching = true;
          
          // Check if touch started on video controls
          const target = e.target || e.touches[0].target;
          const isVideoElement = target.tagName === 'VIDEO' || target.closest('video');
          
          if (isVideoElement) {
            // Don't interfere with video interactions
            return;
          }
          
          if (e.touches && e.touches[0]) {
            touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
          }
        }, { passive: true });

        container.addEventListener('touchmove', function(e){
          // Allow native scrolling and zooming
        }, { passive: true });

        container.addEventListener('touchend', function(e){
          const touchEndX = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX) || touchStartX;
          const touchEndTime = Date.now();
          const dx = touchStartX - touchEndX;
          const dt = touchEndTime - touchStartTime;
          
          isTouching = false;

          // Check if touch ended on video controls
          const target = e.target || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].target);
          const isVideoElement = target && (target.tagName === 'VIDEO' || target.closest && target.closest('video'));
          
          if (isVideoElement) {
            // Don't interfere with video interactions
            return;
          }

          if (isLocked || scrollCooldown) return;
          
          // Only allow swipe navigation when not zoomed
          if (currentScale <= 1) {
            const isFastSwipe = dt < 300;
            const isLongSwipe = Math.abs(dx) > SWIPE_THRESHOLD;
            
            if (isFastSwipe && isLongSwipe) {
              const dir = dx > 0 ? 1 : -1;
              navigateBy(dir);
            } else {
              const currentIndex = getCurrentIndex();
              if (currentIndex !== lastReported) {
                navigateToPage(currentIndex, true);
              }
            }
          }
        }, { passive: true });

        function handleMessage(ev){
          try{
            const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
            if (d && d.type === 'goToPage'){
              const requested = Math.max(1, Number(d.page) || 1);
              const smooth = !!d.smooth;
              navigateToPage(requested, smooth);
            }
            
            if (d && d.type === 'setScale') {
              currentScale = d.scale;
              applyScaleToAllContent(currentScale);
            }
            
            if (d && d.action) {
              switch(d.action) {
                case 'zoomIn':
                  currentScale = Math.min(currentScale * 1.2, 5);
                  applyScaleToAllContent(currentScale);
                  break;
                case 'zoomOut':
                  currentScale = Math.max(currentScale / 1.2, 0.3);
                  applyScaleToAllContent(currentScale);
                  break;
                case 'setZoom':
                  if (d.scale !== undefined) {
                    currentScale = Math.min(Math.max(d.scale, 0.3), 5);
                    applyScaleToAllContent(currentScale);
                  }
                  break;
                case 'resetZoom':
                  currentScale = 1.0;
                  applyScaleToAllContent(currentScale);
                  break;
                case 'pauseAllVideos':
                  try { pauseAllVideos(); } catch(e) {}
                  break;
              }
            }
          }catch(e){}
        }

        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);

        requestAnimationFrame(() => {
          setTimeout(() => {
            const first = container.children[(lastReported||1)-1] || container.children[0];
            if (first) {
              try { container.scrollLeft = computeLeftForNode(first); } catch(e){}
            }
            isInitializing = false;
          }, 80);
        });

      })();
    </script>
  </body>
  </html>`;
}


interface SlidesViewerRef {
  setZoom: (scale: number) => void;
  resetZoom: () => void;
  pauseMedia?: () => void;
  goToPage: (page: number) => void;
}

interface SlideData {
  file: string;
  note?: string;
}

const SlidesViewer = forwardRef<SlidesViewerRef, { slides: (string | SlideData)[]; scale?: number }>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [currentScale, setCurrentScale] = useState(props.scale || 1.0);

  useImperativeHandle(ref, () => ({
    setZoom: (scale: number) => {
      setCurrentScale(scale);
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setScale',
          scale
        }));
      }
    },
    resetZoom: () => {
      setCurrentScale(1.0);
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          action: 'resetZoom'
        }));
      }
    },
    pauseMedia: () => {
      try {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ action: 'pauseAllVideos' }));
        }
      } catch (e) { console.log('SlidesViewer.pauseMedia error', e); }
    },
    goToPage: (page: number) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'goToPage',
          page: page,
          smooth: true
        }));
      }
    }
  }));

  return (
    <WebView
      ref={webViewRef}
      source={{ html: generateSlidesHtml(props.slides, currentScale) }}
      originWhitelist={["*"]}
      style={{ flex: 1, width: '100%', height: '100%' }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      scalesPageToFit={false}
      startInLoadingState={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={false}
      scrollEnabled={true}
      allowsInlineMediaPlayback={true}
      allowsFullscreenVideo={true}
      mediaPlaybackRequiresUserAction={false}
      nestedScrollEnabled={true}
      overScrollMode="never"
      mixedContentMode="compatibility"
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
    />
  );
});

SlidesViewer.displayName = 'SlidesViewer';

export default SlidesViewer;
