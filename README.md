## What is the Telephone Game Network Simulation?

This simulation models how messages degrade as they pass through a network of nodes, similar to the classic "telephone game" where a message is whispered from person to person and changes along the way. It shows that a high number of textual variants among transmitted copies does not necessarily mean the original message cannot be accurately reconstructed.

## How do the parameters work?

Like a telephone game, each node (player) receives messages from previous nodes in the chain, then they try to reconstruct the original message as best they can, then they forward their reconstructed message to the next nodes in the chain.

- **Nodes per generation (N)**: How many nodes exist at each level (except the first, which always has 1 node)
- **Transmissions per node (K)**: How many nodes each node transmits their message to in the next generation
- **Corruption probability (p)**: The likelihood that each word gets corrupted during transmission

## What happens to messages during transmission?

Each word in a message has an independent probability (p) of being corrupted. When a word is corrupted, one of four methods is chosen at random:
- **Character deletion** - a random character is removed from the word (only if the word has more than one character)
- **Character replacement** - a random character in the word is replaced with a different character
- **Character swap** - two random characters in the word swap positions
- **Word swap** - the word swaps positions with another random word in the message

## How do nodes reconstruct the message from multiple inputs?

When a node receives multiple messages, it uses a "majority vote" system to reconstruct the message. For each word position, it picks the most frequently received word at that position.

## How is accuracy calculated?

Accuracy is the percentage of words at each word position that are the same as in the original message.

## What is "Final Message Error Distribution"?

This shows the error rate of the reconstructed messages at the last generation of nodes.

## What is a "variant"?

A variant is any unique message that gets transmitted between two nodes. Each unique message is counted as a single variant, so the original message is one variant, and every unique corruption of the message is its own variant.

## What is "Transmission Variant Error Distribution"?

This shows the total number of unique variants ever transmitted, and the distribution of word errors among those variants.

## Can I use my own message?

Yes! You can edit the "Original message" text box to use any message you want to test how it degrades through the network.

## Have a suggestion?

Create an [issue](https://github.com/ed-kung/telephone/issues) on Github!