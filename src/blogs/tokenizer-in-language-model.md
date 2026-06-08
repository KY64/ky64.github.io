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

Hm. Neither. Seems "impossibly" is a word but not a token. It is not exactly one word but could be one word. In short, _"it depends"_. How come?
How _exactly_ can we know how much token in a sentence or even a word?

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

The tokenizer vocabulary is unlike a common English dictionary.

## The Long Journey Of Stressful Discovery

