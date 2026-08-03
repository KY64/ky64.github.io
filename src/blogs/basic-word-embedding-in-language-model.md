---
layout: "blog.njk"
title: How Vectors Are Produced In An Embedding Model
description: Understanding how vector is produced in an embedding model
tags: blog
date: 2026-08-03
---

# How Vectors Are Produced In An Embedding Model

My first time hearing word _'embedding'_ is when I read book about MLOps. MLOps is somewhat like DevOps but with
additional task on partly of Machine Learning work (deploying model, setup feature pipeline, etc.). When I got into
"Feature Pipeline" chapter it started to discuss about RAG (Retrieval Augmented Generation) which involved using
Embedding model. It gave some introduction about what embedding is and why it matters, it was helpful.
However, when I saw a demo of using embedding model, I got confused instead. Take this example,

```
star -> [0.535; 2.098; -0.484]
```

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

Suppose we start with two kids placed at initial room coordinates like [0.5; -0.6; -0.8] and [0.7; 0.1; -0.2].
Because the model hasn't learned who gets along yet, these starting positions are essentially random. As training
progresses, the model learns their profile similarities and shifts their locations to [0.53; 0.10; -0.48] and
[0.45; 0.20; -0.39].

What actually happened? The model moved the two kids closer together in the room and turned them to face the
same way. In vector math, we measure this spatial alignment (their profile similarities) using two key metrics:

