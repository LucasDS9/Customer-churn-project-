# 🔍 Customer Churn classification

🌎 Leia em: [Português](README.md) | [English](README_en.md)

Projeto completo de **Machine Learning** focado em prever quais clientes bancários possuem maior probabilidade de cancelar seus serviços (**churn**).  
Além da previsão, o projeto também busca **entender os fatores que influenciam o cancelamento**, oferecendo insights estratégicos para retenção de clientes.

---

## 📌 Problema

O **churn** representa clientes que encerram sua relação com a empresa.  
Em bancos, essa perda é especialmente crítica: **captar novos clientes custa muito mais do que manter os atuais**.

Assim, prever quais clientes estão propensos a sair permite:

- Reduzir perdas financeiras  
- Otimizar estratégias de retenção  
- Agir preventivamente identificando fatores que causam saída

---

## 🎯 Objetivo

Construir uma solução de Machine Learning que:

- Classifique clientes com **alta probabilidade de churn**
- Destaque **padrões e comportamentos** associados ao cancelamento
- Ofereça métricas confiáveis mesmo em um cenário **desbalanceado**
- Forneça insights sobre quais fatores mais contribuem para a saída

O modelo escolhido foi o **Random Forest Classifier**, pela sua robustez, interpretabilidade e excelente desempenho em dados estruturados.

⚠️ Como a base é desbalanceada, foram priorizadas métricas como:

- **Recall** → essencial para capturar o maior número possível de clientes que realmente cancelariam  
- **ROC AUC** → para avaliar desempenho geral do modelo

---

## 🧱 Etapas do Projeto

### 1️⃣ Importações e conhecimento inicial do dataset
- Leitura dos dados
- Primeiras inspeções: tipos, estatísticas e estrutura geral

### 2️⃣ Análise Exploratória de Dados (EDA)
- Distribuição da variável alvo (`Exited`)
- Relação entre variáveis e churn
- Identificação de padrões estruturais
- Verificação de correlação entre atributos

### 3️⃣ Pré-processamento
<<<<<<< HEAD
- Codificação de variáveis categóricas com **OrdinalEncoder**
=======
- Limpeza e organização dos dados
>>>>>>> 8e24ff30eea613e59925a85e1f89eff977bfdf1e
- Separação em treino e teste
- Aplicação de **SMOTE** para corrigir o desbalanceamento

### 4️⃣ Treinamento e avaliação do modelo
- Modelo: **Random Forest Classifier**
- Avaliação com:
  - `classification_report`
  - `ROC AUC`
  - `matriz de confusão`
- Interpretação dos resultados
- Features mais importantes para o churn

---

## 🧠 Principais Insights do Projeto

- A desproporção de classes exigiu técnicas específicas (**SMOTE**)
- Variáveis como **idade, Complain, IsActiveMember** e **Satisfaction Score** estão entre as mais relevantes
- Clientes que reclamam (**Complain=1**) são muito propensos a sair, principalmente se Satisfaction Score é baixo, assim como membros nao ativos (**IsActiveMember=0**)
- O **Recall** mostrou-se fundamental para identificar clientes em risco
- O modelo conseguiu aprender padrões consistentes que ajudam na tomada de decisão estratégica
- A definição de um **threshold** (limiar de decisão) personalizado foi essencial para aumentar a detecção de clientes com risco de churn. Esse limiar pode — e **deve** — ser ajustado conforme os objetivos da empresa, equilibrando precisão e sensibilidade.

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Função |
|-----------|--------|
| 🐍 **Python** | Linguagem principal do projeto |
| 🧮 **Pandas / NumPy** | Manipulação e análise de dados |
| 📊 **Matplotlib / Seaborn** | Visualizações e gráficos |
| 🤖 **Scikit-learn** | Modelagem e métricas |
| ⚖️ **Imbalanced-learn (SMOTE)** | Correção do desbalanceamento |
| 🌲 **RandomForestClassifier** | Classificador utilizado |





