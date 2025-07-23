from flask import Flask, request, render_template, send_file
import yt_dlp
import os

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        url = request.form['url']
        try:
            # Remove any existing video files first
            for ext in ['mp4', 'webm', 'mkv']:
                if os.path.exists(f'video.{ext}'):
                    os.remove(f'video.{ext}')

            ydl_opts = {
                'outtmpl': 'video.%(ext)s',
                'format': 'bestvideo+bestaudio/best',
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            for ext in ['mp4', 'webm', 'mkv']:
                if os.path.exists(f'video.{ext}'):
                    return send_file(f'video.{ext}', as_attachment=True)

            return "❌ Video format not found after download."
        except Exception as e:
            return f"❌ Error: {str(e)}"
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
