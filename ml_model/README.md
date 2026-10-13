# Machine Learning Model Artifacts

This directory is designated for the serialized model and preprocessor artifacts produced by the Google Colab notebook (`ML final project1.ipynb`).

## Expected Model Files

Per project specifications, no placeholder or fake pickle files are generated here. The actual files are produced by **Cell 102** of your Google Colab notebook:

1. **`elastic_net_churn_model.pkl`**
   - Trained `LogisticRegression` model with Elastic Net regularization.
   - Solver: `saga`
   - Penalty: `elasticnet`
   - Hyperparameters: `C=1.0`, `l1_ratio=0.5`, `max_iter=1000`, `random_state=42`
   - Scoring / Performance: ROC-AUC = 0.8433, Accuracy = 0.8074

2. **`churn_preprocessor.pkl`**
   - Fitted `ColumnTransformer` pipeline.
   - Numerical Transformer: `StandardScaler` applied to `Tenure Months`, `Monthly Charges`, `Total Charges`, `CLTV`.
   - Categorical Transformer: `OneHotEncoder(handle_unknown='ignore')` applied to the 16 categorical features.
   - Outputs: 47 encoded feature columns matching model weights.

---

## How to Obtain These Files from Google Colab

Run Cell 102 in your Google Colab notebook:

```python
import joblib

# 1. Save trained Elastic Net model
joblib.dump(best_model, "elastic_net_churn_model.pkl")

# 2. Save fitted preprocessor
joblib.dump(preprocessor, "churn_preprocessor.pkl")

# 3. Download to your local machine
from google.colab import files
files.download("elastic_net_churn_model.pkl")
files.download("churn_preprocessor.pkl")
```

Once downloaded, place both `.pkl` files into this directory (`ml_model/`).

---

## Standalone Retraining / Local Export Script

If you wish to train and export the model locally using your Python environment instead of Colab, you can run the helper script provided in `backend/train_or_export.py` using your dataset file:

```bash
python backend/train_or_export.py --dataset path/to/Telco_customer_churn.xlsx
```
