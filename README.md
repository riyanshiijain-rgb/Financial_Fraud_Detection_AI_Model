# FraudLens — AI Financial Fraud Detection UI

A Flask + XGBoost web application for the financial fraud detection model.

## Project structure

```text
fraud_detection_ui/
├── app.py
├── Fraud_Detection_Model.pkl
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js
```

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Important

The API recreates the exact one-hot encoding used by the trained model:

- type_CASH_IN
- type_CASH_OUT
- type_DEBIT
- type_PAYMENT
- type_TRANSFER

The model expects 12 features in this exact order.


## UI note

The user-facing interface does not ask for `step` or `isFlaggedFraud`.
The Flask API supplies these model-required fields internally so the existing trained model continues to work without exposing dataset-specific technical fields to users.
