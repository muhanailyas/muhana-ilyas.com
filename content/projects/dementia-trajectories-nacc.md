---
title: Forecasting neuropsychiatric, cognitive and functional decline in dementia
short_title: Dementia forecasting
summary: Explainable machine learning models that forecast decline at the next clinical visit across three domains of dementia, using the NACC Uniform Data Set.
thumbnail: /uploads/figures/nacc-cover.svg
thumbnail_alt: Three illustrative trajectories across clinic visits with a forecast for the next visit
status: active
tags: [dementia, machine learning, explainable AI, NACC]
start: "2026"
figures:
  - image: /uploads/figures/nacc-framework.svg
    caption: "Study framework. Information collected at one visit of the NACC Uniform Data Set is used to forecast cognition, daily function and neuropsychiatric symptoms at the next visit, and each forecast is explained with SHAP values."
    alt: "Inputs at visit t feed multivariate and temporal models that forecast three domains at visit t plus one, with an explanation panel"
  - image: /uploads/figures/nacc-cascade.svg
    caption: "Cascades between domains. Cross-lagged and dynamic models test whether change in one domain, such as neuropsychiatric symptoms, precedes change in another, such as daily function."
    alt: "Cognition, function and neuropsychiatric nodes at two visits connected by within-domain and cross-domain arrows"
order: 2
---

## What it is

Full title: *Forecasting dynamic neuropsychiatric, cognitive and functional cascades across the dementia continuum using explainable multivariate machine learning.* The project builds models that predict how a person's cognition, daily function and neuropsychiatric symptoms will change by their next clinic visit, and shows which information drives each prediction.

## Why it matters

Dementia is not only a memory disorder. Apathy, depression, agitation and sleep problems are common, and they are among the strongest drivers of caregiver burden and institutional care. These domains change together, but most prediction models treat them separately. Forecasting them jointly, and asking which decline tends to come first, could help clinicians time support and interventions better.

## Data and approach

- **Data:** the Uniform Data Set of the National Alzheimer's Coordinating Center (NACC), a large longitudinal cohort with standardised visits across Alzheimer's Disease Research Centers in the United States.
- **Outcomes:** cognitive test scores, daily function (Functional Activities Questionnaire), neuropsychiatric symptoms (NPI-Q) and dementia stage at the next visit.
- **Models:** multivariate and multi-task machine learning (elastic net, XGBoost, CatBoost), with SHAP values to explain individual predictions.
- **Temporal structure:** cross-lagged panel models, dynamic Bayesian networks and multi-state models to describe how the domains influence each other over time.

## Status

In progress. Results will be posted here once the analysis is complete.
