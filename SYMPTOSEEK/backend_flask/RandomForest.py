import pandas as pd
import numpy as np
import warnings
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

warnings.filterwarnings('ignore')

def summary_report(y_true, y_pred, prefix=""):
    acc = accuracy_score(y_true, y_pred)
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    print(f"\n✅ {prefix} Accuracy: {acc:.3f}")
    print(f"{prefix} Classification Report (summary):")
    print("   Macro avg    | Precision: {:.2f}  Recall: {:.2f}  F1: {:.2f}".format(
        report['macro avg']['precision'], report['macro avg']['recall'], report['macro avg']['f1-score']))
    print("Weighted avg | Precision: {:.2f}  Recall: {:.2f}  F1: {:.2f}\n".format(
        report['weighted avg']['precision'], report['weighted avg']['recall'], report['weighted avg']['f1-score']))

# Load data
train = pd.read_csv('data/Training.csv')
test = pd.read_csv('data/Testing.csv')

X_train = train.drop('prognosis', axis=1)
y_train = train['prognosis']
X_test = test.drop('prognosis', axis=1)
y_test = test['prognosis']

le = LabelEncoder()
y_train_enc = le.fit_transform(y_train)
y_test_enc = le.transform(y_test)

# Automatically determine cv splits
class_counts = pd.Series(y_train_enc).value_counts()
min_class_count = class_counts.min()
cv_splits = min(5, min_class_count)

# GridSearchCV for Random Forest
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 20, None],
    'min_samples_leaf': [1, 3, 5],
    'max_features': ['sqrt', 'log2']
}
rf_base = RandomForestClassifier(random_state=42)
grid = GridSearchCV(rf_base, param_grid, cv=cv_splits, scoring='accuracy', n_jobs=-1)
grid.fit(X_train, y_train_enc)
best_rf = grid.best_estimator_

# Evaluate on train and test set
y_pred_train = best_rf.predict(X_train)
y_pred_test = best_rf.predict(X_test)
summary_report(y_train_enc, y_pred_train, prefix="Train ")
summary_report(y_test_enc, y_pred_test, prefix="Test ")

joblib.dump(best_rf, "best_rf_model.joblib")
joblib.dump(le, "label_encoder.joblib")
