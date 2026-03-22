# 🔍 Customer Churn Classification

🌎 Leia em: [Português](README.md) | [English](README_en.md)

> Projeto completo de **Machine Learning** focado em prever quais clientes bancários possuem maior probabilidade de cancelar seus serviços (**churn**). Além da previsão, o projeto também busca **entender os fatores que influenciam o cancelamento**, oferecendo insights estratégicos para retenção de clientes.

🌐 **[Acesse o portfólio](https://LucasDS9.github.io)** · 🚀 **[Testar o modelo](https://customer-churn-project-d7xs.onrender.com/app/;)** · 📓 **[Ver notebook](https://github.com/LucasDS9/Customer-churn-project-/blob/main/notebook/Customer_churn.ipynb)**

---

## 📌 Problema

O **churn** representa clientes que encerram sua relação com a empresa.
Em bancos, essa perda é especialmente crítica: **captar novos clientes custa muito mais do que manter os atuais**.

Prever quais clientes estão propensos a sair permite:
- Reduzir perdas financeiras
- Otimizar estratégias de retenção
- Agir preventivamente identificando os fatores que causam saída

---

## 🎯 Objetivo

Construir uma solução de Machine Learning que:
- Classifique clientes com **alta probabilidade de churn**
- Destaque **padrões e comportamentos** associados ao cancelamento
- Ofereça métricas confiáveis mesmo em um cenário **desbalanceado**
- Forneça insights sobre quais fatores mais contribuem para a saída

O modelo escolhido foi o **Random Forest Classifier**, pela sua robustez, interpretabilidade e excelente desempenho em dados estruturados.

> ⚠️ Como a base é desbalanceada, foram priorizadas métricas como **Recall** (para capturar o maior número possível de clientes em risco) e **ROC-AUC** (para avaliação geral do modelo).

---

## 📁 Estrutura do Projeto

```text
📦 customer-churn-project
├── 📁 app
│   └── app.py                  # Aplicação Streamlit
│
├── 📁 artifacts
│   ├── model.pkl               # Modelo treinado
│   ├── test.pkl                # Dados de teste serializados
│   └── metrics.json            # Métricas de avaliação
│
├── 📁 data
│   └── customer_dataset.csv    # Dataset do projeto
│
├── 📁 notebook
│   └── Customer_churn.ipynb    # EDA, insights e implementação completa
│
├── 📁 src
│   ├── pipeline.py             # Construção do pipeline sklearn + SMOTE
│   ├── train.py                # Treinamento e tracking com MLflow
│   └── evaluate.py             # Avaliação com threshold customizado
│
└── README.md
```

---

## 🧱 Etapas do Projeto

### 1️⃣ Conhecimento inicial do dataset
- Leitura dos dados e primeiras inspeções
- Tipos de variáveis, estatísticas iniciais e identificação de inconsistências
- Entendimento geral da estrutura do conjunto de dados

### 2️⃣ Análise Exploratória de Dados (EDA)
- Distribuição da variável alvo (`Exited`)
- Relação entre variáveis e churn
- Identificação de padrões estruturais e correlação entre atributos
- Visualizações orientadas à tomada de decisão

### 3️⃣ Pré-processamento
- Codificação de variáveis categóricas com **OrdinalEncoder**
- Separação em treino e teste com estratificação
- Aplicação de **SMOTE** para corrigir o desbalanceamento de classes

### 4️⃣ Treinamento e avaliação
- Três modelos avaliados e rastreados com **MLflow autolog**: Logistic Regression, Random Forest e Gradient Boosting
- Modelo campeão registrado no **MLflow Model Registry** com alias `champion`
- Threshold customizado de **0.35** para maximizar recall
- Avaliação com `classification_report`, `ROC-AUC` e `matriz de confusão`

---

## 📊 Desempenho do Modelo

| Métrica | Valor |
|---|---|
| ROC-AUC | **99.66%** |
| Accuracy | **98.20%** |
| Threshold | **0.35** |

### Classification Report

| Classe | Precision | Recall | F1-score | Support |
|---|---|---|---|---|
| No churn | 99.6% | 98.4% | 99.0% | 2790 |
| Churn | 82.0% | 95.2% | 88.1% | 210 |

### Confusion Matrix

| | Predicted No | Predicted Yes |
|---|---|---|
| Actual No | 2746 | 44 |
| Actual Yes | 10 | 200 |

---

## 🧠 Principais Insights

- A desproporção de classes exigiu técnicas específicas (**SMOTE**)
- **Satisfaction Score** é o fator mais relevante: quanto menor a satisfação, maior a probabilidade de churn
- Clientes que reclamam (**Complain=1**) são muito propensos a sair, especialmente com baixo Satisfaction Score
- Membros inativos (**IsActiveMember=0**) apresentam maior risco de cancelamento
- Clientes mais velhos mostram maior tendência ao churn (**Age**)
- A definição de um **threshold customizado** foi essencial para maximizar a detecção de clientes em risco — e pode ser ajustado conforme os objetivos da empresa

### Features mais correlacionadas com churn

| Feature | Correlação | Interpretação |
|---|---|---|
| Satisfaction Score | −0.562 | Fator mais importante. Quanto menor a satisfação, maior o churn |
| Complain | +0.335 | Clientes que reclamam têm forte tendência a sair |
| Age | +0.127 | Clientes mais velhos apresentam maior probabilidade de churn |
| IsActiveMember | −0.119 | Membros inativos têm maior risco de cancelamento |

---

## 🚀 Conclusão

O projeto entrega uma solução completa que:
- Identifica clientes em risco com **alta precisão e recall**
- Oferece **rastreabilidade de experimentos** via MLflow
- Fornece **insights acionáveis** para estratégias de retenção
- Utiliza um pipeline robusto e reprodutível, próximo de ambientes reais de produção

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Função |
|---|---|
| 🐍 **Python 3.12** | Linguagem principal do projeto |
| 🧮 **Pandas / NumPy** | Manipulação e análise de dados |
| 📊 **Matplotlib / Seaborn** | Visualizações e gráficos |
| 🤖 **Scikit-learn** | Modelagem, pipeline e métricas |
| ⚖️ **Imbalanced-learn (SMOTE)** | Correção do desbalanceamento de classes |
| 🌲 **RandomForestClassifier** | Classificador principal utilizado |
| 📈 **MLflow** | Rastreamento de experimentos e model registry |
| 📦 **Joblib** | Serialização e persistência de modelos |