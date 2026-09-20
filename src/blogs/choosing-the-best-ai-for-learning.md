---
layout: 'blog.njk'
title: Choosing the Best Free AI For Learning
description: Most AI guides push paid subscriptions, but free models can be reliable tutors if you know how to use them.
tags: blog
date: 2026-09-20
---

# Choosing the Best Free AI For Learning

I've been following tutorial and reading books to learn a new topic or skill. Sometimes it does teach
me something, sometimes it just make me *feel* I learn something. What I mean is, I can dilligently follow
instructions but never be able to answer *'what if'* questions and trace back how the answer/solution
was invented. Moreover, I don't know how to use each information I learn in practice.

Since the booming of AI or specifically *Large Language Model* (LLM), I was skeptical due to a lot of
misinformation and hallucination. Yet since early 2026, most people relying on LLM daily just like
how they rely on search engine to find answers, even doing research. The model gets smarter and reliable,
though still not free from hallucination.

I started considering whether I should change how I usually learn. Instead of going straight to the book,
or tutorial, I will ask LLM to teach me. If that fails my expectation, what if I read a book or follow
tutorial first, then for diving deeper, I'll try to reach LLM. Without paying a single penny, of course.

My first experience was that, it was helpful but too eager to answer. So the tone and explanation a bit like
lecturing and using a lot of academical or technical jargon. Over time, it was slowly adapting to my preference.
However, when I created a new session, it was not always giving a consistent behavior. So I started experimenting
to craft a prompt which explained how I want to learn, how it should teach me, and how it should evaluate my
understanding. Hoping that LLM could finally become my solution for the missing part in my learning process.
A mentor who is always ready not just to answer but gently guide, one baby step at a time also ready to answer
any hillarious hypothetical questions.

You don't need a paid subscription to access top-tier LLM models, and neither do I. Once you know how to
customize a free model, you can transform it into a humble and smart mentor that eases the struggle of
learning, helping you master complex topics without feeling overwhelmed.

> We will use term **Large Language Model (LLM)** as that is the right term on what is being discussed in
> this article. You can read more about the term here https://dl.acm.org/doi/epdf/10.1145/3747356

## Summary

A model's intelligence matters, but what matters more is *how* we want to learn. When using an LLM as a
mentor, my first question is always "how do I want to learn this topic?"

For me, learning breaks down into 3 distinct types:

1. Casual chat
2. Structured learning
3. Mastery

For **casual chat**, I prefer to use hosted models like Gemini, ChatGPT, Mistral, Qwen, or whichever free
as long as the model is able to search the source from internet to verify facts. My pick is Gemini Flash
since I already have a Google account, not because it is the best. Also it is multimodal so I can take picture
and quickly find out about it.

For **structured learning**, there are several things to consider: long context limit, multimodal, instruction
following and speed. Visualization also helps explain complicated topics, so a model's ability to render visual
diagrams is a major plus. I always give a guideline to start. For this case, I choose
Qwen because I could have long-session chat without being limited.

For **mastery**, it is the same like the one I use for structured learning with one additional requirement:
reasoning. Mastery requires us to be able to argue, asking right questions, transfer knowledge,
and understand tradeoff. I choose a model with strong reasoning capabilities that can argue with me,
challenge my assumptions, and point out logical flaws. I use Qwen here as well, giving it a custom prompt
to turn it into a thorough examiner.

## Beyond Default

Most people repeatedly typing instructions like 'keep it brief' or 'explain simply' in every new
chat. Others assume you have to spend weeks chatting with an LLM before it 'learns' your style. I don't want
to spend time 'hanging out' with an LLM just so it learns my preferences, nor do I want to constantly remind
it how to respond. Instead, I give it explicit instructions upfront or setup a custom prompt to change its
default behavior to my preference. Since each type of learning has a different instructions and principles,
I created a set of prompts that can be reusable whenever I need LLM to help me learning something.

### Casual Chat

