from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin    
from controller import Controller
import onetimescript
from db import db

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///domains.db'
db.init_app(app)
with app.app_context():
    db.create_all() 

controller = Controller()

@app.route('/', methods=['POST'])
def analyze_url():
    """API endpoint to analyze a URL and return results in JSON format."""
    if request.method == 'POST':
        data = request.get_json()
        url = data.get('url')
        if not url:
            return jsonify({'status': 'ERROR', 'msg': 'No URL provided'}), 400

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
        url = data.get('url')
        if not url:
            return jsonify({'status': 'ERROR', 'msg': 'No URL provided'}), 400

        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Inject external resources into HTML
        for link in soup.find_all('link'):
            if link.get('href'):
                link['href'] = urljoin(url, link['href'])
        
        # Uncomment this if you want to enable scripts
        # for script in soup.find_all('script'):
        #     if script.get('src'):
        #         script['src'] = urljoin(url, script['src'])

        for img in soup.find_all('img'):
            if img.get('src'):
                img['src'] = urljoin(url, img['src'])

        return jsonify({'status': 'SUCCESS', 'content': soup.prettify()})
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500


@app.route('/source-code', methods=['POST'])
def view_source_code():
    """API endpoint to retrieve the source code of a website."""
    try:
        data = request.get_json()
        url = data.get('url')
        if not url:
            return jsonify({'status': 'ERROR', 'msg': 'No URL provided'}), 400

        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        formatted_html = soup.prettify()
        
        return jsonify({'status': 'SUCCESS', 'formatted_html': formatted_html})
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/update-db')
def update_db(): 
    """API endpoint to update the database."""
    try:
        with app.app_context():
            response = onetimescript.update_db()
            return jsonify({'status': 'SUCCESS', 'msg': 'Database populated successfully!'}), 200
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500

@app.route('/update-json')
def update_json(): 
    """API endpoint to update JSON data."""
    try:
        with app.app_context():
            response = onetimescript.update_json()
            return jsonify({'status': 'SUCCESS', 'msg': 'JSON updated successfully!'}), 200
    except Exception as e:
        return jsonify({'status': 'ERROR', 'msg': str(e)}), 500


if __name__ == '__main__':
    app.debug = True
    app.run()
