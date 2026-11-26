---
title: Explainable multimodal machine learning for nerve conduction studies
short_title: NCS-AI
summary: Master's thesis project at Universitas Gadjah Mada that combines nerve conduction measurements with clinical text to classify nerve conduction study findings, with explanations clinicians can check.
thumbnail: /uploads/figures/ncs-cover.svg
thumbnail_alt: Schematic motor response with latency and amplitude marked
status: active
tags: [neurophysiology, machine learning, explainable AI, peripheral nerve]
figures:
  - image: /uploads/figures/ncs-latefusion.svg
    caption: "Late-fusion design. One model learns from the electrodiagnostic measurements and another from the clinical narrative, after removing text that states or hints at the final diagnosis. Their predicted probabilities are combined, and the prediction is explained in terms of both measurements and words."
    alt: "Two input branches, measurements and clinical text, feed separate models whose outputs are fused into a diagnosis with an explanation"
  - image: /uploads/figures/ncs-measurements.svg
    caption: "What the main measurements mean. Latency is the time from stimulus to response, amplitude reflects the number of conducting axons, and conduction velocity, calculated from two stimulation sites, reflects myelin function."
    alt: "Two schematic motor responses after distal and proximal stimulation, with latency, amplitude and conduction velocity explained"
links:
  - label: NCS-hier (web tool)
    url: /projects/ncs-hier/
order: 3
---

## What it is

A nerve conduction study (NCS) measures how fast and how strongly electrical signals travel along peripheral nerves. It is central to diagnosing conditions such as carpal tunnel syndrome and polyneuropathy. This project builds machine learning models that classify NCS findings by combining two sources of information that a neurologist also uses: the **numerical measurements** and the **clinical narrative**.

## Why it matters

Interpreting NCS takes training and experience, and many hospitals have few clinical neurophysiologists. Models that only see the numbers miss clinical context, while models that read the full report can simply copy the conclusion written in it. Controlling for that leakage, and explaining every prediction, are what make such a model trustworthy enough to support clinicians.

## Approach

- **Two modalities, late fusion:** separate models for the tabular measurements (latency, amplitude, conduction velocity, F-waves) and for the clinical text, combined at the prediction level.
- **Leakage control:** words in the text that state or strongly hint at the final diagnosis are removed before training.
- **Explainability:** feature contributions for measurements and word-level attributions for text.
- **Evaluation:** discrimination, calibration and clinical usefulness, not accuracy alone.

## Status

Master's thesis in Artificial Intelligence at Universitas Gadjah Mada, carried out with clinical neurophysiology colleagues. A scoping review of AI applications in nerve conduction studies is being prepared alongside the main study.

A related study uses only the measurements of routine upper- and lower-limb examinations. It asks two clinical questions (is the study abnormal, and is it polyneuropathy?), localises the conclusion in a two-level hierarchy (normal or abnormal, then where the lesion lies), checks how much of the apparent accuracy comes from which tests were ordered, and expresses uncertainty as prediction sets. Its models run in the browser as a [web-based decision support tool](/projects/ncs-hier/), and laboratories interested in external validation are welcome to get in touch.
