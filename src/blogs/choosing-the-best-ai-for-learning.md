---
layout: 'blog.njk'
title: Choosing the Best Free AI For Learning
description: Most AI guides push paid subscriptions, but free models can be reliable tutors if you know how to use them.
tags: blog
date: 2026-09-18
---

# Choosing the Best Free AI For Learning

I've been following tutorial and reading books to learn a new topic or skill. Sometimes it does teach
me something, sometimes it just make me *feel* I learn something. What I mean is, I can dilligently follow
instructions but never be able to answer *'what if'* questions and trace back how the answer/solution
was invented. Moreover, I don't know how to use each information I learn in practice.

Since the booming of AI or specifically *Large Language Model* (LLM), I was skeptical due to a lot of
misinformation and hallucination. Yet since early 2026, most people relying on LLM daily just like
how they rely on search engine to find answers. The model gets smarter and reliable, though still not free
from hallucination.

I started to change how I learn. Instead of just relying on tutorial and books, I also included LLM to be my
mentor. So this article shares about my experience and tips when learning with LLM.

> We will use term **Large Language Model (LLM)** as that is the right term on what is being discussed in
> this article. You can read more about the term here https://dl.acm.org/doi/epdf/10.1145/3747356

## Summary

A model intelligence does matter but what matters more is *how* we want to learn. When I was using LLM
as mentor, my first question is "how do I want to learn this topic?", and it breaks down to 3 types:

1. Casual chat
2. Structured learning
3. Mastery

Quite often, the first type can be achieved by any frontier LLM. Which many people already did, treating the
LLM as replacement for search engine to answer questions. In fact, many free LLM is already good at it, the
one rule of thumb is always clarify how it finds the answers. Always ask for source to read if possible.
So prefer to use the hosted model like Gemini, ChatGPT, Mistral, Qwen, or whichever free as long as the
model is able to search the source from internet.

