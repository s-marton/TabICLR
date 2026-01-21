# ICLR 2026 Acceptance Prediction: Tabular ML Approach

A web application for predicting ICLR 2026 paper acceptance using tabular machine learning models (CatBoost, TabPFN, Logistic Regression, and Decision Trees).

## Overview

This project applies tabular machine learning models to predict ICLR paper acceptance decisions based on structured features from review scores, ratings, and metadata. Unlike LLM-based approaches, we focus on feature engineering from numerical and categorical data.

## Models

- **CatBoost**: Gradient boosting with categorical feature handling
- **TabPFN**: Prior-data Fitted Networks optimized for tabular data
- **Logistic Regression**: Linear baseline model
- **Decision Tree**: Non-parametric decision tree model

## Features

- 🔍 Search predictions by OpenReview submission ID
- 📊 View prediction probabilities for all acceptance tiers
- 📈 Interactive charts showing prediction distributions
- 📥 Download complete prediction dataset

## Data

The predictions are stored in `iclr2026_predictions.csv` with the following columns:
- `id`: OpenReview submission ID
- `pred_status`: Predicted status (oral, spotlight, poster, reject)
- `proba_oral`: Probability of Oral acceptance
- `proba_spotlight`: Probability of Spotlight acceptance
- `proba_poster`: Probability of Poster acceptance
- `proba_reject`: Probability of Rejection

## File Structure

```
.
├── index.html          # Main HTML page
├── styles.css          # CSS styling
├── script.js           # JavaScript for data loading and interactivity
├── iclr2026_predictions.csv  # Prediction data
└── README.md           # This file
```

## Notes

- Currently, the CSV contains predictions from CatBoost model. Predictions from other models (TabPFN, Logistic Regression, Decision Tree) will be added as they become available.

## Authors

- [Sascha Marton](https://www.linkedin.com/in/sascha-marton-phd-a19630185/)
- [Patrick Knab](https://www.linkedin.com/in/patrick-knab-4396261b4/)
- [Bartelt Lab](https://bartelt-lab.github.io/)