- [Cosine similarity](https://www.geeksforgeeks.org/dbms/cosine-similarity/), which tracks how closely their directions match (getting closer to 1.0 as they align).
- [Dot product](https://www.geeksforgeeks.org/maths/dot-product/), which combines both their directional alignment and distance to give an overall score of how strongly they belong in the same neighborhood.

To human eyes, raw coordinate numbers like [0.53; 0.10; -0.48] and [0.45; 0.20; -0.39] look unrelated. But
through cosine similarity, the math proves they are facing the same direction. This doesn't mean the model "understands"
what these two words mean in a human sense. It simply means the model noticed how often they appeared together
in the dataset—just like a teacher noticing two kids playing together every day on the playground, and deciding
to assign them desks side by side. Should they sit together on the center? right corner? left corner? It doesn't
matter as long as they face the same direction.

> **_Note:_**
> _I'm not an AI researcher, scientist or an expert in this field. This blog is pure exploration and notes on
> what is my current understanding about components of AI. Please do clarify with someone who knows better._

## I Know That's The Result But I Don't Understand

Recall the earlier example,

```
star -> [0.535; 2.098; -0.484]
```

I wonder how those numbers are related to a word "stars", is it a unicode? ID for each character? I can't
figure. I know that it has something to do with [helping](https://huggingface.co/blog/getting-started-with-embeddings)
a language model to find reference as an answer or ranking similarity, yet my mind keep stuck on wondering these
questions:

1. How those numbers are produced?
2. What it means to the model?
3. If those numbers are just random, why don't we just assign a random number for each word instead of using
   an embedding model?

Thus, to answer the questions, I decided to write a minimal embedding model from scratch.

## Talking About Data

What I didn't realise about embedding model was, it requires training. Just like when I wrote a tokenizer [before](../tokenizer-in-language-model),
the program needs to learn a pattern to create a model. Training requires a dataset, so we need a set of valid
and meaningful sentences to be able to create an embedding model. During training, this dataset will be used
to create a "semantic relationship" between words or so called "context". Therefore, to build a proof of concept
I use the following minimal dataset:

```
sun rise glow
moon sky star
star glow sky
fish swim ocean
wave rock boat
ocean wave boat
sun glow ocean
rise star sky
```

Yes, it sounds random and not meaningful, yet the principle here is we want to know how the vector number
is produced and how it can find if the word is "similar" to others.

## Training Methods

The training method that I follow is not exactly a [Word2Vec](https://www.geeksforgeeks.org/python/python-word-embedding-using-word2vec/)
but is intentionally simplified to focus on the core principles of learning word embeddings rather than
reproducing the original algorithm. So the steps will consist of:

1. Initialize embedding vectors
2. Predict how related two words are
3. Measure how wrong the prediction is
4. Update the vectors

### 1. Initialize Embedding Vector Table

Before starting a training process, we need to prepare a dataset first by breaking down sentences into words
then group it based on its sentence. So,

```
"sun rise glow"
"moon sky star"
```

becomes,

```
["sun"; "rise"; "glow"]
["moon"; "sky"; "star"]
```

after that, we assign ID for each word and ensure we get a unique list of words eventually. So it's something
like,

- sun = 10
- rise = 6
- glow = 3
- moon = 4

and so on. There is no reason why that number is chosen. We can even use a tokenizer model to breakdown the
sentence then get ID for each token. From here on, we interpret "sun = 10" as "sun has token ID 10".

Now we have a list of token IDs, the next question is, how can we tell the model that each token ID has
relationship to each other? For example, how can we tell the model if a word "sun" should be
paired with "rise" or "glow"? Since in the dataset, "sun" is in one sentence with words "rise", "glow", and
"ocean". The simple approach is we need to add another "identifier".

#### Trial 1: Binary Relationship Table

Let's create this table as example

| words | related to sun | not related to sun |
| ----- | -------------- | ------------------ |
| rise  | 1              | 0                  |
| glow  | 1              | 0                  |
| rock  | 0              | 1                  |
| ocean | 1              | 0                  |

While this works for a handful of words, the model can simply
lookup which word related to other word. As the vocabulary grows, we need to define what each new word relationship with the
existing words in vocabulary. How many new relationship we need
to define? You can imagine how many columns we end up with and
how tedious it would be. The table never learns but depends on
our capacity to add our answers.

#### Trial 2: Count Frequency of Word Pairs in Sentence

Since doing it by hand is pretty tedious, what if we just write a program to count the
frequency of a pair of words appear together in a sentence?

See this table as example,

| x     | sun | glow | rock | ocean | rise |
| ----- | --- | ---- | ---- | ----- | ---- |
| sun   | 0   | 2    | 0    | 1     | 1    |
| glow  | 2   | 0    | 0    | 1     | 0    |
| rock  | 0   | 0    | 0    | 0     | 0    |
| ocean | 1   | 1    | 0    | 0     | 0    |
| rise  | 1   | 1    | 0    | 0     | 0    |

Now this looks better because by knowing the frequency of a pair of word appear together indicates
it has relationship to one and another. We can call that table **[Co-occurrence Matrix](https://www.baeldung.com/cs/co-occurrence-matrices)**.
Let's look ahead, how many words are we going to pair with? There are [appoximately](https://www.merriam-webster.com/help/faq-how-many-english-words)
470,000 English words. If we create the table with 470,000 words
then the size would be 470,000 x 470,000. That's already huge,
also many of the columns would have zero values since it may not
have relation to many words.

There is another concern. Although the relationships are discovered automatically from the dataset, they are
still limited by the patterns present in the training data. If two words never appear in similar contexts,
the model has no evidence that they are related. For example, if the dataset contains "sun rise" but
never "sun shine" it won't consider word "shine" has relation to "sun".

#### Spatial Coordinates

The co-occurrence matrix stores every relationship explicitly. Instead of keeping such a large table,
what if we could summarize each word using only a few numbers while still preserving the important relationships?

One way to do this is to treat those numbers as coordinates in a geometric space.

Imagine every word as a point on a map. During training, words that frequently appear in similar contexts
gradually move into similar regions of the space, while unrelated words tend to occupy different regions.

Instead of asking, "How many times did these two words appear together?", we can simply ask, "How similar are
these words in the embedding space?"

We call these coordinates "**vectors**". Each dimension is simply one coordinate of the vector. Individually
the numbers have no meaning, but together they determine the word's position in the geometric space.

Take a look at this example,

| word  | dimension 1 | dimension 2 | dimension 3 |
| ----- | ----------- | ----------- | ----------- |
| sun   | 0.82        | 0.41        | 0.12        |
| rise  | 0.79        | 0.44        | 0.10        |
| glow  | 0.84        | 0.39        | 0.15        |
| ocean | 0.20        | 0.91        | 0.18        |
| rock  | -0.76       | 0.08        | 0.61        |

At a glance, the number is just random and does not have any meaning. Yet later, after we learn about
embedding training steps, we will start to see how these numbers can be used to determine similarity
between words.

#### Initialize Random Vector

Before starting the training steps, each word needs to be assigned with a vector. Let's just use 3 dimensions
just for this example. Each dimension will have a random vector, which means the model has no prior knowledge
what these words are and the relationship. The model also doesn't see word as string but token ID from tokenizer.
Suppose we have vocabulary from the tokenizer like this,

| Token ID | Word  |
| -------- | ----- |
| 1        | boat  |
| 2        | fish  |
| 3        | glow  |
| 4        | moon  |
| 5        | ocean |
| 6        | rise  |
| 7        | rock  |
| 8        | sky   |
| 9        | star  |
| 10       | sun   |
| 11       | swim  |
| 12       | wave  |

Then our embedding vector table would look like this,

| Token ID | Dimension 1 | Dimension 2 | Dimension 3 |
| -------- | ----------- | ----------- | ----------- |
| 1        | -0.110      | 0.551       | -0.253      |
| 2        | -0.338      | -0.207      | 0.395       |
| 3        | -0.039      | 0.169       | 0.694       |
| 4        | -0.521      | 0.966       | -0.556      |
| 5        | 0.686       | -0.655      | 0.731       |
| 6        | 0.150       | 0.061       | -0.905      |
| 7        | -0.682      | -0.355      | -0.572      |
| 8        | 0.223       | 0.044       | 0.145       |
| 9        | 0.837       | 0.918       | -0.411      |
| 10       | 0.563       | -0.704      | -0.366      |
| 11       | -0.761      | -0.808      | 0.994       |
| 12       | 0.369       | -0.045      | -0.675      |

Now we have the embedding vector table ready. What happens here, each word has coordinate in a map, they are
scattered everywhere or maybe close to unrelated words. That is expected since the model hasn't learned anything.

![Image showing a 3D diagram where the vector scattered](/images/basic-word-embedding-in-language-model/initial-embedding-vector.png)

We have our data ready for training, the next step is designing how the training should be
done. Since we have converted all input into number, the training steps will use a lot of number operation
or math here.

[![Snoopy smile with tears by hibikicakes1](/images/basic-word-embedding-in-language-model/snoopy.gif)](https://tenor.com/view/snoopy-gif-1199808039773969830)

### 2. Predict how related two words are

When training the model, the goal is to make the model be able to tell what is right and wrong by itself without
any human intervention. We want the model to be able to guess whether a pair of word is related or not. However,
since we have converted all input into a vector, how can the model guess if two words are related or not?

With vector, determining its "similarity" is by finding how _aligned_ two vectors are. Vector has length and
direction. Meaning we can determine its alignment by measuring length and direction of the vector. Take a look
at image below.

![Angle of sun to wave vector is smaller than angle of sun to rise vector](/images/basic-word-embedding-in-language-model/initial-sun-vector.png)

We can see the "sun" vector here is the shortest while "wave" and "rise" vector are longer. Each vector also points
to different direction. We can measure the direction of a vector from its angle, the value of θ. With all this
information, we calculate it using a formula to determine its alignment so that the result will tell how aligned
those vectors are. This formula is called [dot product](https://www.geeksforgeeks.org/maths/dot-product/):

> a ⋅ b = ∑(ai ∗ bi)


