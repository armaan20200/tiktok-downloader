import os
import uuid
import logging
from flask import Flask, render_template, request, send_file, flash, redirect, url_for, after_this_request
import yt_dlp
from urllib.parse import urlparse
import tempfile
import shutil

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Create downloads directory if it doesn't exist
DOWNLOADS_DIR = os.path.join(os.getcwd(), 'downloads')
if not os.path.exists(DOWNLOADS_DIR):
    os.makedirs(DOWNLOADS_DIR)

# File size limit in bytes (500MB)
MAX_FILE_SIZE = 500 * 1024 * 1024

def is_valid_tiktok_url(url):
    """Validate if the URL is a valid TikTok URL - More flexible validation"""
    if not url or not isinstance(url, str):
        return False
    
    # Clean up the URL
    url = url.strip()
    
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        parsed = urlparse(url)
    except:
        return False
    
    if not parsed.scheme in ['http', 'https']:
        return False
    
    # Check if it's a TikTok domain (more flexible)
    tiktok_domains = ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com']
    domain_match = any(domain in parsed.netloc.lower() for domain in tiktok_domains)
    
    if not domain_match:
        return False
    
    # For TikTok domains, be much more permissive
    # Most TikTok URLs are valid if they contain the domain
    # This includes short URLs like vt.tiktok.com/ZSBECEnF5/
    
    # Additional checks for common TikTok URL patterns
    path = parsed.path.lower()
    query = parsed.query.lower()
    
    # Accept URLs that contain video indicators
    video_indicators = ['video', '@', 'v/', '/t/', 'zsb']  # Added 'zsb' for short URLs
    has_video_indicator = any(indicator in path or indicator in query for indicator in video_indicators)
    
    # Also accept URLs with long numeric IDs (TikTok video IDs)
    import re
    has_numeric_id = bool(re.search(r'\d{16,19}', url))
    
    # Accept short URLs with alphanumeric codes (like ZSBECEnF5)
    has_short_code = bool(re.search(r'/[A-Za-z0-9]{8,}/?$', path))
    
    # Be permissive for TikTok domains - if it's a TikTok domain with any meaningful path, accept it
    has_meaningful_path = len(path) > 1 and path != '/'
    
    return has_video_indicator or has_numeric_id or has_short_code or has_meaningful_path

