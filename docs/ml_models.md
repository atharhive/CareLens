# Machine Learning Models

This document provides an overview of the machine learning models used in the CareLens platform.

## Model Overview

CareLens uses a suite of specialized machine learning models to assess the risk of various health conditions. Each model is trained on a combination of public and private medical datasets and is designed to provide a risk score for a specific condition.

## Conditions

The following conditions are currently supported:

-   Diabetes
-   Heart Disease
-   Stroke
-   Chronic Kidney Disease (CKD)
-   Liver Disease
-   Anemia
-   Thyroid Disorders

## Model Architecture

For each condition, we use an ensemble of models to improve accuracy and robustness. The ensemble typically consists of:

-   **Logistic Regression:** A linear model that provides a good baseline and is highly interpretable.
-   **XGBoost:** A gradient boosting framework that is known for its high performance.
-   **LightGBM:** Another gradient boosting framework that is fast and efficient.

The predictions from these models are then combined to produce a final risk score. This score is then calibrated using Platt Scaling or Isotonic Regression to ensure that it can be interpreted as a true probability.

## Feature Importance

To provide transparency and explainability, we use [SHAP (SHapley Additive exPlanations)](https://shap.readthedocs.io/en/latest/index.html) to calculate the importance of each feature in the model's prediction. This allows users to understand which factors contributed most to their risk score.