For structured learning, there are several things to consider: context limit, multimodal, instruction following
and speed. Learning requires building mental model and presenting a lot of new information. This session
often last for more than half an hour. So model with large context limit should be sufficient. Usually more
than 256k context limit. Also visualization often helps explain complicated topics, so if the model able to
visualize its explanation, that helps a lot. Another thing, I usually describe how I want to proceed the
learning step by step. I always give [a guideline](https://codeberg.org/ky64/agent-prompts/src/branch/main/teaching/prompt.txt) to start.
If the model is able to dilligently follow the instruction, that could increase the learning experience.
Last but not least, when we are already in the 'flow', the model should be able to keep up. So response speed
matters, though doesn't necessarily mean faster is better.

For the third type, mastery, it is the same like the one I use for structured learning with one additional
requirement: reasoning. Mastery requires us to be able to argue, asking right questions, transfer knowledge,
and understand tradeoff. So I choose the model which has good reasoning so I could use it to argue with me,
challenge my understanding, and point out my logical flaw. I also use a [prompt](https://codeberg.org/ky64/agent-prompts/src/branch/main/examiner/prompt.txt)
to change how the model interacts with me.

Those guidelines should be enough to determine which LLM provider we choose. We can use the free one by giving
the right prompt and it will act like a good mentor for studying. Since I don't sign up to many providers, I
only use few LLM for each types of learning:

1. Casual Chat - [Gemini Flash](https://gemini.google.com/)
2. Structured Learning - [Qwen](https://chat.qwen.ai/)
3. Mastery - [Qwen](https://chat.qwen.ai/)

I focus on long session chat with free usage. ChatGPT has free tier but quite limited. So I use
Qwen which has good reasoning capability and long context limit. Also pretty stable. The cons is just
for visualization, Gemini Flash does it better. Gemini Flash struggles with long conversation
and often overlook the past interaction, but for a short conversation, it's good enough. Just like someone
insightful you'd talk to on a bus ride.

See one of my session with Qwen here:
https://chat.qwen.ai/s/33362c91-73f0-48eb-bdea-963aa7152887?fev=0.2.91

## Beyond Default

LLM learns its user preference and habit throughout the time. So user interaction with LLM will feel much
smoother and it kind of know what we want. For me, I don't want to spend a lot of time just to 'hangout'
with LLM so it knows what I want and my preference. So instead of interacting a lot with an LLM, I give
it a long *lecture* on how to behave. I mean a [prompt](https://www.geeksforgeeks.org/artificial-intelligence/what-is-an-ai-prompt/).

This realisation comes after I used a 'learning mode' for each LLM that doesn't suit my learning style, 
and I have to tell how I want to do it repeatedly. Which eventually force me to create a set of prompt for
certain type of learning.

### Casual Chat

Sometimes I want to know something, just for the sake of knowing. Not really want to read through a lot of
textbook materials. LLM often gives me a long lecture when I ask about scientific question, but I only
care about plain and casual explanation without getting overwhelmed. So what I did is often add a prefix "explain to me
plainly...". While this is working, what if I can just type less what I want to know without telling it
how I want to know about it.

For this case, I usually set the default behavior for the LLM by using a custom prompt:
https://codeberg.org/ky64/agent-prompts/src/branch/main/behavior/prompt.txt

The result would be different for each LLM, but basically, I want the response to be as short as possible
and focus on one main idea in plain english. Here is the result:

![Gemini Chat](/images/choosing-the-best-ai-for-learning/gemini-chat.png)

When I tested this, I found that Gemini Flash 3.6 often gives a longer response unlike Gemini Flash-lite 3.5
which is more casual like I expected. I used Gemini here due to its multimodal model and I'm already
a Google user. Another thing is, Google has search engine and Gemini is able to find any source quickly if
I ask for it. Which is like the other LLM but I pick this one just because I already signed up.

Setting up Gemini behavior can be done here https://gemini.google.com/saved-info though note that it will
rewrite your input so the end result will be different. This is mine:

![Gemini Instructions](/images/choosing-the-best-ai-for-learning/gemini-instructions.png)

### Structured Learning

Whenever I want to dive into certain topics, I make a habit to reach out to LLM to
help me discover what articles I should read. I do this because sometimes every result in search engine
is not giving the clear answer, or I find it lacking of depth. So this is where LLM could be helpful to
point which article I should read.

However, reading an article is often requires me to infer the writer hidden assumption. Like maybe the writer
already assumes the reader familiar with certain term, has specific educational background, or capable to
decipher what the writer means. This cause me fatigue before I can find the real answer.

When I felt overwhelm with a certain topic, book, or any information, I often ask "how is it true?",
"where should I start from?", "what is the basic?". This requires me to have someone to sit with me and patiently
teach me like I'm an elementary student. I don't know what I don't know so I need others to discover that.
This is where LLM becomes really useful for me.

So when I started the interaction, I prefer to discuss a study plan first. The LLM will diagnose what is
my struggle, knowledge gap, and my goal. After that it gives me a plan from the basic until how the answer/solution
was invented. It's not stopping there, it should also explains its practical usage.

Before the learning session ends, there is an evaluation where I get some quiz about the basics,
reframe the answer using general terms, and test me to ask critical questions from a given scenario. This helps
me to retain what I have learned.

How I achieve this is by using this prompt:
https://codeberg.org/ky64/agent-prompts/src/branch/main/teaching/prompt.txt

It is pretty long because this is explaining my preference on how I want to learn things. So whenever I started
a new chat session, the very first message always:

```
Follow this system prompt:

[PROMPT]
```

I replace the **[PROMPT]** with my saved prompt that I shared earlier. After that, the LLM will switch into
'learning mode' but with the behavior that I prefer. Here is a snippet of the interaction:

![Qwen Study Plan](/images/choosing-the-best-ai-for-learning/qwen-study-plan.png)

So the study plan here will keep us aligned what is the expectation and tailor the concept from previous
explanation. The learning session looks like this:

![Qwen Learning Session](/images/choosing-the-best-ai-for-learning/qwen-learning-session.png)

I use Qwen here because it allows me to have long session chat even with free tier. Previously I used Gemini Flash
but lately it often overlook the past conversation so it didn't follow the learning plan. I also tried
ChatGPT, I was using subscription plan and it was good actually yet the free tier has limited time and often
requires me to create a new chat to continue. Qwen here is consistent despite I'm on free tier. It's able to
recall the past conversation correctly, like ChatGPT but with more generous free tier limit.

The problem with Qwen is, although it is a multimodal model, it can't help me to visualize its explanation
properly. So I have to move to Gemini Flash to have a quick chat to ask question then visualize the
answer.

So for this structured learning, I think the ideal model should have these specific requirements:

- Long context limit (> 256k token)
- Multimodal for visualizing the explanation
- Instruction following for adhering to user preferred way to learn
- Speed for keeping the user in the flow instead of waiting for too long

Qwen 'thinking mode' is slow, but its 'fast mode' is similar to ChatGPT speed.

### Mastery

I often feel like I already know something. Yet at the same time, I always reminded of [2nd Order of Ignorance](https://cacm.acm.org/opinion/the-five-orders-of-ignorance/).
Which is "I don't know what I don't know" or *unknown unknowns*. This often happen when I faced with a problem
and suddenly dumbfounded how the problem occurs, and even inexpicably solved when I just blink at it. I
don't want that to happen again but at the same time I don't know what is the right question to ask and where
to start. Finding out what I don't know is very hard, and it is often giving me illusion of mastery.

So every time I doubt my knowledge or even confident with it, I expect someone to argue, challenge, and
point out how flawed my logic is. In this case, I started to use LLM not to be my assistant but to be a
tool to probe me with questions and scrutinize my answer. It is like roleplaying with your killer professor
to defend your thesis.

I honestly impressed because this is actually working, if we use a model with very good reasoning capability
like equal to or above [GPT 5.4](https://openai.com/index/introducing-gpt-5-4/) then it can probe us many
critical questions. However, of course I have to create a prompt what kind of questions need to be asked
and what is to evaluate.

I wrote my prompt here https://codeberg.org/ky64/agent-prompts/src/branch/main/examiner/prompt.txt
which is very long since I want the model to clearly understand what to do. I tested this using Qwen
model and it is able to challenge and evaluate my answers. You can check here:

https://chat.qwen.ai/s/33362c91-73f0-48eb-bdea-963aa7152887?fev=0.2.91

This is when I tell LLM not to be 'helpful' neither agreeable. I honestly often felt stressful since I
need to clearly type my answer. One vague word will cause my score low and considered incapable. Quite
annoying but that is part of the design for mastery. However, at the end of the probing session, there
is evaluation where I can get feedback and discuss about it.

## Conclusion

So that is how I customize LLM to be my learning assistant. It shows that it is possible to make it align
with how we want to learn. Changing it to be a better mentor or even a partner who challenge our understanding.

My pick of LLM here is very opinionated, not saying these are the best but it is meeting my expectation. So
the principle is knowing what we need, our learning style then we can start writing it out as a prompt. Try
pass that prompt to current LLM we've been using then judge the result. We don't need to be tied to a single
LLM since each has its own strength.

I also want to mention one article that I recently read about learning using LLM:

https://fordhaminstitute.org/national/commentary/illusion-learning-danger-artificial-intelligence-education

It says, AI is *"a knowledge amplifier, not a knowledge substitute"*. So it means everytime we want to learn
something using LLM, make sure we are an active participant not just merely accepting the answer. We can
ask for source to read or even switch the learning mode from teaching to probing questions. Just like how
I differentiate prompt for Structured Learning and Mastery.

I hope this article and my personal experience can help you to learn better with LLM and save you some cost.
Keep learning!
