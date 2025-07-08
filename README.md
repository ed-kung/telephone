## What is the Telephone Game Network Simulation?

This simulation models how messages degrade as they pass through a network of nodes, similar to the classic "telephone game" where a message is whispered from person to person and changes along the way. It shows that a high number of textual variants among transmitted copies does not necessarily mean the original message cannot be accurately reconstructed.

## How do the parameters work?

Like a telephone game, each node (player) receives messages from previous nodes in the chain, then they try to reconstruct the original message as best they can, then they forward their reconstructed message to the next nodes in the chain.

- **Generations (T)**: The length of the chain, i.e. how many hops in the network
- **Nodes per generation (N)**: How many nodes exist at each level (except the first, which always has 1 node)
- **Connections per node (K)**: How many nodes each node transmits their message to in the next generation
- **Corruption probability (p)**: The likelihood that each word gets corrupted during transmission

## What happens to messages during transmission?

Messages can be corrupted in several ways:
- Letters removed from the end of words
- Random letters added to words
- Letters scrambled within words
- Vowels replaced with random letters

## How do nodes reconstruct the message from multiple inputs?

When a node receives multiple messages, it uses a "majority vote" system to reconstruct the message. For each word position, it picks the most frequently received word at that position.

## How is accuracy calculated?

Accuracy is the percentage of words at each word position that are the same as in the original message.

## What is "Final Message Error Distribution"?

This shows the error rate of the reconstructed messages at the last generation of nodes.

## What is "Transmission Variant Error Distribution"?

A transmission variant is any unique message that ever gets transmitted between two nodes. Each unique message is counted as a single variant, so the original message is a one variant, then every unique corruption of the message is its own variant.

The transmission variant error distribution shows the number of unique variants ever transmitted, and the distribution of errors among those variants.

## Can I use my own message?

Yes! You can edit the "Original message" text box to use any message you want to test how it degrades through the network.

## Have a suggestion?

Create an [issue](https://github.com/ed-kung/telephone/issues) on Github!