# 🔍 Customer Churn Classification

🌎 Leia em: [Português](README.md) | [English](README_en.md)

> Projeto completo de **Machine Learning** focado em prever quais clientes bancários possuem maior probabilidade de cancelar seus serviços (**churn**). Além da previsão, o projeto também busca **entender os fatores que influenciam o cancelamento**, oferecendo insights estratégicos para retenção de clientes.

🌐 **[Acesse o portfólio](https://LucasDS9.github.io)** · 🚀 **[Testar o modelo](https://customer-churn-project-d7xs.onrender.com/app/)** · 📓 **[Ver notebook](https://github.com/LucasDS9/Customer-churn-project-/blob/main/notebook/Customer_churn.ipynb)** · 📊 **[Ver dashboard](https://customer-churn-project-kk14.vercel.app)**

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

Desenvolvi também um **[dashboard interativo](https://customer-churn-project-kk14.vercel.app)** que exibe todos os principais fatores que levam ao churn, permitindo explorar visualmente os padrões identificados pelo modelo.

O modelo escolhido foi o **XGBoost Classifier**, pela sua robustez, interpretabilidade e excelente desempenho em dados estruturados.

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
└── 📁 frontend
├── 📁 notebook
│   └── Customer_churn.ipynb    # EDA, insights e implementação completa
│
├── 📁 src
│   ├── pipeline.py             # Construção do pipeline sklearn + SMOTE
│   ├── train.py                # Treinamento e tracking com MLflow
│   └── evaluate.py             # Avaliação com threshold customizado
│
└── README.md
└── requirements.txt
```

---

## 📈 Resultados

Variáveis como histórico de reclamações, score de satisfação, nível de atividade e tempo de relacionamento demonstraram alto poder preditivo para identificar clientes em risco de cancelamento.

- Clientes insatisfeitos representam o grupo com maior propensão ao churn, indicando que estratégias de retenção e engajamento direcionadas a esse perfil podem reduzir significativamente a evasão.
- A variável `risco_composto` — criada a partir de uma combinação ponderada de indicadores — apresentou correlação de **60%** com os clientes que efetivamente cancelaram o serviço.

O modelo desenvolvido é altamente eficaz para prever churn, atingindo:

- **97% de detecção** dos clientes que realmente saem
- Baixo número de falsos negativos
- Excelente capacidade de discriminação
- Forte utilidade prática para tomada de decisão

Ele está pronto para ser integrado em pipelines de decisão, dashboards de monitoramento ou sistemas de alerta precoce. Também serve como base sólida para estratégias de retenção, ofertas personalizadas e intervenções preventivas.

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
- Três modelos avaliados e rastreados com **MLflow autolog**: Logistic Regression, XGBoost e Gradient Boosting
- Modelo campeão registrado no **MLflow Model Registry** com alias `champion`
- Avaliação com `classification_report`, `ROC-AUC` e `matriz de confusão`

---

## 📊 Desempenho do Modelo

| Métrica | Valor |
|---|---|
| ROC-AUC | **99.32%** |
| Accuracy | **96.00%** |

### Classification Report

| Classe | Precision | Recall | F1-score | Support |
|---|---|---|---|---|
| No churn | 100% | 96% | 98% | 2765 |
| Churn | 65% | 97% | 78% | 235 |
| **macro avg** | **82%** | **96%** | **88%** | **3000** |
| **weighted avg** | **97%** | **96%** | **96%** | **3000** |

### Confusion Matrix

| | Predicted No | Predicted Yes |
|---|---|---|
| Actual No | 2657 | 108 |
| Actual Yes | 7 | 228 |

---

## 🧠 Principais Insights

- A desproporção de classes exigiu técnicas específicas (**SMOTE**)
- **Satisfaction Score** é o fator mais relevante: quanto menor a satisfação, maior a probabilidade de churn
- Clientes que reclamam (**Complain=1**) são muito propensos a sair, especialmente com baixo Satisfaction Score
- Membros inativos (**IsActiveMember=0**) apresentam maior risco de cancelamento

### Churn por Satisfação, Reclamação e Atividade

A análise multivariada cruzando satisfação, reclamação (`Complain`) e nível de atividade (`IsActiveMember`) revela padrões críticos de risco:

| Satisfação | Complain=0 \| Inativo | Complain=0 \| Ativo | Complain=1 \| Inativo | Complain=1 \| Ativo |
|---|---|---|---|---|
| Baixa | 0.10 | 0.05 | **0.44** | 0.32 |
| Média | 0.00 | 0.00 | 0.00 | 0.07 |
| Alta | 0.00 | 0.00 | 0.00 | 0.03 |

O combinação mais crítica é **baixa satisfação + reclamação + inatividade**, que resulta em uma taxa de churn de **44%** — o patamar mais elevado observado. Clientes com satisfação média ou alta apresentam churn próximo de zero, independentemente dos demais fatores. Isso reforça que o Satisfaction Score é o principal gatilho de evasão e que intervenções devem ser priorizadas para clientes insatisfeitos que já reclamaram e estão inativos.

### Importância das Variáveis (SHAP — Top 8)

A análise SHAP revela tanto a magnitude quanto a **direção** do impacto de cada variável no churn:

| Variável | Direção | Interpretação |
|---|---|---|
| **Satisfaction Score** | ← Reduz churn | Principal fator protetor: alta satisfação suprime fortemente o churn |
| **risco_composto** | → Aumenta churn | Feature engenheirada com maior impacto positivo no churn; correlação de 60% com evasão |
| **Complain** | → Aumenta churn | Reclamações são forte indicativo de saída iminente |
| **Tenure** | ← Protetor moderado | Clientes com maior tempo de relacionamento tendem a permanecer |
| **IsActiveMember** | ← Protetor moderado | Membros ativos apresentam menor propensão ao churn |
| **risco_cliente** | → Aumenta churn | Indicador composto de perfil de risco do cliente |
| **Gender** | → Aumenta churn | Efeito moderado dependendo do perfil demográfico |
| **Age** | → Aumenta churn | Clientes mais velhos apresentam leve tendência maior ao cancelamento |

O `risco_composto` — feature criada no projeto — superou variáveis nativas como `Complain` e `IsActiveMember` em poder preditivo, validando a eficácia da engenharia de features aplicada.

### Features mais correlacionadas com churn

| Feature | Correlação | Interpretação |
|---|---|---|
| risco_compost | +0.590 | Fator mais importante. Variável criada|
| Satisfaction Score | −0.562 | Fator muito importante. Quanto menor a satisfação, maior o churn |
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
| ⚡ **XGBoost** | Classificador principal utilizado |
| 📈 **MLflow** | Rastreamento de experimentos e model registry |
| 📦 **Joblib** | Serialização e persistência de modelos |