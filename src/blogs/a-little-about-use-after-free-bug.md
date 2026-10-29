---
layout: 'blog.njk'
title: A Little About Use-After-Free Bug
description: Understanding how Use-After-Free bug could cause a vulnerability by looking at a small Proof-of-Concept in C
tags: blog
date: 2026-10-29
---

# A Little About Use-After-Free Bug

Quite often, I kept seeing *Use-After-Free* mentioned in CVE reports. I kept wondering what that meant and
how it could become a vulnerability. Since I wasn't familiar with C or manual memory management, I looked
into it to understand how it happens.

*Use-After-Free* or UAF is a bug that specifically occurs in programming languages with manual memory management,
like C and C++. Why though? Plainly speaking, it happens when we allocate a memory space, use it to add value,
then release the memory back to the system, but forget to remove the pointer that still points to that original
memory address. If this sounds confusing, let's start from the basics on understanding how memory plays a
role in executing any program.

## Memory Basic

A program needs memory to store data, like assigning a value to be read by other function. In memory, there
are two kinds of area: Heap and Stack. When we call a function, Stack is storing the instruction to be executed
while Heap is storing the data independently of the function. A more detailed explanation on this can be
read [here](https://www.geeksforgeeks.org/dsa/stack-vs-heap-memory-allocation/).

Let's focus on Heap since we will focus on what is needed to understand UAF bug. See the following picture

<figure>
  <img src="/images/a-little-about-use-after-free-bug/heap-diagram.png" 
       alt="Two squares which show a name with 16 bytes and function with 8 bytes"
  >
  <figcaption>Figure 1. Heap Diagram. </figcaption>
</figure>

The diagram above shows two squares with label "Name" which has size 16 bytes and "Function" which has 8 bytes.
Think of memory as a large warehouse. When we need space to store data, we reserve a specific section of
that warehouse. This is similar to how memory management works. We have 16 GB memory and we are reserving or allocating
16 bytes and 8 bytes for data labeled as "Name" and "Function". Since this data is stored in the Heap,
this is called heap allocation. When reserving a memory space, we need to know where it is located, hence a
heap contains not just values but also addresses. Just like a storage unit in the warehouse which has both contents and a unit
number.

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

The snippet above implements diagram from Figure 1. The function here is `print_name` where we will store
the pointer or the address of the function in the heap. A pointer is just a variable that stores the
memory address of another variable. The `malloc` function is used to reserve memory for `User` struct
which contain data for `name` and `print_name`. This step is necessary since we are using manual memory
management programming language.

### Memory Address

Unlike a normal home address, a memory address is written as a hexadecimal value. We can
read more about it [here](https://www.geeksforgeeks.org/dsa/stack-vs-heap-memory-allocation/).
This address is usually stored in a pointer. We need to know about this because Use-After-Free
bug will make more sense when we release memory but forget to update the pointer which still stores
the old address. We will show an example later to better understand this concept.

## Producing A Bug

Now that we have learned the basic about memory, let's start producing a bug so it is easier to understand
how releasing memory works, and why certain step is necessary.

We are building a minimal POC to demonstrate Use-After-Free bug by calling a different function to print
text. Let's do the first part,

```c
void print_normal(char *name) {
    printf("Hello, %s\n", name);
}

void print_hacked(char *name) {
    printf("SYSTEM COMPROMISED: %s\n", name);
}
```

We have 2 functions that we are going to use, the first one is what we use in the code, the second one will not be used in
the code. Instead, we are going to get the second function address and show how to call the function by utilizing
Use-After-Free bug.

Let's continue the next part,

```c
int main() {
    struct User *user = malloc(sizeof(struct User));
    strcpy(user->name, "Alice"); // Assign the value for 'name'
    user->print_name = print_normal; // Store print_name function address

    printf("Function address: %p\n", print_normal); // Print memory address of print_normal function
    free(user); // BUG: We only release the memory but the memory map address remains.

    user->print_name(user->name); // Use-After-Free
    return 0;
}
```

This part showcases the Use-After-Free bug. We are assigning the name as "Alice" and use `print_normal` function
to print text. Keep in mind that when we store a function here, we are actually storing its memory address.
Notice the `free(user)` function there, this function releases the memory back to the system since we no longer
need it. Hence the value 'Alice' disappears because the system reclaims that memory space, which may be
overwritten with random characters. It could contain no value or random characters. Despite this, the pointer variable in our code
is not updated. See the output when we compile it,

```
> gcc useafterfree.c 
> ./a.out 
Function address: 0x401176
Hello, ��
```

As we can see, we no longer see 'Alice' in the output yet somehow we can still call the function with
`user->print_name`. This shows the pointer variable still referring to old memory address while the
memory has been released back to the system. This condition is called *dangling pointer*. See the diagram below

<figure>
  <img src="/images/a-little-about-use-after-free-bug/heap-diagram-free.png" 
       alt="User's pointer still points to the heap box, but after free() the name field is now empty while the function field still holds the memory address 0x401176"
  >
  <figcaption>Figure 2. Heap Diagram After Releasing Memory. </figcaption>
</figure>

As someone who is not familiar with manual memory management, I found this seems ok and not critical enough. However, let's
try to exploit this bug.

### Exploit POC

We can introduce another struct to reserve another memory space.

```c
struct User *attacker_payload = malloc(sizeof(struct User));
// REAL WORLD: Read 24 raw bytes directly from the user's input (stdin)
read(0, attacker_payload, 24);

```

We are building another struct `attacker_payload` which reserves memory, and the structure is identical to `user`
struct before. After that, we retrieve an input and store the result to the new struct. The expectation
here, `user` struct and `attacker_payload` struct are using different memory space. The whole code becomes
like this,

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

    user->print_name(user->name); // Use-After-Free, we are using `user` struct instead of `attacker_payload`
    return 0;
}
```

We print the memory address for `print_hacked` function to show later on how we can call the function without
explicitly updating the code.

```c
> gcc useafterfree.c 
> ./a.out 
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

Since our target address is 0x4011ab, we need to include this as the input. However, since C is a low-level language,
it talks directly to the machine so let's get to know about how our machine handle bytes. Back to our analogy
about memory as large warehouse, we already reserved a space as storage we call it storage unit. Let's say
we want to line up packages in a storage unit, how do we start? Should we start from the left-most area or
the right-most area? Either way works. This also applies in memory. When storing a value, it converted into
bytes but it needs to be stored in order. Ordering of bytes is called *[endianness](https://courses.cs.washington.edu/courses/cse351/24su/lectures/02/CSE351-02-memoryI_24su_ink.pdf)*.
There are *big-endian* which starts from most-significant byte, and *little-endian* which starts from
least-significant byte.

For our case, we are compiling and executing the code on x86-64 CPU which [uses](https://www.cs.ucr.edu/~csong/cs153/refs/amd64-vol4-media.pdf)
little-endian. So the ordering goes like this

```
[40] -> most-significant byte
[11]
[ab] -> least-significant byte


Big-Endian: 40 11 ab
Little-Endian: ab 11 40
```

Now we know what to input, the question is how? If we put it on terminal, it won't work because it is converting
our input into ASCII string yet pointer address is not a string. So we are going to use a script to input this
as bytes by using Python script, here is the script:

```sh
python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
```

First we reverse the order from `0x4011ab` to `\xab\x11\x40`. This is how Python respresents `ab 11 40` bytes.
Second, since the heap size for pointer is 8 bytes, we pad the rest 5 bytes with zero. So the final result is
`\xab\x11\x40\x00\x00\x00\x00\x00`

```
> python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
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

    user->print_name(user->name); // Use-After-Free, we are using `user` struct instead of `attacker_payload`
    return 0;
}
```

See? We even use `user->print_name(user->name);` which already assigned with `print_normal` before. Even the `name` in `user`
struct here should be empty since we already called `free(user)`. See the diagram below,

<figure>
  <img src="/images/a-little-about-use-after-free-bug/two-structs.png" 
       alt="Both User and Attacker Payload structs point to the same heap box, whose name field is filled with 'A' bytes and function field holds 0x4011ab; User's arrow is marked as a dangling pointer while Attacker Payload's is a valid pointer"
  >
  <figcaption>Figure 3. Heap Diagram For Two Different Structs. </figcaption>
</figure>

This happens because the `user` struct still points to the same heap address which currently used by `attacker_payload`. So how
to solve this issue?

## Mitigation

So the simplest way to mitigate this is [mentioned](http://cwe.mitre.org/data/definitions/416.html) in the CWE site, which is
by assigning `NULL` to `user`.

```c
user = NULL;
```

What this means is, since after releasing the memory with `free(user)`, the pointer is still pointing to that memory so by
assigning `NULL` we are saying, "there's nothing there, stop referring to that". The whole implementation looks like this,

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
    printf("Target address: %p\n", print_hacked);
    free(user);
    user = NULL; // Remove dangling pointer
    struct User *attacker_payload = malloc(sizeof(struct User));
    read(0, attacker_payload, 24);
    user->print_name(user->name); // Use-After-Free
    return 0;
}

```

If we update the diagram, it is now looking like this,

<figure>
  <img src="/images/a-little-about-use-after-free-bug/mitigation.png" 
       alt="User is set to NULL and no longer points to the heap; only Attacker Payload's valid pointer points to the heap box, whose name field is filled with 'A' bytes and function field holds 0x4011ab"
  >
  <figcaption>Figure 4. Mitigation. </figcaption>
</figure>

Only the `attacker_payload` is pointing to the heap address while `user` is now `NULL`. Let's try running it,

```c
> python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
Function address: 0x401186
Target address: 0x4011ab
Segmentation fault         (core dumped) python3 -c "import sys; sys.stdout.buffer.write(b'A'*16 + b'\xab\x11\x40\x00\x00\x00\x00\x00')" | ./a.out
```

The program now fails to print any text and instead ends with [segmentation fault](https://www.tutorialspoint.com/article/what-is-a-segmentation-fault-in-c-cplusplus)
error. This happens because `user` pointer is pointing to NULL address, which is an invalid memory address so
the operating system terminates the program.

Of course we are not writing a program only to produce segmentation fault, we need to handle that but the focus
here is understanding Use-After-Free bug and how to mitigate it.

## That's A Wrap

So that's how Use-After-Free bug becomes a vulnerability. We might wonder: "What if we don't print the function
address? Isn't this much safer?" The short answer is no. The adversary can still do it without requiring us
to print the function address. In the real world, this can be known if the adversary has done research on
what open-source libraries we use, then reproduce the bug on their machine before silently testing their
payload to our applications. The vulnerability lies in the dangling pointer. If we remember to set the pointer
to `NULL` after releasing memory, the risk has been removed entirely.

This is also why using languages with garbage-collection or no manual memory allocation are less risky. I'm not
saying C is bad. It's just, despite its elegance and simplicity, there is a risk we need to be aware of.
