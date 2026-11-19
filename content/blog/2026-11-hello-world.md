---
title: Hello, world
date: 2026-11-19
description: Why I built this site, and a quick look at what the blog can display.
tags: [meta]
draft: false
---

Welcome to my site. I will use this blog for short notes on clinical neuroscience, research methods and medical AI: things that are too long for a social media post and too informal for a paper.

This first post also shows what the editor can do, so feel free to delete it once you have written your own.

## Text and links

Regular paragraphs, *italics*, **bold**, and [links](https://doi.org/10.1002/epi4.70019) all work. So do lists:

- systematic reviews and meta-analyses
- prognostic modelling
- neuroimaging-based outcome maps

> A short quotation looks like this.

## Maths

Inline formulas use single dollar signs, for example the standardised mean difference $d = \frac{\bar{x}_1 - \bar{x}_2}{s_p}$. Display equations use double dollar signs:

$$
\hat{\theta}_{\text{RE}} = \frac{\sum_i w_i^{*} \hat{\theta}_i}{\sum_i w_i^{*}}, \qquad w_i^{*} = \frac{1}{v_i + \hat{\tau}^2}
$$

## Code

```python
import numpy as np

def pooled_estimate(theta, v, tau2):
    """Random-effects pooled estimate (DerSimonian-Laird weights)."""
    w = 1 / (np.asarray(v) + tau2)
    return np.sum(w * np.asarray(theta)) / np.sum(w)
```
