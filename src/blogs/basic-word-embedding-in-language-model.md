---
layout: 'blog.njk'
title: Why Vector Means So Much For A Language Model (#1 Learning Word Embeddings From Scratch)
description: Understanding how vector plays an important role for a language model
tags: blog
date: 2026-07-20
---

# Why Vector Means So Much For A Language Model: Learning Word Embeddings From Scratch

My first time hearing word _'embedding'_ is when I read book about MLOps. MLOps is somewhat like DevOps but with
additional task on partly of Machine Learning work (deploying model, setup feature pipeline, etc.). When I got into
"Feature Pipeline" chapter it started to discuss about RAG (Retrieval Augmented Generation) which involved using
Embedding model. It gave some introduction about what embedding is and why it matters, it was helpful.
However, when I see the demo of using embedding model, I got confused instead.

_"How come that is the result? What just happened? What those numbers represent?"_

Seeing the number just magically appear got me thinking what exactly was happening.
Does it have meaning or is it random? If it is random then how that helped the model or
even know that is not random?

To find out about this, I spent time to learn how embedding works

## Summary

The embedding I learned here is word-level embedding, not a sentence. It is not yet cover how transformer
works. Just discovering how the numbers are produced.

The number that becomes an output of embedding model is called _[Vector](https://www.britannica.com/science/vector-physics)_.
An embedding vector is simply a set of spatial coordinates that places a concept inside a multi-dimensional
room. Imagine setting up a kindergarten classroom. You have a list of kids along with their profiles—their
personalities, interests, and past drama. To keep the room peaceful, you place kids who get along close
together, facing the same direction, while keeping kids who clash far apart. Because these coordinates are
normalized to a standard scale (keeping each kid's distance fixed from the center of the room), their
location values appear as floating-point decimals between -1.0 and 1.0.

Suppose we start with two kids placed at initial room coordinates like [0.5, -0.6, -0.8] and [0.7, 0.1, -0.2].
Because the model hasn't learned who gets along yet, these starting positions are essentially random. As training
progresses, the model learns their profile similarities and shifts their locations to [0.53, 0.10, -0.48] and
[0.45, 0.20, -0.39].

What actually happened? The model moved the two kids closer together in the room and turned them to face the
same way. In vector math, we measure this spatial alignment using two key metrics:

- [Cosine similarity](https://www.geeksforgeeks.org/dbms/cosine-similarity/), which tracks how closely their directions match (getting closer to 1.0 as they align).
- [Dot product](https://www.geeksforgeeks.org/maths/dot-product/), which combines both their directional alignment and distance to give an overall score of how strongly they belong in the same neighborhood.

To human eyes, raw coordinate numbers like [0.53, 0.10, -0.48] and [0.45, 0.20, -0.39] look unrelated. But
through cosine similarity, the math proves they are facing the same direction. This doesn't mean the model "understands"
what these two words mean in a human sense. It simply means the model noticed how often they appeared together
in the dataset—just like a teacher noticing two kids playing together every day on the playground, and deciding
to assign them desks side by side.

> __*Note:*__
> _I'm not an AI researcher, scientist or an expert in this field. This blog is pure exploration and notes on
> what is my current understanding about components of AI. Please do clarify with someone who knows better._
