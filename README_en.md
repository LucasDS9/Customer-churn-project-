# 🔍 Customer Churn Classification

🌎 Read in: [Português](README.md) | [English](README_en.md)


A complete **Machine Learning** project focused on predicting which banking customers are most likely to cancel their services (**churn**).  
In addition to prediction, the project also aims to **understand the factors that drive customer churn**, providing strategic insights for customer retention.

---

## 📌 Problem

**Churn** refers to customers ending their relationship with a company.  
In the banking sector, this loss is especially critical, as **acquiring new customers is far more expensive than retaining existing ones**.

Therefore, predicting which customers are likely to leave allows companies to:

- Reduce financial losses  
- Optimize retention strategies  
- Act proactively by identifying factors that lead to churn

---

## 🎯 Objective

Build a Machine Learning solution that:

- Classifies customers with a **high probability of churn**
- Highlights **patterns and behaviors** associated with cancellation
- Delivers reliable metrics even in a **highly imbalanced dataset**
- Provides insights into the variables that most strongly influence churn

The model of choice was the **Random Forest Classifier**, due to its robustness, interpretability, and strong performance on structured data.

⚠️ Since the dataset is imbalanced, the evaluation prioritized metrics such as:

- **Recall** → essential for capturing as many true churn cases as possible  
- **ROC AUC** → to assess overall model performance

---

## 🧱 Project Steps

### 1️⃣ Initial Imports and Dataset Understanding
- Data loading
- First inspections: types, statistics, and overall structure

### 2️⃣ Exploratory Data Analysis (EDA)
- Distribution of the target variable (`Exited`)
- Relationship between features and churn
- Identification of structural patterns
- Correlation analysis

### 3️⃣ Preprocessing
- Data cleaning and organization
- Train-test split
- Application of **SMOTE** to address class imbalance

### 4️⃣ Model Training and Evaluation
- Model: **Random Forest Classifier**
- Evaluation using:
  - `classification_report`
  - `ROC AUC`
  - `confusion_matrix`
- Interpretation of results
- Feature importance analysis

---

## 🧠 Key Insights

- The class imbalance required specific techniques such as **SMOTE**
- Variables such as **Age, Complain, IsActiveMember**, and **Satisfaction Score** were among the most influential
- Customers who filed complaints (**Complain = 1**) are highly likely to churn, especially when Satisfaction Score is low — similarly to non-active members (**IsActiveMember = 0**)
- **Recall** proved fundamental for identifying customers at risk
- The model successfully learned consistent patterns that support strategic decision-making
- Defining a custom **decision threshold** was essential to improve the detection of customers at risk of churn. This threshold can — and **should** — be adjusted according to business goals, balancing precision and sensitivity.

---

## 🛠 Technologies Used

| Technology | Purpose |
|-----------|---------|
| 🐍 **Python** | Main programming language |
| 🧮 **Pandas / NumPy** | Data manipulation and analysis |
| 📊 **Matplotlib / Seaborn** | Visualizations and charts |
| 🤖 **Scikit-learn** | Modeling and evaluation metrics |
| ⚖️ **Imbalanced-learn (SMOTE)** | Handling class imbalance |
| 🌲 **RandomForestClassifier** | Model used |

---
