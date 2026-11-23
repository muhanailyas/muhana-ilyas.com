---
title: "Why tumour location matters: introducing APONO"
date: 2026-11-20
description: What the Atlas of Psychological Outcomes in Neuro-Oncology is, why location is the missing piece in outcome research, and how the atlas is being built.
tags: [neuro-oncology, meta-analysis, APONO]
cover: /uploads/figures/apono-pipeline.svg
cover_alt: Five-step workflow from finding studies to an open brain atlas
draft: false
---

"Will I still be myself after the operation?" Many people facing surgery for a brain tumour ask some version of this question. They want to know what will happen to their memory, concentration, mood and ability to work. Clinicians often answer from experience, because the published evidence is hard to use at the bedside. APONO, the Atlas of Psychological Outcomes in Neuro-Oncology, is my attempt to change that.

## The missing piece is location

Research on cognitive and psychological outcomes after brain tumour treatment is growing, but it is fragmented. Studies are often small, use different tests, assess patients at different times after treatment, and describe tumour location in different ways, from "left hemisphere" to precise coordinates. Each study adds a little, but together they rarely answer the practical question of what to expect for a tumour *in this particular place*.

Location matters because the brain is not uniform. Damage to different regions is linked to different patterns of cognitive and emotional change, and treatment effects such as those of radiotherapy may also depend on where the dose is delivered. If we pool evidence without considering location, we lose exactly the information patients need most.

## How APONO works

APONO combines two established methods: systematic review and meta-analysis, and standard neuroimaging atlases.

1. **Find** every eligible study reporting cognitive, psychological or quality-of-life outcomes after treatment for an adult brain tumour.
2. **Extract** tumour location, tumour type, treatment, time since treatment, the outcome measured and the comparison group.
3. **Map** each tumour site into MNI152 standard brain space, using the Harvard-Oxford and Schaefer-200 atlases.
4. **Pool** the results with meta-analysis at several levels of detail, from the whole brain down to hemisphere, lobe, atlas region and voxel.
5. **Share** the results as an open interactive atlas that anyone can explore by location, diagnosis and treatment.

The multi-level design is deliberate. Every study can contribute to the whole-brain and hemisphere summaries, while only studies with precise location data contribute to the finest levels. This lets the atlas use all the evidence while being honest about where detailed evidence is missing.

![Five levels of spatial detail, from whole brain to voxel](/uploads/figures/apono-levels.svg)

## What will be hard

Three challenges stand out. First, heterogeneity: studies use different cognitive tests and questionnaires, so outcomes must be grouped into comparable domains carefully. Second, reporting: many studies report location only coarsely, which limits the finer maps. Third, small studies and publication bias, which require careful sensitivity analyses. An atlas that shows uncertainty openly is more useful than one that looks precise but is not.

## What comes first

The first module covers intracranial meningioma. Glioma, pituitary adenoma, vestibular schwannoma, medulloblastoma and brain metastases will follow, and the modules will then be combined into one atlas. A working prototype of the viewer is already [on GitHub](https://github.com/muhanailyas/brain-tumour-neuropsychology-atlas), and progress will be shared on the [Atlas page](/atlas/).

If you work in neuro-oncology, neuropsychology or neuroimaging and would like to contribute data, expertise or feedback, I would be glad to hear from you through the [contact page](/contact/).
