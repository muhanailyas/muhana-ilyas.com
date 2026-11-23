---
title: Atlas of Psychological Outcomes in Neuro-Oncology (APONO)
short_title: APONO
summary: An open, location-based atlas of cognitive, psychological and quality-of-life outcomes after surgery for adult brain tumours, built from systematic reviews and meta-analyses.
thumbnail: /uploads/figures/apono-cover.svg
thumbnail_alt: Schematic brain slice with regions shaded to show how outcomes are summarised by location
status: active
tags: [neuro-oncology, meta-analysis, neuroimaging, neuropsychology]
start: "2026"
figures:
  - image: /uploads/figures/apono-pipeline.svg
    caption: "The APONO workflow. Published cohorts are identified and screened, tumour location and outcomes are extracted, sites are placed in MNI152 space, effects are pooled by brain region, and the results are shared as an open interactive atlas."
    alt: "Five-step workflow: find studies, extract, map, pool, share"
  - image: /uploads/figures/apono-levels.svg
    caption: "Five levels of spatial detail. Every study contributes at the whole-brain level; only studies that report precise tumour location contribute at the region and voxel levels. Shading is illustrative."
    alt: "Brain outlines shaded at whole-brain, hemisphere, lobe, atlas region and voxel level"
  - image: /uploads/figures/apono-roadmap.svg
    caption: "Programme roadmap. Each tumour type is reviewed as a separate module, starting with intracranial meningioma, before all modules are combined into one atlas."
    alt: "Timeline of tumour modules from meningioma to brain metastases, ending in a combined atlas"
links:
  - label: Atlas page
    url: /atlas/
  - label: Prototype code
    url: https://github.com/muhanailyas/brain-tumour-neuropsychology-atlas
order: 1
---

## What it is

APONO is an open atlas that answers one question for adults with a brain tumour: **what happens to cognition, mood and quality of life after treatment, depending on where the tumour is?** It combines systematic review and meta-analysis with standard neuroimaging atlases, so that published outcomes can be read by location, time since treatment and treatment type.

## Why it matters

Before surgery, patients and families often ask what the operation will mean for memory, attention, mood and everyday life. The evidence exists, but it is scattered across many small cohorts that use different tests, different follow-up times and different ways of describing tumour location. Individual studies are rarely large enough to compare locations, and narrative reviews cannot show the spatial pattern. Pooling the evidence in a common brain space makes that pattern visible and shows where the evidence is still thin.

## Approach

1. **Find studies.** Systematic searches and screening of studies reporting cognitive, psychological or quality-of-life outcomes after treatment for adult brain tumours.
2. **Extract.** Tumour location, tumour type and grade, treatment (surgery, radiotherapy, chemotherapy and their combinations), time since treatment, outcome domain and comparison group (healthy controls, other tumour locations, or pre- versus post-treatment).
3. **Map.** Tumour sites are placed in MNI152 standard space using the Harvard-Oxford and Schaefer-200 atlases.
4. **Pool.** Random-effects meta-analysis at five levels of detail, from whole brain to hemisphere, lobe, atlas region and voxel.
5. **Share.** An open interactive viewer built on NiiVue, searchable by location, diagnosis and treatment.

## Status

The first module, on intracranial meningioma, is in progress. Modules on glioma, pituitary adenoma, vestibular schwannoma, medulloblastoma and brain metastases will follow, and the programme ends with a combined atlas and an open web resource. A working prototype of the viewer is available on GitHub.
