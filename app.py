from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "Fraud_Detection_Model.pkl")
model = joblib.load(MODEL_PATH)

# Exact feature order expected by the trained XGBoost model.
FEATURE_COLUMNS = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "isFlaggedFraud",
    "type_CASH_IN",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER"
]

VALID_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]


def make_features(data):
    transaction_type = str(data["type"]).upper()

    if transaction_type not in VALID_TYPES:
        raise ValueError("Invalid transaction type.")

    # Step and isFlaggedFraud are intentionally hidden from the user.
    # The trained model still expects them, so the API supplies neutral defaults.
    row = {
        "step": 100.0,
        "amount": float(data["amount"]),
        "oldbalanceOrg": float(data["oldbalanceOrg"]),
        "newbalanceOrig": float(data["newbalanceOrig"]),
        "oldbalanceDest": float(data["oldbalanceDest"]),
        "newbalanceDest": float(data["newbalanceDest"]),
        "isFlaggedFraud": 0
    }

    # Recreate the exact one-hot encoding used during model training.
    for t in VALID_TYPES:
        row[f"type_{t}"] = int(transaction_type == t)

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        required = [
            "type",
            "amount",
            "oldbalanceOrg",
            "newbalanceOrig",
            "oldbalanceDest",
            "newbalanceDest"
        ]

        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({
                "success": False,
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        features = make_features(data)

        prediction = int(model.predict(features)[0])
        probability = float(model.predict_proba(features)[0][1])

        if probability >= 0.80:
            risk = "CRITICAL"
        elif probability >= 0.40:
            risk = "HIGH"
        elif probability >= 0.15:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return jsonify({
            "success": True,
            "prediction": prediction,
            "label": "FRAUD" if prediction == 1 else "LEGITIMATE",
            "fraud_probability": round(probability * 100, 2),
            "risk": risk
        })

    except (ValueError, TypeError, KeyError) as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Prediction failed: {e}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
