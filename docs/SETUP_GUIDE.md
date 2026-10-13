# System Setup & Deployment Guide

This guide provides instructions for setting up, running, and testing the Customer Churn Prediction web application both locally on your machine and remotely using Google Colab.

---

## 1. Local Machine Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.9 or higher
- **pip** and **npm**

### Backend Setup (Local)
1. Open a terminal in the project directory:
   ```bash
   cd e:\ML_Project\backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the trained model files (`elastic_net_churn_model.pkl` and `churn_preprocessor.pkl`) from Google Colab into `e:\ML_Project\ml_model/`.
   *(Alternatively, run `python train_or_export.py --dataset path/to/Telco_customer_churn.xlsx` to train locally).*
4. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend will start at: `http://localhost:5000`.

### Frontend Setup (Local)
1. Open a second terminal window:
   ```bash
   cd e:\ML_Project\frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 2. Google Colab Execution Workflow

Because your trained model is already in Google Colab, you can run the Flask backend directly inside Colab and connect your local frontend to it over a secure HTTPS tunnel.

### Why a Tunnel is Required
Google Colab instances execute inside isolated Google Cloud virtual machines. The address `http://localhost:5000` inside Colab refers to the Colab container itself, **not** your personal computer. To allow your browser to communicate with Colab, an external reverse-proxy tunnel like **ngrok** is used.

### Step-by-Step Colab Instructions

#### Step 1: Save the Model and Preprocessor in Colab
Ensure you have executed **Cell 102** in `ML final project1.ipynb`:
```python
import joblib

joblib.dump(best_model, "elastic_net_churn_model.pkl")
joblib.dump(preprocessor, "churn_preprocessor.pkl")
print("Model files generated successfully!")
```

#### Step 2: Add the Backend Runner Cell to Colab
Create a new code cell at the bottom of your Colab notebook and paste the code from:
[`backend/colab_backend_runner.py`](file:///e:/ML_Project/backend/colab_backend_runner.py)

#### Step 3: Configure your Free Ngrok Token
1. Go to [https://ngrok.com](https://ngrok.com) and create a free account.
2. In your ngrok dashboard, copy your **Authtoken**.
3. In the Colab cell, paste your token:
   ```python
   NGROK_AUTHTOKEN = "your_actual_token_here"
   ```

#### Step 4: Run the Colab Cell
Execute the cell. In the cell output, you will see:
```text
🚀 COLAB BACKEND IS LIVE!
Public API URL: https://3a91-34-125-92-120.ngrok-free.app
```

#### Step 5: Connect Frontend to Google Colab
1. In your browser running the frontend (`http://localhost:5173`), look at the top navigation bar.
2. Click the **API Settings** button (with the gear icon).
3. In the modal, paste your Colab ngrok URL (e.g. `https://3a91-34-125-92-120.ngrok-free.app`).
4. Click **Test & Save Connection**.
5. The status badge will turn green (**Connected: Colab Backend**). All predictions and queries will now flow directly into your live Colab session!

---

## 3. Google Colab Session Limitations & Production Considerations

| Limitation | Technical Reason | Recommended Solution |
|---|---|---|
| **Colab Disconnections** | Colab VMs automatically shut down after 90 minutes of inactivity or 12 hours total session duration. | For college presentations, run the Colab cell 10 minutes prior to the demonstration. |
| **Tunnel Ephemeral URLs** | Free ngrok tunnels assign a new random URL upon each restart. | Update the API base URL in the frontend **API Settings** modal whenever Colab restarts. |
| **Permanent Hosting** | Colab is meant for interactive notebooks, not 24/7 web backends. | For long-term public hosting, deploy the Flask backend to free/low-cost platforms like **Render**, **Railway**, or **Hugging Face Spaces**. |
