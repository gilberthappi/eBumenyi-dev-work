import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';

function generatePdfViewerHtml(pdfUrl: string) {
  const encodedUrl = encodeURIComponent(pdfUrl);
  return `<!doctype html>
   <html>
   <head>
     <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=10, minimum-scale=0.3, user-scalable=yes" />
     <style>
       html,body{height:100%;margin:0;background:#fff;overflow:hidden;touch-action:manipulation;}
       .pages-container{display:flex;overflow-x:auto;height:100%;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;align-items:center;}
       .pages-container.no-snap{scroll-snap-type:none;}
       .page{flex:0 0 100%;height:100%;display:flex;align-items:center;justify-content:center;scroll-snap-align:center;padding:10px;box-sizing:border-box;position:relative;overflow:visible;}
       .page.zoomed{scroll-snap-align:none;overflow:auto;}
       canvas{display:block;max-width:100%;max-height:100%;transition:transform 0.1s ease-out;position:relative;}
       .pages-container::-webkit-scrollbar{height:8px;}
       .pages-container::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:4px;}
     </style>
   </head>
   <body>
     <div id="container" class="pages-container"></div>

     <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
     <script>
       pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

       const url = decodeURIComponent('${encodedUrl}');
       const container = document.getElementById('container');
       let currentScale = 1.0;
       let scrollCooldown = false;
       const SCROLL_COOLDOWN_MS = 600;
       let total = 0;

       function post(obj){ try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }catch(e){} }

       function applyScaleToAllPages(scale) {
         const pages = container.getElementsByClassName('page');
         for (let page of pages) {
           const canvas = page.querySelector('canvas');
           if (canvas) {
             const originalWidth = canvas.getAttribute('data-original-width');
             if (originalWidth) {
               canvas.style.width = (parseFloat(originalWidth) * scale) + 'px';
             }
             
             // Also apply transform for better visual scaling
             canvas.style.transform = 'scale(' + scale + ')';
             canvas.style.transformOrigin = 'center center';
           }
           
           // Enable/disable scroll snap and overflow based on zoom level
           if (scale > 1) {
             page.classList.add('zoomed');
             page.style.overflow = 'auto';
           } else {
             page.classList.remove('zoomed');
             page.style.overflow = 'visible';
           }
         }
         
         // Update container behavior based on zoom level
         if (scale > 1) {
           container.classList.add('no-snap');
         } else {
           container.classList.remove('no-snap');
         }
         
         // DEBUG: Visual indicator for scale level (removed border colors)
         currentScale = scale;
       }

       function navigateToPage(targetPage, animate = true) {
         if (scrollCooldown) return;
         
         const SCROLL_DURATION = 420;
         let found = null;
         for (let i = targetPage; i <= total; i++) {
           const c = container.children[i-1];
           if (c) { found = { node: c, page: i }; break; }
         }
         if (!found) {
           for (let i = targetPage - 1; i >= 1; i--) {
             const c = container.children[i-1];
             if (c) { found = { node: c, page: i }; break; }
           }
         }
         if (found) {
           scrollCooldown = true;
           setTimeout(() => { scrollCooldown = false; }, SCROLL_COOLDOWN_MS);
           
           try {
             scrollToNode(found.node, animate);
           } catch (e) { }
           setTimeout(() => post({ type: 'pageChange', page: found.page }), animate ? SCROLL_DURATION : 50);
         } else if (container.children.length > 0) {
           scrollCooldown = true;
           setTimeout(() => { scrollCooldown = false; }, SCROLL_COOLDOWN_MS);
           
           try { scrollToNode(container.children[0], animate); } catch(e){}
           setTimeout(() => post({ type: 'pageChange', page: 1 }), animate ? SCROLL_DURATION : 50);
         }
       }

       function handleMessage(ev) {
         try {
           const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
           
           if (d && d.type === 'goToPage') {
             const requested = Math.max(1, Number(d.page) || 1);
             const smooth = !!d.smooth;
             navigateToPage(requested, smooth);
           }
           
           if (d && d.type === 'setScale') {
             applyScaleToAllPages(d.scale);
           }
           
           if (d && d.action) {
             switch(d.action) {
               case 'zoomIn':
                 const newZoomIn = Math.min(currentScale * 1.2, 5);
                 applyScaleToAllPages(newZoomIn);
                 break;
               case 'zoomOut':
                 const newZoomOut = Math.max(currentScale / 1.2, 0.3);
                 applyScaleToAllPages(newZoomOut);
                 break;
               case 'setZoom':
                 if (d.scale !== undefined) {
                   const newScale = Math.min(Math.max(d.scale, 0.3), 5);
                   applyScaleToAllPages(newScale);
                 }
                 break;
               case 'resetZoom':
                 applyScaleToAllPages(1.0);
                 break;
             }
           }
         } catch(e) {}
       }

       (async () => {
         try {
           const loadingTask = pdfjsLib.getDocument(url);
           const pdf = await loadingTask.promise;
           total = pdf.numPages;
           post({ type: 'pdfReady', total });

           const paddingFactor = 1.0;
           let isInitializing = true;
           const DEBOUNCE_MS = 200;

           for (let i = 1; i <= total; i++) {
             const page = await pdf.getPage(i);
             const viewport = page.getViewport({ scale: 1 });
             const devicePixelRatio = window.devicePixelRatio || 1;

             const cssTargetWidth = Math.floor(window.innerWidth * paddingFactor);
             const candidateScale = cssTargetWidth / viewport.width;
             const MAX_UPSCALE = 2.0;
             const scale = Math.min(candidateScale, MAX_UPSCALE);

             const outputScale = scale * devicePixelRatio;
             const renderViewport = page.getViewport({ scale: outputScale });
             const canvas = document.createElement('canvas');
             const context = canvas.getContext('2d');
             canvas.width = Math.floor(renderViewport.width);
             canvas.height = Math.floor(renderViewport.height);

             const visualWidth = Math.floor(viewport.width * scale);
             const visualHeight = Math.floor(viewport.height * scale);
             
             // Store original dimensions for zooming
             canvas.setAttribute('data-original-width', visualWidth.toString());
             canvas.setAttribute('data-original-height', visualHeight.toString());
             
             // Set initial styles
             canvas.style.width = visualWidth + 'px';
             canvas.style.height = visualHeight + 'px';
             canvas.style.maxWidth = '100%';
             canvas.style.maxHeight = '100%';

             const pageWrapper = document.createElement('div');
             pageWrapper.className = 'page';
             pageWrapper.appendChild(canvas);
             container.appendChild(pageWrapper);

             await page.render({ canvasContext: context, viewport: renderViewport }).promise;
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

           let lastReported = 1;
           let scrollDebounce = null;
           
           container.addEventListener('scroll', function(){
             if (scrollDebounce) clearTimeout(scrollDebounce);
             // Only auto-navigate when at normal scale (1.0) and not during initialization or cooldown
             if (isInitializing || scrollCooldown || currentScale !== 1.0) return;
             
             scrollDebounce = setTimeout(() => {
               const idx = Math.round(container.scrollLeft / container.clientWidth) + 1;
               if (idx !== lastReported) { 
                 lastReported = idx;
                 post({ type: 'pageChange', page: idx });
               }
             }, DEBOUNCE_MS);
           }, { passive: true });

           // Enhanced touch handling for both zoomed and non-zoomed states
           let touchStartX = 0;
           let touchStartY = 0;
           let touchStartTime = 0;
           let isTouching = false;
           const SWIPE_THRESHOLD = 50;
           const VERTICAL_THRESHOLD = 30;
           
           // Detect manual zoom changes
           let lastViewportWidth = window.innerWidth;
           let lastVisualViewportScale = window.visualViewport ? window.visualViewport.scale : 1;
           
           function checkForZoomChange() {
             const currentViewportWidth = window.innerWidth;
             const currentVisualViewportScale = window.visualViewport ? window.visualViewport.scale : 1;
             
             // Check if browser zoom has changed
             if (currentVisualViewportScale !== lastVisualViewportScale || 
                 Math.abs(currentViewportWidth - lastViewportWidth) > 10) {
               
               if (currentVisualViewportScale > 1.01) {
                 // User has zoomed in manually
                 if (currentScale === 1.0) {
                   currentScale = currentVisualViewportScale;
                   container.classList.add('no-snap');
                   console.log('DEBUG: Manual zoom detected - scale:', currentVisualViewportScale, '- ZOOM/PAN MODE ENABLED');
                 }
               } else {
                 // User has zoomed back to normal
                 if (currentScale !== 1.0) {
                   currentScale = 1.0;
                   container.classList.remove('no-snap');
                   console.log('DEBUG: Zoom reset to normal - SWIPE MODE ENABLED');
                 }
               }
               
               lastViewportWidth = currentViewportWidth;
               lastVisualViewportScale = currentVisualViewportScale;
             }
           }
           
           // Monitor for zoom changes
           if (window.visualViewport) {
             window.visualViewport.addEventListener('resize', checkForZoomChange);
             window.visualViewport.addEventListener('scroll', checkForZoomChange);
           }
           window.addEventListener('resize', checkForZoomChange);
           
           // Also check periodically
           setInterval(checkForZoomChange, 500);
           
           container.addEventListener('touchstart', function(e) {
             if (e.touches.length === 1 && currentScale === 1.0) {
               touchStartX = e.touches[0].clientX;
               touchStartY = e.touches[0].clientY;
               touchStartTime = Date.now();
               isTouching = true;
               console.log('DEBUG: Touch started at scale 1.0');
             }
           }, { passive: true });
           
           container.addEventListener('touchmove', function(e) {
             if (!isTouching) return;
             
             // When zoomed (scale > 1.0), allow natural panning - don't interfere
             if (currentScale > 1.0) {
               // Let the browser handle natural scrolling/panning
               return;
             }
             
             // When at normal scale (1.0), we'll handle swipe in touchend
           }, { passive: true });
           
           container.addEventListener('touchend', function(e) {
             if (!isTouching) {
               isTouching = false;
               return;
             }
             
             // Only handle swipe navigation when at normal scale (1.0)
             if (currentScale === 1.0) {
               console.log('DEBUG: Processing swipe at scale 1.0');
               const touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX;
               const touchEndY = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY;
               const touchEndTime = Date.now();
               const deltaX = touchStartX - touchEndX;
               const deltaY = Math.abs(touchEndY - touchStartY);
               const deltaTime = touchEndTime - touchStartTime;
               
               console.log('DEBUG: Swipe deltaX:', deltaX, 'deltaY:', deltaY, 'deltaTime:', deltaTime);
               
               // Check if it's a horizontal swipe (not vertical scroll) and within time threshold
               if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < 100 && deltaTime < 500) {
                 console.log('DEBUG: Valid swipe detected!');
                 
                 if (deltaX > 0) {
                   // Swipe left - go to next page
                   console.log('DEBUG: Swipe LEFT - going to next page');
                   const nextPage = lastReported + 1;
                   if (nextPage <= total) {
                     navigateToPage(nextPage, true);
                   }
                 } else {
                   // Swipe right - go to previous page  
                   console.log('DEBUG: Swipe RIGHT - going to previous page');
                   const prevPage = lastReported - 1;
                   if (prevPage >= 1) {
                     navigateToPage(prevPage, true);
                   }
                 }
               } else {
                 console.log('DEBUG: Swipe not valid - deltaX:', Math.abs(deltaX), 'threshold:', SWIPE_THRESHOLD);
               }
             } else {
               console.log('DEBUG: Ignoring touch - scale is', currentScale, '(not 1.0)');
             }
             // When zoomed (scale > 1.0), do nothing - let browser handle natural pan/zoom
             
             isTouching = false;
           }, { passive: true });

           document.addEventListener('message', handleMessage);
           window.addEventListener('message', handleMessage);

           requestAnimationFrame(() => {
             setTimeout(() => {
               const first = container.children[0];
               if (first) { 
                 try { 
                   container.scrollLeft = computeLeftForNode(first); 
                 } catch(e){} 
               }
               isInitializing = false;
               
               // Apply initial scale
               applyScaleToAllPages(currentScale);
             }, 80);
           });

         } catch (err) {
           try { 
             window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
               JSON.stringify({ type: 'pdfError', error: String(err) })
             ); 
           } catch(e){}
         }
       })();
     </script>
   </body>
   </html>`;
}

interface PdfViewerRef {
  setZoom: (scale: number) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  goToPage: (page: number) => void;
}

const PdfViewer = forwardRef<PdfViewerRef, { uri: string }>((props, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setZoom: (scale: number) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setScale',
          scale
        }));
      }
    },
    resetZoom: () => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          action: 'resetZoom'
        }));
      }
    },
    zoomIn: () => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          action: 'zoomIn'
        }));
      }
    },
    zoomOut: () => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          action: 'zoomOut'
        }));
      }
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
      source={{ html: generatePdfViewerHtml(props.uri) }}
      originWhitelist={["*"]}
      style={{ flex: 1, width: '100%', height: '100%' }}
      javaScriptEnabled={true}
      scalesPageToFit={false}
      startInLoadingState={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={false}
      scrollEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      nestedScrollEnabled={true}
      overScrollMode="never"
    />
  );
});

PdfViewer.displayName = 'PdfViewer';

export default PdfViewer;