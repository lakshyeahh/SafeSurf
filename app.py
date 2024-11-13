from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin
from controller import Controller
import onetimescript
from db import db
import pdfkit
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///domains.db'
db.init_app(app)
with app.app_context():
    db.create_all()

controller = Controller()

# Utility function to validate URL format
def validate_url(url):
    if not url:
        return False
    return url.startswith("http://") or url.startswith("https://")

@app.route('/', methods=['POST'])
def analyze_url():
    """API endpoint to analyze a URL and return results in JSON format."""
    if request.method == 'POST':
        data = request.get_json()
        url = data.get('url') if data else None

        if not validate_url(url):
            return jsonify({'status': 'ERROR', 'msg': 'Invalid or missing URL'}), 400

        try:
            # Analyze the URL
            result = controller.main(url)
            return jsonify({'status': 'SUCCESS', 'output': result})
        except Exception as e:
            return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/preview', methods=['POST'])
def preview():
    """API endpoint to get a preview of the website's HTML content."""
    try:
        data = request.get_json()
        url = data.get('url') if data else None

        if not validate_url(url):
            return jsonify({'status': 'ERROR', 'msg': 'Invalid or missing URL'}), 400

        response = requests.get(url, timeout=5)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Convert relative URLs to absolute URLs for CSS and images
        for link in soup.find_all('link', href=True):
            link['href'] = urljoin(url, link['href'])
        for img in soup.find_all('img', src=True):
            img['src'] = urljoin(url, img['src'])

        return jsonify({'status': 'SUCCESS', 'content': soup.prettify()})
    except requests.RequestException as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/source-code', methods=['POST'])
def view_source_code():
    """API endpoint to retrieve the source code of a website."""
    if request.content_type != 'application/json':
        return jsonify({'status': 'ERROR', 'msg': 'Content-Type must be application/json'}), 400

    try:
        data = request.get_json()
        print("Received data:", data)  # Log the received data for debugging
        url = data.get('url') if data else None

        if not validate_url(url):
            return jsonify({'status': 'ERROR', 'msg': 'Invalid or missing URL'}), 400

        response = requests.get(url, timeout=5)
        response.raise_for_status()

        # Prettify HTML source for display
        soup = BeautifulSoup(response.content, 'html.parser')
        formatted_html = soup.prettify()

        return jsonify({'status': 'SUCCESS', 'formatted_html': formatted_html})
    except requests.RequestException as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/update-db', methods=['POST'])
def update_db():
    """API endpoint to update the database."""
    try:
        with app.app_context():
            response = onetimescript.update_db()
            return jsonify({'status': 'SUCCESS', 'msg': 'Database populated successfully!'}), 200
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/update-json', methods=['POST'])
def update_json():
    """API endpoint to update JSON data."""
    try:
        with app.app_context():
            response = onetimescript.update_json()
            return jsonify({'status': 'SUCCESS', 'msg': 'JSON updated successfully!'}), 200
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    """Generate a PDF report for the specified URL."""
    data = request.get_json()
    url = data.get('url') if data else None

    if not validate_url(url):
        return jsonify({'status': 'ERROR', 'msg': 'Invalid or missing URL'}), 400

    try:
        # Fetch webpage content
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract details (customize this as needed)
        page_title = soup.title.string if soup.title else "No Title"
        page_text = soup.get_text()

        # Create HTML content for PDF (customize as needed)
        html_content = f"""
        <h1>Report for {url}</h1>
        <h2>Title: {page_title}</h2>
        <h3>Content:</h3>
        <p>{page_text[:2000]}...</p>  <!-- Limit content length for readability -->
        """

        # Convert HTML to PDF using pdfkit
        pdf_bytes = pdfkit.from_string(html_content, False)  # False returns PDF as bytes

        # Send PDF as a downloadable file
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name="webpage_report.pdf"
        )
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

if __name__ == '__main__':
    app.debug = True
    app.run(host="0.0.0.0", port=5000)
    