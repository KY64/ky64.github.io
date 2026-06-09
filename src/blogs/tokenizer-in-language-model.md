---
layout: 'base.njk'
title: Why 1 Token Is Not Exactly 1 Word In Language Model?
tags: blog
date: 2026-06-09
---

# Why 1 Token Is Not Exactly 1 Word In Language Model?

When I was exploring API pricing of Large Language Model (LLM) provider,
I was baffled on a term "token". It says "$X per 1M token", what does it mean?
Is it 1M words? 1M characters?

So I try to look into a site and found what is called _**Tokenizer**_. An interactive
[tool](https://platform.openai.com/tokenizer) to show how token is calculated. I used
this sentence as input

> _You are impossibly real_

and guess what? Is it 4 words or 23 characters?

![ChatGPT Tokenizer shows it is 5 tokens](/images/tokenizer-in-language-model/chatgpt-tokenizer.png)

Hm. Neither. Seems "impossibly" is a word but not a token. It is not exactly one word but could be one word.
In short, _"it depends"_. How come? How _exactly_ can we know how much token in a sentence or even a word?

So to find out about this, I spend time to learn how tokenizer works.

## Summary

In short, a tokenizer requires a "vocabulary". This _vocabulary_ is a list of known words and characters by
tokenizer. If you ever buy an English dictionary or even search a word on online dictionary, there is a
chance that some particular word does not exist in the dictionary although it is grammatically correct.
That is also the case for vocabulary in tokenizer. So what happen if the word does not exist? This tokenizer
instead break down the word into characters to find what is the "known token".

Take previous example for the word "impossibly". In the previous picture, we can see the word is
partially highlighted until "imposs". After that, "ibly" is highlighted with different color. This
means the tokenizer see the word "impossibly" as

> imposs + ibly = impossibly

where "imposs" is 1 token and "ibly" is 1 token.

This separation happens because its vocabulary does not have word "impossibly" but it has word for
"impossible". So it can only tell "imposs" is 1 token. Why just "imposs" ? Let's define token
as __*a series of character*__ first. Which sounds like "word" but unlikely true as we know it.

The tokenizer vocabulary is unlike a common English dictionary. It may look like this:

- im
- imp
- impo
- impos
- imposs
- impossible
- possibly
- ibly

Weird, huh? Well, that is also interesting since when it is looking into the word "impossibly", it breaks down
into "i-m-p-o-s-s-i-b-l-y" first. After that, it starts to pair each character then look back into vocabulary for
reference. Say, we pair "i-m" to be "im" then check the vocabulary, if it exists, continue to pair
"imp" then check again, keep going until it is unable to find the token in vocabulary. Hence it stops
at "imposs" then consider it as 1 token since "imposs" exists in the vocabulary. So that is how tokenizer
works and why 1 token is not always 1 word. _It depends_.

> __*Note:*__
> _I'm not an AI researcher, scientist or an expert in this field. This blog is pure exploration and notes on
> what is my current understanding about components of AI. Please do clarify with someone who knows better._

## The Long Journey Of Stressful Discovery

As I try to understand what tokenizer is, I had a "private course" with AI to teach me
about it and still, despite I get the idea of vocabulary, chunking, encoding, something just doesn't click.
I already get the basic principle, it's just breaking down words into characters then rebuild it into a series of
character. Yet I'm still itching to know the intricate details. It is like you've been told a food tastes
bad but you still want to try it.

### Rebuilding For The Sake Of Knowing

I decided to rebuild a tokenizer. Not a better tokenizer, nor rewrite existing tokenizer that was widely used.
Just to know how tokenizer is working and what is the tradeoff that was made. For this, I setup an AI as my
private tutor to patiently guide and review my implementation whether it is right.

Remember about the first picture I've shown about tokenizer that counts a sentence  "You are impossibly real" 
has 5 tokens although it has 4 words? There are several questions that I was trying to answer:

- Why the other words are fully highlighted in one color but the word "impossibly" has 2 highlight colors?
"imposs" and "ibly" have different color although there is no space between it and it is a single word based on
[English dictionary](https://www.merriam-webster.com/dictionary/impossibly). 
- Was the tokenizer "reading" by character or by syllable?
- Was the word "impossibly" not recognised as an English word by the tokenizer?
- What "imposs" and "ibly" mean for the tokenizer?

### Talking About Data

When facing with this questions, my intuition tell me it all leads into one thing. Data. The most underrated and
boring thing to work on yet AI need it the most. I've often heard about the [importance](https://www.turingpost.com/p/cvhistory7)
of data when building an AI, so I try to make the tiniest sample for the sake of experiment.

```
you are real
you are impossible
it is impossible
that is not impossible
she is really fast
you are really happy
this is reliably good
that player is terribly bad
he is reliably good at his job
it was forcibly removed
```

That was generated by AI and I added more and replaced some words so the end result mimic the tokenizer that
we've seen before. The dataset here will be used for the tokenizer to "learn" to build its "vocabulary".

<br />
<br />
<br />
