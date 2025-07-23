// TikTok Downloader App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize app
    initializeApp();
    
    function initializeApp() {
        setupFormHandling();
        setupSmoothScrolling();
        setupTooltips();
        setupAnalytics();
        setupSocialSharing();
        setupKeyboardShortcuts();
    }
    
    // Form handling and validation
    function setupFormHandling() {
        const form = document.getElementById('downloadForm');
        const videoUrlInput = document.getElementById('videoUrl');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (!form || !videoUrlInput || !downloadBtn) return;
        
        // Real-time URL validation
        videoUrlInput.addEventListener('input', function() {
            validateTikTokUrl(this.value);
        });
        
        // Paste event handling
        videoUrlInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                const pastedUrl = this.value;
                if (pastedUrl) {
                    validateTikTokUrl(pastedUrl);
                    // Auto-focus download button if URL is valid
                    if (isValidTikTokUrl(pastedUrl)) {
                        downloadBtn.focus();
                    }
                }
            }, 100);
        });
        
        // Form submission
        form.addEventListener('submit', function(e) {
            const url = videoUrlInput.value.trim();
            
            if (!url) {
                e.preventDefault();
                showError('Please enter a TikTok video URL');
                videoUrlInput.focus();
                return;
            }
            
            if (!isValidTikTokUrl(url)) {
                e.preventDefault();
                showError('Please enter a valid TikTok URL (e.g., https://www.tiktok.com/@username/video/...)');
                videoUrlInput.focus();
                return;
            }
            
            // Show loading state briefly
            setButtonLoading(downloadBtn, true);
            
            // Reset button quickly since download happens via direct file serving
            setTimeout(() => {
                setButtonLoading(downloadBtn, false);
                showSuccessMessage('Download started! Check your downloads folder.');
                // Clear the input for next download
                videoUrlInput.value = '';
                validateTikTokUrl(''); // Reset validation state
            }, 1500); // Reset after 1.5 seconds
            
            // Track download attempt
            trackEvent('download_attempt', {
                url: url,
                timestamp: new Date().toISOString()
            });
        });
        
        // Handle form errors (when redirected back with errors)
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert.classList.contains('alert-danger')) {
                // Reset form state if there's an error
                setButtonLoading(downloadBtn, false);
            }
        });
    }
    
    // URL validation - More permissive patterns
    function isValidTikTokUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        // Clean up the URL - remove extra spaces and common issues
        url = url.trim();
        
        // Check for basic TikTok domains first
        const tiktokDomains = [
            'tiktok.com',
            'www.tiktok.com', 
            'vm.tiktok.com',
            'vt.tiktok.com',
            'm.tiktok.com'
        ];
        
        // Check if URL contains any TikTok domain
        const hasTikTokDomain = tiktokDomains.some(domain => url.toLowerCase().includes(domain));
        if (!hasTikTokDomain) return false;
        
        // More flexible patterns that match real TikTok URLs
        const tiktokPatterns = [
            // Standard desktop URLs
            /https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
            // Short URLs
            /https?:\/\/(www\.)?tiktok\.com\/t\/[\w-]+/i,
            // VM short URLs  
            /https?:\/\/vm\.tiktok\.com\/[\w-]+/i,
            // VT short URLs (new format)
            /https?:\/\/vt\.tiktok\.com\/[\w-]+/i,
            // Mobile URLs
            /https?:\/\/m\.tiktok\.com\/v\/\d+/i,
            // Alternative patterns with extra parameters
            /https?:\/\/(www\.)?tiktok\.com\/.*video\/\d+/i,
            // More flexible pattern for any TikTok URL with video ID
            /https?:\/\/.*tiktok\.com.*\/(\d{19}|\d{18}|\d{17}|\d{16})/i,
            // Capture any TikTok URL that looks like a video
            /https?:\/\/.*tiktok\.com.*(@[\w.-]+|video|v\/)/i,
            // Very permissive pattern for any TikTok domain with alphanumeric path
            /https?:\/\/(vm|vt|m|www\.)?tiktok\.com\/[\w-]+/i
        ];
        
        const isValid = tiktokPatterns.some(pattern => pattern.test(url));
        
        // Log for debugging (remove in production)
        if (!isValid) {
            console.log('URL validation failed for:', url);
        }
        
        return isValid;
    }
    
    function validateTikTokUrl(url) {
        const videoUrlInput = document.getElementById('videoUrl');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (!videoUrlInput || !downloadBtn) return;
        
        if (url && isValidTikTokUrl(url)) {
            videoUrlInput.classList.remove('is-invalid');
            videoUrlInput.classList.add('is-valid');
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>Download';
        } else if (url) {
            videoUrlInput.classList.remove('is-valid');
            videoUrlInput.classList.add('is-invalid');
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Invalid URL';
        } else {
            videoUrlInput.classList.remove('is-valid', 'is-invalid');
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>Download';
        }
    }
    
    // Button loading state
    function setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            button.innerHTML = '<span>Downloading...</span>';
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-download me-2"></i>Download';
        }
    }
    
    // Error display
    function showError(message) {
        showAlert(message, 'danger');
    }
    
    // Success message display
    function showSuccessMessage(message) {
        showAlert(message, 'success');
    }
    
    // Generic alert display
    function showAlert(message, type = 'danger') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        alertDiv.innerHTML = `
            <i class="${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert before form
        const form = document.getElementById('downloadForm');
        if (form) {
            form.parentNode.insertBefore(alertDiv, form);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
    
    // Smooth scrolling for anchor links
    function setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Track navigation
                    trackEvent('navigation', {
                        section: targetId
                    });
                }
            });
        });
    }
    
    // Initialize tooltips
    function setupTooltips() {
        // Enable Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    // Analytics tracking
    function setupAnalytics() {
        // Track page view
        trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
        
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', throttle(() => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll % 25 === 0) { // Track every 25%
                    trackEvent('scroll_depth', {
                        percent: maxScroll
                    });
                }
            }
        }, 500));
        
        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            trackEvent('time_on_page', {
                seconds: timeOnPage
            });
        });
    }
    
    // Social sharing
    function setupSocialSharing() {
        // Add social sharing buttons click handlers
        const socialLinks = document.querySelectorAll('.social-links a');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const platform = this.querySelector('i').className.includes('facebook') ? 'facebook' :
                               this.querySelector('i').className.includes('twitter') ? 'twitter' :
                               this.querySelector('i').className.includes('instagram') ? 'instagram' : 'unknown';
                
                const shareUrl = encodeURIComponent(window.location.href);
                const shareText = encodeURIComponent('Check out this amazing TikTok video downloader! Download videos without watermark for free.');
                
                let popupUrl = '';
                
                switch(platform) {
                    case 'facebook':
                        popupUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                        break;
                    case 'twitter':
                        popupUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
                        break;
                    case 'instagram':
                        // Instagram doesn't have direct sharing, so copy to clipboard
                        copyToClipboard(window.location.href);
                        showSuccess('Link copied! You can now share it on Instagram.');
                        return;
                }
                
                if (popupUrl) {
                    window.open(popupUrl, 'share', 'width=600,height=400,scrollbars=yes,resizable=yes');
                    
                    // Track social sharing
                    trackEvent('social_share', {
                        platform: platform,
                        url: window.location.href
                    });
                }
            });
        });
    }
    
    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const form = document.getElementById('downloadForm');
                if (form) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
            
            // Escape to clear form
            if (e.key === 'Escape') {
                const videoUrlInput = document.getElementById('videoUrl');
                if (videoUrlInput && document.activeElement === videoUrlInput) {
                    videoUrlInput.value = '';
                    validateTikTokUrl('');
                }
            }
        });
    }
    
    // Utility functions
    function trackEvent(eventName, parameters = {}) {
        try {
            // Console log for debugging
            console.log('Event:', eventName, parameters);
            
            // Google Analytics 4 (if available)
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, parameters);
            }
            
            // Facebook Pixel (if available)
            if (typeof fbq !== 'undefined') {
                fbq('track', eventName, parameters);
            }
            
            // Custom analytics endpoint (if needed)
            // fetch('/api/analytics', {
            //     method: 'POST',
            //     headers: {'Content-Type': 'application/json'},
            //     body: JSON.stringify({event: eventName, ...parameters})
            // }).catch(() => {}); // Silently fail
            
        } catch (error) {
            // Silently handle analytics errors
            console.warn('Analytics error:', error);
        }
    }
    
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.warn('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    function showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const form = document.getElementById('downloadForm');
        if (form) {
            form.parentNode.insertBefore(alertDiv, form);
            
            setTimeout(() => {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 3000);
        }
    }
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    trackEvent('performance', {
                        load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                        dom_content_loaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                        first_paint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
                    });
                }
            }, 0);
        });
    }
    
    // Service Worker registration for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Only register if service worker file exists
            fetch('/sw.js', {method: 'HEAD'})
                .then(() => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW registered: ', registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                })
                .catch(() => {
                    // Service worker file doesn't exist, skip registration
                });
        });
    }
    
    // Auto-focus URL input on page load (desktop only)
    if (window.innerWidth > 768) {
        const videoUrlInput = document.getElementById('videoUrl');
        if (videoUrlInput) {
            videoUrlInput.focus();
        }
    }
    
    // Handle viewport changes (mobile orientation)
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    function handleViewportChange() {
        if (window.orientation !== undefined) {
            // Mobile device orientation change
            setTimeout(() => {
                trackEvent('orientation_change', {
                    orientation: Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait'
                });
            }, 500);
        }
    }
    
    window.addEventListener('orientationchange', handleViewportChange);
    window.addEventListener('resize', throttle(handleViewportChange, 250));
    
});