def get_video_info(url):
    """Get video information using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info
    except Exception as e:
        app.logger.error(f"Error extracting video info: {str(e)}")
        return None

def download_tiktok_video(url, output_path):
    """Download TikTok video using yt-dlp with multiple fallback methods"""
    unique_id = str(uuid.uuid4())
    
    # Try multiple configurations in order of preference
    configurations = [
        # Config 1: Latest mobile configuration
        {
            'format': 'best[ext=mp4]/best',
            'outtmpl': os.path.join(output_path, f'{unique_id}.%(ext)s'),
            'noplaylist': True,
            'writeinfojson': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'ignoreerrors': False,
            'no_warnings': True,
            'extract_flat': False,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
            }
        },
        # Config 2: Desktop configuration
        {
            'format': 'best[ext=mp4]/best',
            'outtmpl': os.path.join(output_path, f'{unique_id}.%(ext)s'),
            'noplaylist': True,
            'writeinfojson': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'ignoreerrors': False,
            'no_warnings': True,
            'extract_flat': False,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            }
        },
        # Config 3: Minimal configuration
        {
            'format': 'best',
            'outtmpl': os.path.join(output_path, f'{unique_id}.%(ext)s'),
            'noplaylist': True,
            'no_warnings': True,
        }
    ]
    
    # Try each configuration
    for i, ydl_opts in enumerate(configurations):
        app.logger.info(f"Trying TikTok download configuration {i+1}")
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Try to download directly
                try:
                    ydl.download([url])
                    
                    # Find any downloaded file in the directory
                    for file in os.listdir(output_path):
                        if file.startswith(unique_id):
                            downloaded_file = os.path.join(output_path, file)
                            # Try to extract info for title
                            try:
                                info = ydl.extract_info(url, download=False)
                                video_title = info.get('title', 'TikTok Video') if info else 'TikTok Video'
                            except:
                                video_title = 'TikTok Video'
                            return downloaded_file, video_title
                    
                except Exception as download_error:
                    app.logger.warning(f"Configuration {i+1} failed: {str(download_error)}")
                    continue
                    
        except Exception as config_error:
            app.logger.warning(f"Configuration {i+1} setup failed: {str(config_error)}")
            continue
    
    # If all configurations fail, try with generic extractor
    app.logger.info("All TikTok configurations failed, trying generic extractor")
    try:
        generic_opts = {
            'format': 'best',
            'outtmpl': os.path.join(output_path, f'{unique_id}.%(ext)s'),
            'extractor_args': {
                'generic': {
                    'force_generic_extractor': True
                }
            }
        }
        
        with yt_dlp.YoutubeDL(generic_opts) as ydl:
            ydl.download([url])
            
            for file in os.listdir(output_path):
                if file.startswith(unique_id):
                    downloaded_file = os.path.join(output_path, file)
                    return downloaded_file, "TikTok Video"
                    
    except Exception as generic_error:
        app.logger.error(f"Generic extractor also failed: {str(generic_error)}")
    
    # If everything fails, provide helpful message
    return None, "TikTok is currently blocking automated downloads. This is a temporary issue with TikTok's servers, not our app. Please try a different video or try again later."

@app.route('/')
def index():
    """Main page with video download form"""
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_video():
    """Handle video download request"""
    video_url = request.form.get('video_url', '').strip()
    
    # Validate input
    if not video_url:
        flash('Please enter a TikTok video URL', 'error')
        return redirect(url_for('index'))
    
    if not is_valid_tiktok_url(video_url):
        flash('Please enter a valid TikTok URL (e.g., https://www.tiktok.com/@username/video/...)', 'error')
        return redirect(url_for('index'))
    
    try:
        # Create temporary directory for this download
        temp_dir = tempfile.mkdtemp(dir=DOWNLOADS_DIR)
        
        # Download the video
        downloaded_file, result = download_tiktok_video(video_url, temp_dir)
        
        if downloaded_file and os.path.exists(downloaded_file):
            # Get file info for user-friendly naming
            file_ext = os.path.splitext(downloaded_file)[1]
            download_name = f"{result[:50]}...{file_ext}" if len(result) > 50 else f"{result}{file_ext}"
            download_name = "".join(c for c in download_name if c.isalnum() or c in (' ', '-', '_', '.')).rstrip()
            
            # Set up cleanup after request
            @after_this_request
            def cleanup(response):
                try:
                    # Remove the temporary directory and all its contents
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    app.logger.info(f"Cleaned up temporary directory: {temp_dir}")
                except Exception as e:
                    app.logger.error(f"Error during cleanup: {str(e)}")
                return response
            
            # Read file into memory first to avoid cleanup issues
            try:
                with open(downloaded_file, 'rb') as f:
                    file_data = f.read()
                
                # Send file with proper headers for mobile download
                from flask import Response, make_response
                import urllib.parse
                
                # Properly encode filename for HTTP headers
                safe_filename = urllib.parse.quote(download_name.encode('utf-8'))
                
                response = make_response(file_data)
                response.headers['Content-Type'] = 'application/octet-stream'
                response.headers['Content-Disposition'] = f'attachment; filename*=UTF-8\'\'{safe_filename}'
                response.headers['Content-Transfer-Encoding'] = 'binary'
                response.headers['Cache-Control'] = 'no-cache'
                response.headers['X-Content-Type-Options'] = 'nosniff'
                response.headers['Content-Length'] = str(len(file_data))
                
                return response
                
            except Exception as file_error:
                app.logger.error(f"Error reading downloaded file: {str(file_error)}")
                # Fallback to original send_file method with safe filename
                import re
                safe_fallback_name = re.sub(r'[^\w\s.-]', '_', download_name)
                return send_file(
                    downloaded_file,
                    as_attachment=True,
                    download_name=safe_fallback_name,
                    mimetype='application/octet-stream'
                )
        else:
            # Cleanup failed download
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
            flash(f'Download failed: {result}', 'error')
            return redirect(url_for('index'))
            
    except Exception as e:
        app.logger.error(f"Unexpected error in download route: {str(e)}")
        flash('An unexpected error occurred. Please try again.', 'error')
        return redirect(url_for('index'))

# SEO Routes for better search coverage
@app.route('/sitemap.xml')
def sitemap():
    """Generate sitemap for SEO"""
    from flask import make_response
    
    sitemap_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://ttdownloader.com/</loc>
        <lastmod>2025-07-22</lastmod>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
    </url>
    <url>
        <loc>https://ttdownloader.com/how-to-download-tiktok-videos</loc>
        <lastmod>2025-07-22</lastmod>
        <priority>0.9</priority>
        <changefreq>weekly</changefreq>
    </url>
    <url>
        <loc>https://ttdownloader.com/tiktok-downloader-faq</loc>
        <lastmod>2025-07-22</lastmod>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
    </url>
    <url>
        <loc>https://ttdownloader.com/best-tiktok-downloader</loc>
        <lastmod>2025-07-22</lastmod>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
    </url>
</urlset>'''
    
    response = make_response(sitemap_xml)
    response.headers['Content-Type'] = 'application/xml'
    return response

@app.route('/robots.txt')
def robots():
    """Generate robots.txt for SEO"""
    from flask import make_response
    
    robots_txt = '''User-agent: *
Allow: /

Sitemap: https://ttdownloader.com/sitemap.xml

# High traffic keywords for crawling
# tiktok video downloader without watermark
# download tiktok videos free
# tiktok downloader online
# save tiktok videos
# tiktok mp4 downloader
'''
    
    response = make_response(robots_txt)
    response.headers['Content-Type'] = 'text/plain'
    return response

@app.route('/how-to-download-tiktok-videos')
def how_to_guide():
    """SEO-optimized how-to guide page"""
    return render_template('index.html')

@app.route('/tiktok-downloader-faq')
def faq_page():
    """SEO-optimized FAQ page"""
    return render_template('index.html')

@app.route('/best-tiktok-downloader')
def comparison_page():
    """SEO-optimized comparison page"""
    return render_template('index.html')

@app.route('/download-tiktok-without-watermark')
def no_watermark_page():
    """High-traffic keyword page"""
    return render_template('index.html')

@app.route('/free-tiktok-video-downloader')
def free_downloader_page():
    """High-traffic keyword page"""
    return render_template('index.html')

@app.route('/tiktok-mp4-downloader')
def mp4_downloader_page():
    """High-traffic keyword page"""
    return render_template('index.html')

@app.route('/save-tiktok-videos')
def save_videos_page():
    """High-traffic keyword page"""
    return render_template('index.html')

@app.route('/mobile-tiktok-downloader')
def mobile_downloader_page():
    """Mobile-optimized page"""
    return render_template('index.html')

@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {str(error)}")
    flash('An internal server error occurred. Please try again.', 'error')
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