Sometimes I want to know something, just for the sake of knowing. I don't really want to read through a lot of
textbook materials. An LLM often gives me a long lecture when I ask a scientific question, but I only
care about plain and casual explanation without getting overwhelmed. So what I did often is adding a prefix
"explain to me plainly...". While this is working, what if I can just type less about what I want to know
without telling it how I want to know about it?

For this case, I usually set the default behavior for the LLM by using a [custom prompt](https://codeberg.org/ky64/agent-prompts/src/branch/main/behavior/prompt.txt).
The result would be different for each LLM, but basically, I want the response to be as short as possible
and focus on one main idea in plain English. I used Gemini here due to its multimodal model and I'm already
a Google user. Also, Gemini is able to find any source quickly if I ask for it.

I set up Gemini behavior using my custom prompt. It can be done in [Gemini Instructions](https://gemini.google.com/saved-info)
though note that it will rewrite your input so the end result will be different. This is mine:

![Gemini Instructions](/images/choosing-the-best-ai-for-learning/gemini-instructions.png)

Here is the result:

![Gemini Chat](/images/choosing-the-best-ai-for-learning/gemini-chat.png)

When I tested this, I found that Gemini Flash 3.6 often gives a longer response unlike Gemini Flash-lite 3.5
which is more casual like I expected. My preference is Flash-lite 3.5 response since it can answer in plain
and direct way. You are welcome to customise and choose your own LLM according to your taste.

### Structured Learning

Reading an article often requires me to infer the writer's hidden assumption. Like maybe the writer
already assumed the reader is familiar with certain term, has specific educational background, or capable to
decipher what the writer means. This causes me fatigue before I can find the real answer.

When I feel overwhelmed by a certain topic, book, or any information, I often ask "how is it true?",
"where should I start from?", "what is the basic?". This requires me to have someone to sit with me and patiently
teach me like I'm an elementary student. I don't know what I don't know so I need others to discover that.
This is where LLM becomes really useful for me.

So when I started the interaction, I prefer to discuss a study plan first. The LLM will diagnose what is
my struggle, knowledge gap, and my goal. After that it gives me a plan from the basic until how the answer/solution
was invented. It's not stopping there, it should also explains its practical usage.

Before the learning session ends, there is an evaluation where I get some quiz about the basics,
reframe the answer using general terms, and test me to ask critical questions from a given scenario. This helps
me to retain what I have learned.

How I achieve this is by using a [custom prompt](https://codeberg.org/ky64/agent-prompts/src/branch/main/teaching/prompt.txt)
for structured learning. It is pretty long because this is explaining my preference on how I want to learn
things. So whenever I started a new chat session with an LLM, the very first message always:

```
Follow this system prompt:

[PROMPT]
```

I replace the **[PROMPT]** with my saved prompt that I shared earlier. After that, the LLM will switch into
'learning mode' but with the behavior that I prefer. I didn't add it to global instructions because this prompt
will make the model to be specialised as mentor. Let's say someday you ask it to plan a trip, you don't want it
to respond with diagnosing your confusion then provide you study plan about why planning a trip is so necessary
and how to do it better.

This is the example on how it gives me study plan after diagnosing my struggle and goal:

![Qwen Study Plan](/images/choosing-the-best-ai-for-learning/qwen-study-plan.png)

So the study plan here will keep us aligned with our expectation and tailor the concept from previous
explanation. The learning session looks like this:

![Qwen Learning Session](/images/choosing-the-best-ai-for-learning/qwen-learning-session.png)

I use Qwen here because it allows me to have long session chat even with free tier. Previously I used Gemini Flash
but lately it often overlooks the past conversation so it didn't follow the learning plan. I also tried
ChatGPT, I was using subscription plan and it was good actually yet the free tier has limited time and often
requires me to create a new chat to continue. Qwen here is consistent despite I'm on free tier. It's able to
recall the past conversation correctly, like ChatGPT but with more generous free tier limit.

The problem with Qwen is, although it is a multimodal model, it can't help me to visualize its explanation
properly. So I have to move to Gemini Flash to have a quick chat to ask question then visualize the
answer.

### Mastery

I often feel like I already understand a concept, even confidently. Yet at the same time, I'm always reminded
of the [2nd Order of Ignorance](https://cacm.acm.org/opinion/the-five-orders-of-ignorance/):
*"I don't know what I don't know,"* or the *unknown unknowns*. This often happens when I am faced with
a problem and am suddenly dumbfounded on how the problem occurs, and even inexplicably solved when I just blink
at it. I don't want that to happen again but at the same time I don't know what is the right question to ask
and where to start. Finding out what I don't know is very hard, and it is often giving me an illusion of mastery.

So every time I doubt my knowledge or even feel confident with it, I expect someone to argue, challenge, and
point out how flawed my logic is. In this case, I experimented with using an LLM not to be my assistant but to be a
tool to probe me with questions and scrutinize my answer. It is like roleplaying with your meticulous professor
to defend your thesis.

I was honestly impressed to find out it was actually working, if we use a model with very good reasoning capability
similar to [GPT 5.4](https://openai.com/index/introducing-gpt-5-4/) or better, then it can probe us with many
critical questions. However, of course I have to create a prompt what kind of questions need to be asked
and what is to evaluate.

I wrote another [custom prompt](https://codeberg.org/ky64/agent-prompts/src/branch/main/examiner/prompt.txt)
which is very long since I want the model to clearly understand what to do. I tested this using Qwen
model and it is able to challenge and evaluate my answers. This is an example of my interaction:

![Qwen probing questions](/images/choosing-the-best-ai-for-learning/qwen-mastery-probing.png)

The model is being thorough if my answer is too vague, it didn't correct me but clarify my answer. This probing
questions would go on until 9 or more questions before it enters into focused evaluation where I will be given
a feedback for each question that I answered. See the picture below:

![Qwen focused evaluation](/images/choosing-the-best-ai-for-learning/qwen-mastery-focused-evaluation.png)

This evaluation phase will identify my weakness and knowledge gap. Which helps me discover what I don't know
about. During per question evaluation, I can also learn with the mentor and clarify anything I still don't
grasp about the concept. After that it will proceed to evaluate my answer on next question. At the end of the session
is the overall evaluation about my depth of my knowledge like this:

![Qwen summary report](/images/choosing-the-best-ai-for-learning/qwen-mastery-report-summary.png)

Moreover, it also suggests me what should I learn and dive deeper to close the gap.

![Qwen study suggestions](/images/choosing-the-best-ai-for-learning/qwen-mastery-study-suggestion.png)

This is the scenario where I instruct the LLM to be neither helpful nor agreeable. I honestly often find it
stressful because I need to type my answers with precise meaning. A single vague word will cause my score
to drop and mark me as incapable. It can be quite annoying, but that friction is by design for true mastery.
Fortunately, at the end of the probing session, there is an evaluation phase where I get constructive
feedback and can discuss the results.

## Conclusion

So that's that. I'm able to find a tool to help me learn better. A tool that challenges my thoughts, and
point me what am I lacking off. Of course, this doesn't mean I solely use LLM but always find a source
to read about and if I happen to meet someone knowledgeable in that field, I'd ask the same questions to
clarify the answers.

My LLM picks here is very opinionated, but the core principle here is: identify your learning goal,
write a prompt that enforces that behavior, and test it with your preferred LLM. You don't need expensive
subscriptions when you can give it a clear prompt.

A quote from [Fordham Institute article](https://fordhaminstitute.org/national/commentary/illusion-learning-danger-artificial-intelligence-education),
AI is *"a knowledge amplifier, not a knowledge substitute."* Real learning requires active participation.
Whether you're using a casual lookup, a structured study plan, or a thorough examination session, always
hold to one rule: find out how the model arrived at that answer.

I hope these workflows help you learn deeper, build real mental models, and save money along the way. Keep
learning!
