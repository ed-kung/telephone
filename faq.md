# Frequently Asked Questions

## What is the Telephone Game Network Simulation?

This simulation models how messages degrade as they pass through a network of nodes, similar to the classic "telephone game" where a message is whispered from person to person and changes along the way. It shows that a high number of textual variants among transmitted copies does not necessarily mean the original message cannot be accurately reconstructed.

## How do the parameters work?

- **Generations (T)**: The number of levels or "hops" in the network
- **Nodes per generation (N)**: How many nodes exist at each level (except the first, which always has 1 node)
- **Connections per node (K)**: How many nodes each node transmits a message to in the next generation
- **Corruption probability**: The likelihood that each word gets corrupted during transmission

## What happens to messages during transmission?

Messages can be corrupted in several ways:
- Letters removed from the end of words
- Random letters added to words
- Letters scrambled within words
- Vowels replaced with random letters

## How do nodes with multiple inputs work?

When a node receives multiple messages, it uses a "majority vote" system to reconstruct the message. For each word position, it picks the most frequently received word at that position.

## What do the colors mean?

The colors represent accuracy of the node's reconstructed message, calculated as the percentage of words that in the message that are accurate.

- **Green**: High accuracy (80-100%)
- **Yellow**: Medium accuracy (50-80%)  
- **Orange**: Low accuracy (20-50%)
- **Red**: Very low accuracy (0-20%)

## What's the difference between "Final Message Error Distribution" and "Transmission Variant Error Distribution"?

- **Final Message Error Distribution**: Shows how many errors are in the final reconstructed messages at the last generation
- **Transmission Variant Error Distribution**: Shows how many errors are in all the unique message variants that were transmitted between nodes (excluding the original transmission from node 0)

## Why doesn't node 0 corrupt messages to generation 1?

Node 0 represents the original message source, so it transmits the message perfectly to the first generation. Corruption only happens in subsequent transmissions.

## Can I use my own message?

Yes! You can edit the "Original message" text box to use any message you want to test how it degrades through the network.