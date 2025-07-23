# TikTok Video Downloader

A Flask-based web application that allows users to download TikTok videos without watermarks. Features a modern, responsive interface with TikTok-inspired styling that works perfectly on both desktop and mobile devices.

## Features

- **Download TikTok videos without watermarks**
- **Mobile-optimized interface** - Large input fields and touch-friendly buttons
- **Multiple URL format support** - Works with all TikTok URL formats (vm.tiktok.com, vt.tiktok.com, etc.)
- **Responsive design** - Beautiful interface that works on all devices
- **Fast downloads** - Powered by yt-dlp for reliable video extraction
- **Automatic cleanup** - Files are automatically removed after download

## Demo

![TikTok Downloader](https://via.placeholder.com/800x400/ff0050/ffffff?text=TikTok+Video+Downloader)

## Quick Start

### Prerequisites

- Python 3.7+
- pip (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tiktok-downloader.git
cd tiktok-downloader
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

4. Open your browser and visit: `http://localhost:5000`

## Deployment

### Deploy to Render

1. Fork this repository
2. Connect your GitHub account to [Render](https://render.com)
3. Create a new Web Service
4. Connect your forked repository
5. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --reuse-port main:app`
   - **Environment**: Python 3

### Deploy to Heroku

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create app: `heroku create your-app-name`
4. Push to Heroku: `git push heroku main`

### Deploy to Railway

1. Connect your GitHub repository to [Railway](https://railway.app)
2. Railway will automatically detect the Python app and deploy it

## How to Use

1. **Copy a TikTok video URL** - Any TikTok URL format works
2. **Paste it into the input field** - The large input box is optimized for mobile
3. **Click Download** - The video will be processed and downloaded without watermarks
4. **Save the file** - Video downloads directly to your device

### Supported URL Formats

- `https://www.tiktok.com/@username/video/1234567890`
- `https://vm.tiktok.com/ABC123`
- `https://vt.tiktok.com/ABC123`
- `https://m.tiktok.com/v/1234567890`
- And more TikTok URL variations

## Project Structure

```
tiktok-downloader/
├── app.py                 # Main Flask application
├── main.py               # Entry point for the application
├── gunicorn.conf.py      # Production server configuration
├── requirements.txt      # Python dependencies
├── templates/
│   └── index.html       # Main webpage template
├── static/
│   ├── css/
│   │   └── style.css    # TikTok-inspired styling
│   └── js/
│       └── main.js      # Frontend functionality
└── utils/
    └── downloader.py    # Video download logic
```

## Technical Details

- **Backend**: Flask (Python web framework)
- **Video Processing**: yt-dlp library
- **Frontend**: Bootstrap 5 with custom CSS
- **Server**: Gunicorn for production deployment
- **Mobile Support**: Optimized for iOS and Android browsers

## API Endpoints

- `GET /` - Main download page
- `POST /download` - Download TikTok video

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational purposes only. Please respect TikTok's terms of service and content creators' rights. Only download videos you have permission to download.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/tiktok-downloader/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible about the error

## Changelog

### v1.0.0
- Initial release
- TikTok video downloading without watermarks
- Mobile-optimized interface
- Multiple URL format support
- Automatic file cleanup