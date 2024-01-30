import yfinance as yf
from flask import request, jsonify, Flask, render_template
import logging
import os

app = Flask(__name__, template_folder='templates')

# Basic logging setup
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_data', methods=['POST'])
def get_data():
    try:
        data = request.get_json()
        ticker = data.get('ticker', '').upper()
        if not ticker:
            return jsonify({'error': 'No Stock provided'}), 400

        stock = yf.Ticker(ticker)
        financial_data = stock.history(period='1d')

        if financial_data.empty or "Close" not in financial_data.columns:
            return jsonify({'error': 'Invalid Stock entered'}), 404

        # Fetching 1-year data if the ticker is valid
        financial_data = stock.history(period='1y')
        return jsonify({
            'currentPrice': financial_data.iloc[-1].Close,
            'OpenPrice': financial_data.iloc[-1].Open
        })
    except Exception as e:
        logging.error(f"Error fetching data: {e}")
        return jsonify({'error': 'An error occurred fetching data'}), 500

if __name__ == '__main__':
    app.run(debug=os.environ.get('DEBUG', 'False') == 'True')
